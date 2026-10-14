// Cleans a pasted SoundCloud link and looks up its title, artist and cover.
// Only single-track links are accepted (not profiles or playlists).

export function cleanScUrl(raw) {
  try {
    const u = new URL((raw || "").trim());
    const host = u.hostname.replace(/^(www|m)\./, "");
    if (u.protocol !== "https:" || host !== "soundcloud.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2 || parts.length > 3) return null;
    if (parts[1] === "sets") return null;
    return `https://soundcloud.com/${parts.join("/")}`;
  } catch (e) {
    return null;
  }
}

const safeCdn = (u) =>
  typeof u === "string" && /^https:\/\/[a-z0-9-]+\.sndcdn\.com\//.test(u) ? u : "";

// Never throws. If the lookup fails we fall back to names built from the link.
export async function getScTrack(url) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const fallback = {
    id: url,
    url,
    source: "soundcloud",
    title: parts[1].replace(/-/g, " "),
    channel: parts[0].replace(/-/g, " "),
    thumb: "",
  };
  try {
    const res = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) return fallback;
    const j = await res.json();
    const channel = String(j.author_name || fallback.channel).slice(0, 100);
    let title = String(j.title || fallback.title);
    const tail = ` by ${channel}`;
    if (title.endsWith(tail)) title = title.slice(0, -tail.length);
    return {
      ...fallback,
      title: title.slice(0, 150),
      channel,
      thumb: safeCdn(j.thumbnail_url),
    };
  } catch (e) {
    return fallback;
  }
}

/* ── import a whole SoundCloud playlist (set) ── */
let scApi = null;
const loadScApi = () => {
  if (window.SC && window.SC.Widget) return Promise.resolve(window.SC);
  if (scApi) return scApi;
  scApi = new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://w.soundcloud.com/player/api.js";
    tag.onload = () => resolve(window.SC);
    tag.onerror = reject;
    document.head.appendChild(tag);
  });
  return scApi;
};

export function cleanScSetUrl(raw) {
  try {
    const u = new URL((raw || "").trim());
    const host = u.hostname.replace(/^(www|m)\./, "");
    if (u.protocol !== "https:" || host !== "soundcloud.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 3 || parts[1] !== "sets") return null;
    return `https://soundcloud.com/${parts.slice(0, 3).join("/")}`;
  } catch (e) {
    return null;
  }
}

// Loads the playlist in a hidden player and reads its song list.
export async function importScSet(url) {
  const SC = await loadScApi();
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.style.cssText =
      "position:fixed;left:-9999px;top:0;width:300px;height:166px;border:0;";
    frame.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`;
    document.body.appendChild(frame);

    let done = false;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      frame.remove();
      fn(value);
    };
    const timer = setTimeout(
      () => finish(reject, new Error("SoundCloud took too long to answer.")),
      15000,
    );

    const w = SC.Widget(frame);
    w.bind(SC.Widget.Events.READY, () => {
      w.getSounds((sounds) => {
        const tracks = (sounds || [])
          .map((s) => {
            const link = s && s.permalink_url ? cleanScUrl(s.permalink_url) : null;
            if (!link) return null;
            return {
              id: link,
              url: link,
              source: "soundcloud",
              title: String(s.title || "Untitled").slice(0, 150),
              channel: String((s.user && s.user.username) || "SoundCloud").slice(0, 100),
              thumb: safeCdn(s.artwork_url),
            };
          })
          .filter(Boolean)
          .slice(0, 100);
        if (!tracks.length) {
          finish(
            reject,
            new Error("No songs found. Is the playlist public?"),
          );
        } else {
          finish(resolve, tracks);
        }
      });
    });
  });
}