const BASE = "https://site.api.espn.com/apis/site/v2/sports";

export const SPORTS = [
  { key: "nba", label: "NBA", emoji: "🏀", feeds: ["basketball/nba"] },
  { key: "nfl", label: "NFL", emoji: "🏈", feeds: ["football/nfl"] },
  { key: "mlb", label: "MLB", emoji: "⚾", feeds: ["baseball/mlb"] },
  { key: "nhl", label: "NHL", emoji: "🏒", feeds: ["hockey/nhl"] },
  {
    key: "soccer",
    label: "Soccer",
    emoji: "⚽",
    feeds: ["soccer/eng.1", "soccer/esp.1", "soccer/usa.1", "soccer/uefa.champions"],
  },
];

const ymd = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA").replace(/-/g, "");
};

const side = (c) => {
  const t = c.team || {};
  const name = t.name || t.shortDisplayName || t.displayName || "";
  return {
    name,
    city: t.location && t.location !== name ? t.location : "",
    logo: t.logo || "",
    score: c.score,
  };
};

const normalize = (e) => {
  const comp = (e.competitions && e.competitions[0]) || {};
  const list = comp.competitors || [];
  const home = list.find((c) => c.homeAway === "home") || list[0];
  const away = list.find((c) => c.homeAway === "away") || list[1];
  const type = (e.status && e.status.type) || {};
  return {
    id: e.id,
    datetime: e.date,
    state: type.state, // "pre" | "in" | "post"
    label:
      type.state === "post"
        ? type.shortDetail || "Final"
        : type.state === "in"
          ? type.shortDetail || "Live"
          : "",
    home: side(home),
    away: side(away),
  };
};

const fetchFeed = async (feed, dates) => {
  const get = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Scores ${res.status}`);
    return res.json();
  };

  const tries = [
    `${BASE}/${feed}/scoreboard?dates=${dates}&limit=500`,
    `${BASE}/${feed}/scoreboard?dates=${dates}`,
    `${BASE}/${feed}/scoreboard`, // this week only
  ];

  let lastErr;
  for (let i = 0; i < tries.length; i++) {
    try {
      const data = await get(tries[i]);
      let events = data.events || [];

      // The plain scoreboard only shows this week. For weekly sports (NFL),
      // also grab the next 3 weeks so upcoming games show up.
      if (i === tries.length - 1 && data.week && data.week.number) {
        const type = (data.season && data.season.type) || 2;
        const extra = await Promise.allSettled(
          [1, 2, 3].map((n) =>
            get(`${BASE}/${feed}/scoreboard?seasontype=${type}&week=${data.week.number + n}`),
          ),
        );
        extra.forEach((r) => {
          if (r.status === "fulfilled") events = events.concat(r.value.events || []);
        });
      }

      const seen = new Set();
      return events.filter((e) => !seen.has(e.id) && seen.add(e.id)).map(normalize);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

export async function getScores(sportKey, fromDays = -3, toDays = 21) {
  const sport = SPORTS.find((s) => s.key === sportKey);
  const dates = `${ymd(fromDays)}-${ymd(toDays)}`;

  const results = await Promise.allSettled(
    sport.feeds.map((feed) => fetchFeed(feed, dates)),
  );

  const ok = results.filter((r) => r.status === "fulfilled");
  if (ok.length === 0) {
    const why = results[0].reason && results[0].reason.message;
    throw new Error(`Couldn't load scores right now.${why ? ` (${why})` : ""}`);
  }

  return ok
    .flatMap((r) => r.value)
    .filter((g) => g.home && g.away)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
}