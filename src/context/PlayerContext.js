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

export const PlayerProvider = ({ children }) => {
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const nextRef = useRef(() => {});

  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);

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
  const prev = useCallback(() => playAt(indexRef.current - 1), [playAt]);
  nextRef.current = next;

  const playTrack = useCallback(
    (track, list) => {
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

  const toggleCollapse = () => {
  setCollapsed((c) => !c);
};

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

      const value = {
    current,
    playing,
    collapsed,
    playTrack,
    toggle,
    next,
    prev,
    toggleCollapse,
    close,
  };

    return (
    <PlayerContext.Provider value={value}>
      {children}
      <div
        className={`yt-window ${visible ? "" : "hidden"} ${collapsed ? "collapsed" : ""}`}
      >
        <div className="yt-header">
          <span className="yt-title">
          {current
            ? playing
              ? current.title
              : `Tap ▶ to play · ${current.title}`
            : ""}
          </span>
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
