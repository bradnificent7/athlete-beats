import { useEffect, useState, useCallback } from "react";
import {
  collection, doc, getDoc, getCountFromServer, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function useFollow(targetUid) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!targetUid) return;
    try {
      const [a, b] = await Promise.all([
        getCountFromServer(collection(db, "users", targetUid, "followers")),
        getCountFromServer(collection(db, "users", targetUid, "following")),
      ]);
      setFollowers(a.data().count);
      setFollowingCount(b.data().count);
      if (user && user.uid !== targetUid) {
        const snap = await getDoc(doc(db, "users", user.uid, "following", targetUid));
        setFollowing(snap.exists());
      }
    } catch (e) {
      console.error("follow load", e);
    }
  }, [targetUid, user]);

  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    if (!user || user.uid === targetUid || busy) return;
    setBusy(true);
    const mine = doc(db, "users", user.uid, "following", targetUid);
    const theirs = doc(db, "users", targetUid, "followers", user.uid);
    const batch = writeBatch(db);
    try {
      if (following) {
        batch.delete(mine);
        batch.delete(theirs);
      } else {
        batch.set(mine, { createdAt: serverTimestamp() });
        batch.set(theirs, { createdAt: serverTimestamp() });
      }
      await batch.commit();
      setFollowing(!following);
      setFollowers((n) => n + (following ? -1 : 1));
    } catch (e) {
      console.error("follow toggle", e);
      alert("Couldn't update follow. Verify your email first, then try again.");
    }
    setBusy(false);
  };

  return { following, followers, followingCount, busy, toggle };
}