import React, { useEffect, useState } from "react";
import { getSportsCards, getMusicNews, getTopSongs, MUSIC_GENRES } from "../services/hub";
import NewsList from "../components/NewsList";
import "./Pages.css";

const TABS = [
  { key: "sports", label: "🏆 Sports updates" },
  { key: "music", label: "🎵 Music news" },
];

function MusicTab() {
  const [genre, setGenre] = useState("all");
  const [songs, setSongs] = useState({}); // genre id -> songs
  const [cache, setCache] = useState({}); // genre id -> articles
  const [msgs, setMsgs] = useState({}); // genre id -> message

  const current = MUSIC_GENRES.find((g) => g.id === genre) || MUSIC_GENRES[0];

  useEffect(() => {
    if (songs[genre]) return;
    let cancelled = false;
    getTopSongs(genre)
      .then((s) => !cancelled && setSongs((x) => ({ ...x, [genre]: s })))
      .catch(() => !cancelled && setSongs((x) => ({ ...x, [genre]: [] })));
    return () => {
      cancelled = true;
    };
  }, [genre, songs]);

  useEffect(() => {
    if (cache[genre] || msgs[genre]) return;
    let cancelled = false;
    getMusicNews(genre)
      .then((n) => !cancelled && setCache((c) => ({ ...c, [genre]: n })))
      .catch((e) => {
        if (cancelled) return;
        setMsgs((m) => ({
          ...m,
          [genre]:
            e.message === "NOT_CONFIGURED"
              ? "Music news is coming soon."
              : "Couldn't load this category right now.",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [genre, cache, msgs]);

  useEffect(() => {
    const id = setInterval(() => {
        if (document.hidden) return;
        getTopSongs(genre)
        .then((s) => s.length && setSongs((x) => ({ ...x, [genre]: s })))
        .catch(() => {});
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
    }, [genre]);

  const list = songs[genre];

  return (
    <div>
      <div className="genre-pills">
        {MUSIC_GENRES.map((g) => (
          <button
            key={g.id}
            className={`genre-pill ${genre === g.id ? "active" : ""}`}
            onClick={() => setGenre(g.id)}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      <h3 className="page-sub">
  🔥 Top {genre === "all" ? "" : current.label + " "}songs right now
        </h3>
      {!list && <p className="page-msg">Loading...</p>}
      {list && list.length === 0 && (
        <p className="page-msg">The chart isn't available right now.</p>
      )}
      {list && list.length > 0 && (
        <div className="song-scroll">
            <div className="song-grid">
            {list.map((s, i) => (
                <a
                key={s.id || i}
                className="song-card"
                href={s.link || undefined}
                target="_blank"
                rel="noopener noreferrer"
                >
                {s.image && <img src={s.image} alt="" loading="lazy" />}
                <span className="song-rank">#{i + 1}</span>
                <div className="song-title">{s.title}</div>
                <div className="song-artist">{s.artist}</div>
                </a>
            ))}
            </div>
        </div>
        )}

      <h3 className="page-sub">📰 Latest {genre === "all" ? "music" : current.label} news</h3>
      {!cache[genre] && !msgs[genre] && <p className="page-msg">Loading...</p>}
      {msgs[genre] && <p className="page-msg">{msgs[genre]}</p>}
      {cache[genre] && <NewsList items={cache[genre]} />}
    </div>
  );
}

export default function Trending() {
  const [tab, setTab] = useState("sports");
  const [sports, setSports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab !== "sports" || sports) return;
    let cancelled = false;
    setError("");
    getSportsCards()
      .then((items) => !cancelled && setSports(items))
      .catch((e) => !cancelled && setError(e.message || "Couldn't load that."));
    return () => {
      cancelled = true;
    };
  }, [tab, sports]);

  return (
    <div className="page">
      <h2 className="page-title">🔥 Trending</h2>
      <div className="page-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`page-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sports" && (
        <>
          {error && <p className="page-msg error">{error}</p>}
          {!sports && !error && <p className="page-msg">Loading...</p>}
          {sports && <NewsList items={sports} />}
        </>
      )}
      {tab === "music" && <MusicTab />}
    </div>
  );
}