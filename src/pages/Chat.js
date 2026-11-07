import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useRoom from "../hooks/useRoom";
import MessageEdit, { canEdit, isExpired } from "../components/MessageEdit";
import "./Chat.css";

const ROOMS = [
  { id: "lobby", label: "💬 Lobby", blurb: "Hang out and talk anything sports and music." },
  { id: "nba", label: "🏀 NBA", blurb: "Hoops talk: games, trades, takes." },
  { id: "nfl", label: "🏈 NFL", blurb: "Football talk: Sundays, fantasy, hot takes." },
  { id: "music", label: "🎵 Music", blurb: "What are you listening to?" },
];

const timeOf = (ts) =>
  ts && ts.toDate
    ? ts.toDate().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

export default function Chat() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("lobby");
  const { messages, send, sending, edit, remove } = useRoom(roomId);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const listRef = useRef(null);
  const room = ROOMS.find((r) => r.id === roomId);

  // deleted messages show a marker for 24 hours, then they're hidden
  const visible = messages.filter((m) => !isExpired(m));

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length, roomId]);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await send(text);
    if (ok) setText("");
  };

  const canSend = user && user.emailVerified;

  return (
    <div className="chat-page">
      <div className="chat-tabs">
        {ROOMS.map((r) => (
          <button
            key={r.id}
            className={r.id === roomId ? "active" : ""}
            onClick={() => {
              setRoomId(r.id);
              setEditingId(null);
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="chat-blurb">{room.blurb}</p>

      <div className="chat-thread" ref={listRef}>
        {visible.length === 0 && (
          <p className="chat-empty">Quiet in here. Be the first to say something 👋</p>
        )}
        {visible.map((m) => (
          <div
            key={m.id}
            className={`chat-line ${m.from === user.uid ? "mine" : ""}`}
          >
            <div className="chat-meta">
              <Link to={`/u/${m.username}`} className="chat-user">
                @{m.username}
              </Link>
              <span className="chat-time">{timeOf(m.createdAt)}</span>
              {m.editedAt && !m.deleted && <span className="edited-tag">(edited)</span>}
              {canEdit(m, user.uid) && editingId !== m.id && (
                <button
                  className="chat-del"
                  title="Edit (within 15 minutes)"
                  onClick={() => setEditingId(m.id)}
                >
                  ✎
                </button>
              )}
              {m.from === user.uid && !m.deleted && (
                <button
                  className="chat-del"
                  title="Delete your message"
                  onClick={() => remove(m.id)}
                >
                  ✕
                </button>
              )}
            </div>
            {m.deleted ? (
              <div className="chat-text gone-text">🚫 Message deleted</div>
            ) : editingId === m.id ? (
              <MessageEdit
                initial={m.text}
                max={500}
                onSave={(t) => edit(m.id, t)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="chat-text">{m.text}</div>
            )}
          </div>
        ))}
      </div>

      {!canSend && (
        <p className="chat-note">Verify your email to join the conversation.</p>
      )}
      <form className="chat-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message #${room.id}...`}
          maxLength={500}
          disabled={!canSend}
        />
        <button type="submit" disabled={!canSend || sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}