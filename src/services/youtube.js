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

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    maxResults: "12",
    q: query,
    key: process.env.REACT_APP_YOUTUBE_API_KEY,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (res.status === 403) {
    throw new Error("YouTube search limit reached, or the key isn't allowed here. Try again later.");
  }
  if (!res.ok) throw new Error(`YouTube error (${res.status})`);

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