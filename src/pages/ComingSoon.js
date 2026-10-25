import React from "react";
import "./Pages.css";

export default function ComingSoon({ emoji, title, text }) {
  return (
    <div className="page coming-soon">
      <h2 className="page-title">
        {emoji} {title}
      </h2>
      <p className="page-msg">{text}</p>
    </div>
  );
}