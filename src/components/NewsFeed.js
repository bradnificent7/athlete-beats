import React, { useEffect, useState } from "react";
import { getSportsNews } from "../services/news";
import "./NewsFeed.css";

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSportsNews()
      .then((a) => {
        if (!cancelled) setArticles(a);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="news">
      <h2 className="news-title">📰 Sports News</h2>
      {loading && <p className="news-msg">Loading news...</p>}
      {error && <p className="news-msg error">{error}</p>}
      {!loading && !error && articles.length === 0 && (
        <p className="news-msg">No articles found right now.</p>
      )}

      <div className="news-grid">
        {articles.map((a) => (
          <a
            key={a.url}
            className="news-card"
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {a.urlToImage && (
              <img
                className="news-img"
                src={a.urlToImage}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className="news-body">
              <div className="news-meta">
                {a.source?.name} · {timeAgo(a.publishedAt)}
              </div>
              <div className="news-headline">{a.title}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default NewsFeed;
