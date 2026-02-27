"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/explore";
  const { data: session, status, update } = useSession();

  const [form, setForm] = useState({
    name: "",
    affiliation: "",
    orcid: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        affiliation: session.user.affiliation || "",
        orcid: session.user.orcid || "",
      });
    }
  }, [session]);

  const isComplete = useMemo(() => {
    return Boolean(session?.user?.name);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not update profile.");
        setLoading(false);
        return;
      }

      await update();
      router.push(callbackUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <section><p>Loading...</p></section>;
  }

  if (status === "unauthenticated") {
    return (
      <section style={{ maxWidth: 520 }}>
        <header className="major">
          <h2>Complete your profile</h2>
        </header>
        <p>You need to sign in first to finish setting up your account.</p>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 520 }}>
      <header className="major">
        <h2>Complete your profile</h2>
      </header>
      <p style={{ marginBottom: "1.5rem" }}>
        We pulled your basic info from your sign-in provider. Please confirm the details below so your author profile matches the submission form.
      </p>
      {isComplete && (
        <p style={{ margin: "-0.5rem 0 1rem", color: "#6b7280", fontSize: "0.9rem" }}>
          You can update these details anytime. Click Continue to proceed.
        </p>
      )}
      {session?.user?.email && (
        <p style={{ margin: "-0.5rem 0 1.5rem", color: "#6b7280", fontSize: "0.9rem" }}>
          Signed in as <strong>{session.user.email}</strong>
        </p>
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="affiliation">
              Affiliation <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span>
            </label>
            <input
              type="text"
              id="affiliation"
              placeholder="e.g. University of X"
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label htmlFor="orcid">
              ORCID <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>
                (optional - <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", textDecoration: "underline" }}>find yours</a>)
              </span>
            </label>
            <input
              type="text"
              id="orcid"
              placeholder="0000-0000-0000-0000"
              value={form.orcid}
              onChange={(e) => setForm({ ...form, orcid: e.target.value })}
            />
          </div>
          <div className="col-12">
            <ul className="actions">
              <li>
                <button type="submit" className="button primary" disabled={loading}>
                  {loading ? "Saving..." : "Continue"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => router.push(callbackUrl)}
                >
                  Skip for now
                </button>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </section>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<section><p>Loading...</p></section>}>
      <CompleteProfileForm />
    </Suspense>
  );
}
