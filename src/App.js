import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Music from "./pages/Music";
import AppLayout from "./components/AppLayout";
import Profile from "./pages/Profile";
import Legal from "./pages/Legal";
import PublicProfile from "./pages/PublicProfile";
import AdminReports from "./pages/AdminReports";
import AdminVerify from "./pages/AdminVerify";
import Trending from "./pages/Trending";
import SportHub from "./pages/SportHub";
import ComingSoon from "./pages/ComingSoon";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/legal/:doc" element={<Legal />} />
      
        <Route path="/*" element={
          <ProtectedRoute>
            <PlayerProvider>
              <AppLayout>
                <Routes>
                  <Route path="/u/:handle" element={<PublicProfile />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/music" element={<Music />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/verify" element={<AdminVerify />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/nba" element={<SportHub key="nba" sport="nba" />} />
                  <Route path="/nfl" element={<SportHub key="nfl" sport="nfl" />} />
                  <Route path="/live" element={<ComingSoon emoji="📺" title="Live" text="Live streams and watch parties are coming soon." />} />
                  <Route path="/chat" element={<ComingSoon emoji="💬" title="Chat" text="Direct messages and group chat are coming soon." />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </AppLayout>
            </PlayerProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
export default App;