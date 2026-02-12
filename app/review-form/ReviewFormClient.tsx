"use client";

import { useState, FormEvent } from "react";

const YES_NO_NA = ["Yes", "No", "N/A"] as const;
const RATINGS = ["Poor", "Below Average", "Average", "Good", "Excellent"] as const;
const RECOMMENDATIONS = [
  { value: "Accept", color: "#059669" },
  { value: "Minor Revision", color: "#d97706" },
  { value: "Major Revision", color: "#ea580c" },
  { value: "Reject", color: "#dc2626" },
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

const hintStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
  margin: "0 0 0.4rem",
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

function ToggleRow({ value, onChange, options = YES_NO_NA as unknown as readonly string[] }: { value: string; onChange: (v: string) => void; options?: readonly string[] }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem" }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "6px",
            border: value === o ? "1.5px solid #1e3a5f" : "1px solid rgba(10,22,40,0.12)",
            background: value === o ? "#1e3a5f" : "#faf8f5",
            color: value === o ? "#fff" : "#334155",
            fontSize: "0.8rem",
            fontFamily: "inherit",
            cursor: "pointer",
            fontWeight: value === o ? 600 : 400,
            transition: "all 0.15s",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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

function SectionNumber({ n }: { n: number }) {
  return (
    <span style={{
      display: "inline-block", width: 28, height: 28, lineHeight: "28px", textAlign: "center",
      background: "#1e3a5f", color: "#fff", borderRadius: "50%", fontSize: "0.8rem",
      fontWeight: 700, marginRight: "0.6rem", flexShrink: 0,
    }}>{n}</span>
  );
}

export default function ReviewFormClient() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Reviewer info
    reviewerName: "",
    reviewerEmail: "",
    manuscriptId: "",
    // Introduction
    objectivesClear: "",
    literatureAdequate: "",
    introComments: "",
    // Methods
    methodsReproducible: "",
    statisticsAppropriate: "",
    methodsComments: "",
    // Results
    resultsPresentation: "",
    tablesAppropriate: "",
    resultsComments: "",
    // Discussion
    conclusionsSupported: "",
    limitationsStated: "",
    discussionComments: "",
    // Overall assessment
    originality: "",
    methodology: "",
    clarity: "",
    significance: "",
    languageEditing: "",
    // Structured feedback
    majorIssues: "",
    minorIssues: "",
    commentsToAuthors: "",
    confidentialComments: "",
    // Recommendation
    recommendation: "",
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            Please evaluate each section of the manuscript below.
          </p>
          <div className="page-meta">
            <span>Confidential</span>
            <span>Structured Review</span>
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
              Thank you for your review. It has been forwarded to the editorial office.
              We will contact you if we have any follow-up questions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>

            {/* 1. Reviewer info */}
            <div className="card settings-card" style={{ display: "grid", gap: "1.25rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={1} /> Reviewer Information
              </h3>
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

            {/* 2. Introduction */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={2} /> Introduction
              </h3>

              <div>
                <label style={labelStyle}>Are the objectives clearly stated?</label>
                <ToggleRow value={form.objectivesClear} onChange={(v) => set("objectivesClear", v)} />
              </div>

              <div>
                <label style={labelStyle}>Is the literature review adequate and up to date?</label>
                <ToggleRow value={form.literatureAdequate} onChange={(v) => set("literatureAdequate", v)} />
              </div>

              <div>
                <label htmlFor="rv-intro" style={labelStyle}>Comments on Introduction</label>
                <textarea id="rv-intro" rows={3} value={form.introComments} onChange={(e) => set("introComments", e.target.value)} placeholder="Optional comments..." style={textareaStyle} />
              </div>
            </div>

            {/* 3. Methods */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={3} /> Methods
              </h3>

              <div>
                <label style={labelStyle}>Are the methods reported in sufficient detail for reproducibility?</label>
                <ToggleRow value={form.methodsReproducible} onChange={(v) => set("methodsReproducible", v)} />
              </div>

              <div>
                <label style={labelStyle}>Are statistical analyses appropriate and well described?</label>
                <ToggleRow value={form.statisticsAppropriate} onChange={(v) => set("statisticsAppropriate", v)} />
              </div>

              <div>
                <label htmlFor="rv-methods" style={labelStyle}>Comments on Methods</label>
                <textarea id="rv-methods" rows={3} value={form.methodsComments} onChange={(e) => set("methodsComments", e.target.value)} placeholder="Optional comments..." style={textareaStyle} />
              </div>
            </div>

            {/* 4. Results */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={4} /> Results
              </h3>

              <div>
                <label style={labelStyle}>Are the results presented clearly and completely?</label>
                <ToggleRow value={form.resultsPresentation} onChange={(v) => set("resultsPresentation", v)} />
              </div>

              <div>
                <label style={labelStyle}>Are the tables and figures appropriate and well labeled?</label>
                <ToggleRow value={form.tablesAppropriate} onChange={(v) => set("tablesAppropriate", v)} />
              </div>

              <div>
                <label htmlFor="rv-results" style={labelStyle}>Comments on Results</label>
                <textarea id="rv-results" rows={3} value={form.resultsComments} onChange={(e) => set("resultsComments", e.target.value)} placeholder="Optional comments..." style={textareaStyle} />
              </div>
            </div>

            {/* 5. Discussion & Conclusions */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={5} /> Discussion & Conclusions
              </h3>

              <div>
                <label style={labelStyle}>Are the conclusions supported by the data?</label>
                <ToggleRow value={form.conclusionsSupported} onChange={(v) => set("conclusionsSupported", v)} />
              </div>

              <div>
                <label style={labelStyle}>Have the authors clearly stated the limitations?</label>
                <ToggleRow value={form.limitationsStated} onChange={(v) => set("limitationsStated", v)} />
              </div>

              <div>
                <label htmlFor="rv-disc" style={labelStyle}>Comments on Discussion</label>
                <textarea id="rv-disc" rows={3} value={form.discussionComments} onChange={(e) => set("discussionComments", e.target.value)} placeholder="Optional comments..." style={textareaStyle} />
              </div>
            </div>

            {/* 6. Overall Assessment */}
            <div className="card settings-card" style={{ display: "grid", gap: "0.5rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={6} /> Overall Assessment
              </h3>
              <p style={hintStyle}>
                Rate the manuscript on each criterion.
              </p>
              <RatingRow label="Originality" value={form.originality} onChange={(v) => set("originality", v)} />
              <RatingRow label="Methodology" value={form.methodology} onChange={(v) => set("methodology", v)} />
              <RatingRow label="Clarity of Writing" value={form.clarity} onChange={(v) => set("clarity", v)} />
              <RatingRow label="Significance" value={form.significance} onChange={(v) => set("significance", v)} />

              <div style={{ marginTop: "0.5rem" }}>
                <label style={labelStyle}>Does the manuscript need language editing?</label>
                <ToggleRow value={form.languageEditing} onChange={(v) => set("languageEditing", v)} options={["Yes", "No"]} />
              </div>
            </div>

            {/* 7. Detailed Feedback */}
            <div className="card settings-card" style={{ display: "grid", gap: "1.25rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={7} /> Detailed Feedback
              </h3>

              <div>
                <label htmlFor="rv-major" style={labelStyle}>Major Issues</label>
                <p style={hintStyle}>
                  Issues that must be addressed before the manuscript can proceed.
                </p>
                <textarea id="rv-major" rows={5} value={form.majorIssues} onChange={(e) => set("majorIssues", e.target.value)} placeholder="List major concerns with specific references to sections or line numbers..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-minor" style={labelStyle}>Minor Issues</label>
                <p style={hintStyle}>
                  Suggestions that would improve the manuscript but do not affect the main conclusions.
                </p>
                <textarea id="rv-minor" rows={4} value={form.minorIssues} onChange={(e) => set("minorIssues", e.target.value)} placeholder="List minor suggestions (typos, formatting, clarifications)..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-authors" style={labelStyle}>Summary & Comments to Authors</label>
                <p style={hintStyle}>
                  Overall feedback that will be shared with the authors.
                </p>
                <textarea id="rv-authors" rows={5} value={form.commentsToAuthors} onChange={(e) => set("commentsToAuthors", e.target.value)} placeholder="Summarize your assessment and provide constructive feedback..." style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-conf" style={labelStyle}>Confidential Comments to Editor</label>
                <p style={hintStyle}>
                  These will only be seen by the editor and will not be shared with the authors.
                </p>
                <textarea id="rv-conf" rows={3} value={form.confidentialComments} onChange={(e) => set("confidentialComments", e.target.value)} placeholder="Optional confidential notes for the editor..." style={textareaStyle} />
              </div>
            </div>

            {/* 8. Recommendation */}
            <div className="card settings-card" style={{ display: "grid", gap: "1rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={8} /> Recommendation *
              </h3>
              <p style={hintStyle}>
                Based on your evaluation, what is your recommendation for this manuscript?
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {RECOMMENDATIONS.map(({ value: r, color: c }) => {
                  const active = form.recommendation === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("recommendation", r)}
                      style={{
                        padding: "0.6rem 1.4rem",
                        borderRadius: "8px",
                        border: active ? `2px solid ${c}` : "1px solid rgba(10,22,40,0.12)",
                        background: active ? c : "#faf8f5",
                        color: active ? "#fff" : "#334155",
                        fontSize: "0.95rem",
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
                {sending ? "Submitting Review..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
