import { useEffect, useState, useCallback } from "react";
import {
  collection, addDoc, updateDoc, doc, query, orderBy, limit,
  onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import useProfile from "./useProfile";

export default function useRoom(roomId) {
  const { user } = useAuth();
  const profile = useProfile();
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  // live feed: the newest 50 messages in this room
  useEffect(() => {
    setMessages([]);
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()),
      (err) => console.error("room", err),
    );
    return unsub;
  }, [roomId]);

  const send = useCallback(
    async (text) => {
      const clean = (text || "").trim().slice(0, 500);
      if (!user || !profile || !profile.username || !clean || sending) return false;
      setSending(true);
      try {
        await addDoc(collection(db, "rooms", roomId, "messages"), {
          from: user.uid,
          username: profile.username, // the rules check this against your real profile
          text: clean,
          createdAt: serverTimestamp(),
        });
        setSending(false);
        return true;
      } catch (e) {
        console.error("room send", e);
        alert("Couldn't send that. Verify your email first, then try again.");
        setSending(false);
        return false;
      }
    },
    [user, profile, roomId, sending],
  );

  const edit = useCallback(
    async (id, text) => {
      const clean = (text || "").trim().slice(0, 500);
      if (!clean) return false;
      try {
        await updateDoc(doc(db, "rooms", roomId, "messages", id), {
          text: clean,
          editedAt: serverTimestamp(),
        });
        return true;
      } catch (e) {
        console.error("room edit", e);
        alert("Couldn't save that edit. You can only edit for 15 minutes after sending.");
        return false;
      }
    },
    [roomId],
  );

  // "delete" wipes the text and leaves a blank marker, so nothing breaks for anyone
  const remove = useCallback(
    async (id) => {
      try {
        await updateDoc(doc(db, "rooms", roomId, "messages", id), {
          text: "",
          deleted: true,
          deletedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("room delete", e);
      }
    },
    [roomId],
  );

  return { messages, send, sending, edit, remove };
}