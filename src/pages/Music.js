import React, { useEffect, useState } from "react";
import { searchMusic } from "../services/youtube";
import { usePlayer } from "../context/PlayerContext";
import "./Music.css";

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

/* ── Search tab ── */
const SearchTab = () => {
  const { playTrack, current, playing } = usePlayer();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await searchMusic(q);
      setResults(r);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
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
            <button
              key={t.id}
              className={`result ${isCurrent ? "active" : ""}`}
              onClick={() => playTrack(t, results)}
            >
              <img src={t.thumb} alt="" />
              <div>
                <div className="result-title">{t.title}</div>
                <div className="result-channel">{t.channel}</div>
                {isCurrent && (
                  <div className="result-now">{playing ? "▶ Playing" : "Paused"}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Add by link tab ── */
const LinkTab = () => {
  const [input, setInput] = useState("");
  const [items, setItems] = useState(loadSaved);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // storage unavailable, the list just won't persist
    }
  }, [items]);

  const handleAdd = (e) => {
    e.preventDefault();
    setError("");
    const parsed = parseLink(input);
    if (!parsed) {
      setError("Paste a Spotify or SoundCloud link (open.spotify.com/... or soundcloud.com/...).");
      return;
    }
    if (items.some((i) => i.url === parsed.url)) {
      setError("That one is already on your list.");
      return;
    }
    setItems([{ id: Date.now(), ...parsed }, ...items]);
    setInput("");
  };

  const handleRemove = (id) => setItems(items.filter((i) => i.id !== id));

  return (
    <div>
      <form className="music-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="https://open.spotify.com/track/..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="music-error">{error}</p>}
      {items.length === 0 && (
        <p className="music-empty">Nothing here yet. Add your first song above.</p>
      )}

      <div className="music-list">
        {items.map((item) => (
          <div key={item.id} className="music-card">
            <div className="music-card-top">
              <span className={`music-badge ${item.platform}`}>
                {item.platform === "spotify" ? "Spotify" : "SoundCloud"}
              </span>
              <button className="music-remove" onClick={() => handleRemove(item.id)}>
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
        ))}
      </div>
    </div>
  );
};

/* ── Page ── */
const Music = () => {
  const [tab, setTab] = useState("search");

  return (
    <div className="music">
      <h2 className="music-title">🎵 Music</h2>
      <div className="music-tabs">
        <button
          className={`music-tab ${tab === "search" ? "active" : ""}`}
          onClick={() => setTab("search")}
        >
          🔍 Search
        </button>
        <button
          className={`music-tab ${tab === "link" ? "active" : ""}`}
          onClick={() => setTab("link")}
        >
          🔗 Add by link
        </button>
      </div>
      {tab === "search" ? <SearchTab /> : <LinkTab />}
    </div>
  );
};

export default Music;