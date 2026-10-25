import { fetchNews } from "./news";

export const HUBS = {
  nba: { label: "NBA", emoji: "🏀", path: "basketball/nba" },
  nfl: { label: "NFL", emoji: "🏈", path: "football/nfl" },
};

const safeUrl = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : null);

// Turn HTML from a feed into plain text (nothing gets executed)
const toText = (html) => {
  try {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch (e) {
    return "";
  }
};

// Sports headlines: reuses your existing fetchNews (cached for 5 minutes)
export async function getSportsCards(league) {
  const items = await fetchNews();
  const list = league ? items.filter((a) => a.league === league) : items;
  return list.slice(0, 30).map((a) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    image: a.image || null,
    link: a.url || null,
    time: a.published ? new Date(a.published).getTime() : 0,
    source: a.league,
  }));
}

// Paste your Cloudflare Worker address here once you've made it (Part B),
// like "https://athletebeats-music.yourname.workers.dev" (no slash at the end).
const MUSIC_PROXY = "https://athletebeats-music.bradnifisent.workers.dev";
const MUSIC_FEEDS = [
  { key: "billboard", name: "Billboard" },
  { key: "rollingstone", name: "Rolling Stone" },
  { key: "stereogum", name: "Stereogum" },
  { key: "pitchfork", name: "Pitchfork" },
];

const parseFeed = (xml, name) => {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return Array.from(doc.querySelectorAll("item"))
    .slice(0, 15)
    .map((it) => {
      const get = (tag) => {
        const n = it.getElementsByTagName(tag)[0];
        return n ? n.textContent : "";
      };
      const media =
        it.getElementsByTagNameNS("*", "content")[0] ||
        it.getElementsByTagNameNS("*", "thumbnail")[0] ||
        it.getElementsByTagName("enclosure")[0];
      return {
        id: get("guid") || get("link"),
        title: toText(get("title")),
        summary: toText(get("description")).slice(0, 220),
        time: get("pubDate") ? new Date(get("pubDate")).getTime() : 0,
        image: safeUrl(media && media.getAttribute("url")),
        link: safeUrl(get("link")),
        source: name,
      };
    });
};

export async function getMusicNews() {
  if (!MUSIC_PROXY) throw new Error("NOT_CONFIGURED");
  const results = await Promise.allSettled(
    MUSIC_FEEDS.map(async (f) => {
      const res = await fetch(`${MUSIC_PROXY}/?feed=${f.key}`);
      if (!res.ok) throw new Error(`${f.name} ${res.status}`);
      return parseFeed(await res.text(), f.name);
    }),
  );
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (all.length === 0) throw new Error("Couldn't load music news right now.");
  return all
    .filter((a) => a.title && a.link)
    .sort((a, b) => b.time - a.time)
    .slice(0, 30);
}

// Apple's most-played songs chart (no key needed)
export async function getTopSongs() {
  try {
    const res = await fetch(
      "https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json",
    );
    if (!res.ok) throw new Error("chart");
    const data = await res.json();
    return (data.feed.results || []).map((s) => ({
      id: s.id,
      title: s.name,
      artist: s.artistName,
      image: safeUrl(s.artworkUrl100),
      link: safeUrl(s.url),
    }));
  } catch (e) {
    // older Apple address as a backup
    const res = await fetch("https://itunes.apple.com/us/rss/topsongs/limit=10/json");
    if (!res.ok) throw new Error("Couldn't load the chart right now.");
    const data = await res.json();
    return (data.feed.entry || []).map((s) => {
      const link = Array.isArray(s.link) ? s.link[0] : s.link;
      const imgs = s["im:image"] || [];
      return {
        id: s.id && s.id.label,
        title: s["im:name"] && s["im:name"].label,
        artist: s["im:artist"] && s["im:artist"].label,
        image: safeUrl(imgs[imgs.length - 1] && imgs[imgs.length - 1].label),
        link: safeUrl(link && link.attributes && link.attributes.href),
      };
    });
  }
}

export async function getStandings(key) {
  const hub = HUBS[key];
  const res = await fetch(
    `https://site.api.espn.com/apis/v2/sports/${hub.path}/standings`,
  );
  if (!res.ok) throw new Error("Couldn't load standings right now.");
  const data = await res.json();
  return (data.children || []).map((c) => ({
    name: c.name,
    rows: ((c.standings && c.standings.entries) || [])
      .map((e) => {
        const stat = (n) => (e.stats || []).find((s) => s.name === n);
        const show = (n) => {
          const s = stat(n);
          return s && s.displayValue != null ? s.displayValue : "–";
        };
        const pct = stat("winPercent");
        return {
          team: e.team.displayName,
          logo: safeUrl(e.team.logos && e.team.logos[0] && e.team.logos[0].href),
          w: show("wins"),
          l: show("losses"),
          pct: show("winPercent"),
          gb: show("gamesBehind"),
          sort: pct ? Number(pct.value) || 0 : 0,
        };
      })
      .sort((a, b) => b.sort - a.sort),
  }));
}