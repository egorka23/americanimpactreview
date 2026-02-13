"use client";

import Link from "next/link";
import { useState } from "react";

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
    <section>
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
                      style={{
                        position: "absolute",
                        right: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        boxShadow: "none",
                        cursor: "pointer",
                        padding: "4px",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        height: "auto",
                        width: "auto",
                        lineHeight: 1,
                        letterSpacing: "normal",
                        textTransform: "none" as const,
                        fontFamily: "inherit",
                        fontSize: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
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
                    <button type="submit" className="button primary" disabled={loading}>
                      {loading ? "Sending…" : "Send Reset Link"}
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
        <>
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "1rem 1.25rem",
            borderRadius: "0.5rem",
            marginBottom: "1.25rem",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}>
            If an account with that email exists, we&rsquo;ve sent a password reset link.
            The link expires in <strong>1 hour</strong>.
          </div>

          <div style={{
            background: "#fef9c3",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "0.85rem 1.25rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}>
            <strong>Tip:</strong> Check your spam/junk folder &mdash; password reset emails sometimes
            end up there.
          </div>

          <p style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="button-secondary"
              style={{ fontSize: "0.9rem" }}
            >
              Didn&rsquo;t receive it? Send again
            </button>
          </p>

          <p>
            <Link href="/login">Back to login</Link>
          </p>
        </>
      )}
    </section>
  );
}
