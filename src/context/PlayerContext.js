import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import "../components/MiniPlayer.css";

const PlayerContext = createContext(null);

/* ── helpers ── */
let apiPromise = null;
const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
};

const loadPref = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null || v === undefined ? fallback : v;
  } catch (e) {
    return fallback;
  }
};

export const PlayerProvider = ({ children }) => {
  /* ── refs ── */
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const nextRef = useRef(() => {});
  const touchY = useRef(null);
  const winRef = useRef(null);
  const dragRef = useRef(null);

  /* ── state ── */
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [desk, setDesk] = useState(
    
    () => window.matchMedia("(min-width: 769px)").matches,
  );
  const [pos, setPos] = useState(() => loadPref("ab_mini_pos", null));
  const [size, setSize] = useState(() => loadPref("ab_mini_size", "m"));
  const [docked, setDocked] = useState(false);
  const [dockVec, setDockVec] = useState({ dx: 0, dy: 0 });

  /* ── playback ── */
  const loadTrack = useCallback((track) => {
    setCurrent(track);
    setVisible(true);
    setCollapsed(false);
    if (readyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(track.id);
    } else {
      pendingRef.current = track;
    }
  }, []);

  const playAt = useCallback(
    (i) => {
      const q = queueRef.current;
      if (i < 0 || i >= q.length) return;
      indexRef.current = i;
      loadTrack(q[i]);
    },
    [loadTrack],
  );

  const next = useCallback(() => playAt(indexRef.current + 1), [playAt]);
  nextRef.current = next;

  const prevTrack = useCallback(() => {
  if (indexRef.current <= 0) {
    const p = playerRef.current;
    if (p && readyRef.current) p.seekTo(0, true);
    return;
  }
  playAt(indexRef.current - 1);
}, [playAt]);

  const playTrack = useCallback(
    (track, list) => {
      setDocked(false);
      const queue = list && list.length ? list : [track];
      queueRef.current = queue;
      indexRef.current = queue.findIndex((t) => t.id === track.id);
      loadTrack(track);
    },
    [loadTrack],
  );

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current || !current) return;
    if (p.getPlayerState() === 1) p.pauseVideo();
    else p.playVideo();
  }, [current]);

  // Tap on rewind: restart the song, or go to the previous one if you
  // are only a few seconds in.
  const restartOrPrev = useCallback(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    const t = p.getCurrentTime ? p.getCurrentTime() : 0;
    if (t > 3 || indexRef.current <= 0) {
      p.seekTo(0, true);
    } else {
      playAt(indexRef.current - 1);
    }
  }, [playAt]);

  // Hold rewind / fast-forward: jump a few seconds at a time.
  const seekBy = useCallback((secs) => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    const dur = p.getDuration ? p.getDuration() : 0;
    let t = (p.getCurrentTime() || 0) + secs;
    t = Math.max(0, dur ? Math.min(t, dur - 0.5) : t);
    p.seekTo(t, true);
  }, []);

  const close = () => {
    if (playerRef.current && readyRef.current) {
      playerRef.current.stopVideo();
    }
    queueRef.current = [];
    indexRef.current = -1;
    setPlaying(false);
    setCurrent(null);
    setVisible(false);
    setCollapsed(false);
  };

  /* ── mini player window: minimize, resize ── */
  const toggleCollapse = () => setCollapsed((c) => !c);

  const cycleSize = () =>
    setSize((s) => (s === "s" ? "m" : s === "m" ? "l" : "s"));

  // Phone: swipe down on the header to minimize, swipe up to expand.
  const onTouchStart = (e) => {
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchY.current = null;
    if (dy > 30) setCollapsed(true);
    else if (dy < -30) setCollapsed(false);
  };

  // Laptop / PC: drag the window by its header (mouse only).
  const onDragStart = (e) => {
    if (!desk || e.pointerType === "touch" || e.button !== 0) return;
    if (e.target.closest("button")) return;
    const r = winRef.current.getBoundingClientRect();
    dragRef.current = {
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      sx: e.clientX,
      sy: e.clientY,
      id: e.pointerId,
      moved: false,
    };
  };

  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(d.id);
    }
    const r = winRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - d.dx), window.innerWidth - r.width);
    const y = Math.min(Math.max(0, e.clientY - d.dy), window.innerHeight - r.height);
    setPos({ x, y });
  };

  const onDragEnd = () => {
    dragRef.current = null;
  };

  /* ── effects ── */
  // Load the YouTube player once.
  useEffect(() => {
    let destroyed = false;
    loadYouTubeApi().then((YT) => {
      if (destroyed) return;
      playerRef.current = new YT.Player("yt-player", {
        width: "100%",
        height: "100%",
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (pendingRef.current) {
              playerRef.current.loadVideoById(pendingRef.current.id);
              pendingRef.current = null;
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              nextRef.current();
            }
          },
          onError: () => nextRef.current(),
        },
      });
    });
    return () => {
      destroyed = true;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        readyRef.current = false;
      }
    };
  }, []);

  // Track whether we're on a laptop/PC-sized screen.
  useEffect(() => {
    const m = window.matchMedia("(min-width: 769px)");
    const f = () => setDesk(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  // Remember window position and size.
  useEffect(() => {
    try {
      localStorage.setItem("ab_mini_pos", JSON.stringify(pos));
      localStorage.setItem("ab_mini_size", JSON.stringify(size));
    } catch (e) {
      // storage unavailable, position just won't be remembered
    }
  }, [pos, size]);

  // Keep the window on screen after a size change or a saved spot from a bigger screen.
  useEffect(() => {
    if (!pos || !winRef.current) return;
    const r = winRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, pos.x), Math.max(0, window.innerWidth - r.width));
    const y = Math.min(Math.max(0, pos.y), Math.max(0, window.innerHeight - r.height));
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [pos, size, collapsed, visible, desk]);

  // Tuck the player into the bottom-left icon, or pop it back out.
  const toggleDock = () => {
    if (docked) {
      setDocked(false);
      return;
    }
    const w = winRef.current;
    const icon = document.querySelector(".player-thumb");
    if (w && icon) {
      const a = w.getBoundingClientRect();
      const b = icon.getBoundingClientRect();
      setDockVec({
        dx: b.left + b.width / 2 - (a.left + a.width / 2),
        dy: b.top + b.height / 2 - (a.top + a.height / 2),
      });
    }
    setDocked(true);
  };

  

  /* ── context value ── */
    const value = {
    current,
    playing,
    collapsed,
    docked,
    playTrack,
    toggle,
    next,
    prevTrack,
    restartOrPrev,
    seekBy,
    toggleCollapse,
    toggleDock,
    close,
  };

  /* ── render ── */
  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div
        ref={winRef}
        className={`yt-window size-${size} ${visible ? "" : "hidden"} ${collapsed ? "collapsed" : ""} ${docked ? "docked" : ""}`}
        style={{
          ...(desk && pos
            ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
            : {}),
          "--dock-dx": `${dockVec.dx}px`,
          "--dock-dy": `${dockVec.dy}px`,
        }}
      >
        <div
          className="yt-header"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="yt-grip" />
          <span className="yt-title" onClick={toggleCollapse}>
            {current
              ? playing
                ? current.title
                : `Tap ▶ to play · ${current.title}`
              : ""}
          </span>
          {desk && (
            <button
              className="yt-toggle"
              onClick={cycleSize}
              title="Change size"
            >
              ⤢
            </button>
          )}
          <button
            className="yt-toggle"
            onClick={toggleCollapse}
            title={collapsed ? "Expand" : "Minimize"}
          >
            {collapsed ? "▲" : "▼"}
          </button>
          <button className="yt-toggle" onClick={close} title="Close">
            ✕
          </button>
        </div>
        <div className="yt-frame">
          <div id="yt-player" />
        </div>
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};