import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { sendVerify } from "../services/verifyEmail";
import "./VerifyBanner.css";

export default function VerifyBanner() {
  const { user, verified, refreshUser } = useAuth();
  const [msg, setMsg] = useState("");
  const [cool, setCool] = useState(0);

  // when they come back to this tab after clicking the email link, re-check
  useEffect(() => {
    if (!user || verified) return;
    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, verified, refreshUser]);

  // 60 second wait between resends
  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool(cool - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  if (!user || verified) return null;

  const resend = async () => {
    setMsg("");
    try {
      await sendVerify(user);
      setMsg("Email sent. Check your inbox and your spam folder.");
      setCool(60);
    } catch (e) {
      setMsg(
        e.code === "auth/too-many-requests"
          ? "Too many tries. Wait a few minutes and try again."
          : "Couldn't send the email. Try again in a minute.",
      );
    }
  };

  const check = async () => {
    await refreshUser();
    if (!(auth.currentUser && auth.currentUser.emailVerified)) {
      setMsg("Not verified yet. Click the link in the email first.");
    }
  };

  return (
    <div className="verify-banner">
      <p>
        ✉️ Verify your email{user.email ? ` (${user.email})` : ""} to report
        people and request a verified badge.
      </p>
      <div className="verify-actions">
        <button onClick={resend} disabled={cool > 0}>
          {cool > 0 ? `Resend in ${cool}s` : "Resend email"}
        </button>
        <button onClick={check}>I verified it</button>
      </div>
      {msg && <p className="verify-msg">{msg}</p>}
    </div>
  );
}