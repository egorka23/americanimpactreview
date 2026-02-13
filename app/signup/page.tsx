"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
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
    <section>
      <header className="major">
        <h2>Create account</h2>
      </header>
      <p style={{ marginBottom: "1.5rem" }}>
        Register to submit manuscripts to American Impact Review.
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
            <label htmlFor="name">Full name *</label>
            <input
              type="text"
              id="name"
              placeholder="e.g. Jane Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              placeholder="e.g. jane@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="password">Password * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(min. 8 characters)</span></label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                  color: "#64748b",
                  height: "auto",
                  width: "auto",
                  lineHeight: 1,
                  letterSpacing: "normal",
                  textTransform: "none" as const,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
            <label htmlFor="orcid">ORCID <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
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
                <button type="submit" className="button primary" disabled={loading}>
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
