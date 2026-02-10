"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    affiliation: "",
    orcid: "",
  });
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
        router.push("/explore");
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
            <input
              type="password"
              id="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
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
