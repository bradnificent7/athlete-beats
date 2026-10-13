import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./AppLayout.css";
import { Link } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import useProfile from "../hooks/useProfile";

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const { current, playing, toggle, next, prev } = usePlayer();
  const profile = useProfile();

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "You";

  const roleLabel = (profile?.roles || ["fan"])
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(" · ");

  const handleLogout = async () => {
    await signOut(auth);
  };

  const closeOnMobile = () => {
  if (window.innerWidth <= 768) setSidebarOpen(false);
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
            <input type="text" placeholder="Search athletes, songs, teams..." />
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-icon-btn">🔔</button>
          <button className="nav-icon-btn">✉️</button>
          <div className="nav-user">
            <div className="nav-avatar">{displayName[0].toUpperCase()}</div>
            <div className="nav-user-info">
              <span className="nav-username">{displayName}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-body">
        {/* Sidebar open backdrop */}
        {sidebarOpen && (
         <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          {/* User profile mini card */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{displayName[0].toUpperCase()}</div>
            {sidebarOpen && (
              <div className="sidebar-user-info">
                <p className="sidebar-username">{displayName}</p>
                <p className="sidebar-role">{roleLabel}</p>
              </div>
            )}
          </div>

                    {/* Nav items */}
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className="sidebar-link"
                  onClick={closeOnMobile}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="sidebar-label">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Sign out
          </button>
          
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
            <p className="player-song">
              {current ? current.title : "Not Playing"}
            </p>
            <p className="player-artist">
              {current ? current.channel : "Search a song in Music"}
            </p>
          </div>
        </div>

        <div className="player-center">
          <button className="player-btn" onClick={prev}>
            ⏮
          </button>
          <button className="player-btn play-btn" onClick={toggle}>
            {playing ? "⏸" : "▶️"}
          </button>
          <button className="player-btn" onClick={next}>
            ⏭
          </button>
        </div>

        <div className="player-right">
          <span className="player-platform">YouTube</span>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;