"use client";

import Link from "next/link";
import { useState } from "react";

/* ── branded spinner ── */
const Spinner = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="#e5e0da" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 018.66 5" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

/* ── icon-button reset ── */
const iconBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "0.6rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  outline: "none",
  boxShadow: "none",
  cursor: "pointer",
  padding: "4px",
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  height: "auto",
  width: "auto",
  minHeight: 0,
  minWidth: 0,
  lineHeight: 1,
  letterSpacing: "normal",
  textTransform: "none" as const,
  fontFamily: "inherit",
  fontSize: "inherit",
  WebkitAppearance: "none" as const,
  transition: "color 0.15s ease",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 480 }}>
      <header className="major">
        <h2>Reset your password</h2>
      </header>

      {!sent ? (
        <>
          <p style={{ marginBottom: "1.5rem" }}>
            Enter the email address associated with your account and we&rsquo;ll send you a link to
            reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="row gtr-uniform">
              <div className="col-12">
                <label htmlFor="email">Email</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingRight: "2.5rem" }}
                  />
                  {email.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      style={iconBtnStyle}
                      aria-label="Clear email"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12">
                <ul className="actions">
                  <li>
                    <button type="submit" className="button primary" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      {loading && <Spinner />}
                      {loading ? "Sending\u2026" : "Send Reset Link"}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </form>

          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/login">Back to login</Link>
          </p>
        </>
      ) : (
        /* ── "Check your email" popup card ── */
        <div style={{
          textAlign: "center",
          padding: "2.5rem 2rem",
          background: "#fff",
          border: "1px solid #e5e0da",
          borderRadius: "1rem",
          boxShadow: "0 4px 24px rgba(30, 58, 95, 0.08)",
        }}>
          {/* envelope icon */}
          <div style={{ marginBottom: "1.25rem" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
          </div>

          <h3 style={{ fontSize: "1.3rem", marginBottom: "0.75rem", color: "#1e3a5f" }}>
            Check your email
          </h3>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            We sent a password reset link to<br />
            <strong style={{ color: "#1e3a5f" }}>{email}</strong>
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            The link expires in <strong>1 hour</strong>. Check your spam folder if you don&rsquo;t see it.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="button-secondary"
              style={{ fontSize: "0.9rem" }}
            >
              Didn&rsquo;t receive it? Send again
            </button>
            <Link href="/login" style={{ fontSize: "0.9rem", color: "#1e3a5f" }}>
              Back to login
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
