import React, { useEffect, useRef, useState } from "react";
import { searchMusic } from "../services/youtube";
import { usePlayer } from "../context/PlayerContext";
import usePlaylists from "../hooks/usePlaylists";
import "./Music.css";
import { cleanScUrl, cleanScSetUrl, getScTrack, importScSet } from "../services/soundcloud";


const SPOTIFY_RE =
  /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/;
const SOUNDCLOUD_RE = /^https?:\/\/(www\.|m\.)?soundcloud\.com\/\S+$/i;
const STORAGE_KEY = "athletebeats_music";

const parseLink = (raw) => {
  const link = raw.trim();
  const sp = link.match(SPOTIFY_RE);
  if (sp) {
    const type = sp[1];
    const id = sp[2];
    return {
      platform: "spotify",
      url: link,
      src: `https://open.spotify.com/embed/${type}/${id}?theme=0`,
      height: type === "track" || type === "episode" ? 152 : 352,
    };
  }
  if (SOUNDCLOUD_RE.test(link)) {
    return {
      platform: "soundcloud",
      url: link,
      src:
        `https://w.soundcloud.com/player/?url=${encodeURIComponent(link)}` +
        `&color=%23c471ed&hide_related=true&show_comments=false&show_reposts=false`,
      height: 166,
    };
  }
  return null;
};

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};


const errText = (err) =>
  err && err.code === "permission-denied"
    ? "Playlists aren't switched on yet (check the Firestore rules)."
    : (err && err.message) || "Something went wrong.";

