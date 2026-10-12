// Turns a pasted link into a safe embed. Only YouTube, Spotify, SoundCloud allowed.
// We store the original link and rebuild the embed every time, never trust stored src.
export function toEmbed(input) {
  let u;
  try {
    u = new URL((input || "").trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return /^[\w-]{11}$/.test(id)
      ? {
          provider: "YouTube",
          src: `https://www.youtube.com/embed/${id}`,
          height: 220,
        }
      : null;
  }
  if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
    const id = u.searchParams.get("v");
    return id && /^[\w-]{11}$/.test(id)
      ? {
          provider: "YouTube",
          src: `https://www.youtube.com/embed/${id}`,
          height: 220,
        }
      : null;
  }
  if (host === "open.spotify.com") {
    const m = u.pathname.match(
      /^\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/,
    );
    return m
      ? {
          provider: "Spotify",
          src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
          height: m[1] === "track" ? 152 : 352,
        }
      : null;
  }
  if (host === "soundcloud.com" && u.pathname.length > 1) {
    return {
      provider: "SoundCloud",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.origin + u.pathname)}&color=%23c471ed`,
      height: 166,
    };
  }
  return null;
}
