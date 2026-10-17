import React from "react";
import "./VerifiedBadge.css";

const LABEL = {
  athlete: "Verified athlete",
  coach: "Verified coach",
  media: "Verified media",
};

export default function VerifiedBadge({ user }) {
  if (!user || user.verified !== true) return null;
  const label = LABEL[user.verifiedRole] || "Verified";
  return (
    <span className="verified-badge" title={label} aria-label={label}>
      ✔
    </span>
  );
}