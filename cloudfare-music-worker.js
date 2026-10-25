const FEEDS = {
  billboard: "https://www.billboard.com/feed/",
  rollingstone: "https://www.rollingstone.com/music/feed/",
  stereogum: "https://www.stereogum.com/feed/",
  pitchfork: "https://pitchfork.com/feed/feed-news/rss",
  xxl: "https://www.xxlmag.com/feed/",
  thesource: "https://thesource.com/feed/",
  rapup: "https://www.rap-up.com/feed/",
  ratedrnb: "https://www.ratedrnb.com/feed/",
  okayplayer: "https://www.okayplayer.com/feed",
  idolator: "https://www.idolator.com/feed/",
  billboardpop: "https://www.billboard.com/c/music/pop/feed/",
  loudwire: "https://loudwire.com/feed/",
  consequence: "https://consequence.net/feed/",
  nme: "https://www.nme.com/news/music/feed",
  tasteofcountry: "https://tasteofcountry.com/feed/",
  savingcountry: "https://www.savingcountrymusic.com/feed",
  soundslikenashville: "https://www.soundslikenashville.com/feed/",
  mixmag: "https://mixmag.net/rss.xml",
  edmcom: "https://edm.com/.rss/full/",
  dancingastronaut: "https://dancingastronaut.com/feed/",
  remezcla: "https://remezcla.com/feed/",
  billboardlatin: "https://www.billboard.com/c/music/latin/feed/",
};

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://athlete-beats.web.app",
  "https://athlete-beats.firebaseapp.com",
];

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[2],
      Vary: "Origin",
    };

    const key = new URL(request.url).searchParams.get("feed");
    const target = FEEDS[key]; // only feeds on this list can be fetched
    if (!target) {
      return new Response("Unknown feed", { status: 400, headers: cors });
    }

    try {
      const upstream = await fetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AthleteBeats/1.0)" },
        cf: { cacheTtl: 900, cacheEverything: true },
      });
      if (!upstream.ok) {
        return new Response("Feed unavailable", { status: 502, headers: cors });
      }
      return new Response(await upstream.text(), {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=900",
        },
      });
    } catch (e) {
      return new Response("Feed unavailable", { status: 502, headers: cors });
    }
  },
};