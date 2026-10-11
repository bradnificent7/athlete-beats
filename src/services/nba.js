const BASE = "https://api.balldontlie.io/v1";
const cache = {};    // finished results, keyed by date
const pending = {};  // requests currently in flight, keyed by date

export async function getGames(date) {
  if (cache[date]) return cache[date];
  if (pending[date]) return pending[date];

  pending[date] = fetch(`${BASE}/games?dates[]=${date}&per_page=100`, {
    headers: { Authorization: process.env.REACT_APP_BALLDONTLIE_API_KEY },
  })
    .then(async (res) => {
      if (res.status === 429) {
        throw new Error("Too many requests. Wait a minute and try again.");
      }
      if (!res.ok) {
        throw new Error(`NBA data error (${res.status})`);
      }
      const json = await res.json();
      cache[date] = json.data;
      return json.data;
    })
    .finally(() => {
      delete pending[date];
    });

  return pending[date];
}