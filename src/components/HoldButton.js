import React, { useEffect, useRef } from "react";

export default function HoldButton({
  onTap,
  onHold,
  holdDelay = 450,
  repeatEvery = 300,
  className,
  title,
  children,
}) {
  const delayTimer = useRef(null);
  const repeatTimer = useRef(null);
  const held = useRef(false);
  const active = useRef(false);

  const clear = () => {
    clearTimeout(delayTimer.current);
    clearInterval(repeatTimer.current);
  };

  useEffect(
    () => () => {
      clearTimeout(delayTimer.current);
      clearInterval(repeatTimer.current);
    },
    [],
  );

  const handleDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    active.current = true;
    held.current = false;
    clear();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // not supported, fine
    }
    delayTimer.current = setTimeout(() => {
      held.current = true;
      onHold();
      repeatTimer.current = setInterval(onHold, repeatEvery);
    }, holdDelay);
  };

  const handleUp = () => {
    if (!active.current) return;
    active.current = false;
    const wasHeld = held.current;
    clear();
    held.current = false;
    if (!wasHeld) onTap();
  };

  const handleCancel = () => {
    active.current = false;
    held.current = false;
    clear();
  };

  return (
    <button
      type="button"
      className={className}
      title={title}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // keyboard activation (Enter/Space) has detail 0
        if (e.detail === 0) onTap();
      }}
    >
      {children}
    </button>
  );
}