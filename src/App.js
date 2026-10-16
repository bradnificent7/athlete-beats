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