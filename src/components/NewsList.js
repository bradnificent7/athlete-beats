import React from "react";

const ago = (t) => {
  if (!t) return "";
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

export default function NewsList({ items }) {
  if (!items.length) return <p className="page-msg">Nothing here right now.</p>;
  return (
    <div className="news-list">
      {items.map((a) => {
        const inner = (
          <>
            {a.image && (
              <img
                className="news-img"
                src={a.image}
                alt=""
                loading="lazy"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <div className="news-body">
              <div className="news-meta">
                <span className="news-source">{a.source}</span>
                <span>{ago(a.time)}</span>
              </div>
              <h3 className="news-title">{a.title}</h3>
              {a.summary && <p className="news-summary">{a.summary}</p>}
            </div>
          </>
        );
        return a.link ? (
          <a key={a.id} className="news-card" href={a.link} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          <div key={a.id} className="news-card">{inner}</div>
        );
      })}
    </div>
  );
}