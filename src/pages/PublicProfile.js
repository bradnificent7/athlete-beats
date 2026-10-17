import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { toEmbed } from "../services/embed";
import ProfilePlaylists from "../components/ProfilePlaylists";
import "./Profile.css";
import ReportButton from "../components/ReportButton";
import FollowBar from "../components/FollowBar";


const ROLE_LABELS = {
  fan: "🏆 Fan",
  athlete: "🏃 Athlete",
  coach: "📋 Coach",
  media: "📺 Media",
};
const THEMES = ["default", "neon", "fire", "gold", "forest"];

export default function PublicProfile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const claim = await getDoc(doc(db, "usernames", handle.toLowerCase()));
        if (!claim.exists()) {
          if (!cancelled) setState({ status: "missing" });
          return;
        }
        const uid = claim.data().uid;
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        if (!snap.exists()) setState({ status: "missing" });
        else setState({ status: "ok", uid, p: snap.data() });
      } catch (e) {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (state.status === "loading") {
    return <p className="profile-msg">Loading profile...</p>;
  }
  if (state.status === "error") {
    return <p className="profile-msg">Couldn't load that profile.</p>;
  }
  if (state.status === "missing") {
    return <p className="profile-msg">No one with the @handle "{handle}".</p>;
  }

  const { uid, p } = state;
  if (user && uid === user.uid) return <Navigate to="/profile" replace />;

  const theme = THEMES.includes(p.theme) ? p.theme : "default";
  const name = p.displayName || p.username || "Athlete";
  const roles = Array.isArray(p.roles) && p.roles.length ? p.roles : ["fan"];
  const joined =
    p.createdAt && p.createdAt.toDate
      ? p.createdAt
          .toDate()
          .toLocaleDateString([], { month: "short", year: "numeric" })
      : null;
  const boxes = Array.isArray(p.musicBoxes) ? p.musicBoxes : [];

  return (
    <div className={`profile theme-${theme}`}>
      <div className="profile-top">
        <div className="profile-left">
          <ProfilePlaylists uid={uid} />
        </div>

        <div className="profile-header">
          <div className="profile-avatar">{name[0].toUpperCase()}</div>
          <div className="profile-head-info">
            <h2 className="profile-name">{name}</h2>
            {p.username && <p className="profile-handle">@{p.username}</p>}
            <div className="profile-badges">
              {roles
                .filter((r) => ROLE_LABELS[r])
                .map((r) => (
                  <span key={r} className="profile-badge">
                    {ROLE_LABELS[r]}
                  </span>
                ))}
            </div>
            <p className="profile-stats">
              <strong>{p.followers || 0}</strong> followers ·{" "}
              <strong>{p.following || 0}</strong> following
              {joined && <> · Joined {joined}</>}
            </p>
              <ReportButton targetUid={uid} targetUsername={p.username} />
              <FollowBar targetUid={uid} />
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h3>About</h3>
          <p className="profile-bio">{p.bio || "Nothing here yet."}</p>
        </section>

        <section className="profile-card">
          <h3>🎵 Music box</h3>
          {boxes.length === 0 && (
            <p className="profile-soon">No songs added yet.</p>
          )}
          {boxes.map((item, i) => {
            const e = toEmbed(item.url);
            if (!e) return null;
            return (
              <div key={item.id} className="music-item">
                <iframe
                  title={`${e.provider} player ${i + 1}`}
                  src={e.src}
                  height={e.height}
                  loading="lazy"
                  allow="encrypted-media; clipboard-write"
                />
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}