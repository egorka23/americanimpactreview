"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Energy & Climate",
  "AI & Data",
  "Health & Biotech",
  "Robotics & Automation",
  "Human Performance",
  "Impact Profile",
];

export default function SubmitClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    category: CATEGORIES[0],
    keywords: "",
    coverLetter: "",
    conflictOfInterest: "",
    noConflict: true,
    policyAgreed: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <section>
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <>
        <section className="page-hero">
          <div className="page-hero__inner">
            <div className="page-hero__kicker">Submit</div>
            <h1>Submit Now</h1>
            <p>
              Submit your manuscript to American Impact Review. Every submission is
              screened for formatting, originality, and ethical compliance before
              entering peer review.
            </p>
            <div className="page-meta">
              <span>Open Access</span>
              <span>Peer-Reviewed</span>
              <span>ISSN Pending</span>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1.25rem 0 1.5rem", flexWrap: "wrap" }}>
            <Link className="button" href={`/login?callbackUrl=${encodeURIComponent("/submit")}`}>
              Log in to submit
            </Link>
            <Link className="button" href={`/signup?callbackUrl=${encodeURIComponent("/submit")}`}>
              Create account
            </Link>
            <Link className="button-secondary" href="/for-authors">
              View author guidelines
            </Link>
          </div>

          <div className="card settings-card">
            <h3>Submission checklist</h3>
            <ul className="category-list">
              <li>Use the journal template and structured sections</li>
              <li>Include abstract, keywords, and references</li>
              <li>Provide author affiliations and ORCID (if available)</li>
              <li>Confirm originality and conflict of interest disclosure</li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3>Publication timeline</h3>
            <ul className="category-list">
              <li>Initial screening: 3-5 business days</li>
              <li>Peer review: 7-14 days</li>
              <li>Decision: accept / revise / reject</li>
              <li>Issue placement after acceptance</li>
            </ul>
          </div>
        </section>
      </>
    );
  }

  if (success) {
    return (
      <section>
        <header className="major">
          <h2>Submission received</h2>
        </header>
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: "1.25rem 1.5rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
        }}>
          <p style={{ margin: 0 }}>
            Your manuscript has been submitted successfully.
            <br />Submission ID: <strong>{success}</strong>
          </p>
          <p style={{ margin: "0.75rem 0 0" }}>
            Our editorial team will review your submission within 3-5 business days.
          </p>
        </div>
        <ul className="actions">
          <li>
            <Link href="/explore" className="button">Explore articles</Link>
          </li>
          <li>
            <button className="button-secondary" onClick={() => { setSuccess(null); setForm({ title: "", abstract: "", category: CATEGORIES[0], keywords: "", coverLetter: "", conflictOfInterest: "", noConflict: true, policyAgreed: false }); setFile(null); }}>
              Submit another
            </button>
          </li>
        </ul>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.abstract.trim()) {
      setError("Title and abstract are required.");
      return;
    }

    if (!form.policyAgreed) {
      setError("You must agree to the publication policies before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("abstract", form.abstract.trim());
      formData.append("category", form.category);
      if (form.keywords.trim()) {
        formData.append("keywords", form.keywords.trim());
      }
      if (form.coverLetter.trim()) {
        formData.append("coverLetter", form.coverLetter.trim());
      }
      if (!form.noConflict && form.conflictOfInterest.trim()) {
        formData.append("conflictOfInterest", form.conflictOfInterest.trim());
      } else if (form.noConflict) {
        formData.append("conflictOfInterest", "");
      }
      formData.append("policyAgreed", form.policyAgreed ? "1" : "0");
      if (file) {
        formData.append("manuscript", file);
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed.");
        return;
      }

      const data = await res.json();
      setSuccess(data.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Submit</div>
          <h1>Submit your manuscript</h1>
          <p>
            Fill in the details below and upload your manuscript (PDF or DOCX, up to 10 MB).
          </p>
        </div>
      </section>

      <section className="page-section">
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
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                placeholder="Manuscript title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label htmlFor="abstract">Abstract *</label>
              <textarea
                id="abstract"
                rows={6}
                placeholder="Provide a structured abstract (200-300 words)"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                required
              />
            </div>
            <div className="col-12">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label htmlFor="keywords">Keywords <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(comma-separated)</span></label>
              <input
                type="text"
                id="keywords"
                placeholder="e.g. machine learning, NLP, immigration"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label htmlFor="coverLetter">Cover Letter <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
              <textarea
                id="coverLetter"
                rows={4}
                placeholder="Briefly describe why your manuscript is suitable for AIR"
                value={form.coverLetter}
                onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label htmlFor="manuscript">Manuscript file <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(PDF or DOCX, max 10 MB)</span></label>
              <input
                type="file"
                id="manuscript"
                accept=".pdf,.docx,.doc"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Conflict of Interest</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="noConflict"
                  checked={form.noConflict}
                  onChange={(e) => setForm({ ...form, noConflict: e.target.checked, conflictOfInterest: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noConflict" style={{ margin: 0, fontWeight: 400 }}>
                  I declare that I have no competing interests
                </label>
              </div>
              {!form.noConflict && (
                <textarea
                  id="conflictOfInterest"
                  rows={3}
                  placeholder="If yes, describe your competing interests"
                  value={form.conflictOfInterest}
                  onChange={(e) => setForm({ ...form, conflictOfInterest: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>
            <div className="col-12">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="policyAgreed"
                  checked={form.policyAgreed}
                  onChange={(e) => setForm({ ...form, policyAgreed: e.target.checked })}
                  style={{ width: "auto", margin: 0, marginTop: "0.25rem" }}
                />
                <label htmlFor="policyAgreed" style={{ margin: 0, fontWeight: 400 }}>
                  I confirm this manuscript is original work, not published or under review elsewhere, and I agree to AIR&apos;s publication policies *
                </label>
              </div>
            </div>
            <div className="col-12">
              <ul className="actions">
                <li>
                  <button type="submit" className="button primary" disabled={submitting || !form.policyAgreed}>
                    {submitting ? "Submitting..." : "Submit manuscript"}
                  </button>
                </li>
                <li>
                  <Link href="/for-authors" className="button-secondary">
                    Author guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
