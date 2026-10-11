const cache = {};

export async function getSportsNews() {
  if (cache.news) return cache.news;

  const key = process.env.REACT_APP_NEWS_API_KEY;
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?sources=espn&pageSize=12&apiKey=${key}`
  );
  if (res.status === 429) throw new Error("News limit reached for today.");
  if (!res.ok) throw new Error(`News error (${res.status})`);

  const json = await res.json();
  cache.news = (json.articles || []).filter(
    (a) => a.title && a.title !== "[Removed]"
  );
  return cache.news;
}