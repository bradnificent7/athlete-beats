import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const cache = new Map();

export default function useUser(uid) {
  const [u, setU] = useState(() => (uid && cache.get(uid)) || null);

  useEffect(() => {
    if (!uid) return;
    if (cache.has(uid)) {
      setU(cache.get(uid));
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", uid))
      .then((s) => {
        const d = s.exists() ? s.data() : {};
        const v = { username: d.username, displayName: d.displayName };
        cache.set(uid, v);
        if (!cancelled) setU(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return u;
}