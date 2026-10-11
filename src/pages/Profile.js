import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const ROLES = [
  { id: "fan", label: "🏆 Fan" },
  { id: "athlete", label: "🏃 Athlete" },
  { id: "coach", label: "📋 Coach" },
  { id: "media", label: "📺 Media" },
];

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [bio, setBio] = useState("");
  const [roles, setRoles] = useState(["fan"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        setProfile(data);
        setBio(data.bio || "");
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setRoles(
          data.roles && data.roles.length ? data.roles : [data.role || "fan"]
        );
      } catch (e) {
        if (!cancelled) setError("Couldn't load your profile.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user.uid]);

  const toggleRole = (id) => {
    setRoles((current) => {
      if (current.includes(id)) {
        return current.length > 1 ? current.filter((r) => r !== id) : current;
      }
      return [...current, id];
    });
    setMsg("");
  };

    const handleSave = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const handle = (
        profile.username ||
        user.displayName ||
        "user" + Math.random().toString(36).slice(2, 8)
      ).toLowerCase().replace(/[^a-z0-9_.]/g, "");

      const base = profile.createdAt
        ? {}
        : {
            username: handle,
            displayName: user.displayName || handle,
            createdAt: new Date(),
            followers: 0,
            following: 0,
          };

        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");  

      await setDoc(
  doc(db, "users", user.uid),
  {
    ...base,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    displayName: fullName || profile.username || handle,
    bio: bio.trim(),
    roles,
    role: roles[0],
  },
  { merge: true }
);
setProfile((p) => ({
  ...p,
  ...base,
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  displayName: fullName || profile.username || handle,
}));

      if (base.username) {
        try {
          await setDoc(doc(db, "usernames", handle), { uid: user.uid });
        } catch (e) {
          // handle already claimed, fine
        }
      }
      setMsg("Saved ✓");
    } catch (e) {
      console.error("Save failed:", e);
      setError("Couldn't save. Try again.");
    }
    setSaving(false);
  };

  const name = profile.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "You");
  const joined =
    profile.createdAt && profile.createdAt.toDate
      ? profile.createdAt.toDate().toLocaleDateString([], { month: "short", year: "numeric" })
      : null;

  if (loading) return <p className="profile-msg">Loading profile...</p>;

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar">{name[0].toUpperCase()}</div>
        <div className="profile-head-info">
          <h2 className="profile-name">{name}</h2>
          {profile.username && <p className="profile-handle">@{profile.username}</p>}
          <div className="profile-badges">
            {ROLES.filter((r) => roles.includes(r.id)).map((r) => (
              <span key={r.id} className="profile-badge">{r.label}</span>
            ))}
          </div>
          <p className="profile-stats">
            <strong>{profile.followers || 0}</strong> followers ·{" "}
            <strong>{profile.following || 0}</strong> following
            {joined && <> · Joined {joined}</>}
          </p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h3>About me</h3>
          <div className="profile-names">
  <input
    placeholder="First name (optional)"
    maxLength={30}
    value={firstName}
    onChange={(e) => { setFirstName(e.target.value); setMsg(""); }}
  />
  <input
    placeholder="Last name (optional)"
    maxLength={30}
    value={lastName}
    onChange={(e) => { setLastName(e.target.value); setMsg(""); }}
  />
</div>
          <textarea
            value={bio}
            maxLength={300}
            placeholder="Tell people who you are, what you play, what you listen to..."
            onChange={(e) => { setBio(e.target.value); setMsg(""); }}
          />
          <p className="profile-count">{bio.length}/300</p>

          <h3>I am a...</h3>
          <div className="profile-roles">
            {ROLES.map((r) => (
              <button
                key={r.id}
                className={`profile-role ${roles.includes(r.id) ? "active" : ""}`}
                onClick={() => toggleRole(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button className="profile-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
          {msg && <p className="profile-ok">{msg}</p>}
          {error && <p className="profile-err">{error}</p>}
        </section>

        <section className="profile-card">
          <h3>🎵 Profile song</h3>
          <p className="profile-soon">Pick a song from Music to show here. Coming next.</p>

          <h3>⭐ Top 8</h3>
          <div className="profile-top8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="top8-slot">{i + 1}</div>
            ))}
          </div>
          <p className="profile-soon">Friends will go here once following is built.</p>
        </section>
      </div>
    </div>
  );
};

export default Profile;