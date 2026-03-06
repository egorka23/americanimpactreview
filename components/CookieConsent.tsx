"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "air_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
        background: "rgba(15, 23, 42, 0.97)",
        backdropFilter: "blur(8px)",
        color: "#e2e8f0",
        padding: "1rem 1.5rem",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5 }}>
            We use cookies to improve your experience.{" "}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: "#93c5fd",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "inherit",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              {expanded ? "Hide details" : "Learn more"}
            </button>
          </p>
          {expanded && (
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.8rem",
                color: "#94a3b8",
                lineHeight: 1.5,
              }}
            >
              This site uses third-party services for analytics and performance
              monitoring, including Google Analytics, Google Ads conversion
              tracking, and Microsoft Clarity (session recordings and heatmaps).
              These services may set cookies to collect anonymous usage data. No
              personal data is shared without your consent. See our{" "}
              <a
                href="/privacy-policy"
                style={{ color: "#93c5fd", textDecoration: "underline" }}
              >
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0 }}>
          <button
            onClick={accept}
            style={{
              padding: "0.55rem 1.5rem",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
            }}
          >
            Accept
          </button>
          <button
            onClick={decline}
            style={{
              padding: "0.55rem 1.5rem",
              background: "rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
