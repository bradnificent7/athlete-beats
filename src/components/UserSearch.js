import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import "./UserSearch.css";

const PAGE = 10;
const MAX = 50;

const byPrefix = (field, q, n) =>
  getDocs(
    query(
      collection(db, "users"),
      where(field, ">=", q),
      where(field, "<=", q + "\uf8ff"),
      limit(n),
    ),
  );

const ROLE_ICON = { fan: "🏆", athlete: "🏃", coach: "📋", media: "📺" };

export default function UserSearch() {
  const [text, setText] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState(PAGE);
  const [more, setMore] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = text.trim().toLowerCase();
    const q = raw.replace(/^@/, "");
    if (q.length < 2) {
      setResults([]);
      setMore(false);
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const isHandle = raw.startsWith("@");
        const parts = q.split(/\s+/);
        let jobs;
        if (isHandle) {
          jobs = [byPrefix("usernameLower", q, size)];
        } else if (parts.length > 1) {
          jobs = [byPrefix("firstLower", parts[0], size)];
        } else {
          jobs = [
            byPrefix("usernameLower", q, size),
            byPrefix("firstLower", q, size),
            byPrefix("lastLower", q, size),
          ];
        }
        const snaps = await Promise.all(jobs);
        if (cancelled) return;

        const seen = new Map();
        snaps.forEach((s) =>
          s.forEach((d) => seen.set(d.id, { uid: d.id, ...d.data() })),
        );
        let list = [...seen.values()].filter((u) => u.username);
        if (!isHandle && parts.length > 1) {
          list = list.filter((u) => (u.lastLower || "").startsWith(parts[1]));
        }
        setResults(list);
        setMore(size < MAX && snaps.some((s) => s.size >= size));
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setMore(false);
        }
      }
      if (!cancelled) setBusy(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, size]);

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (u) => {
    navigate(`/u/${u.username.toLowerCase()}`);
    setText("");
    setResults([]);
    setSize(PAGE);
    setOpen(false);
  };

  // load 10 more when you scroll to the bottom of the list
  const onScroll = (e) => {
    const el = e.currentTarget;
    if (
      more &&
      !busy &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - 40
    ) {
      setSize((s) => Math.min(s + PAGE, MAX));
    }
  };

  const showBox = open && text.trim().replace(/^@/, "").length >= 2;

  return (
    <div className="user-search" ref={boxRef}>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          autoComplete="off"
          placeholder="Search people by name or @handle..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSize(PAGE);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) go(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>

      {showBox && (
        <div className="search-results" onScroll={onScroll}>
          {busy && results.length === 0 && (
            <div className="sr-msg">Searching...</div>
          )}
          {!busy && results.length === 0 && (
            <div className="sr-msg">No one found. Try their @handle.</div>
          )}
          {results.map((u) => (
            <button
              type="button"
              key={u.uid}
              className="sr-item"
              onClick={() => go(u)}
            >
              <div className="sr-avatar">
                {(u.displayName || u.username)[0].toUpperCase()}
              </div>
              <div>
                <div className="sr-name">
                  {u.displayName || u.username} {ROLE_ICON[u.role] || ""}
                </div>
                <div className="sr-sub">@{u.username}</div>
              </div>
            </button>
          ))}
          {more && <div className="sr-msg">Scroll for more…</div>}
        </div>
      )}
    </div>
  );
}