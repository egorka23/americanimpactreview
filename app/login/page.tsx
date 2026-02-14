"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

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

/* ── branded spinner ── */
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="#e5e0da" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 018.66 5" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 480 }}>
      <header className="major">
        <h2>Log in</h2>
      </header>
      <p style={{ marginBottom: "1.5rem" }}>
        Sign in to your American Impact Review author account.
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
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              <Link href="/forgot-password" style={{ color: "#1e3a5f" }}>
                Forgot your password?
              </Link>
            </div>
          </div>
          <div className="col-12">
            <ul className="actions">
              <li>
                <button type="submit" className="button primary" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  {loading && <Spinner />}
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </li>
              <li>
                <Link href={callbackUrl !== "/explore" ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"} className="button-secondary">
                  No account? Sign up
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section><p>Loading...</p></section>}>
      <LoginForm />
    </Suspense>
  );
}
