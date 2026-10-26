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
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "../components/Report.css";


const fetchRequests = async () => {
  const snap = await getDocs(
    query(
      collection(db, "verifyRequests"),
      orderBy("createdAt", "desc"),
      limit(100),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default function AdminVerify() {
  const { user } = useAuth();
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const a = await getDoc(doc(db, "admins", user.uid));
        if (!a.exists()) {
          if (!cancelled) setState("denied");
          return;
        }
        const list = await fetchRequests();
        if (!cancelled) {
          setItems(list);
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

  const approve = async (r) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "verifyRequests", r.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", r.uid), {
        verified: true,
        verifiedRole: r.role,
        verifiedAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, "users", r.uid, "notifications")), {
        type: "verified",
        role: r.role,
        createdAt: serverTimestamp(),
        read: false,
      });
      await batch.commit();
      setItems((xs) =>
        xs.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)),
      );
    } catch (e) {
      console.error(e);
      alert("Couldn't approve that request.");
    }
  };

  const reject = async (r, revoke) => {
    const note = window.prompt(
      revoke
        ? "Why are you removing the badge? (the user will see this)"
        : "Why was it rejected? (the user will see this)",
    );
    if (note === null) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "verifyRequests", r.id), {
        status: "rejected",
        adminNote: note.slice(0, 200),
        reviewedAt: serverTimestamp(),
      });
      if (revoke) {
        batch.update(doc(db, "users", r.uid), {
          verified: false,
          verifiedRole: "",
          verifiedAt: null,
        });
      }
      await batch.commit();
      setItems((xs) =>
        xs.map((x) =>
          x.id === r.id ? { ...x, status: "rejected", adminNote: note } : x,
        ),
      );
    } catch (e) {
      console.error(e);
      alert("Couldn't update that request.");
    }
  };

  if (state === "loading") return <p className="profile-msg">Loading...</p>;
  if (state === "denied") {
    return <p className="profile-msg">You don't have access to this page.</p>;
  }
  if (state === "error") {
    return <p className="profile-msg">Couldn't load requests.</p>;
  }

  const shown = items.filter((x) => filter === "all" || x.status === filter);

  return (
    <div className="admin-reports">
      <h2>✔ Verification requests</h2>

      <div className="admin-filter">
        {["pending", "approved", "rejected", "all"].map((f) => (
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
            <strong>
              <Link to={`/u/${(r.username || "").toLowerCase()}`}>
                @{r.username}
              </Link>{" "}
              wants to be verified as {r.role}
            </strong>
            <span className="admin-status">{r.status}</span>
          </div>
          <p>
            Look for this code on the page: <strong>{r.code}</strong>
          </p>
          {r.proofLink && r.proofLink.startsWith("https://") && (
            <p>
              <a href={r.proofLink} target="_blank" rel="noopener noreferrer">
                Open proof page ↗
              </a>
            </p>
          )}

          {r.reviewedAt && r.reviewedAt.toDate && (
            <p className="admin-details">
              Reviewed {r.reviewedAt.toDate().toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
          
          {r.note && <p className="admin-details">{r.note}</p>}
          <div className="admin-actions">
            {r.status !== "approved" && (
              <button onClick={() => approve(r)}>Approve</button>
            )}
            {r.status === "pending" && (
              <button onClick={() => reject(r, false)}>Reject</button>
            )}
            {r.status === "approved" && (
              <button onClick={() => reject(r, true)}>Remove badge</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}