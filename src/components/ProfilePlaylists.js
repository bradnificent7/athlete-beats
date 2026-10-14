import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { usePlayer } from "../context/PlayerContext";
import "./ProfilePlaylists.css";

const toRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "196,113,237";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ProfilePlaylists = ({ uid }) => {
  const { playTrack, current } = usePlayer();
  const [lists, setLists] = useState([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "playlists"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLists(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data, tracks: data.tracks || [] };
          }),
        );
        setReady(true);
      },
      () => {
        setFailed(true);
        setReady(true);
      },
    );
    return unsub;
  }, [uid]);

  if (failed) return null;
  if (ready && lists.length === 0) return null;

  return (
    <section className="pp">
      <h3 className="pp-heading">📚 Playlists</h3>
      {lists.map((p) => (
        <div
          key={p.id}
          className="pp-card"
          style={{ "--pl": toRgb(p.color) }}
        >
          <button
            className="pp-title"
            onClick={() => setOpen(open === p.id ? null : p.id)}
          >
            <span>
              {open === p.id ? "▾" : "▸"} {p.name}
            </span>
            <span className="pp-count">{p.tracks.length} songs</span>
          </button>

          <div className="pp-actions">
            <button
              disabled={!p.tracks.length}
              onClick={() => playTrack(p.tracks[0], p.tracks)}
            >
              ▶ Play all
            </button>
            <button
              disabled={p.tracks.length < 2}
              onClick={() => {
                const s = shuffled(p.tracks);
                playTrack(s[0], s);
              }}
            >
              🔀 Shuffle
            </button>
          </div>

          {open === p.id && (
            <div className="pp-tracks">
              {p.tracks.map((t) => (
                <button
                  key={t.id}
                  className={`pp-track ${
                    current && current.id === t.id ? "active" : ""
                  }`}
                  onClick={() => playTrack(t, p.tracks)}
                >
                  <span className="pp-track-title">{t.title}</span>
                  <span className="pp-track-by">{t.channel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default ProfilePlaylists;