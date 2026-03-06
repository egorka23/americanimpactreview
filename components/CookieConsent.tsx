"use client";

import { useEffect, useRef, useState } from "react";

const CONSENT_KEY = "air_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  // Add padding-bottom to body so content isn't hidden behind the fixed banner
  useEffect(() => {
    if (!visible) {
      document.body.style.paddingBottom = "";
      return;
    }
    const update = () => {
      if (bannerRef.current) {
        document.body.style.paddingBottom = `${bannerRef.current.offsetHeight}px`;
      }
    };
    // Small delay to let the DOM render
    const t = setTimeout(update, 50);
    return () => {
      clearTimeout(t);
      document.body.style.paddingBottom = "";
    };
  }, [visible, expanded]);

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
      ref={bannerRef}
      className="cookie-consent"
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
              className="cookie-consent__learn"
              onClick={() => setExpanded(!expanded)}
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
          <button className="cookie-consent__accept" onClick={accept}>
            Accept
          </button>
          <button className="cookie-consent__decline" onClick={decline}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
