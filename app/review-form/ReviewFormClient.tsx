"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

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

function ToggleRow({ value, onChange, options = YES_NO_NA as unknown as readonly string[], inverted = false }: { value: string; onChange: (v: string) => void; options?: readonly string[]; inverted?: boolean }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem" }}>
      {options.map((o) => {
        const active = value === o;
        const invertedClass: Record<string, string> = { Yes: "rv-active-red", No: "rv-active-green", "N/A": "rv-active-gray" };
        const cls = active ? ((inverted ? invertedClass : toggleActiveClass)[o] || "rv-active-blue") : "";
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
    <div className="rv-rating-row" style={{ marginBottom: "0.75rem" }}>
      <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>{label}</span>
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
  const [showPreview, setShowPreview] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Token-based flow
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLocked, setTokenLocked] = useState(false);
  const [tokenMeta, setTokenMeta] = useState<{
    title?: string;
    articleType?: string;
    deadline?: string;
    alreadySubmitted?: boolean;
  }>({});
  const [tokenLoading, setTokenLoading] = useState(false);

  // Load draft from localStorage on mount; resolve token if present
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      setTokenLoading(true);
      fetch(`/api/review-token?token=${encodeURIComponent(urlToken)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then((data) => {
          setForm((f) => ({
            ...f,
            reviewerName: data.reviewerName || f.reviewerName,
            reviewerEmail: data.reviewerEmail || f.reviewerEmail,
            manuscriptId: data.manuscriptId || f.manuscriptId,
          }));
          setTokenMeta({
            title: data.title,
            articleType: data.articleType,
            deadline: data.deadline,
            alreadySubmitted: data.alreadySubmitted,
          });
          setTokenLocked(true);
          setTokenLoading(false);
          setHydrated(true);
        })
        .catch(() => {
          // Bad token — fall back to manual flow
          setToken(null);
          setTokenLoading(false);
          const draft = loadDraft();
          setForm(draft);
          setHydrated(true);
        });
    } else {
      const draft = loadDraft();
      setForm(draft);
      // Check if already submitted for this manuscript
      if (draft.manuscriptId) {
        try {
          if (localStorage.getItem(`air-review-sent-${draft.manuscriptId}`)) {
            setSubmitted(true);
          }
        } catch {}
      }
      setHydrated(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock body scroll when a popup is open
  useEffect(() => {
    if (showPreview || justSubmitted) {
      document.documentElement.classList.add("rv-no-scroll");
      document.body.classList.add("rv-no-scroll");
      return () => {
        document.documentElement.classList.remove("rv-no-scroll");
        document.body.classList.remove("rv-no-scroll");
      };
    }
  }, [showPreview, justSubmitted]);

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

  const validate = (): string[] => {
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
    return missing;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const missing = validate();
    if (missing.length > 0) {
      setValidationErrors(missing);
      setTimeout(() => {
        document.getElementById("validation-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setValidationErrors([]);
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(token ? { token } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
        if (form.manuscriptId.trim()) {
          localStorage.setItem(`air-review-sent-${form.manuscriptId.trim()}`, "1");
        }
      } catch {}
      setShowPreview(false);
      setSubmitted(true);
      setJustSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      submittingRef.current = false;
      setSending(false);
    }
  };

  const handleOpenPrintPage = async () => {
    try {
      // Generate document ID (SHA-256 hash of review content)
      const content = JSON.stringify(form);
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fullHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const docId = "AIR-PRR-" + fullHash.slice(0, 8).toUpperCase();

      const printData = {
        ...form,
        title: tokenMeta.title || "",
        submittedAt: new Date().toISOString(),
        docId,
        fullHash,
      };
      localStorage.setItem("air-review-print", JSON.stringify(printData));
      window.open("/review-form/print", "_blank");
    } catch (err) {
      console.error("Error opening print page:", err);
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
          {tokenMeta.title && (
            <p style={{ fontSize: "0.95rem", color: "#1e3a5f", fontWeight: 500, marginTop: "0.5rem" }}>
              {tokenMeta.title}
              {tokenMeta.deadline && <> &middot; Due: {tokenMeta.deadline}</>}
            </p>
          )}
          <div className="page-meta">
            <span>Confidential</span>
            <span>Structured Review</span>
            <span>COPE Guidelines</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {tokenLoading ? (
          <div className="card settings-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <p style={{ margin: 0, color: "#64748b" }}>Loading review details...</p>
          </div>
        ) : tokenMeta.alreadySubmitted && !submitted ? (
          <div style={{
            background: "#fffbeb",
            border: "1.5px solid #fbbf24",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#92400e",
          }}>
            You previously submitted a review for this manuscript. Submitting again will update your review.
          </div>
        ) : null}
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
                  <input id="rv-name" type="text" required maxLength={200} value={form.reviewerName} onChange={(e) => set("reviewerName", e.target.value)} placeholder="Full name" style={{ ...inputStyle, ...(tokenLocked ? { background: "#f1f5f9", color: "#475569" } : {}) }} readOnly={tokenLocked} />
                </div>
                <div>
                  <label htmlFor="rv-email" style={labelStyle}>Your Email *</label>
                  <input id="rv-email" type="email" required maxLength={200} value={form.reviewerEmail} onChange={(e) => set("reviewerEmail", e.target.value)} placeholder="you@example.com" style={{ ...inputStyle, ...(tokenLocked ? { background: "#f1f5f9", color: "#475569" } : {}) }} readOnly={tokenLocked} />
                </div>
              </div>
              <div>
                <label htmlFor="rv-ms" style={labelStyle}>Manuscript ID *</label>
                {!tokenLocked && <p style={hintStyle}>You can find the Manuscript ID in the invitation email or on the first page of the PDF.</p>}
                <input id="rv-ms" type="text" required maxLength={50} value={form.manuscriptId} onChange={(e) => set("manuscriptId", e.target.value)} placeholder="e.g. e2026001" style={{ ...inputStyle, ...(tokenLocked ? { background: "#f1f5f9", color: "#475569" } : {}) }} readOnly={tokenLocked} />
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
                <ToggleRow value={form.languageEditing} onChange={(v) => set("languageEditing", v)} options={["Yes", "No"]} inverted />
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
                      className={`rv-rec rv-rec-btn ${active ? recCls : ""}`}
                      onClick={() => set("recommendation", r)}
                      style={{
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
                      <span className="rv-rec-label">{r}</span>
                      <span className="rv-rec-hint" style={{
                        fontSize: "0.8rem",
                        fontWeight: 400,
                        opacity: active ? 0.85 : 0.5,
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

            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                type="submit"
                className="rv-submit-main"
                disabled={sending}
                style={{
                  padding: "0.75rem 2.5rem", borderRadius: "10px",
                  fontSize: "0.95rem", fontFamily: "inherit", fontWeight: 600,
                  cursor: sending ? "wait" : "pointer",
                  background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
                  color: "#fff", border: "none",
                  opacity: sending ? 0.7 : 1,
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
                  boxShadow: "0 3px 10px rgba(30,58,95,0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!sending) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(30,58,95,0.4)";
                    e.currentTarget.style.background = "linear-gradient(135deg, #24466f, #3568a6)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(30,58,95,0.2)";
                  e.currentTarget.style.background = "linear-gradient(135deg, #1e3a5f, #2d5a8e)";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {sending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Popup 1: Preview summary ── */}
      {showPreview && !justSubmitted && (
        <div className="rv-overlay">
          <div className="rv-modal" style={{ maxWidth: 860, padding: 0, overflow: "hidden" }}>
            {/* Gradient header */}
            <div style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 50%, #1e3a5f 100%)",
              padding: "1.5rem 2rem 1.25rem",
              position: "relative",
            }}>
              {/* Top-right: Confirm & Send + Edit + X */}
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={sending}
                  className="rv-header-btn"
                  style={{
                    padding: "0.3rem 0.8rem", borderRadius: "6px",
                    background: "rgba(255,255,255,0.25)", border: "none",
                    fontSize: "0.78rem", fontWeight: 600, cursor: sending ? "wait" : "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    transition: "background 0.15s",
                    opacity: sending ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                >
                  {sending ? (
                    <span className="rv-spinner" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                  <span>{sending ? "Sending..." : "Confirm & Send"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rv-header-btn"
                  style={{
                    padding: "0.3rem 0.8rem", borderRadius: "6px",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close"
                  className="rv-header-btn"
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l12 12M13 1L1 13" />
                  </svg>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ color: "#fff", fontSize: "1.15rem", margin: 0, fontWeight: 700 }}>Review Summary</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", margin: 0 }}>Please verify before submitting</p>
                </div>
              </div>

              {/* Reviewer info chips */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <span style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: "6px",
                  padding: "0.25rem 0.6rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.85)",
                }}>{form.reviewerName}</span>
                <span style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: "6px",
                  padding: "0.25rem 0.6rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.85)",
                }}>{form.manuscriptId}</span>
                {tokenMeta.title && <span style={{
                  background: "rgba(255,255,255,0.12)", borderRadius: "6px",
                  padding: "0.25rem 0.6rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.7)",
                  maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{tokenMeta.title}</span>}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "1.25rem 2rem 1.75rem" }}>
              {/* Evaluations */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Section Evaluations</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 1.5rem" }}>
                  {([
                    ["Objectives clear", form.objectivesClear],
                    ["Literature adequate", form.literatureAdequate],
                    ["Methods reproducible", form.methodsReproducible],
                    ["Statistics appropriate", form.statisticsAppropriate],
                    ["Results clear", form.resultsPresentation],
                    ["Tables appropriate", form.tablesAppropriate],
                    ["Conclusions supported", form.conclusionsSupported],
                    ["Limitations stated", form.limitationsStated],
                  ] as const).map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", fontSize: "0.84rem", borderBottom: "1px solid #f8fafc" }}>
                      <span style={{ color: "#64748b" }}>{label}</span>
                      <span style={{
                        fontWeight: 600, fontSize: "0.78rem",
                        padding: "0.1rem 0.45rem", borderRadius: "4px",
                        background: val === "Yes" ? "#ecfdf5" : val === "No" ? "#fef2f2" : "#f8fafc",
                        color: val === "Yes" ? "#059669" : val === "No" ? "#dc2626" : "#94a3b8",
                      }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Overall Ratings</h4>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {([
                    ["Originality", form.originality],
                    ["Methodology", form.methodology],
                    ["Clarity", form.clarity],
                    ["Significance", form.significance],
                  ] as const).map(([label, val]) => (
                    <div key={label} style={{
                      background: "#f0f4f8", borderRadius: "8px", padding: "0.4rem 0.7rem",
                      display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px",
                    }}>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: "0.88rem", color: "#1e3a5f", fontWeight: 700 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{
                    background: "#f0f4f8", borderRadius: "8px", padding: "0.4rem 0.7rem",
                    display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px",
                  }}>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>Language edit</span>
                    <span style={{ fontSize: "0.88rem", color: form.languageEditing === "No" ? "#059669" : form.languageEditing === "Yes" ? "#dc2626" : "#64748b", fontWeight: 700 }}>{form.languageEditing}</span>
                  </div>
                </div>
              </div>

              {/* Comments preview (if any) */}
              {(() => {
                const commentFields: [string, string][] = [
                  ["Introduction", form.introComments],
                  ["Methods", form.methodsComments],
                  ["Results", form.resultsComments],
                  ["Discussion", form.discussionComments],
                  ["Major Issues", form.majorIssues],
                  ["Minor Issues", form.minorIssues],
                  ["Comments to Authors", form.commentsToAuthors],
                  ["Confidential to Editor", form.confidentialComments],
                ];
                const filled = commentFields.filter(([, v]) => v.trim());
                if (!filled.length) return null;
                return (
                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Feedback</h4>
                    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.84rem", color: "#475569", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {filled.map(([label, val]) => (
                        <div key={label}>
                          <strong style={{ color: "#334155" }}>{label}:</strong>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: "0.15rem" }}>{val.trim()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Recommendation badge */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: form.recommendation === "Accept" ? "#ecfdf5" :
                  form.recommendation === "Reject" ? "#fef2f2" :
                  form.recommendation.includes("Minor") ? "#fffbeb" : "#fff7ed",
                borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1.25rem",
                borderLeft: `4px solid ${
                  form.recommendation === "Accept" ? "#059669" :
                  form.recommendation === "Reject" ? "#dc2626" :
                  form.recommendation.includes("Minor") ? "#d97706" : "#ea580c"
                }`,
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Recommendation</span>
                <span style={{
                  fontWeight: 700, fontSize: "1.05rem",
                  color: form.recommendation === "Accept" ? "#059669" :
                    form.recommendation === "Reject" ? "#dc2626" :
                    form.recommendation.includes("Minor") ? "#d97706" : "#ea580c",
                }}>{form.recommendation}</span>
              </div>

              {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>}
            </div>

            {/* Bottom bar */}
            <div style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 50%, #1e3a5f 100%)",
              padding: "0.75rem 1.5rem",
              display: "flex", justifyContent: "flex-end", gap: "0.4rem", alignItems: "center",
              borderRadius: "0 0 16px 16px",
            }}>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={sending}
                className="rv-header-btn"
                style={{
                  padding: "0.35rem 0.9rem", borderRadius: "6px",
                  background: "rgba(255,255,255,0.25)", border: "none",
                  fontSize: "0.8rem", fontWeight: 600, cursor: sending ? "wait" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  transition: "background 0.15s",
                  opacity: sending ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{sending ? "Sending..." : "Confirm & Send"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rv-header-btn"
                style={{
                  padding: "0.35rem 0.9rem", borderRadius: "6px",
                  background: "rgba(255,255,255,0.15)", border: "none",
                  fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup 2: Thank you + Download PDF ── */}
      {justSubmitted && (
        <div className="rv-overlay">
          <div className="rv-modal rv-thank-you" style={{ maxWidth: 460, textAlign: "center", padding: 0, overflow: "hidden" }}>
            {/* Gradient header */}
            <div style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 50%, #1e3a5f 100%)",
              padding: "2rem 2rem 1.5rem",
              position: "relative",
            }}>
              {/* Close button (X) */}
              <button
                type="button"
                onClick={() => setJustSubmitted(false)}
                aria-label="Close"
                style={{
                  position: "absolute", top: 12, right: 12,
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>

              {/* Animated checkmark circle */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
                animation: "rvPulse 2s ease-in-out infinite",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h3 style={{ color: "#fff", fontSize: "1.35rem", marginBottom: "0.35rem", fontWeight: 700 }}>
                Thank You!
              </h3>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                Your peer review has been submitted successfully.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem 2rem 2rem" }}>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                Your evaluation has been forwarded to the editorial office. Would you like to save a copy of your review for your records?
              </p>

              <button
                type="button"
                onClick={handleOpenPrintPage}
                className="rv-download-btn"
                style={{
                  width: "100%",
                  padding: "0.85rem 1.5rem",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.6rem",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: "0 4px 14px rgba(30,58,95,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,95,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(30,58,95,0.25)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="2" width="12" height="4" rx="1" />
                  <path d="M6 6H4a2 2 0 00-2 2v6a2 2 0 002 2h1" />
                  <path d="M18 6h2a2 2 0 012 2v6a2 2 0 01-2 2h-1" />
                  <rect x="6" y="14" width="12" height="8" rx="1" />
                </svg>
                Save Review Copy (PDF)
              </button>

              <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.75rem", marginBottom: 0 }}>
                Opens a print-ready page — use your browser&apos;s &quot;Save as PDF&quot; to download.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        html.rv-no-scroll, body.rv-no-scroll {
          overflow: hidden !important;
          height: 100% !important;
          position: relative !important;
        }
        @keyframes rvFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rvSlideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes rvPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2) } 50% { box-shadow: 0 0 0 12px rgba(255,255,255,0) } }
        @keyframes rvSpin { to { transform: rotate(360deg) } }
        .rv-spinner {
          display: inline-block;
          width: 12px; height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: rvSpin 0.6s linear infinite;
        }
        /* Override global button reset inside popups */
        .rv-modal button {
          background-color: unset !important;
          box-shadow: none !important;
          color: inherit !important;
          border-radius: unset !important;
          font-size: unset !important;
          font-weight: unset !important;
          letter-spacing: unset !important;
          text-transform: unset !important;
        }
        /* Header buttons on dark gradient need explicit white */
        .rv-modal .rv-header-btn {
          color: rgba(255,255,255,0.85) !important;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s !important;
        }
        .rv-modal .rv-header-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.35) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          color: #fff !important;
        }
        /* Download button in thank-you popup */
        .rv-modal .rv-download-btn {
          color: #fff !important;
        }
        /* Main submit button on form page */
        .rv-submit-main {
          background-color: #1e3a5f !important;
          box-shadow: 0 3px 10px rgba(30,58,95,0.2) !important;
          color: #fff !important;
          border-radius: 10px !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
          text-transform: none !important;
        }
        .rv-submit-main:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(30,58,95,0.4) !important;
        }
        .rv-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: flex-start; justify-content: center;
          background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
          animation: rvFadeIn 0.2s ease;
          overflow-y: auto; overflow-x: hidden;
          overscroll-behavior: contain;
          padding: 2rem 0;
        }
        .rv-modal {
          background: #fff; border-radius: 16px;
          padding: 2rem 2rem 1.75rem; width: 92%;
          box-shadow: 0 25px 60px rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.1);
          animation: rvSlideUp 0.25s ease;
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
