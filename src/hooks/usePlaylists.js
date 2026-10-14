import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const MAX_TRACKS = 100;
const MAX_PLAYLISTS = 20;

const lite = (t) => ({
  id: String(t.id).slice(0, 300),
  source: t.source === "soundcloud" ? "soundcloud" : "youtube",
  title: String(t.title || "").slice(0, 150),
  channel: String(t.channel || "").slice(0, 100),
  thumb: String(t.thumb || ""),
  ...(t.source === "soundcloud"
    ? { url: String(t.url || t.id).slice(0, 300) }
    : {}),
});
export default function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "playlists"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPlaylists(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, ...data, tracks: data.tracks || [] };
          }),
        );
        setReady(true);
      },
      () => {
        setError("Couldn't load your playlists.");
        setReady(true);
      },
    );
    return unsub;
  }, [user]);

  const createPlaylist = useCallback(
    async (name, firstTrack) => {
      const clean = (name || "").trim().slice(0, 40);
      if (!clean) throw new Error("Give the playlist a name.");
      if (playlists.length >= MAX_PLAYLISTS) {
        throw new Error(`You can have up to ${MAX_PLAYLISTS} playlists.`);
      }
      const ref = await addDoc(
        collection(db, "users", user.uid, "playlists"),
        {
          name: clean,
          tracks: firstTrack ? [lite(firstTrack)] : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );
      return ref.id;
    },
    [user, playlists.length],
  );

     const createPlaylistWithTracks = useCallback(
    async (name, tracks) => {
      const clean = (name || "").trim().slice(0, 40) || "Imported playlist";
      if (playlists.length >= MAX_PLAYLISTS) {
        throw new Error(`You can have up to ${MAX_PLAYLISTS} playlists.`);
      }
      const ref = await addDoc(
        collection(db, "users", user.uid, "playlists"),
        {
          name: clean,
          tracks: (tracks || []).slice(0, MAX_TRACKS).map(lite),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );
      return ref.id;
    },
    [user, playlists.length],
  );

  const addTrack = useCallback(
    async (playlist, track) => {
      if (playlist.tracks.some((t) => t.id === track.id)) return "dup";
      if (playlist.tracks.length >= MAX_TRACKS) {
        throw new Error(`A playlist can hold up to ${MAX_TRACKS} songs.`);
      }
      await updateDoc(doc(db, "users", user.uid, "playlists", playlist.id), {
        tracks: [...playlist.tracks, lite(track)],
        updatedAt: serverTimestamp(),
      });
      return "ok";
    },
    [user],
  );

  const removeTrack = useCallback(
    async (playlist, trackId) => {
      await updateDoc(doc(db, "users", user.uid, "playlists", playlist.id), {
        tracks: playlist.tracks.filter((t) => t.id !== trackId),
        updatedAt: serverTimestamp(),
      });
    },
    [user],
  );

  const deletePlaylist = useCallback(
    async (id) => {
      await deleteDoc(doc(db, "users", user.uid, "playlists", id));
    },
    [user],
  );

  const setColor = useCallback(
    async (playlist, color) => {
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;
        await updateDoc(doc(db, "users", user.uid, "playlists", playlist.id), {
        color,
        updatedAt: serverTimestamp(),
        });
    },
    [user],
);

  return {
    playlists,
    ready,
    error,
    createPlaylist,
    addTrack,
    removeTrack,
    deletePlaylist,
    setColor,
    createPlaylistWithTracks
  };
}