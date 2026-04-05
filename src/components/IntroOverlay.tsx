"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vantage-intro-seen";

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
      sessionStorage.setItem(STORAGE_KEY, "1");

      // Begin exit after content has fully revealed
      const exitTimer = setTimeout(() => setExiting(true), 3000);
      // Remove from DOM after exit animation completes
      const removeTimer = setTimeout(() => setVisible(false), 3700);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`intro-overlay ${exiting ? "intro-exiting" : ""}`}
      aria-hidden="true"
    >
      <div className="intro-content">
        {/* ShiftFlow logo */}
        <div className="intro-logo">
          <img
            src="/brand/logo/ShiftFlow-Logo-Landscape-FullColour-DarkBackground-2500x930px-72dpi.png"
            alt="ShiftFlow"
          />
        </div>

        {/* Sweep line */}
        <div className="intro-line" />

        {/* VANTAGE wordmark */}
        <div className="intro-wordmark">
          <span>V</span>
          <span>A</span>
          <span>N</span>
          <span>T</span>
          <span>A</span>
          <span>G</span>
          <span>E</span>
        </div>

        {/* Tagline */}
        <p className="intro-tagline">Strategic advisory intelligence</p>
      </div>

      {/* Corner accents */}
      <div className="intro-corner intro-corner-tl" />
      <div className="intro-corner intro-corner-br" />
    </div>
  );
}
