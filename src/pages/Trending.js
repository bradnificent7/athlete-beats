import React, { useEffect, useState } from "react";
import { getSportsCards, getMusicNews, getTopSongs } from "../services/hub";
import NewsList from "../components/NewsList";
import "./Pages.css";

const TABS = [
  { key: "sports", label: "🏆 Sports updates" },
  { key: "music", label: "🎵 Music news" },
];

function MusicTab() {
  const [songs, setSongs] = useState(null);
  const [news, setNews] = useState(null);
  const [newsMsg, setNewsMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTopSongs()
      .then((s) => !cancelled && setSongs(s))
      .catch(() => !cancelled && setSongs([]));
    getMusicNews()
      .then((n) => !cancelled && setNews(n))
      .catch((e) => {
        if (cancelled) return;
        setNewsMsg(
          e.message === "NOT_CONFIGURED"
            ? "Music news is coming soon."
            : "Couldn't load music news right now.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h3 className="page-sub">🔥 Top songs right now</h3>
      {songs === null && <p className="page-msg">Loading...</p>}
      {songs && songs.length === 0 && (
        <p className="page-msg">The chart isn't available right now.</p>
      )}
      {songs && songs.length > 0 && (
        <div className="song-grid">
          {songs.map((s, i) => (
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
      )}

      <h3 className="page-sub">📰 Latest music news</h3>
      {!news && !newsMsg && <p className="page-msg">Loading...</p>}
      {newsMsg && <p className="page-msg">{newsMsg}</p>}
      {news && <NewsList items={news} />}
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