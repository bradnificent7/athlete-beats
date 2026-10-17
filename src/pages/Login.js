import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Login.css";
import { Link } from "react-router-dom";
import { sendVerify } from "../services/verifyEmail";


const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special symbol (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const USERNAME_RE = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9_.]{3,20}$/;

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("fan");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length;

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "#f64f59";
    if (passwordStrength <= 2) return "#FFA500";
    if (passwordStrength <= 3) return "#c471ed";
    return "#00c853";
  };

  // ── Check if a username is free (looks up one document, never lists users) ──
  const checkUsername = async (value) => {
    const name = value.toLowerCase();
    if (name.length < 3) { setUsernameAvailable(null); return; }
    if (!USERNAME_RE.test(name)) { setUsernameAvailable(false); return; }
    try {
      const snap = await getDoc(doc(db, "usernames", name));
      setUsernameAvailable(!snap.exists());
    } catch (e) {
      setUsernameAvailable(null);
    }
  };

  const validatePassword = () => {
    if (passwordStrength < 4) {
      setError("Password must have 8+ characters, a number, uppercase letter, and special symbol.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  // ── Create a profile ONCE. Never overwrites an existing one. ──
  const saveUserRole = async (user, uname) => {
    const ref = doc(db, "users", user.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) return;

    const handle = (
      uname || "user" + Math.random().toString(36).slice(2, 8)
    ).toLowerCase();

    await setDoc(ref, {
      username: handle,
      displayName: handle,
      role: role,
      roles: [role],
      createdAt: new Date(),
      bio: "",
      followers: 0,
      following: 0,
    });

    try {
      await setDoc(doc(db, "usernames", handle), { uid: user.uid });
    } catch (e) {
      // handle already claimed, profile still works
    }
  };

  // ── Email sign in / sign up ──
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!validatePassword()) { setLoading(false); return; }
        if (!usernameAvailable) {
          setError("Pick an available username (3-20 letters, numbers, or _).");
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: username.toLowerCase() });
        await saveUserRole(result.user, username);
        try { await sendVerify(result.user); } catch (e) { /* banner has a resend button */ }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  // ── Forgot password ──
  const handleReset = async () => {
    setError("");
    setNotice("");
    if (!email) {
      setError("Type your email above first, then click Forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice("Password reset email sent. Check your inbox (and spam).");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  // ── Google ──
  const handleGoogle = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserRole(result.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  // ── Phone ──
  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, "recaptcha-container", { size: "invisible" }
      );
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      window.confirmationResult = result;
      setOtpSent(true);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      await saveUserRole(result.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div id="recaptcha-container" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="logo-icon">🎵</span>
          <h1 className="logo-text">AthleteBeats</h1>
          <p className="logo-sub">Where Sports Meets Sound</p>
        </div>

        {/* Sign In / Sign Up tabs */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(false); setShowPhone(false); setError(""); setNotice(""); }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(true); setShowPhone(false); setError(""); setNotice(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Role selector — sign up only */}
        {isSignUp && (
          <div className="role-selector">
            <p className="role-label">I am a...</p>
            <div className="role-options">
              {["fan", "athlete", "coach", "media"].map((r) => (
                <button
                  key={r}
                  type="button"
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

        {/* Phone view */}
        {showPhone ? (
          <div className="phone-section">
            {!otpSent ? (
              <>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 404 555 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button className="submit-btn" onClick={handleSendOTP} disabled={loading}>
                  {loading ? "Sending..." : "Send Code"}
                </button>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label>Enter the 6-digit code</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button className="submit-btn" onClick={handleVerifyOTP} disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </>
            )}
            <button className="back-btn" onClick={() => { setShowPhone(false); setOtpSent(false); setError(""); }}>
              ← Back
            </button>
          </div>
        ) : (
          <>
            <form className="login-form" onSubmit={handleEmailAuth}>

              {/* Username — sign up only */}
              {isSignUp && (
                <div className="input-group">
                  <label>Username</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. hooper23"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        checkUsername(e.target.value);
                      }}
                      required
                    />
                    {username.length >= 3 && (
                      <span className="username-status">
                        {usernameAvailable === true && "✓"}
                        {usernameAvailable === false && "✗"}
                      </span>
                    )}
                  </div>
                  {username.length >= 3 && usernameAvailable !== null && (
                    <p className="match-msg" style={{
                      color: usernameAvailable ? "#00c853" : "#f64f59"
                    }}>
                      {usernameAvailable
                        ? "✓ Username available"
                        : "✗ Taken or invalid (3-20 letters, numbers, _)"}
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {isSignUp && password.length > 0 && (
                  <>
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-segment"
                          style={{
                            background: i <= passwordStrength
                              ? getStrengthColor()
                              : "rgba(255,255,255,0.1)"
                          }}
                        />
                      ))}
                    </div>
                    <p className="strength-label" style={{ color: getStrengthColor() }}>
                      {getStrengthLabel()}
                    </p>
                    <ul className="password-rules">
                      {passwordRules.map((rule) => (
                        <li
                          key={rule.label}
                          className={rule.test(password) ? "rule-pass" : "rule-fail"}
                        >
                          {rule.test(password) ? "✓" : "○"} {rule.label}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {!isSignUp && (
                  <button type="button" className="back-btn" onClick={handleReset}>
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Confirm password — sign up only */}
              {isSignUp && (
                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className="match-msg" style={{
                      color: password === confirmPassword ? "#00c853" : "#f64f59"
                    }}>
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>
              )}

              {error && <p className="error-msg">{error}</p>}
              {notice && <p className="match-msg" style={{ color: "#00c853", textAlign: "center" }}>{notice}</p>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </button>
            <p className="login-legal">
            By signing up you agree to our{" "}
            <Link to="/legal/terms">Terms</Link>,{" "}
            <Link to="/legal/privacy">Privacy Policy</Link>, and{" "}
            <Link to="/legal/guidelines">Community Guidelines</Link>.
            </p>
            </form>
            <div className="divider"><span>or</span></div>

            <div className="social-btns">
              <button className="social-btn google" onClick={handleGoogle}>
                <img src="https://www.google.com/favicon.ico" alt="Google" width="18" />
                Google
              </button>
              <button className="social-btn phone" onClick={() => setShowPhone(true)}>
                📱 Phone
              </button>
            </div>
          </>
        )}

        
      </div>
    </div>
  );
};

export default Login;