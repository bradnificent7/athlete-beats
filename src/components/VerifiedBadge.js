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

  // verifiedAt is a Firestore timestamp; show it if it's there
  const when =
    user.verifiedAt && typeof user.verifiedAt.toDate === "function"
      ? user.verifiedAt
          .toDate()
          .toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : null;

  const tip = when ? `${label} · ${when}` : label;

  return (
    <span className="verified-badge" title={tip} aria-label={tip}>
      ✔
    </span>
  );
}