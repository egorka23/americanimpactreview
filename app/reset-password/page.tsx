"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

/* ── eye icons (Stripe-style: thin outline, round caps) ── */
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.036 12.322a1 1 0 010-.644C3.68 7.3 7.56 4.5 12 4.5c4.44 0 8.32 2.8 9.964 7.178a1 1 0 010 .644C20.32 16.7 16.44 19.5 12 19.5c-4.44 0-8.32-2.8-9.964-7.178z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.98 8.223A10.5 10.5 0 002.036 11.678a1 1 0 000 .644C3.68 16.7 7.56 19.5 12 19.5c1.63 0 3.17-.39 4.53-1.07M6.53 6.53A10.45 10.45 0 0112 4.5c4.44 0 8.32 2.8 9.964 7.178a1 1 0 010 .644A10.5 10.5 0 0117.47 17.47" />
    <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <section style={{ maxWidth: 480 }}>
        <header className="major">
          <h2>Invalid Link</h2>
        </header>
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "1rem 1.25rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}>
          This password reset link is invalid. Please request a new one.
        </div>
        <p>
          <Link href="/forgot-password">Request a new reset link</Link>
        </p>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section style={{ maxWidth: 480 }}>
        <header className="major">
          <h2>Password Updated</h2>
        </header>
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: "1rem 1.25rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.95rem",
        }}>
          Your password has been updated successfully. You can now log in with your new password.
        </div>
        <p>
          <Link href="/login">Go to login</Link>
        </p>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 480 }}>
      <header className="major">
        <h2>Set a new password</h2>
      </header>
      <p style={{ marginBottom: "1.5rem" }}>
        Enter your new password below. It must be at least 8 characters.
      </p>

      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "0.75rem 1rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row gtr-uniform">
          <div className="col-12">
            <label htmlFor="password">New password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={iconBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>
          <div className="col-12">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={iconBtnStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>
          <div className="col-12">
            <ul className="actions">
              <li>
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? "Updating\u2026" : "Update Password"}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<section><p>Loading...</p></section>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
