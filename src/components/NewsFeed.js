import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchNews, LEAGUES } from "../services/news";
import "./NewsFeed.css";

const PAGE = 8;

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!isFinite(s) || s < 0) return "";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NewsFeed = () => {
  const [all, setAll] = useState([]);
  const [shown, setShown] = useState(PAGE);
  const [status, setStatus] = useState("loading");
  const [league, setLeague] = useState("All");
  const boxRef = useRef(null);
  const endRef = useRef(null);

  const load = useCallback(async (force) => {
    try {
      const items = await fetchNews(force);
      setAll(items);
      setStatus("ok");
    } catch (e) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  const list = league === "All" ? all : all.filter((a) => a.league === league);
  const visible = list.slice(0, shown);
  const done = shown >= list.length;

  // Endless scroll: when the bottom marker comes into view, show more.
  useEffect(() => {
    const end = endRef.current;
    const box = boxRef.current;
    if (!end || !box || done) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setShown((n) => n + PAGE);
      },
      { root: box, rootMargin: "200px" },
    );
    obs.observe(end);
    return () => obs.disconnect();
  }, [done, visible.length, status]);

  const pick = (l) => {
    setLeague(l);
    setShown(PAGE);
    if (boxRef.current) boxRef.current.scrollTop = 0;
  };

  return (
    <div className="news">
      <div className="news-tabs">
        {LEAGUES.map((l) => (
          <button
            key={l}
            className={`news-tab ${league === l ? "active" : ""}`}
            onClick={() => pick(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="news-box" ref={boxRef}>
        {status === "loading" && <p className="news-msg">Loading news...</p>}
        {status === "error" && (
          <p className="news-msg">
            Couldn't load the news.{" "}
            <button className="news-retry" onClick={() => load(true)}>
              Try again
            </button>
          </p>
        )}

        {visible.map((a) => (
          <a
            key={a.id}
            className="news-card"
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {a.image && <img src={a.image} alt="" loading="lazy" />}
            <div className="news-body">
              <span className="news-badge">{a.league}</span>
              <h4>{a.title}</h4>
              {a.summary && <p>{a.summary}</p>}
              <span className="news-meta">
                {a.byline ? `${a.byline} · ` : ""}
                {timeAgo(a.published)}
              </span>
            </div>
          </a>
        ))}

        {status === "ok" && !done && <div ref={endRef} className="news-more">Loading more...</div>}
        {status === "ok" && done && list.length > 0 && (
          <p className="news-msg">
            You're all caught up.{" "}
            <button className="news-retry" onClick={() => load(true)}>
              Refresh
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;