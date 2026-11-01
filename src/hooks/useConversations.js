import { useEffect, useState } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function useConversations() {
  const { user } = useAuth();
  const uid = user ? user.uid : null;
  const [convos, setConvos] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!uid) {
      setConvos([]);
      setReady(true);
      return;
    }
    const q = query(
      collection(db, "conversations"),
      where("members", "array-contains", uid),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            other: x.members.find((m) => m !== uid),
            lastMessage: x.lastMessage,
            lastFrom: x.lastFrom,
            lastAt: x.lastAt,
            unread: x.unreadFor === uid,
          };
        });
        // newest first (a just-sent message has no server time yet, so it goes on top)
        const t = (c) => (c.lastAt && c.lastAt.toMillis ? c.lastAt.toMillis() : Infinity);
        list.sort((a, b) => t(b) - t(a));
        setConvos(list);
        setReady(true);
      },
      (err) => {
        console.error("conversations", err);
        setReady(true);
      },
    );
    return unsub;
  }, [uid]);

  const unreadCount = convos.filter((c) => c.unread).length;
  return { convos, unreadCount, ready };
}