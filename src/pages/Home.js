import React, { useEffect, useState } from "react";
import { getGamesRange } from "../services/nba";
import NewsFeed from "../components/NewsFeed";
import "./Home.css";

const toDateString = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateString(d);
};

const prettyDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const gameStatus = (g) => {
  if (g.status === "Final") return "Final";
  if (g.status_state === "in_progress") return `Q${g.period} ${g.time || ""}`;
  if (g.datetime) {
    return new Date(g.datetime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return g.status;
};

const LOGO_FIXES = {
  GSW: "gs",
  NOP: "no",
  NYK: "ny",
  SAS: "sa",
  UTA: "utah",
  WAS: "wsh",
};

const logoUrl = (abbr) => {
  const code = LOGO_FIXES[abbr] || abbr.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${code}.png`;
};

const hasStarted = (g) => g.status === "Final" || g.status_state === "in_progress";

const TeamSide = ({ team, score, showScore }) => (
  <div className="team-side">
    <img
      className="team-logo"
      src={logoUrl(team.abbreviation)}
      alt={team.full_name}
      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
    />
    <div className="team-name">{team.name}</div>
    <div className="team-city">{team.city}</div>
    <div className="team-score">{showScore ? score : "–"}</div>
  </div>
);

const Home = () => {
  const [byDate, setByDate] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getGamesRange(addDays(-3), addDays(21))
      .then((games) => {
        if (cancelled) return;
        const grouped = {};
        games.forEach((g) => {
          const d = g.date.slice(0, 10);
          (grouped[d] = grouped[d] || []).push(g);
        });
        setByDate(grouped);

        const dates = Object.keys(grouped).sort();
        const today = toDateString(new Date());
        const pick =
          (grouped[today] && today) ||
          dates.find((d) => d >= today) ||
          dates[dates.length - 1] ||
          null;
        setSelected(pick);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const dates = Object.keys(byDate).sort();
  const games = selected ? byDate[selected] || [] : [];

  return (
    <div className="home">
      <h2 className="games-title">🏀 NBA Games</h2>

      {loading && <p className="home-msg">Loading games...</p>}
      {error && <p className="home-msg error">{error}</p>}
      {!loading && !error && dates.length === 0 && (
        <p className="home-msg">
          No NBA games found in the next few weeks yet.
        </p>
      )}

      {dates.length > 0 && (
        <div className="date-pills">
          {dates.map((d) => (
            <button
              key={d}
              className={`date-pill ${d === selected ? "active" : ""}`}
              onClick={() => setSelected(d)}
            >
              {prettyDate(d)}
            </button>
          ))}
        </div>
      )}

                  <div className="games-grid">
        {games.map((g) => (
          <div key={g.id} className="game-card">
            <div className="game-time">{gameStatus(g)}</div>
            <div className="matchup">
              <TeamSide
                team={g.visitor_team}
                score={g.visitor_team_score}
                showScore={hasStarted(g)}
              />
              <div className="vs">@</div>
              <TeamSide
                team={g.home_team}
                score={g.home_team_score}
                showScore={hasStarted(g)}
              />
            </div>
          </div>
        ))}
      </div>

      <NewsFeed />
    </div>
  );
};

export default Home;