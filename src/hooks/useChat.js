import { useEffect, useState, useCallback } from "react";
import {
  collection, doc, query, orderBy, limitToLast, onSnapshot,
  writeBatch, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// otherUid: who you're chatting with
// convo: this conversation's entry from useConversations (or null if it doesn't exist yet)
export default function useChat(otherUid, convo) {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  // same pair of people = same ID, whoever starts it
  const members = uid && otherUid ? [uid, otherUid].sort() : null;
  const cid = members ? members.join("_") : null;
  const exists = !!convo;

  // live messages (only once the conversation exists, because the rules
  // can't read a conversation that hasn't been created yet)
  useEffect(() => {
    if (!cid || !exists) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "conversations", cid, "messages"),
      orderBy("createdAt", "asc"),
      limitToLast(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("messages", err),
    );
    return unsub;
  }, [cid, exists]);

  // opening the chat clears your unread flag
  const unread = !!(convo && convo.unread);
  useEffect(() => {
    if (!cid || !unread) return;
    updateDoc(doc(db, "conversations", cid), { unreadFor: null }).catch((e) =>
      console.error("mark read", e),
    );
  }, [cid, unread]);

  const send = useCallback(
    async (text) => {
      const clean = (text || "").trim().slice(0, 1000);
      if (!uid || !cid || !clean || sending) return false;
      setSending(true);
      try {
        const batch = writeBatch(db);
        // 1) the message
        batch.set(doc(collection(db, "conversations", cid, "messages")), {
          from: uid,
          text: clean,
          createdAt: serverTimestamp(),
        });
        // 2) the conversation card (merge = create the first time, update after)
        batch.set(
          doc(db, "conversations", cid),
          {
            members,
            lastMessage: clean.slice(0, 100),
            lastAt: serverTimestamp(),
            lastFrom: uid,
            unreadFor: otherUid,
          },
          { merge: true },
        );
        await batch.commit();
        setSending(false);
        return true;
      } catch (e) {
        console.error("send", e);
        alert("Couldn't send that. Verify your email first, then try again.");
        setSending(false);
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, cid, otherUid, sending],
  );

    const edit = useCallback(
    async (id, text) => {
      const clean = (text || "").trim().slice(0, 1000);
      if (!cid || !clean) return false;
      try {
        await updateDoc(doc(db, "conversations", cid, "messages", id), {
          text: clean,
          editedAt: serverTimestamp(),
        });
        return true;
      } catch (e) {
        console.error("edit", e);
        alert("Couldn't save that edit. You can only edit for 15 minutes after sending.");
        return false;
      }
    },
    [cid],
  );

    const edit = useCallback(
    async (id, text) => {
      const clean = (text || "").trim().slice(0, 1000);
      if (!cid || !clean) return false;
      try {
        await updateDoc(doc(db, "conversations", cid, "messages", id), {
          text: clean,
          editedAt: serverTimestamp(),
        });
        return true;
      } catch (e) {
        console.error("edit", e);
        alert("Couldn't save that edit. You can only edit for 15 minutes after sending.");
        return false;
      }
    },
    [cid],
  );

  return { cid, messages, send, sending, edit };
}