import React from "react";
import useFollow from "../hooks/useFollow";

export default function FollowBar({ targetUid, self }) {
  const { following, followers, followingCount, busy, toggle } = useFollow(targetUid);
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", margin: "12px 0" }}>
      <span><strong>{followers}</strong> followers</span>
      <span><strong>{followingCount}</strong> following</span>
      {!self && (
        <button className="btn-primary" onClick={toggle} disabled={busy}>
          {following ? "Following ✓" : "Follow"}
        </button>
      )}
    </div>
  );
}