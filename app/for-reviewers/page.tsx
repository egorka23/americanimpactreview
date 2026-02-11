"use client";

import { useState } from "react";

export default function ForReviewersPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const res = await fetch("/api/reviewer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(err.error || "Submission failed. Please try again.");
        return;
      }

      setStatus("sent");
      setMessage("Application sent. We’ll review it and follow up by email.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Reviewers</h1>
          <p>Reviewer standards, ethical responsibilities, and evaluation criteria.</p>
          <div className="page-meta">
            <span>Confidentiality</span>
            <span>Integrity</span>
            <span>Quality</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          Complete the reviewer application below. Responses help editors match
          submissions to your expertise and review preferences.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">7-14d</div>
            <div className="lbl">Review Window</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Single</div>
            <div className="lbl">Blind Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Ethics</div>
            <div className="lbl">Required</div>
          </div>
        </div>

        <form
          className="card settings-card"
          style={{ display: "grid", gap: "1.25rem" }}
          onSubmit={handleSubmit}
        >
          <div>
            <h3>Reviewer application</h3>
            <p className="text-sm text-slate-600">
              Fields marked with * are required.
            </p>
          </div>

          {message ? (
            <div
              style={{
                background: status === "sent" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${status === "sent" ? "#bbf7d0" : "#fecaca"}`,
                color: status === "sent" ? "#166534" : "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              {message}
            </div>
          ) : null}

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Basic information</h4>
            <label className="label">
              Full name *
              <input className="input" name="fullName" placeholder="Full legal name" required />
            </label>
            <label className="label">
              Email (institutional preferred) *
              <input className="input" type="email" name="email" placeholder="name@university.edu" required />
            </label>
            <label className="label">
              Affiliation / position *
              <input className="input" name="affiliation" placeholder="Institution, title" required />
            </label>
            <label className="label">
              Field of expertise *
              <input className="input" name="discipline" placeholder="Primary discipline" required />
            </label>
            <label className="label">
              Expertise keywords *
              <input
                className="input"
                name="keywords"
                placeholder="e.g., microgrids, immunotherapy, bias mitigation"
                required
              />
            </label>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Profile & experience (optional)</h4>
            <label className="label">
              Highest degree
              <input className="input" name="degree" placeholder="PhD, MD, MS, etc." />
            </label>
            <label className="label">
              ORCID iD or profile link
              <input className="input" name="orcid" placeholder="0000-0000-0000-0000 or https://..." />
            </label>
            <label className="label">
              Publications / Scholar link
              <input className="input" name="publications" placeholder="https://scholar.google.com/..." />
            </label>
            <label className="label">
              Review history (optional)
              <textarea className="input" name="reviewHistory" rows={3} placeholder="Journals reviewed for or # of reviews" />
            </label>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Preferences & ethics</h4>
            <label className="label">
              Manuscript types you want to review
              <input className="input" name="manuscriptTypes" placeholder="Original research, reviews, etc." />
            </label>
            <label className="label">
              Conflicts of interest (if any)
              <textarea className="input" name="conflicts" rows={3} placeholder="Describe any potential conflicts" />
            </label>
            <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="ethics" required />
              I agree to follow ethical review standards and confidentiality.
            </label>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Certification fee</h4>
            <p>
              Reviewer certification includes a one-time processing fee of <strong>$800</strong>.
            </p>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Submit</h4>
            <p className="text-sm text-slate-600">
              Your application will be emailed to the editorial team for review.
            </p>
            <div>
              <button className="button primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Submitting..." : "Submit application"}
              </button>
            </div>
          </section>
        </form>
      </section>
    </>
  );
}