/* ── Search tab ── */
const SearchTab = ({ playlists, createPlaylist, addTrack }) => {
  const { playTrack, current, playing } = usePlayer();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");

  const flash = (m) => {
    setNote(m);
    setTimeout(() => setNote(""), 2500);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (document.activeElement) document.activeElement.blur();
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setMenuFor(null);
    try {
      const r = await searchMusic(q);
      setResults(r);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAdd = async (p, t) => {
    try {
      const r = await addTrack(p, t);
      flash(r === "dup" ? `Already in ${p.name}` : `Added to ${p.name} ✓`);
    } catch (err) {
      flash(errText(err));
    }
    setMenuFor(null);
  };

  const handleCreate = async (e, t) => {
    e.preventDefault();
    try {
      const name = newName.trim();
      await createPlaylist(name, t);
      flash(`Created "${name}" and added the song ✓`);
      setNewName("");
    } catch (err) {
      flash(errText(err));
    }
    setMenuFor(null);
  };

  return (
    <div>
      <form className="music-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search a song or artist..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading && <span className="btn-spinner" />}
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <p className="music-error">{error}</p>}
      {searched && !error && results.length === 0 && (
        <p className="music-empty">No results. Try a different search.</p>
      )}

      <div className="results">
        {results.map((t) => {
          const isCurrent = current && current.id === t.id;
          return (
            <div key={t.id} className="result-wrap">
              <button
                className={`result ${isCurrent ? "active" : ""}`}
                onClick={() => playTrack(t, results)}
              >
                <img src={t.thumb} alt="" />
                <div>
                  <div className="result-title">{t.title}</div>
                  <div className="result-channel">{t.channel}</div>
                  {isCurrent && (
                    <div className="result-now">
                      {playing ? "▶ Playing" : "Paused"}
                    </div>
                  )}
                </div>
              </button>

              <button
                className="result-add"
                title="Add to playlist"
                aria-label="Add to playlist"
                onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}
              >
                ＋
              </button>

              {menuFor === t.id && (
                <div className="add-menu">
                  {playlists.length === 0 && (
                    <p className="add-menu-empty">No playlists yet</p>
                  )}
                  {playlists.map((p) => (
                    <button key={p.id} onClick={() => handleAdd(p, t)}>
                      <span>{p.name}</span>
                      <span className="add-menu-count">{p.tracks.length}</span>
                    </button>
                  ))}
                  <form onSubmit={(e) => handleCreate(e, t)}>
                    <input
                      placeholder="New playlist..."
                      value={newName}
                      maxLength={40}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <button type="submit">Create</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {note && <div className="music-note">{note}</div>}
    </div>
  );
};

const PL_COLORS = ["#c471ed", "#f64f59", "#ff7eb3", "#4facfe", "#43e97b", "#f9d423"];

const toRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "196,113,237";
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ── Playlists tab ── */
const PlaylistsTab = ({
  playlists,
  ready,
  error,
  createPlaylist,
  removeTrack,
  deletePlaylist,
  setColor,
}) => {
  const { playTrack, current } = usePlayer();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState("");
  const [paletteFor, setPaletteFor] = useState(null);
  const colorTimer = useRef(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const id = await createPlaylist(name);
      setName("");
      setOpen(id);
    } catch (err) {
      setMsg(errText(err));
    }
  };

  const handleDelete = (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    deletePlaylist(p.id).catch((err) => setMsg(errText(err)));
  };

  return (
    <div>
      <form className="music-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New playlist name..."
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>
      {msg && <p className="music-error">{msg}</p>}
      {error && <p className="music-error">{error}</p>}
      {ready && !error && playlists.length === 0 && (
        <p className="music-empty">
          No playlists yet. Create one above, then use the ＋ on any search
          result.
        </p>
      )}

          <div className="playlists">
            {playlists.map((p) => (
              <div
            key={p.id}
            className="playlist-card"
            style={{ "--pl": toRgb(p.color) }}
          >
             <div
                className="playlist-head"
                onClick={() => setOpen(open === p.id ? null : p.id)}
              >
                <button
                  className="pl-gear"
                  aria-label="Playlist color"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaletteFor(paletteFor === p.id ? null : p.id);
                  }}
                >
                  ⚙
                </button>

                <button
                  className="playlist-title"
                >
                  <span className="playlist-name">
                    {open === p.id ? "▾" : "▸"} {p.name}
                  </span>
                  <span className="playlist-count">{p.tracks.length} songs</span>
                </button>

                <div className="playlist-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={!p.tracks.length}
                    onClick={() => playTrack(p.tracks[0], p.tracks)}
                  >
                    ▶ Play all
                  </button>
                  <button
                    disabled={p.tracks.length < 2}
                    onClick={() => {
                      const s = shuffled(p.tracks);
                      playTrack(s[0], s);
                    }}
                  >
                    🔀 Shuffle
                  </button>
                  <button onClick={() => handleDelete(p)}>Delete</button>
                </div>
              </div>

              {paletteFor === p.id && (
                <div className="color-pop">
                  {PL_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`swatch ${p.color === c ? "on" : ""}`}
                      style={{ background: c }}
                      aria-label={`Use color ${c}`}
                      onClick={() => setColor(p, c).catch((err) => setMsg(errText(err)))}
                    />
                  ))}
                  <label className="wheel" title="Color wheel">
                    <input
                      type="color"
                      defaultValue={p.color || "#c471ed"}
                      onChange={(e) => {
                        const v = e.target.value;
                        clearTimeout(colorTimer.current);
                        colorTimer.current = setTimeout(
                          () => setColor(p, v).catch((err) => setMsg(errText(err))),
                          500,
                        );
                      }}
                    />
                  </label>
                </div>
              )}

            {open === p.id && (
              <div className="playlist-tracks">
                {p.tracks.length === 0 && (
                  <p className="music-empty">
                    Empty. Add songs from the Search tab.
                  </p>
                )}
                {p.tracks.map((t, i) => (
                  <div
                    key={t.id}
                    className={`playlist-track ${
                      current && current.id === t.id ? "active" : ""
                    }`}
                  >
                    <button
                      className="playlist-play"
                      onClick={() => playTrack(t, p.tracks)}
                    >
                      <span className="track-num">{i + 1}</span>
                      <div>
                        <div className="result-title">{t.title}</div>
                        <div className="result-channel">{t.channel}</div>
                      </div>
                    </button>
                    <button
                      className="playlist-remove"
                      title="Remove from playlist"
                      onClick={() =>
                        removeTrack(p, t.id).catch((err) => setMsg(errText(err)))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Add by link tab ── */
/* ── Add by link tab ── */
const scThumb = (u) =>
  typeof u === "string" && /^https:\/\/[a-z0-9-]+\.sndcdn\.com\//.test(u) ? u : null;

  function LinkTab({ playlists, createPlaylist, addTrack, createPlaylistWithTracks }) {
  const { playTrack, current, playing } = usePlayer();
  const [input, setInput] = useState("");
  const [items, setItems] = useState(loadSaved);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // storage unavailable, the list just won't persist
    }
  }, [items]);

  const flash = (m) => {
    setNote(m);
    setTimeout(() => setNote(""), 2500);
  };

  const scTracks = items.filter((i) => i.source === "soundcloud");

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const raw = input.trim();
      const setUrl = cleanScSetUrl(raw);
  if (setUrl) {
    setBusy(true);
    try {
      const tracks = await importScSet(setUrl);
      const name = setUrl.split("/").pop().replace(/-/g, " ").slice(0, 40);
      await createPlaylistWithTracks(name, tracks);
      flash(`Imported ${tracks.length} songs into "${name}" ✓`);
      setInput("");
    } catch (err) {
      setError(err.message || "Couldn't import that playlist.");
    }
    setBusy(false);
    return;
  }

    const scUrl = cleanScUrl(raw);
    if (scUrl) {
      if (items.some((i) => i.id === scUrl)) {
        setError("That one is already on your list.");
        return;
      }
      setBusy(true);
      const track = await getScTrack(scUrl);
      setBusy(false);
      setItems([{ ...track, platform: "soundcloud" }, ...items]);
      setInput("");
      return;
    }
    if (SOUNDCLOUD_RE.test(raw)) {
      setError("Paste a single SoundCloud track link (not a profile or playlist).");
      return;
    }

    const parsed = parseLink(raw);
    if (!parsed) {
      setError(
        "Paste a Spotify or SoundCloud link (open.spotify.com/... or soundcloud.com/...).",
      );
      return;
    }
    if (items.some((i) => i.url === parsed.url)) {
      setError("That one is already on your list.");
      return;
    }
    setItems([{ id: Date.now(), ...parsed }, ...items]);
    setInput("");
  };

  const handleRemove = (id) => {
    setItems(items.filter((i) => i.id !== id));
    setMenuFor(null);
  };

  const handleAddTo = async (p, t) => {
    try {
      const r = await addTrack(p, t);
      flash(r === "dup" ? `Already in ${p.name}` : `Added to ${p.name} ✓`);
    } catch (err) {
      flash(errText(err));
    }
    setMenuFor(null);
  };

  const handleCreate = async (e, t) => {
    e.preventDefault();
    try {
      const name = newName.trim();
      await createPlaylist(name, t);
      flash(`Created "${name}" and added the song ✓`);
      setNewName("");
    } catch (err) {
      flash(errText(err));
    }
    setMenuFor(null);
  };

  return (
    <div>
      <form className="music-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="https://soundcloud.com/artist/song"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Adding..." : "Add"}
        </button>
      </form>
      {error && <p className="music-error">{error}</p>}
      {items.length === 0 && (
        <p className="music-empty">
          Nothing here yet. Paste a SoundCloud or Spotify link above.
        </p>
      )}

      <div className="music-list">
        {items.map((item) => {
          if (item.source !== "soundcloud") {
            // Spotify (and older saved links) keep their own embedded player
            return (
              <div key={item.id} className="music-card">
                <div className="music-card-top">
                  <span className={`music-badge ${item.platform}`}>
                    {item.platform === "spotify" ? "Spotify" : "SoundCloud"}
                  </span>
                  <button
                    className="music-remove"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <iframe
                  title={`${item.platform}-${item.id}`}
                  src={item.src}
                  width="100%"
                  height={item.height}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            );
          }

          const isCurrent = current && current.id === item.id;
          return (
            <div key={item.id} className="result-wrap">
              <button
                className={`result ${isCurrent ? "active" : ""}`}
                onClick={() => playTrack(item, scTracks)}
              >
                {scThumb(item.thumb) ? (
                  <img src={scThumb(item.thumb)} alt="" />
                ) : (
                  <span className="thumb-fallback">🎵</span>
                )}
                <div>
                  <div className="result-title">{item.title}</div>
                  <div className="result-channel">{item.channel} · SoundCloud</div>
                  {isCurrent && (
                    <div className="result-now">
                      {playing ? "▶ Playing" : "Paused"}
                    </div>
                  )}
                </div>
              </button>

              <button
                className="result-add"
                title="Add to playlist"
                aria-label="Add to playlist"
                onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}
              >
                ＋
              </button>

              {menuFor === item.id && (
                <div className="add-menu">
                  {playlists.length === 0 && (
                    <p className="add-menu-empty">No playlists yet</p>
                  )}
                  {playlists.map((p) => (
                    <button key={p.id} onClick={() => handleAddTo(p, item)}>
                      <span>{p.name}</span>
                      <span className="add-menu-count">{p.tracks.length}</span>
                    </button>
                  ))}
                  <form onSubmit={(e) => handleCreate(e, item)}>
                    <input
                      placeholder="New playlist..."
                      value={newName}
                      maxLength={40}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <button type="submit">Create</button>
                  </form>
                  <button onClick={() => handleRemove(item.id)}>
                    <span>🗑 Remove from this list</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {note && <div className="music-note">{note}</div>}
    </div>
  );
};

/* ── Page ── */
const useWide = () => {
  const query = "(min-width: 960px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setWide(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  return wide;
};

const Music = () => {
  const [tab, setTab] = useState("search");
  const pl = usePlaylists();
  const wide = useWide();
  const activeTab = wide && tab === "playlists" ? "search" : tab;

  return (
    <div className="music">
      <h2 className="music-title">🎵 Music</h2>
      <div className="music-tabs">
        <button
          className={`music-tab ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setTab("search")}
        >
          🔍 Search
        </button>
        {!wide && (
          <button
            className={`music-tab ${activeTab === "playlists" ? "active" : ""}`}
            onClick={() => setTab("playlists")}
          >
            📚 Playlists
          </button>
        )}
        <button
          className={`music-tab ${activeTab === "link" ? "active" : ""}`}
          onClick={() => setTab("link")}
        >
          🔗 Add by link
        </button>
      </div>

      <div className="music-layout">
        <div className="music-main">
          {activeTab === "search" && (
            <SearchTab
              playlists={pl.playlists}
              createPlaylist={pl.createPlaylist}
              addTrack={pl.addTrack}
            />
          )}
          {activeTab === "playlists" && <PlaylistsTab {...pl} />}
           {activeTab === "link" && (
            <LinkTab
              playlists={pl.playlists}
              createPlaylist={pl.createPlaylist}
              addTrack={pl.addTrack}
              createPlaylistWithTracks={pl.createPlaylistWithTracks}
            />
          )}
        </div>

        {wide && (
          <aside className="music-side">
            <h3 className="music-side-title">📚 My playlists</h3>
            <PlaylistsTab {...pl} />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Music;