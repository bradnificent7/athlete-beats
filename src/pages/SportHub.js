import React, { useEffect, useState } from "react";
import { HUBS, getSportsCards, getStandings } from "../services/hub";
import NewsList from "../components/NewsList";
import "./Pages.css";

export default function SportHub({ sport }) {
  const lg = HUBS[sport];
  const [tab, setTab] = useState("news");
  const [news, setNews] = useState(null);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if ((tab === "news" && news) || (tab === "standings" && groups)) return;
    let cancelled = false;
    setError("");
    const run =
      tab === "news"
        ? getSportsCards(lg.label).then((r) => !cancelled && setNews(r))
        : getStandings(sport).then((r) => !cancelled && setGroups(r));
    run.catch((e) => !cancelled && setError(e.message || "Couldn't load that."));
    return () => {
      cancelled = true;
    };
  }, [sport, tab, news, groups]);

  return (
    <div className="page">
      <h2 className="page-title">
        {lg.emoji} {lg.label}
      </h2>
      <div className="page-tabs">
        <button className={`page-tab ${tab === "news" ? "active" : ""}`} onClick={() => setTab("news")}>
          📰 Headlines
        </button>
        <button className={`page-tab ${tab === "standings" ? "active" : ""}`} onClick={() => setTab("standings")}>
          📊 Standings
        </button>
      </div>

      {error && <p className="page-msg error">{error}</p>}
      {!error && tab === "news" && (news ? <NewsList items={news} /> : <p className="page-msg">Loading...</p>)}

      {!error && tab === "standings" && !groups && <p className="page-msg">Loading...</p>}
      {!error &&
        tab === "standings" &&
        groups &&
        groups.map((g) => (
          <div key={g.name} className="standings-group">
            <h3>{g.name}</h3>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PCT</th>
                  <th>GB</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.team}>
                    <td>
                      <span className="st-team">
                        {r.logo && <img src={r.logo} alt="" />}
                        {r.team}
                      </span>
                    </td>
                    <td>{r.w}</td>
                    <td>{r.l}</td>
                    <td>{r.pct}</td>
                    <td>{r.gb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}