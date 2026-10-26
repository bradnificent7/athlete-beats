import { useEffect, useState, useCallback } from "react";
import {
  collection, query, orderBy, limit, onSnapshot, writeBatch, doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function useNotifications() {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("notifications", err),
    );
    return unsub;
  }, [uid]);

  const markRead = useCallback(
    async (id) => {
      if (!uid) return;
      try {
        const b = writeBatch(db);
        b.update(doc(db, "users", uid, "notifications", id), { read: true });
        await b.commit();
      } catch (e) {
        console.error(e);
      }
    },
    [uid],
  );

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.read);
    if (!uid || !unread.length) return;
    try {
      const b = writeBatch(db);
      unread.forEach((n) =>
        b.update(doc(db, "users", uid, "notifications", n.id), { read: true }),
      );
      await b.commit();
    } catch (e) {
      console.error(e);
    }
  }, [items, uid]);

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, markRead, markAllRead };
}