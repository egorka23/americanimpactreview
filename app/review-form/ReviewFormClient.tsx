"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";

const STORAGE_KEY = "air-review-draft";

const YES_NO_NA = ["Yes", "No", "N/A"] as const;
const RATINGS = ["Poor", "Below Average", "Average", "Good", "Excellent"] as const;
const RECOMMENDATIONS = [
  { value: "Accept", cls: "rv-rec-accept", hint: "Ready for publication as is or with trivial edits" },
  { value: "Minor Revision", cls: "rv-rec-minor", hint: "Small changes needed; no re-review required" },
  { value: "Major Revision", cls: "rv-rec-major", hint: "Substantial changes needed; re-review required" },
  { value: "Reject", cls: "rv-rec-reject", hint: "Fundamental flaws; not suitable for this journal" },
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

const toggleActiveClass: Record<string, string> = {
  Yes: "rv-active-green",
  No: "rv-active-red",
  "N/A": "rv-active-gray",
};

function ToggleRow({ value, onChange, options = YES_NO_NA as unknown as readonly string[] }: { value: string; onChange: (v: string) => void; options?: readonly string[] }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem" }}>
      {options.map((o) => {
        const active = value === o;
        const cls = active ? (toggleActiveClass[o] || "rv-active-blue") : "";
        return (
          <button
            key={o}
            type="button"
            className={`rv-btn ${cls}`}
            onClick={() => onChange(o)}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              cursor: "pointer",
              fontWeight: active ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
      <span style={{ minWidth: 160, fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {RATINGS.map((r) => (
          <button
            key={r}
            type="button"
            className={`rv-btn ${value === r ? "rv-active-blue" : ""}`}
            onClick={() => onChange(r)}
            style={{
              padding: "0.35rem 0.7rem",
              borderRadius: "6px",
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

const defaultForm = {
  reviewerName: "",
  reviewerEmail: "",
  manuscriptId: "",
  objectivesClear: "",
  literatureAdequate: "",
  introComments: "",
  methodsReproducible: "",
  statisticsAppropriate: "",
  methodsComments: "",
  resultsPresentation: "",
  tablesAppropriate: "",
  resultsComments: "",
  conclusionsSupported: "",
  limitationsStated: "",
  discussionComments: "",
  originality: "",
  methodology: "",
  clarity: "",
  significance: "",
  languageEditing: "",
  majorIssues: "",
  minorIssues: "",
  commentsToAuthors: "",
  confidentialComments: "",
  recommendation: "",
};

function loadDraft(): typeof defaultForm {
  if (typeof window === "undefined") return defaultForm;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultForm;
    const parsed = JSON.parse(raw);
    // Only keep known keys, ignore garbage
    const restored = { ...defaultForm };
    for (const k of Object.keys(defaultForm)) {
      if (typeof parsed[k] === "string") {
        (restored as Record<string, string>)[k] = parsed[k];
      }
    }
    return restored;
  } catch {
    return defaultForm;
  }
}

export default function ReviewFormClient() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [hydrated, setHydrated] = useState(false);
  const submittingRef = useRef(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    setForm(loadDraft());
    setHydrated(true);
  }, []);

  // Auto-save to localStorage on every change (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [form, hydrated]);

  const set = useCallback((key: string, val: string) => setForm((f) => ({ ...f, [key]: val })), []);

  // Section completeness checks
  const sectionDone = {
    info: !!(form.reviewerName.trim() && form.reviewerEmail.trim() && form.manuscriptId.trim()),
    intro: !!(form.objectivesClear && form.literatureAdequate),
    methods: !!(form.methodsReproducible && form.statisticsAppropriate),
    results: !!(form.resultsPresentation && form.tablesAppropriate),
    discussion: !!(form.conclusionsSupported && form.limitationsStated),
    overall: !!(form.originality && form.methodology && form.clarity && form.significance && form.languageEditing),
    feedback: !!(form.commentsToAuthors.trim()),
    recommendation: !!(form.recommendation),
  };

  const doneClass = (done: boolean) => done ? "rv-done" : "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const missing: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.reviewerName.trim()) missing.push("Your Name (Reviewer Information)");
    if (!form.reviewerEmail.trim()) missing.push("Your Email (Reviewer Information)");
    else if (!emailRegex.test(form.reviewerEmail.trim())) missing.push("Valid email address (Reviewer Information)");
    if (!form.manuscriptId.trim()) missing.push("Manuscript ID (Reviewer Information)");
    if (!form.objectivesClear) missing.push("Objectives clearly stated (Introduction)");
    if (!form.literatureAdequate) missing.push("Literature adequate (Introduction)");
    if (!form.methodsReproducible) missing.push("Methods reproducible (Methods)");
    if (!form.statisticsAppropriate) missing.push("Statistics appropriate (Methods)");
    if (!form.resultsPresentation) missing.push("Results presented clearly (Results)");
    if (!form.tablesAppropriate) missing.push("Tables/figures appropriate (Results)");
    if (!form.conclusionsSupported) missing.push("Conclusions supported (Discussion)");
    if (!form.limitationsStated) missing.push("Limitations stated (Discussion)");
    if (!form.originality) missing.push("Originality rating (Overall Assessment)");
    if (!form.methodology) missing.push("Methodology rating (Overall Assessment)");
    if (!form.clarity) missing.push("Clarity rating (Overall Assessment)");
    if (!form.significance) missing.push("Significance rating (Overall Assessment)");
    if (!form.languageEditing) missing.push("Language editing needed (Overall Assessment)");
    if (!form.recommendation) missing.push("Final Recommendation");

    if (missing.length > 0) {
      setValidationErrors(missing);
      setTimeout(() => {
        document.getElementById("validation-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setValidationErrors([]);
    submittingRef.current = true;
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
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      submittingRef.current = false;
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
            <div className={`card settings-card ${doneClass(sectionDone.info)}`} style={{ display: "grid", gap: "1.25rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={1} /> Reviewer Information
              </h3>
              <div className="rv-grid-2">
                <div>
                  <label htmlFor="rv-name" style={labelStyle}>Your Name *</label>
                  <input id="rv-name" type="text" required maxLength={200} value={form.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} placeholder="Full name" style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="rv-email" style={labelStyle}>Your Email *</label>
                  <input id="rv-email" type="email" required maxLength={200} value={form.reviewerEmail} onChange={(e) => set("reviewerEmail", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="rv-ms" style={labelStyle}>Manuscript ID *</label>
                <p style={hintStyle}>You can find the Manuscript ID in the invitation email or on the first page of the PDF.</p>
                <input id="rv-ms" type="text" required maxLength={50} value={form.manuscriptId} onChange={(e) => set("manuscriptId", e.target.value)} placeholder="e.g. e2026001" style={inputStyle} />
              </div>
            </div>

            {/* 2. Introduction */}
            <div className={`card settings-card ${doneClass(sectionDone.intro)}`} style={{ display: "grid", gap: "1rem" }}>
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
                <textarea id="rv-intro" rows={3} value={form.introComments} onChange={(e) => set("introComments", e.target.value)} placeholder="Optional comments..." maxLength={10000} style={textareaStyle} />
              </div>
            </div>

            {/* 3. Methods */}
            <div className={`card settings-card ${doneClass(sectionDone.methods)}`} style={{ display: "grid", gap: "1rem" }}>
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
                <textarea id="rv-methods" rows={3} value={form.methodsComments} onChange={(e) => set("methodsComments", e.target.value)} placeholder="Optional comments..." maxLength={10000} style={textareaStyle} />
              </div>
            </div>

            {/* 4. Results */}
            <div className={`card settings-card ${doneClass(sectionDone.results)}`} style={{ display: "grid", gap: "1rem" }}>
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
                <textarea id="rv-results" rows={3} value={form.resultsComments} onChange={(e) => set("resultsComments", e.target.value)} placeholder="Optional comments..." maxLength={10000} style={textareaStyle} />
              </div>
            </div>

            {/* 5. Discussion & Conclusions */}
            <div className={`card settings-card ${doneClass(sectionDone.discussion)}`} style={{ display: "grid", gap: "1rem" }}>
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
                <textarea id="rv-disc" rows={3} value={form.discussionComments} onChange={(e) => set("discussionComments", e.target.value)} placeholder="Optional comments..." maxLength={10000} style={textareaStyle} />
              </div>
            </div>

            {/* 6. Overall Assessment */}
            <div className={`card settings-card ${doneClass(sectionDone.overall)}`} style={{ display: "grid", gap: "0.5rem" }}>
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
            <div className={`card settings-card ${doneClass(sectionDone.feedback)}`} style={{ display: "grid", gap: "1.25rem" }}>
              <h3 style={{ display: "flex", alignItems: "center" }}>
                <SectionNumber n={7} /> Detailed Feedback
              </h3>

              <div>
                <label htmlFor="rv-major" style={labelStyle}>Major Issues</label>
                <p style={hintStyle}>
                  Issues that must be addressed before the manuscript can proceed.
                </p>
                <textarea id="rv-major" rows={5} value={form.majorIssues} onChange={(e) => set("majorIssues", e.target.value)} placeholder="List major concerns with specific references to sections or line numbers..." maxLength={10000} style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-minor" style={labelStyle}>Minor Issues</label>
                <p style={hintStyle}>
                  Suggestions that would improve the manuscript but do not affect the main conclusions.
                </p>
                <textarea id="rv-minor" rows={4} value={form.minorIssues} onChange={(e) => set("minorIssues", e.target.value)} placeholder="List minor suggestions (typos, formatting, clarifications)..." maxLength={10000} style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-authors" style={labelStyle}>Summary & Comments to Authors</label>
                <p style={hintStyle}>
                  Overall feedback that will be shared with the authors.
                </p>
                <textarea id="rv-authors" rows={5} value={form.commentsToAuthors} onChange={(e) => set("commentsToAuthors", e.target.value)} placeholder="Summarize your assessment and provide constructive feedback..." maxLength={10000} style={textareaStyle} />
              </div>

              <div>
                <label htmlFor="rv-conf" style={labelStyle}>Confidential Comments to Editor</label>
                <p style={hintStyle}>
                  These will only be seen by the editor and will not be shared with the authors.
                </p>
                <textarea id="rv-conf" rows={3} value={form.confidentialComments} onChange={(e) => set("confidentialComments", e.target.value)} placeholder="Optional confidential notes for the editor..." maxLength={10000} style={textareaStyle} />
              </div>
            </div>

            {/* 8. Recommendation */}
            <div className={`card settings-card ${doneClass(sectionDone.recommendation)}`} style={{
              display: "grid", gap: "1rem",
              border: "2px solid #1e3a5f",
              background: "linear-gradient(135deg, #f8f6f3 0%, #eef2f7 100%)",
              boxShadow: "0 4px 20px rgba(30,58,95,0.12)",
            }}>
              <h3 style={{ display: "flex", alignItems: "center", fontSize: "1.15rem" }}>
                <SectionNumber n={8} /> Final Recommendation *
              </h3>
              <p style={{ ...hintStyle, fontSize: "0.9rem" }}>
                Based on your evaluation above, what is your recommendation for this manuscript?
              </p>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {RECOMMENDATIONS.map(({ value: r, cls: recCls, hint: h }) => {
                  const active = form.recommendation === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`rv-rec ${active ? recCls : ""}`}
                      onClick={() => set("recommendation", r)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.75rem 1.2rem",
                        borderRadius: "10px",
                        fontSize: "1rem",
                        fontFamily: "inherit",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 500,
                        transition: "all 0.15s",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ minWidth: 130, flexShrink: 0 }}>{r}</span>
                      <span style={{
                        fontSize: "0.8rem",
                        fontWeight: 400,
                        opacity: active ? 0.85 : 0.5,
                        borderLeft: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(10,22,40,0.1)",
                        paddingLeft: "1rem",
                      }}>{h}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div id="validation-errors" style={{
                background: "#fef2f2",
                border: "1.5px solid #fca5a5",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
              }}>
                <p style={{ margin: "0 0 0.6rem", fontWeight: 600, fontSize: "0.95rem", color: "#b91c1c" }}>
                  Please complete the following fields before submitting:
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#dc2626", lineHeight: 1.8 }}>
                  {validationErrors.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

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
