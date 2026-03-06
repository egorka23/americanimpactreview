"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "air_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "granted");
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
    });
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1e293b",
        color: "#e2e8f0",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        flexWrap: "wrap",
        fontSize: "0.9rem",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.2)",
      }}
    >
      <p style={{ margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
        We use cookies and analytics (Google Analytics, Microsoft Clarity) to improve your
        experience. By clicking &ldquo;Accept&rdquo; you consent to our use of cookies.{" "}
        <a
          href="/privacy-policy"
          style={{ color: "#93c5fd", textDecoration: "underline" }}
        >
          Privacy Policy
        </a>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={accept}
          style={{
            padding: "0.5rem 1.25rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
          }}
        >
          Accept
        </button>
        <button
          onClick={decline}
          style={{
            padding: "0.5rem 1.25rem",
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #475569",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
