"use client";

import { useState, FormEvent } from "react";

const RATINGS = ["Poor", "Below Average", "Average", "Good", "Excellent"] as const;
const RECOMMENDATIONS = [
  "Accept",
  "Minor Revision",
  "Major Revision",
  "Reject",
] as const;

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgb(var(--muted))",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  border: "1px solid rgba(10,22,40,0.12)",
  borderRadius: "10px",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  background: "#faf8f5",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

function RatingRow({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
      <span style={{ minWidth: 160, fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", gap: "0.35rem" }}>
        {RATINGS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            style={{
              padding: "0.35rem 0.7rem",
              borderRadius: "6px",
              border: value === r ? "1.5px solid #1e3a5f" : "1px solid rgba(10,22,40,0.12)",
              background: value === r ? "#1e3a5f" : "#faf8f5",
              color: value === r ? "#fff" : "#334155",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: value === r ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewFormClient() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reviewerName: "",
    reviewerEmail: "",
    manuscriptId: "",
    recommendation: "",
    originality: "",
    methodology: "",
    clarity: "",
    significance: "",
    majorIssues: "",
    minorIssues: "",
    commentsToAuthors: "",
    confidentialComments: "",
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.recommendation) {
      setError("Please select a recommendation.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Peer Review</div>
          <h1>Submit Your Review</h1>
          <p>
            Thank you for reviewing a manuscript for American Impact Review.
            Please complete the form below.
          </p>
          <div className="page-meta">
            <span>Confidential</span>
            <span>Structured</span>
            <span>COPE Guidelines</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {submitted ? (
          <div className="card settings-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <h3 style={{ color: "#059669", marginBottom: "0.75rem" }}>
              Review Submitted
            </h3>
            <p style={{ marginBottom: 0 }}>
              Thank you. Your review has been received and forwarded to the editorial office.
              We will contact you if we have any follow-up questions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>

            {/* Reviewer info */}
            <div className="card settings-card" style={{ display: "grid", gap: "1.25rem" }}>
              <h3>Reviewer Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label htmlFor="rv-name" style={labelStyle}>Your Name *</label>
                  <input id="rv-name" type="text" required value={form.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} placeholder="Full name" style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="rv-email" style={labelStyle}>Your Email *</label>
                  <input id="rv-email" type="email" required value={form.reviewerEmail} onChange={(e) => set("reviewerEmail", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="rv-ms" style={labelStyle}>Manuscript ID *</label>
                <input id="rv-ms" type="text" required value={form.manuscriptId} onChange={(e) => set("manuscriptId", e.target.value)} placeholder="e.g. e2026001" style={inputStyle} />
              </div>
            </div>

            {/* Recommendation */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3>Recommendation *</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {RECOMMENDATIONS.map((r) => {
                  const colors: Record<string, string> = {
                    "Accept": "#059669",
                    "Minor Revision": "#d97706",
                    "Major Revision": "#ea580c",
                    "Reject": "#dc2626",
                  };
                  const c = colors[r] || "#1e3a5f";
                  const active = form.recommendation === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("recommendation", r)}
                      style={{
                        padding: "0.5rem 1.2rem",
                        borderRadius: "8px",
                        border: active ? `2px solid ${c}` : "1px solid rgba(10,22,40,0.12)",
                        background: active ? c : "#faf8f5",
                        color: active ? "#fff" : "#334155",
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 500,
                        transition: "all 0.15s",
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ratings */}
            <div className="card settings-card" style={{ display: "grid", gap: "0.5rem" }}>
              <h3>Assessment</h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                Rate the manuscript on each criterion.
              </p>
              <RatingRow label="Originality" name="originality" value={form.originality} onChange={(v) => set("originality", v)} />
              <RatingRow label="Methodology" name="methodology" value={form.methodology} onChange={(v) => set("methodology", v)} />
              <RatingRow label="Clarity of Writing" name="clarity" value={form.clarity} onChange={(v) => set("clarity", v)} />
              <RatingRow label="Significance" name="significance" value={form.significance} onChange={(v) => set("significance", v)} />
            </div>

            {/* Comments */}
            <div className="card settings-card" style={{ display: "grid", gap: "1.25rem" }}>
              <h3>Comments</h3>

              <div>
                <label htmlFor="rv-major" style={labelStyle}>Major Issues</label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.4rem" }}>
                  Issues that must be addressed before the manuscript can proceed.
                </p>
                <textarea id="rv-major" rows={5} value={form.majorIssues} onChange={(e) => set("majorIssues", e.target.value)} placeholder="List major concerns..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-minor" style={labelStyle}>Minor Issues</label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.4rem" }}>
                  Suggestions that would improve the manuscript but do not affect conclusions.
                </p>
                <textarea id="rv-minor" rows={4} value={form.minorIssues} onChange={(e) => set("minorIssues", e.target.value)} placeholder="List minor suggestions..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-authors" style={labelStyle}>Comments to Authors</label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.4rem" }}>
                  General feedback that will be shared with the authors.
                </p>
                <textarea id="rv-authors" rows={5} value={form.commentsToAuthors} onChange={(e) => set("commentsToAuthors", e.target.value)} placeholder="Your feedback to the authors..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-conf" style={labelStyle}>Confidential Comments to Editor</label>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 0.4rem" }}>
                  These comments will only be seen by the editor and will not be shared with the authors.
                </p>
                <textarea id="rv-conf" rows={3} value={form.confidentialComments} onChange={(e) => set("confidentialComments", e.target.value)} placeholder="Confidential notes for the editor (optional)..." style={textareaStyle} />
              </div>
            </div>

            {error && (
              <p style={{ color: "#b5432a", fontSize: "0.9rem", margin: 0 }}>{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="button"
                disabled={sending}
                style={{ cursor: sending ? "wait" : "pointer", opacity: sending ? 0.7 : 1 }}
              >
                {sending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
