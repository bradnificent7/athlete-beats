import React, { useState } from "react";

export const EDIT_MINUTES = 15;

// true if this is your message and it's still inside the edit window
export const canEdit = (m, uid) =>
  !!(
    m.createdAt &&
    m.createdAt.toMillis &&
    m.from === uid &&
    Date.now() - m.createdAt.toMillis() < EDIT_MINUTES * 60000
  );

export default function MessageEdit({ initial, max, onSave, onCancel }) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const clean = val.trim();
    if (!clean || clean === initial) {
      onCancel();
      return;
    }
    setSaving(true);
    const ok = await onSave(clean);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <form className="edit-box" onSubmit={save}>
      <input
        autoFocus
        value={val}
        maxLength={max}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <button type="submit" disabled={saving}>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}