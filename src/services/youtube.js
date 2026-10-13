const cache = {};

const decode = (s) => {
  const t = document.createElement("textarea");
  t.innerHTML = s;
  return t.value;
};

export async function searchMusic(q) {
  const query = q.trim();
  if (!query) return [];
  if (cache[query]) return cache[query];
  if (!process.env.REACT_APP_YOUTUBE_API_KEY) {
    throw new Error("No YouTube key in this build. Rebuild after updating .env.");
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    maxResults: "12",
    q: query,
    key: process.env.REACT_APP_YOUTUBE_API_KEY,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
  );

  if (!res.ok) {
    let reason = "";
    try {
      const body = await res.json();
      const err = body && body.error;
      reason =
        (err && err.details && err.details.find((d) => d.reason)?.reason) ||
        (err && err.errors && err.errors[0] && err.errors[0].reason) ||
        (err && err.status) ||
        "";
    } catch (e) {
      // no readable body
    }

    const hints = {
      quotaExceeded: "Daily YouTube search limit reached. It resets around 3 AM Eastern.",
      dailyLimitExceeded: "Daily YouTube search limit reached. It resets around 3 AM Eastern.",
      rateLimitExceeded: "Too many searches too fast. Wait a moment and retry.",
      API_KEY_HTTP_REFERRER_BLOCKED: "This site isn't allowed to use the YouTube key yet.",
      referrerNotAllowed: "This site isn't allowed to use the YouTube key yet.",
      API_KEY_SERVICE_BLOCKED: "The key isn't allowed to use YouTube Data API v3.",
      accessNotConfigured: "YouTube Data API v3 isn't enabled for this key.",
      API_KEY_INVALID: "The YouTube key is invalid.",
      keyInvalid: "The YouTube key is invalid.",
    };

    throw new Error(
      `${hints[reason] || "YouTube search failed."} (${res.status}${reason ? ": " + reason : ""})`,
    );
  }


  const json = await res.json();
  const results = (json.items || []).map((it) => ({
    id: it.id.videoId,
    title: decode(it.snippet.title),
    channel: decode(it.snippet.channelTitle),
    thumb: it.snippet.thumbnails.medium.url,
  }));
  cache[query] = results;
  return results;
}
