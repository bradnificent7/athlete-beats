import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Login.css";

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special symbol (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("fan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  const saveUserRole = async (user) => {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email || "",
      role: role,
      createdAt: new Date(),
      displayName: user.displayName || "",
    }, { merge: true });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    if (isSignUp && !validatePassword()) return;
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserRole(result.user);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      console.log("Logged in:", result.user.email);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

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
          <h1 className="logo-text">AthletBeats</h1>
          <p className="logo-sub">Where Sports Meets Sound</p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(false); setShowPhone(false); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(true); setShowPhone(false); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Role selector */}
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

                {/* Password strength bar — sign up only */}
                {isSignUp && password.length > 0 && (
                  <>
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="strength-segment"
                          style={{
                            background: i <= passwordStrength ? getStrengthColor() : "rgba(255,255,255,0.1)"
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

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
              </button>
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