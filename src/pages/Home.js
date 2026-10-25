import React, { useEffect, useState } from "react";
import { SPORTS, getScores } from "../services/scores";
import NewsFeed from "../components/NewsFeed";
import "./Home.css";

const toDateString = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

const prettyDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const gameStatus = (g) => {
  if (g.label) return g.label;
  return new Date(g.datetime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const groupByDate = (games) => {
  const grouped = {};
  games.forEach((g) => {
    const d = toDateString(new Date(g.datetime));
    (grouped[d] = grouped[d] || []).push(g);
  });
  return grouped;
};

const TeamSide = ({ team, showScore }) => (
  <div className="team-side">
    {team.logo && (
      <img
        className="team-logo"
        src={team.logo}
        alt={team.name}
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
      />
    )}
    <div className="team-name">{team.name}</div>
    <div className="team-city">{team.city || "\u00A0"}</div>
    <div className="team-score">{showScore ? team.score : "–"}</div>
  </div>
);

const Home = () => {
  const [sport, setSport] = useState("nba");
  const [byDate, setByDate] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setByDate({});
    setSelected(null);

    getScores(sport)
      .then((games) => {
        if (cancelled) return;
        const grouped = {};
        games.forEach((g) => {
          const d = toDateString(new Date(g.datetime)); // local date
          (grouped[d] = grouped[d] || []).push(g);
        });
        setByDate(grouped);

        const dates = Object.keys(grouped).sort();
        const today = toDateString(new Date());
        setSelected(
          (grouped[today] && today) ||
            dates.find((d) => d >= today) ||
            dates[dates.length - 1] ||
            null,
        );
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
  }, [sport]);

  // Quietly refresh scores while any of today's games isn't final
useEffect(() => {
  const today = toDateString(new Date());
  const todays = byDate[today] || [];
  if (!todays.some((g) => g.state !== "post")) return;

  let cancelled = false;
  const refresh = async () => {
    if (document.hidden) return;
    try {
      const games = await getScores(sport);
      if (cancelled) return;
      setByDate(groupByDate(games));
      setUpdated(new Date());
    } catch (e) {
      // keep showing the last scores if a refresh fails
    }
  };

  const id = setInterval(refresh, 45000);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    cancelled = true;
    clearInterval(id);
    document.removeEventListener("visibilitychange", refresh);
  };
}, [sport, byDate]);

  const current = SPORTS.find((s) => s.key === sport);
  const dates = Object.keys(byDate).sort();
  const games = selected ? byDate[selected] || [] : [];

  return (
    <div className="home">
      <h2 className="games-title">🏟️ Today's Games</h2>

      <div className="sport-tabs">
        {SPORTS.map((s) => (
          <button
            key={s.key}
            className={`sport-tab ${s.key === sport ? "active" : ""}`}
            onClick={() => setSport(s.key)}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {updated && (
        <p className="home-msg" style={{ fontSize: 12, opacity: 0.7 }}>
          Updated {updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
        </p>
      )}

      {loading && <p className="home-msg">Loading games...</p>}
      {error && <p className="home-msg error">{error}</p>}
      {!loading && !error && dates.length === 0 && (
        <p className="home-msg">
          No {current.label} games in the next few weeks. It may be the offseason.
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
              <TeamSide team={g.away} showScore={g.state !== "pre"} />
              <div className="vs">@</div>
              <TeamSide team={g.home} showScore={g.state !== "pre"} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <NewsFeed />
      </div>
    </div>
  );
};

export default Home;