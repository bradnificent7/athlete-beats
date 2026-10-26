import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../hooks/useNotifications";
import "./NotificationBell.css";

const ago = (ts) => {
  if (!ts || !ts.toDate) return "just now";
  const m = Math.max(1, Math.round((Date.now() - ts.toDate().getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const label = (n) => {
    if (n.type === "follow") {
      return (
        <>
          <strong>@{n.fromUsername}</strong> started following you
        </>
      );
    }
    if (n.type === "verified") {
      return (
        <>
          🎉 You're now a verified <strong>{n.role}</strong>
        </>
      );
    }
    return "New notification";
  };

  const go = (n) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.type === "follow" && n.fromUsername) navigate(`/u/${n.fromUsername}`);
    else if (n.type === "verified") navigate("/profile");
  };

  return (
    <div
      className="bell-wrap"
      ref={box}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="bell-btn"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        🔔
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="bell-pop">
          <div className="bell-menu">
            <div className="bell-menu-head">
              <strong>Notifications</strong>
              {unread > 0 && (
                <button className="bell-readall" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            {items.length === 0 && <p className="bell-empty">Nothing yet.</p>}

            {items.map((n) => (
              <button
                key={n.id}
                className={`bell-item ${n.read ? "" : "unread"}`}
                onClick={() => go(n)}
              >
                <span className="bell-text">{label(n)}</span>
                <span className="bell-time">{ago(n.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}