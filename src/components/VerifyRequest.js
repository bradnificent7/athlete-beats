import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Report.css";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const makeCode = () => {
  const bytes = new Uint32Array(6);
  window.crypto.getRandomValues(bytes);
  return "AB-" + Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
};

// keep the same code if they refresh the page
const getCode = (uid) => {
  const key = `verifyCode_${uid}`;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved && /^AB-[A-Z0-9]{6}$/.test(saved)) return saved;
    const fresh = makeCode();
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch (e) {
    return makeCode();
  }
};

const ROLE_LABEL = { athlete: "Athlete", coach: "Coach", media: "Media" };

export default function VerifyRequest({ roles, username }) {
  const { user, verified } = useAuth();
  const [req, setReq] = useState(undefined); // undefined = loading, null = none
  const [code] = useState(() => getCode(user.uid));
  const eligible = (roles || []).filter((r) => r !== "fan");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "verifyRequests", user.uid));
        if (!cancelled) setReq(snap.exists() ? snap.data() : null);
      } catch (e) {
        if (!cancelled) setReq(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const submit = async () => {
    setError("");
    const l = link.trim();
    const chosen = role || eligible[0];
    if (!chosen) return setError("Pick a role.");
    if (!/^https:\/\//.test(l)) {
      return setError("The proof link must start with https://");
    }
    setSending(true);
    try {
      const data = {
        uid: user.uid,
        username: (username || "").slice(0, 30),
        role: chosen,
        code,
        proofLink: l,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      if (note.trim()) data.note = note.trim().slice(0, 300);
      await setDoc(doc(db, "verifyRequests", user.uid), data);
      setReq({ ...data, createdAt: null });
    } catch (e) {
      console.error("Verify request failed:", e);
      setError("Couldn't send your request. Check that your email is verified.");
    }
    setSending(false);
  };

  const tryAgain = async () => {
    try {
      await deleteDoc(doc(db, "verifyRequests", user.uid));
      setReq(null);
      setLink("");
      setNote("");
    } catch (e) {
      setError("Couldn't reset. Try again.");
    }
  };

  return (
    <section className="profile-card">
      <h3>✔ Get verified</h3>

      {req === undefined && <p className="profile-soon">Loading...</p>}

      {req && req.status === "approved" && (
        <p className="report-ok">
          You're verified as {ROLE_LABEL[req.role] || "a member"}. ✔
        </p>
      )}

      {req && req.status === "pending" && (
        <>
          <p>⏳ Under review. We'll check the page you linked for your code.</p>
          <p className="profile-soon">
            Code: <strong>{req.code}</strong>
          </p>
        </>
      )}

      {req && req.status === "rejected" && (
        <>
          <p className="report-err">Your request wasn't approved.</p>
          {req.adminNote && <p className="profile-soon">{req.adminNote}</p>}
          <button className="report-cancel" onClick={tryAgain}>
            Try again
          </button>
        </>
      )}

      {req === null && !verified && (
        <p className="profile-soon">
          Verify your email first (see the orange banner at the top).
        </p>
      )}

      {req === null && verified && eligible.length === 0 && (
        <p className="profile-soon">
          Pick Athlete, Coach or Media under "I am a..." and save your profile.
          Then you can ask to be verified.
        </p>
      )}

      {req === null && verified && eligible.length > 0 && (
        <>
          <ol className="verify-steps">
            <li>
              Put this code somewhere public that shows it's you, like your
              team or school roster bio, or your official social profile bio:
              <div className="verify-code">{code}</div>
            </li>
            <li>Paste the link to that page below.</li>
            <li>We check the page for the code, then approve you.</li>
          </ol>

          <div className="report-reasons">
            {eligible.map((r) => (
              <label key={r} className="report-reason">
                <input
                  type="radio"
                  name="verify-role"
                  checked={(role || eligible[0]) === r}
                  onChange={() => setRole(r)}
                />
                {ROLE_LABEL[r]}
              </label>
            ))}
          </div>

          <input
            className="report-link"
            placeholder="Link to the page with your code (https://...)"
            maxLength={300}
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <textarea
            className="verify-note"
            placeholder="Optional: team, school, or outlet, and anything else that helps."
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && <p className="report-err">{error}</p>}
          <div className="report-actions">
            <button className="report-send" onClick={submit} disabled={sending}>
              {sending ? "Sending..." : "Request verification"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}