import React, { useEffect, useState } from "react";
import { getGames } from "../services/nba";
import "./Home.css";

const toDateString = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

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

const Home = () => {
  const [date, setDate] = useState(new Date());
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getGames(toDateString(date))
      .then((data) => { if (!cancelled) setGames(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const shiftDay = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  return (
    <div className="home">
      <div className="games-header">
        <h2>🏀 NBA Games</h2>
        <div className="date-nav">
          <button onClick={() => shiftDay(-1)}>←</button>
          <span>{date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
          <button onClick={() => shiftDay(1)}>→</button>
        </div>
      </div>

      {loading && <p className="home-msg">Loading games...</p>}
      {error && <p className="home-msg error">{error}</p>}
      {!loading && !error && games.length === 0 && (
        <p className="home-msg">No games on this day. Try another date.</p>
      )}

      <div className="games-grid">
        {games.map((g) => (
          <div key={g.id} className="game-card">
            <div className="game-status">{gameStatus(g)}</div>
            <div className="game-team">
              <span>{g.visitor_team.full_name}</span>
              <strong>{g.visitor_team_score}</strong>
            </div>
            <div className="game-team">
              <span>{g.home_team.full_name}</span>
              <strong>{g.home_team_score}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;