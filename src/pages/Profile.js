import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";
import { toEmbed } from "../services/embed";

const ROLES = [
  { id: "fan", label: "🏆 Fan" },
  { id: "athlete", label: "🏃 Athlete" },
  { id: "coach", label: "📋 Coach" },
  { id: "media", label: "📺 Media" },
];

const THEMES = [
  { id: "default", label: "🟣 Classic" },
  { id: "neon", label: "🩵 Neon" },
  { id: "fire", label: "🔥 Fire" },
  { id: "gold", label: "🏆 Gold" },
  { id: "forest", label: "🌲 Forest" },
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
  const [theme, setTheme] = useState("default");
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState("");
  const [linkErr, setLinkErr] = useState("");

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
        setTheme(
          THEMES.some((t) => t.id === data.theme) ? data.theme : "default",
        );
        setLinks(Array.isArray(data.musicBoxes) ? data.musicBoxes : []);
        setRoles(
          data.roles && data.roles.length ? data.roles : [data.role || "fan"],
        );
      } catch (e) {
        if (!cancelled) setError("Couldn't load your profile.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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
  const addLink = () => {
    const url = newLink.trim();
    if (!toEmbed(url)) {
      setLinkErr(
        "That link isn't supported. Use a YouTube, Spotify, or SoundCloud link.",
      );
      return;
    }
    if (links.length >= 5) {
      setLinkErr("Max 5 songs.");
      return;
    }
    setLinks((l) => [...l, { id: Date.now().toString(36), url }]);
    setNewLink("");
    setLinkErr("");
    setMsg("");
  };

  const removeLink = (id) => {
    setLinks((l) => l.filter((x) => x.id !== id));
    setMsg("");
  };

  const moveLink = (id, dir) => {
    setLinks((l) => {
      const i = l.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const copy = [...l];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
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
      )
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "");

      const base = profile.createdAt
        ? {}
        : {
            username: handle,
            displayName: user.displayName || handle,
            createdAt: new Date(),
            followers: 0,
            following: 0,
          };

      const fullName = [firstName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(" ");

      await setDoc(
        doc(db, "users", user.uid),
        {
          ...base,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          theme,
          musicBoxes: links,
          displayName: fullName || profile.username || handle,
          bio: bio.trim(),
          roles,
          role: roles[0],
        },
        { merge: true },
      );
      setProfile((p) => ({
        ...p,
        ...base,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        theme,
        musicBoxes: links,
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

  const name =
    profile.displayName ||
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "You");
  const joined =
    profile.createdAt && profile.createdAt.toDate
      ? profile.createdAt
          .toDate()
          .toLocaleDateString([], { month: "short", year: "numeric" })
      : null;

  if (loading) return <p className="profile-msg">Loading profile...</p>;

  return (
    <div className={`profile theme-${theme}`}>
      <div className="profile-header">
        <div className="profile-avatar">{name[0].toUpperCase()}</div>
        <div className="profile-head-info">
          <h2 className="profile-name">{name}</h2>
          {profile.username && (
            <p className="profile-handle">@{profile.username}</p>
          )}
          <div className="profile-badges">
            {ROLES.filter((r) => roles.includes(r.id)).map((r) => (
              <span key={r.id} className="profile-badge">
                {r.label}
              </span>
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
              onChange={(e) => {
                setFirstName(e.target.value);
                setMsg("");
              }}
            />
            <input
              placeholder="Last name (optional)"
              maxLength={30}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setMsg("");
              }}
            />
          </div>
          <textarea
            value={bio}
            maxLength={300}
            placeholder="Tell people who you are, what you play, what you listen to..."
            onChange={(e) => {
              setBio(e.target.value);
              setMsg("");
            }}
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

          <button
            className="profile-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {msg && <p className="profile-ok">{msg}</p>}
          {error && <p className="profile-err">{error}</p>}
        </section>

        <section className="profile-card">
          <h3>🎨 Theme</h3>
          <div className="profile-roles">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`profile-role ${theme === t.id ? "active" : ""}`}
                onClick={() => {
                  setTheme(t.id);
                  setMsg("");
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <h3>🎵 My music box</h3>
          {links.length === 0 && (
            <p className="profile-soon">
              Paste a YouTube, Spotify, or SoundCloud link below.
            </p>
          )}
          {links.map((item, i) => {
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
                <div className="music-controls">
                  <button
                    onClick={() => moveLink(item.id, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveLink(item.id, 1)}
                    disabled={i === links.length - 1}
                  >
                    ↓
                  </button>
                  <button onClick={() => removeLink(item.id)}>Remove</button>
                </div>
              </div>
            );
          })}
          <div className="music-add">
            <input
              placeholder="Paste a song link..."
              value={newLink}
              onChange={(e) => {
                setNewLink(e.target.value);
                setLinkErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && addLink()}
            />
            <button onClick={addLink}>Add</button>
          </div>
          {linkErr && <p className="profile-err">{linkErr}</p>}
          <p className="profile-soon">
            Click Save profile to keep your changes.
          </p>

          <h3>⭐ Top 8</h3>
          <div className="profile-top8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="top8-slot">
                {i + 1}
              </div>
            ))}
          </div>
          <p className="profile-soon">
            Friends will go here once following is built.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Profile;
