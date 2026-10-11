import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./AppLayout.css";
import { Link } from "react-router-dom";

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nowPlaying] = useState({
    song: "Not Playing",
    artist: "Select a track",
    playing: false,
  });

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { icon: "🏠", label: "Home", path: "/" },
    { icon: "🔥", label: "Trending", path: "/trending" },
    { icon: "🏀", label: "NBA", path: "/nba" },
    { icon: "🏈", label: "NFL", path: "/nfl" },
    { icon: "🎵", label: "Music", path: "/music" },
    { icon: "📺", label: "Live", path: "/live" },
    { icon: "💬", label: "Chat", path: "/chat" },
    { icon: "👤", label: "Profile", path: "/profile" },
  ];

  return (
    <div className="app-layout">
      {/* Animated background */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Top navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className="nav-logo">
            <span className="nav-logo-icon">🎵</span>
            <span className="nav-logo-text">AthleteBeats</span>
          </div>
        </div>

        <div className="navbar-center">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search athletes, songs, teams..."
            />
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-icon-btn">🔔</button>
          <button className="nav-icon-btn">✉️</button>
          <div className="nav-user">
            <div className="nav-avatar">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="nav-user-info">
              <span className="nav-username">
                {user?.displayName || user?.email?.split("@")[0]}
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          {/* User profile mini card */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            {sidebarOpen && (
              <div className="sidebar-user-info">
                <p className="sidebar-username">
                  {user?.displayName || user?.email?.split("@")[0]}
                </p>
                <p className="sidebar-role">🏆 Fan</p>
              </div>
            )}
          </div>

          {/* Nav items */}
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link to={item.path} className="sidebar-link">
                  <span className="sidebar-icon">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Online friends */}
          {sidebarOpen && (
            <div className="sidebar-online">
              <p className="sidebar-section-label">Online Now</p>
              {["LeBron J.", "Steph C.", "Travis S."].map((name) => (
                <div key={name} className="online-user">
                  <div className="online-dot" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="main-content">{children}</main>
      </div>

      {/* Bottom music player bar */}
      <div className="player-bar">
        <div className="player-left">
          <div className="player-thumb">🎵</div>
          <div className="player-info">
            <p className="player-song">{nowPlaying.song}</p>
            <p className="player-artist">{nowPlaying.artist}</p>
          </div>
          <button className="player-like">🤍</button>
        </div>

        <div className="player-center">
          <button className="player-btn">⏮</button>
          <button className="player-btn play-btn">
            {nowPlaying.playing ? "⏸" : "▶️"}
          </button>
          <button className="player-btn">⏭</button>
        </div>

        <div className="player-right">
          <span className="player-platform">
            <img
              src="https://www.google.com/s2/favicons?domain=spotify.com"
              alt="Spotify"
              width="16"
            />
            Spotify
          </span>
          <span className="player-volume">🔊</span>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;