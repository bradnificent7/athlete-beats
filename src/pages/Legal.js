import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./Legal.css";

const DOCS = {
  terms: { title: "Terms of Service", file: "/legal/TERMS_OF_SERVICE.md" },
  privacy: { title: "Privacy Policy", file: "/legal/PRIVACY_POLICY.md" },
  guidelines: { title: "Community Guidelines", file: "/legal/COMMUNITY_GUIDELINES.md" },
};

export default function Legal() {
  const { doc } = useParams();
  const info = DOCS[doc];
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!info) return;
    setText("");
    setFailed(false);
    fetch(info.file)
      .then((r) => { if (!r.ok) throw new Error("bad"); return r.text(); })
      .then((t) =>
        setText(
          t
            .replace("./PRIVACY_POLICY.md", "/legal/privacy")
            .replace("./TERMS_OF_SERVICE.md", "/legal/terms")
        )
      )
      .catch(() => setFailed(true));
  }, [info]);

  return (
    <div className="legal">
      <nav className="legal-nav">
        <Link to="/login">← Back</Link>
        <Link to="/legal/terms">Terms</Link>
        <Link to="/legal/privacy">Privacy</Link>
        <Link to="/legal/guidelines">Guidelines</Link>
      </nav>
      {!info && <p>Page not found.</p>}
      {failed && <p>Couldn't load this page. Try again later.</p>}
      {info && !failed && (text ? <ReactMarkdown>{text}</ReactMarkdown> : <p>Loading...</p>)}
    </div>
  );
}