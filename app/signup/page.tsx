"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
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

/* ── icon-button reset ──── */
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

/* ── branded spinner (concentric arcs like the logo) ── */
const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="#e5e0da" strokeWidth="2.5" />
    <path d="M12 2a10 10 0 018.66 5" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

/* ── hint list component ── */
function HintList({ rules }: { rules: { key: string; label: string; ok: boolean }[] }) {
  return (
    <ul style={{
      listStyle: "none",
      margin: "0.5rem 0 0",
      padding: "0.6rem 0.8rem",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "0.5rem",
      fontSize: "0.82rem",
      lineHeight: 1.7,
    }}>
      {rules.map((r) => (
        <li key={r.key} style={{ color: r.ok ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.95rem" }}>{r.ok ? "\u2713" : "\u2022"}</span>
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── validation rules ── */
const pwRules = [
  { key: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { key: "max", label: "No more than 64 characters", test: (p: string) => p.length <= 64 },
  { key: "letter", label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { key: "digit", label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

const emailRules = [
  { key: "notempty", label: "Email is not empty", test: (e: string) => e.trim().length > 0 },
  { key: "ascii", label: "Latin characters only (no Cyrillic)", test: (e: string) => /^[\x20-\x7E]*$/.test(e) },
  { key: "hasAt", label: "Contains @", test: (e: string) => e.includes("@") },
  { key: "oneAt", label: "Only one @ symbol", test: (e: string) => (e.match(/@/g) || []).length === 1 },
  { key: "domain", label: "Has a valid domain (e.g. university.edu)", test: (e: string) => /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e) },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
  const [providers, setProviders] = useState<Record<string, { id: string }> | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    affiliation: "",
    orcid: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getProviders().then((list) => setProviders(list as Record<string, { id: string }> | null));
  }, []);

  const oauthCallback = callbackUrl
    ? `/signup/complete?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/signup/complete";

  const allPwValid = useMemo(() => pwRules.every((r) => r.test(form.password)), [form.password]);
  const allEmailValid = useMemo(() => emailRules.every((r) => r.test(form.email)), [form.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!allEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!allPwValid) {
      setError("Please fix the password requirements below.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please log in manually.");
        router.push("/login");
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
        <h2>Create account</h2>
      </header>
      <p style={{ marginBottom: "1.5rem" }}>
        Register to submit manuscripts to American Impact Review.
      </p>

      {providers?.google && (
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: oauthCallback })}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "0.65rem 1.2rem",
              background: "#fff",
              border: "1px solid #dadce0",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.9375rem",
              fontFamily: "'Roboto', 'Segoe UI', Arial, sans-serif",
              fontWeight: 500,
              color: "#3c4043",
              letterSpacing: "0.01em",
              transition: "background 0.2s, box-shadow 0.2s",
              boxShadow: "0 1px 2px rgba(60,64,67,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f9fa";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(60,64,67,0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(60,64,67,0.08)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.1 24.1 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign up with Google
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem" }}>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
            <span style={{ fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          </div>
        </div>
      )}

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
            <label htmlFor="name">Full name *</label>
            <input
              type="text"
              id="name"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => setTouched({ ...touched, name: true })}
              required
            />
            {touched.name && !form.name.trim() && (
              <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>Please enter your name.</p>
            )}
          </div>
          <div className="col-12">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              placeholder="e.g. jane@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched({ ...touched, email: true })}
              required
              style={allEmailValid && form.email.length > 0 ? { borderColor: "#86efac", boxShadow: "0 0 0 3px rgba(134, 239, 172, 0.2)" } : undefined}
            />
            {(touched.email || form.email.length > 0) && !allEmailValid && (
              <HintList rules={emailRules.map((r) => ({ ...r, ok: r.test(form.email) }))} />
            )}
          </div>
          <div className="col-12">
            <label htmlFor="password">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Min. 8 chars, letters & numbers"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={iconBtnStyle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
            {form.password.length > 0 && (
              <HintList rules={pwRules.map((r) => ({ ...r, ok: r.test(form.password) }))} />
            )}
          </div>
          <div className="col-12">
            <label htmlFor="affiliation">Affiliation <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
            <input
              type="text"
              id="affiliation"
              placeholder="e.g. MIT, Stanford University"
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label htmlFor="orcid">ORCID <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional - <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", textDecoration: "underline" }}>find yours</a>)</span></label>
            <input
              type="text"
              id="orcid"
              placeholder="e.g. 0000-0002-1234-5678"
              value={form.orcid}
              onChange={(e) => setForm({ ...form, orcid: e.target.value })}
            />
          </div>
          <div className="col-12">
            <ul className="actions">
              <li>
                <button type="submit" className="button primary" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  {loading && <Spinner />}
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </li>
              <li>
                <Link href="/login" className="button-secondary">
                  Already have an account? Log in
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<section><p>Loading...</p></section>}>
      <SignupForm />
    </Suspense>
  );
}
