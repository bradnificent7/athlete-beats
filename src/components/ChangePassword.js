import React, { useState } from "react";
import {
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const hasPassword = user.providerData.some((p) => p.providerId === "password");
  if (!hasPassword) {
    return (
      <section className="profile-card">
        <h3>🔒 Password</h3>
        <p className="profile-soon">
          You sign in with Google or phone, so there's no password to change here.
        </p>
      </section>
    );
  }

  const submit = async () => {
    setMsg(""); setErr("");
    if (next.length < 8 || !/[A-Z]/.test(next) || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) {
    return setErr("Password needs 8+ characters, an uppercase letter, a number and a symbol.");
    }
    if (next !== again) return setErr("The new passwords don't match.");
    if (next === current) return setErr("Pick a password that's different from your current one.");
    setBusy(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      setCurrent(""); setNext(""); setAgain("");
      setMsg("Password changed ✓");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setErr("Your current password is wrong.");
      } else if (e.code === "auth/too-many-requests") {
        setErr("Too many tries. Wait a few minutes and try again.");
      } else if (e.code === "auth/weak-password") {
        setErr("That password is too weak. Try a longer one.");
      } else {
        console.error(e);
        setErr("Couldn't change your password. Try again.");
      }
    }
    setBusy(false);
  };

  return (
    <section className="profile-card">
      <h3>🔒 Change password</h3>
      <input type="password" placeholder="Current password" value={current}
        autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} />
      <input type="password" placeholder="New password (8+ characters)" value={next}
        autoComplete="new-password" onChange={(e) => setNext(e.target.value)} />
      <input type="password" placeholder="Repeat new password" value={again}
        autoComplete="new-password" onChange={(e) => setAgain(e.target.value)} />
      <button className="profile-save" onClick={submit} disabled={busy}>
        {busy ? "Changing..." : "Change password"}
      </button>
      {msg && <p className="profile-ok">{msg}</p>}
      {err && <p className="profile-err">{err}</p>}
    </section>
  );
}