// Sports news from ESPN's public feed (no key needed).
const FEEDS = [
  ["basketball/nba", "NBA"],
  ["football/nfl", "NFL"],
  ["baseball/mlb", "MLB"],
  ["hockey/nhl", "NHL"],
  ["soccer/eng.1", "Soccer"],
];

export const LEAGUES = ["All", ...FEEDS.map((f) => f[1])];

const httpsOnly = (u) =>
  typeof u === "string" && u.startsWith("https://") ? u : "";

let cache = { at: 0, items: [] };

export async function fetchNews(force = false) {
  if (!force && cache.items.length && Date.now() - cache.at < 5 * 60 * 1000) {
    return cache.items;
  }

  const results = await Promise.allSettled(
    FEEDS.map(async ([path, label]) => {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${path}/news?limit=50`,
      );
      if (!res.ok) throw new Error(`ESPN ${res.status}`);
      const json = await res.json();
      return (json.articles || []).map((a) => ({
        id: httpsOnly(a.links && a.links.web && a.links.web.href) || a.headline,
        title: String(a.headline || "").slice(0, 200),
        summary: String(a.description || "").slice(0, 300),
        image: httpsOnly(a.images && a.images[0] && a.images[0].url),
        url: httpsOnly(a.links && a.links.web && a.links.web.href),
        published: a.published || "",
        byline: String(a.byline || "").slice(0, 80),
        league: label,
      }));
    }),
  );

  const seen = new Set();
  const items = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((a) => a.title && a.url && !seen.has(a.id) && seen.add(a.id))
    .sort((a, b) => new Date(b.published) - new Date(a.published));

  if (!items.length) throw new Error("Couldn't load the news right now.");
  cache = { at: Date.now(), items };
  return items;
}