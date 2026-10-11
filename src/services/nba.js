const BASE = "https://api.balldontlie.io/v1";
const cache = {};
const pending = {};

export function getGamesRange(start, end) {
  const key = `${start}_${end}`;
  if (cache[key]) return Promise.resolve(cache[key]);
  if (pending[key]) return pending[key];

  pending[key] = (async () => {
    let all = [];
    let cursor = null;

    for (let i = 0; i < 3; i++) {
      const url =
        `${BASE}/games?start_date=${start}&end_date=${end}&per_page=100` +
        (cursor ? `&cursor=${cursor}` : "");

      const res = await fetch(url, {
        headers: { Authorization: process.env.REACT_APP_BALLDONTLIE_API_KEY },
      });
      if (res.status === 429) {
        throw new Error("Too many requests. Wait a minute and try again.");
      }
      if (!res.ok) {
        throw new Error(`NBA data error (${res.status})`);
      }

      const json = await res.json();
      all = all.concat(json.data);
      cursor = json.meta && json.meta.next_cursor;
      if (!cursor) break;
    }

    cache[key] = all;
    return all;
  })().finally(() => {
    delete pending[key];
  });

  return pending[key];
}