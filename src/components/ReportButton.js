import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Report.css";

export const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "harassment", label: "Harassment or hate" },
  { id: "impersonation", label: "Pretending to be someone else" },
  { id: "fake_verified", label: "Fake athlete / coach / media claim" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "other", label: "Something else" },
];

export default function ReportButton({ targetUid, targetUsername }) {
  const { user, verified } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setOpen(false);
    setError("");
  };

  const submit = async () => {
    setError("");
    const d = details.trim();
    const l = link.trim();
    if (!reason) return setError("Pick a reason.");
    if (d.length < 10) {
      return setError("Tell us what happened (at least 10 characters).");
    }
    if (l && !/^https:\/\//.test(l)) {
      return setError("The proof link must start with https://");
    }

    setSending(true);
    try {
      const data = {
        reporterUid: user.uid,
        targetUid,
        targetUsername: (targetUsername || "").slice(0, 30),
        reason,
        details: d,
        status: "open",
        createdAt: serverTimestamp(),
      };
      if (l) data.link = l;

      // one report per reporter per person (the ID blocks duplicates)
      await setDoc(doc(db, "reports", `${user.uid}_${targetUid}`), data);
      setDone(true);
    } catch (e) {
      console.error("Report failed:", e);
      setError(
        "Couldn't send. You may have already reported this person, or your account isn't verified yet.",
      );
    }
    setSending(false);
  };

  return (
    <>
      <button className="report-btn" onClick={() => setOpen(true)}>
        🚩 Report
      </button>

      {open && (
        <div
          className="report-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="report-modal" role="dialog" aria-modal="true">
            <h3>Report @{targetUsername}</h3>

            {!verified ? (
              <p className="report-note">
                Verify your email first (use the orange banner at the top of
                the page). It helps stop fake reports.
              </p>
            ) : done ? (
              <p className="report-ok">
                Thanks. Your report was sent and will be reviewed.
              </p>
            ) : (
              <>
                <div className="report-reasons">
                  {REASONS.map((r) => (
                    <label key={r.id} className="report-reason">
                      <input
                        type="radio"
                        name="report-reason"
                        checked={reason === r.id}
                        onChange={() => setReason(r.id)}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <textarea
                  placeholder="What happened? Be specific so we can check it."
                  maxLength={500}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
                <p className="report-count">{details.length}/500</p>

                <input
                  className="report-link"
                  placeholder="Proof link (optional, must start with https://)"
                  maxLength={300}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />

                {error && <p className="report-err">{error}</p>}

                <div className="report-actions">
                  <button
                    className="report-send"
                    onClick={submit}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Send report"}
                  </button>
                  <button className="report-cancel" onClick={close}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {(!verified || done) && (
              <div className="report-actions">
                <button className="report-cancel" onClick={close}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}