import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { REASONS } from "../components/ReportButton";
import "../components/Report.css";

const reasonLabel = (id) => (REASONS.find((r) => r.id === id) || {}).label || id;

const fetchReports = async () => {
  const snap = await getDocs(
    query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default function AdminReports() {
  const { user } = useAuth();
  const [state, setState] = useState("loading"); // loading | denied | ok | error
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await getDoc(doc(db, "admins", user.uid));
        if (!a.exists()) {
          if (!cancelled) setState("denied");
          return;
        }
        const list = await fetchReports();
        if (!cancelled) {
          setReports(list);
          setState("ok");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const setStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "reports", id), {
        status,
        reviewedAt: serverTimestamp(),
      });
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      console.error(e);
      alert("Couldn't update that report.");
    }
  };

  if (state === "loading") return <p className="profile-msg">Loading...</p>;
  if (state === "denied") {
    return <p className="profile-msg">You don't have access to this page.</p>;
  }
  if (state === "error") {
    return <p className="profile-msg">Couldn't load reports.</p>;
  }

  const shown = reports.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="admin-reports">
      <h2>🚩 Reports</h2>

      <div className="admin-filter">
        {["open", "reviewed", "dismissed", "all"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="profile-msg">Nothing here.</p>}

      {shown.map((r) => (
        <div key={r.id} className={`admin-report status-${r.status}`}>
          <div className="admin-report-top">
            <strong>{reasonLabel(r.reason)}</strong>
            <span className="admin-status">{r.status}</span>
          </div>
          <p>
            Against{" "}
            <Link to={`/u/${(r.targetUsername || "").toLowerCase()}`}>
              @{r.targetUsername}
            </Link>
            {r.createdAt && r.createdAt.toDate && (
              <> · {r.createdAt.toDate().toLocaleString()}</>
            )}
          </p>
          <p className="admin-details">{r.details}</p>
          {r.link && r.link.startsWith("https://") && (
            <p>
              <a href={r.link} target="_blank" rel="noopener noreferrer">
                Proof link ↗
              </a>
            </p>
          )}
          <div className="admin-actions">
            <button onClick={() => setStatus(r.id, "reviewed")}>
              Mark reviewed
            </button>
            <button onClick={() => setStatus(r.id, "dismissed")}>
              Dismiss
            </button>
            <button onClick={() => setStatus(r.id, "open")}>Reopen</button>
          </div>
        </div>
      ))}
    </div>
  );
}