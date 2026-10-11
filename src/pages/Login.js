import React, { useState } from "react";
import "./Login.css";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("fan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Firebase auth will go here in the next step
    console.log("Submitting:", { email, password, role, isSignUp });

    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Animated background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="logo-icon">🎵</span>
          <h1 className="logo-text">AthletBeats</h1>
          <p className="logo-sub">Where Sports Meets Sound</p>
        </div>

        {/* Tab toggle */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${isSignUp ? "active" : ""}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {/* Role selector — only on sign up */}
        {isSignUp && (
          <div className="role-selector">
            <p className="role-label">I am a...</p>
            <div className="role-options">
              {["fan", "athlete", "coach", "media"].map((r) => (
                <button
                  key={r}
                  className={`role-btn ${role === r ? "active" : ""}`}
                  onClick={() => setRole(r)}
                >
                  {r === "fan" && "🏆 Fan"}
                  {r === "athlete" && "🏃 Athlete"}
                  {r === "coach" && "📋 Coach"}
                  {r === "media" && "📺 Media"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Google login */}
        <button className="google-btn">
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width="18"
          />
          Continue with Google
        </button>

        {/* Footer */}
        <p className="login-footer">
          By signing up you agree to our{" "}
          <span className="link">Terms of Service</span> and{" "}
          <span className="link">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Login;