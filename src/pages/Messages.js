import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import useConversations from "../hooks/useConversations";
import useChat from "../hooks/useChat";
import useUser from "../hooks/useUser";
import "./Messages.css";
import MessageEdit, { canEdit } from "../components/MessageEdit";

function ConvoRow({ c, active }) {
  const u = useUser(c.other);
  const name = (u && (u.displayName || u.username)) || "...";
  const to = u && u.username ? `/messages/${u.username}` : "/messages";
  return (
    <Link
      to={to}
      className={`msg-row ${active ? "active" : ""} ${c.unread ? "unread" : ""}`}
    >
      <div className="msg-avatar">{name[0].toUpperCase()}</div>
      <div className="msg-row-text">
        <strong>{name}</strong>
        <span>{c.lastMessage}</span>
      </div>
      {c.unread && <span className="msg-dot" />}
    </Link>
  );
}

function ChatPane({ otherUid, name, username, convo }) {
  const { user } = useAuth();
  const { messages, send, sending, edit } = useChat(otherUid, convo);
  const [editingId, setEditingId] = useState(null);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  // keep the newest message in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await send(text);
    if (ok) setText("");
  };

  const canSend = user && user.emailVerified;

  return (
    <>
      <div className="msg-chat-head">
        <Link to="/messages" className="msg-back">←</Link>
        <Link to={`/u/${username}`} className="msg-chat-name">
          {name} <span>@{username}</span>
        </Link>
      </div>

      <div className="msg-thread" ref={listRef}>
        {messages.length === 0 && (
          <p className="msg-empty">No messages yet. Say hi 👋</p>
        )}
                {messages.map((m) =>
          editingId === m.id ? (
            <MessageEdit
              key={m.id}
              initial={m.text}
              max={1000}
              onSave={(t) => edit(m.id, t)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={m.id}
              className={`msg-bubble ${m.from === user.uid ? "mine" : "theirs"}`}
            >
              {m.text}
              {m.editedAt && <span className="edited-tag"> (edited)</span>}
              {canEdit(m, user.uid) && (
                <button
                  className="edit-btn"
                  title="Edit (within 15 minutes)"
                  onClick={() => setEditingId(m.id)}
                >
                  ✎
                </button>
              )}
            </div>
          ),
        )}
      </div>

      {!canSend && (
        <p className="msg-note">Verify your email to send messages.</p>
      )}
      <form className="msg-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={1000}
          disabled={!canSend}
        />
        <button type="submit" disabled={!canSend || sending || !text.trim()}>
          Send
        </button>
      </form>
    </>
  );
}

export default function Messages() {
  const { handle } = useParams();
  const { user } = useAuth();
  const { convos, ready } = useConversations();
  const [target, setTarget] = useState(null);

  // turn the @handle in the address into a person
  useEffect(() => {
    if (!handle) {
      setTarget(null);
      return;
    }
    let cancelled = false;
    setTarget({ status: "loading" });
    (async () => {
      try {
        const claim = await getDoc(doc(db, "usernames", handle.toLowerCase()));
        if (!claim.exists()) {
          if (!cancelled) setTarget({ status: "missing" });
          return;
        }
        const uid = claim.data().uid;
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        if (!snap.exists()) {
          setTarget({ status: "missing" });
          return;
        }
        const p = snap.data();
        setTarget({
          status: "ok",
          uid,
          username: p.username || handle,
          name: p.displayName || p.username || "Athlete",
        });
      } catch (e) {
        if (!cancelled) setTarget({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const activeUid = target && target.uid ? target.uid : null;
  const activeConvo = activeUid
    ? convos.find((c) => c.other === activeUid) || null
    : null;

  let right = <p className="msg-empty">Pick a conversation.</p>;
  if (handle) {
    if (!target || target.status === "loading") {
      right = <p className="msg-empty">Loading...</p>;
    } else if (target.status === "missing") {
      right = <p className="msg-empty">No one with the @handle "{handle}".</p>;
    } else if (target.status === "error") {
      right = <p className="msg-empty">Couldn't open that chat.</p>;
    } else if (user && target.uid === user.uid) {
      right = <p className="msg-empty">You can't message yourself.</p>;
    } else {
      right = (
        <ChatPane
          otherUid={target.uid}
          name={target.name}
          username={target.username}
          convo={activeConvo}
        />
      );
    }
  }

  return (
    <div className={`msg-page ${handle ? "has-chat" : ""}`}>
      <aside className="msg-list">
        <h2>✉️ Messages</h2>
        {!ready && <p className="msg-empty">Loading...</p>}
        {ready && convos.length === 0 && (
          <p className="msg-empty">
            No conversations yet. Open someone's profile to say hi.
          </p>
        )}
        {convos.map((c) => (
          <ConvoRow key={c.id} c={c} active={c.other === activeUid} />
        ))}
      </aside>
      <section className="msg-chat">{right}</section>
    </div>
  );
}