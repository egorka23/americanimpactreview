"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

import { TAXONOMY, CATEGORIES } from "@/lib/taxonomy";

const ARTICLE_TYPES = [
  "Original Research",
  "Review Article",
  "Theoretical Article",
  "Policy Analysis",
  "Case Study",
  "Short Communication",
  "Commentary / Opinion",
  "Meta-Analysis",
];

const ARTICLE_TYPE_INFO: Record<string, { desc: string; when: string }> = {
  "Original Research": {
    desc: "A full-length study presenting new data, methods, or findings not previously published.",
    when: "You conducted an experiment, survey, or study with original results.",
  },
  "Review Article": {
    desc: "A comprehensive summary and analysis of existing research on a specific topic.",
    when: "You are synthesizing published literature, not presenting new data.",
  },
  "Theoretical Article": {
    desc: "Develops or challenges a theoretical framework without new empirical data.",
    when: "You are proposing, refining, or critiquing a theory or conceptual model.",
  },
  "Policy Analysis": {
    desc: "Examines a public policy using evidence-based methods to evaluate its impact.",
    when: "You are analyzing a specific policy, regulation, or government program.",
  },
  "Case Study": {
    desc: "An in-depth investigation of a single event, organization, or phenomenon.",
    when: "You are drawing insights from one detailed, real-world example.",
  },
  "Short Communication": {
    desc: "A brief report of significant preliminary findings, novel methods, or negative results.",
    when: "You have a focused finding that doesn\u2019t require a full-length article.",
  },
  "Commentary / Opinion": {
    desc: "A scholarly opinion piece offering perspective on a current issue or published work.",
    when: "You want to argue a position or respond to recent developments.",
  },
  "Meta-Analysis": {
    desc: "A statistical synthesis of results from multiple independent studies on the same question.",
    when: "You are combining quantitative data from several studies for overall trends.",
  },
};

interface CoAuthor {
  name: string;
  email: string;
  affiliation: string;
  orcid: string;
}

const emptyCoAuthor = (): CoAuthor => ({ name: "", email: "", affiliation: "", orcid: "" });

/* ── hint list component (same pattern as Signup page) ── */
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

/* ── helpers ── */
function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

function uniqueKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  return keywords.filter((k) => {
    const lower = k.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function formatOrcid(raw: string): string {
  const digits = raw.replace(/[^0-9Xx]/g, "");
  const parts: string[] = [];
  for (let i = 0; i < digits.length && i < 16; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join("-");
}

function isValidOrcid(value: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/.test(value);
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ── focus next field on Enter ── */
function focusNext(currentId: string) {
  const order = ["title", "abstract", "category", "subject", "keywords", "authorAffiliation", "authorOrcid"];
  const idx = order.indexOf(currentId);
  if (idx >= 0 && idx < order.length - 1) {
    const next = document.getElementById(order[idx + 1]);
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

/* ── valid-field green border style ── */
const validStyle: React.CSSProperties = {
  borderColor: "#86efac",
  boxShadow: "0 0 0 3px rgba(134, 239, 172, 0.2)",
};

/* ── word counter color ── */
function wordCountColor(count: number): string {
  if (count === 0) return "#94a3b8";
  if (count < 150) return "#dc2626";
  if (count < 200) return "#ca8a04";
  if (count <= 300) return "#16a34a";
  if (count <= 500) return "#ca8a04";
  return "#dc2626";
}

export default function SubmitClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    articleType: ARTICLE_TYPES[0],
    title: "",
    abstract: "",
    category: CATEGORIES[0],
    subject: "",
    keywords: "",
    authorAffiliation: "",
    authorOrcid: "",
    coverLetter: "",
    conflictOfInterest: "",
    noConflict: true,
    policyAgreed: false,
    noEthics: true,
    ethicsApproval: "",
    noFunding: true,
    fundingStatement: "",
    dataAvailability: "",
    noAi: true,
    aiDisclosure: "",
  });
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [keywordChips, setKeywordChips] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [coAuthorTouched, setCoAuthorTouched] = useState<Record<string, boolean>>({});
  const [showTypeInfo, setShowTypeInfo] = useState(false);
  const [draftsRestored, setDraftsRestored] = useState(false);

  /* ── autosave to localStorage ── */
  const DRAFT_KEY = "air_submit_draft";

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.form) setForm((prev: typeof form) => ({ ...prev, ...draft.form }));
        if (draft.coAuthors?.length) setCoAuthors(draft.coAuthors);
        if (draft.customSubject) setCustomSubject(draft.customSubject);
        if (draft.keywordChips?.length) setKeywordChips(draft.keywordChips);
        if (draft.keywordInput) setKeywordInput(draft.keywordInput);
        setDraftsRestored(true);
      }
    } catch { /* ignore corrupt localStorage */ }
  }, []);

  // Save draft on every change (debounced via effect)
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        form,
        coAuthors,
        customSubject,
        keywordChips,
        keywordInput,
      }));
    } catch { /* ignore quota errors */ }
  }, [form, coAuthors, customSubject, keywordChips, keywordInput]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  // Clear draft on successful submission
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  /* ── derived validation ── */
  const titleValid = form.title.trim().length >= 10;
  const abstractWordCount = useMemo(() => countWords(form.abstract), [form.abstract]);
  const abstractValid = abstractWordCount >= 150 && abstractWordCount <= 500;
  const keywordsFromField = useMemo(() => uniqueKeywords(parseKeywords(form.keywords)), [form.keywords]);
  const effectiveKeywords = keywordChips.length > 0 ? keywordChips : keywordsFromField;
  const keywordsValid = effectiveKeywords.length >= 3 && effectiveKeywords.length <= 6;
  const orcidValid = form.authorOrcid.trim() === "" || isValidOrcid(form.authorOrcid);
  const fileValid = file !== null;
  const fileTooBig = file ? file.size > 50 * 1024 * 1024 : false;

  const allCoAuthorsValid = coAuthors.every(
    (ca) => ca.name.trim().length > 0 && ca.email.trim().length > 0 && isValidEmail(ca.email)
  );

  const canSubmit =
    titleValid &&
    abstractValid &&
    keywordsValid &&
    fileValid &&
    !fileTooBig &&
    orcidValid &&
    allCoAuthorsValid &&
    form.policyAgreed;

  /* ── progress bar ── */
  const steps = [
    { label: "Title", done: titleValid },
    { label: "Abstract", done: abstractValid },
    { label: "Keywords", done: keywordsValid },
    { label: "Upload", done: fileValid && !fileTooBig },
    { label: "Declarations", done: form.policyAgreed && (form.noConflict || form.conflictOfInterest.trim().length > 0) },
    { label: "Submit", done: canSubmit },
  ];
  const stepsComplete = steps.filter((s) => s.done).length;
  const progressPct = Math.round((stepsComplete / steps.length) * 100);

  /* ── title hints ── */
  const titleRules = [
    { key: "len", label: "At least 10 characters", ok: form.title.trim().length >= 10 },
  ];

  /* ── abstract hints ── */
  const abstractRules = [
    { key: "notempty", label: "Abstract is not empty", ok: form.abstract.trim().length > 0 },
    { key: "minwords", label: "At least 150 words", ok: abstractWordCount >= 150 },
    { key: "maxwords", label: "No more than 500 words", ok: abstractWordCount <= 500 },
  ];

  /* ── keywords hints ── */
  const keywordRules = [
    { key: "min", label: "At least 3 keywords", ok: effectiveKeywords.length >= 3 },
    { key: "max", label: "No more than 6 keywords", ok: effectiveKeywords.length <= 6 },
    { key: "sep", label: "Separated by commas", ok: effectiveKeywords.length >= 1 },
  ];

  /* ── ORCID hints ── */
  const orcidRules = [
    { key: "format", label: "Format: 0000-0000-0000-0000", ok: form.authorOrcid.trim() === "" || isValidOrcid(form.authorOrcid) },
  ];

  /* ── file hints ── */
  const fileRules = [
    { key: "req", label: "Manuscript file is required", ok: fileValid },
    ...(file ? [{ key: "size", label: `File size: ${formatFileSize(file.size)}${fileTooBig ? " (exceeds 50 MB limit)" : ""}`, ok: !fileTooBig }] : []),
  ];

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
            <h1>Submit a Manuscript</h1>
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
              <li>Peer review: 2-4 weeks</li>
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
            <button className="button-secondary" onClick={() => { setSuccess(null); setForm({ articleType: ARTICLE_TYPES[0], title: "", abstract: "", category: CATEGORIES[0], subject: "", keywords: "", authorAffiliation: "", authorOrcid: "", coverLetter: "", conflictOfInterest: "", noConflict: true, policyAgreed: false, noEthics: true, ethicsApproval: "", noFunding: true, fundingStatement: "", dataAvailability: "", noAi: true, aiDisclosure: "" }); setCustomSubject(""); setCoAuthors([]); setFile(null); setKeywordChips([]); setKeywordInput(""); setTouched({}); setCoAuthorTouched({}); }}>
              Submit another
            </button>
          </li>
        </ul>
      </section>
    );
  }

  const addCoAuthor = () => setCoAuthors([...coAuthors, emptyCoAuthor()]);
  const removeCoAuthor = (i: number) => {
    setCoAuthors(coAuthors.filter((_, idx) => idx !== i));
    // Clean up touched state for removed co-author
    const newTouched = { ...coAuthorTouched };
    delete newTouched[`ca_${i}_name`];
    delete newTouched[`ca_${i}_email`];
    setCoAuthorTouched(newTouched);
  };
  const updateCoAuthor = (i: number, field: keyof CoAuthor, value: string) => {
    const updated = [...coAuthors];
    if (field === "orcid") {
      updated[i] = { ...updated[i], [field]: formatOrcid(value) };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setCoAuthors(updated);
  };

  /* ── keyword chip management ── */
  const commitKeywords = () => {
    const newKw = parseKeywords(keywordInput);
    if (newKw.length > 0) {
      const merged = uniqueKeywords([...keywordChips, ...newKw]);
      setKeywordChips(merged);
      setForm({ ...form, keywords: merged.join(", ") });
      setKeywordInput("");
    }
  };

  const removeChip = (idx: number) => {
    const updated = keywordChips.filter((_, i) => i !== idx);
    setKeywordChips(updated);
    setForm({ ...form, keywords: updated.join(", ") });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitKeywords();
    }
  };

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    // If user types/pastes text with commas or semicolons, auto-split
    if (/[,;\n]/.test(value)) {
      const newKw = parseKeywords(value);
      if (newKw.length > 1) {
        const merged = uniqueKeywords([...keywordChips, ...newKw]);
        setKeywordChips(merged);
        setForm({ ...form, keywords: merged.join(", ") });
        setKeywordInput("");
        return;
      }
    }
    // Also keep the plain text keywords in form for fallback
    if (keywordChips.length === 0) {
      setForm({ ...form, keywords: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.abstract.trim()) {
      setError("Title and abstract are required.");
      return;
    }

    if (!form.keywords.trim()) {
      setError("Keywords are required.");
      return;
    }

    if (!file) {
      setError("Manuscript file is required.");
      return;
    }

    if (!form.policyAgreed) {
      setError("You must agree to the publication policies before submitting.");
      return;
    }

    // Validate declarations: if user unchecked "none", they must provide details
    if (!form.noEthics && !form.ethicsApproval.trim()) {
      setError("Please provide ethics/IRB approval details, or check 'No human or animal subjects involved'.");
      return;
    }
    if (!form.noFunding && !form.fundingStatement.trim()) {
      setError("Please provide funding details, or check 'No external funding received'.");
      return;
    }
    if (!form.noAi && !form.aiDisclosure.trim()) {
      setError("Please describe AI tool usage, or check 'No AI tools were used'.");
      return;
    }
    if (!form.noConflict && !form.conflictOfInterest.trim()) {
      setError("Please describe competing interests, or check 'I declare that I have no competing interests'.");
      return;
    }

    // Validate co-author required fields
    for (let i = 0; i < coAuthors.length; i++) {
      if (!coAuthors[i].name.trim() || !coAuthors[i].email.trim()) {
        setError(`Co-author ${i + 1}: name and email are required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("articleType", form.articleType);
      formData.append("title", form.title.trim());
      formData.append("abstract", form.abstract.trim());
      formData.append("category", form.category);
      const finalSubject = form.subject === "Other" ? customSubject.trim() : form.subject;
      if (finalSubject) {
        formData.append("subject", finalSubject);
      }
      formData.append("keywords", form.keywords.trim());

      if (form.authorAffiliation.trim()) {
        formData.append("authorAffiliation", form.authorAffiliation.trim());
      }
      if (form.authorOrcid.trim()) {
        formData.append("authorOrcid", form.authorOrcid.trim());
      }
      if (coAuthors.length > 0) {
        formData.append("coAuthors", JSON.stringify(coAuthors));
      }

      if (form.coverLetter.trim()) {
        formData.append("coverLetter", form.coverLetter.trim());
      }
      if (!form.noConflict && form.conflictOfInterest.trim()) {
        formData.append("conflictOfInterest", form.conflictOfInterest.trim());
      } else if (form.noConflict) {
        formData.append("conflictOfInterest", "");
      }

      // Declarations
      if (form.noEthics) {
        formData.append("ethicsApproval", "No human/animal subjects involved");
      } else if (form.ethicsApproval.trim()) {
        formData.append("ethicsApproval", form.ethicsApproval.trim());
      }

      if (form.noFunding) {
        formData.append("fundingStatement", "No external funding");
      } else if (form.fundingStatement.trim()) {
        formData.append("fundingStatement", form.fundingStatement.trim());
      }

      if (form.dataAvailability.trim()) {
        formData.append("dataAvailability", form.dataAvailability.trim());
      }

      if (form.noAi) {
        formData.append("aiDisclosure", "No AI tools used in writing");
      } else if (form.aiDisclosure.trim()) {
        formData.append("aiDisclosure", form.aiDisclosure.trim());
      }

      formData.append("policyAgreed", form.policyAgreed ? "1" : "0");
      formData.append("manuscript", file);

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
      clearDraft();
      setSuccess(data.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0a1628",
    borderBottom: "2px solid #e2e0dc",
    paddingBottom: "0.5rem",
    marginBottom: "1.25rem",
    marginTop: "2rem",
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "#f0f4f8",
    border: "1px solid #cbd5e1",
    borderRadius: "1rem",
    padding: "0.2rem 0.6rem 0.2rem 0.75rem",
    fontSize: "0.82rem",
    color: "#1e293b",
    lineHeight: 1.6,
  };

  const chipRemoveStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "1rem",
    padding: "0 0.15rem",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Submit</div>
          <h1>Submit your manuscript</h1>
          <p>
            Fill in the details below and upload your manuscript (Word or LaTeX, up to 50 MB).
          </p>
        </div>
      </section>

      <section className="page-section" style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* ── Progress bar ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#faf8f5", paddingTop: "0.75rem", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: progressPct === 100 ? "#16a34a" : "#475569" }}>
              {progressPct === 100 ? "Ready to submit" : `${stepsComplete} of ${steps.length} required fields`}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{progressPct}%</span>
          </div>
          <div style={{
            height: 6,
            borderRadius: 3,
            background: "#e2e8f0",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              borderRadius: 3,
              background: progressPct === 100
                ? "linear-gradient(90deg, #16a34a, #22c55e)"
                : "linear-gradient(90deg, #1e3a5f, #3b82f6)",
              transition: "width 0.4s ease, background 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
            {steps.map((s) => (
              <span key={s.label} style={{
                fontSize: "0.7rem",
                color: s.done ? "#16a34a" : "#94a3b8",
                fontWeight: s.done ? 600 : 400,
                transition: "color 0.2s",
              }}>
                {s.done ? "\u2713" : "\u2022"} {s.label}
              </span>
            ))}
          </div>
          {draftsRestored && stepsComplete > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Draft restored automatically</span>
              <span
                role="button"
                tabIndex={0}
                onClick={() => { clearDraft(); setDraftsRestored(false); setForm({ articleType: ARTICLE_TYPES[0], title: "", abstract: "", category: CATEGORIES[0], subject: "", keywords: "", authorAffiliation: "", authorOrcid: "", coverLetter: "", conflictOfInterest: "", noConflict: true, policyAgreed: false, noEthics: true, ethicsApproval: "", noFunding: true, fundingStatement: "", dataAvailability: "", noAi: true, aiDisclosure: "" }); setCoAuthors([]); setCustomSubject(""); setKeywordChips([]); setKeywordInput(""); setFile(null); setTouched({}); setCoAuthorTouched({}); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
                style={{ fontSize: "0.75rem", color: "#94a3b8", cursor: "pointer", textTransform: "none", letterSpacing: "normal" }}
              >
                Clear draft
              </span>
            </div>
          )}
        </div>

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

            {/* ── Section 1: Manuscript ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>1. Manuscript</div>
            </div>

            <div className="col-12">
              <label htmlFor="articleType">Article Type *</label>
              <select
                id="articleType"
                value={form.articleType}
                onChange={(e) => setForm({ ...form, articleType: e.target.value })}
              >
                {ARTICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Current selection description */}
              {ARTICLE_TYPE_INFO[form.articleType] && (
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                  {ARTICLE_TYPE_INFO[form.articleType].desc}
                </p>
              )}

              {/* Toggle to show all types */}
              <span
                role="button"
                tabIndex={0}
                onClick={() => setShowTypeInfo(!showTypeInfo)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowTypeInfo(!showTypeInfo); } }}
                style={{
                  color: "#1e3a5f",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  marginTop: "0.3rem",
                  textTransform: "none",
                  letterSpacing: "normal",
                  fontWeight: 500,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  textDecorationColor: "rgba(30,58,95,0.3)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s" }} />
                </svg>
                {showTypeInfo ? "Hide" : "See all article types"}
              </span>

              {showTypeInfo && (
                <div style={{
                  marginTop: "0.5rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}>
                  {ARTICLE_TYPES.map((t) => {
                    const info = ARTICLE_TYPE_INFO[t];
                    if (!info) return null;
                    const isSelected = form.articleType === t;
                    return (
                      <div
                        key={t}
                        onClick={() => { setForm({ ...form, articleType: t }); setShowTypeInfo(false); }}
                        style={{
                          padding: "0.65rem 0.8rem",
                          borderRadius: "0.5rem",
                          border: isSelected ? "1.5px solid #1e3a5f" : "1px solid #e2e8f0",
                          background: isSelected ? "#f0f5ff" : "#fff",
                          cursor: "pointer",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          boxShadow: isSelected ? "0 0 0 3px rgba(30,58,95,0.08)" : "none",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#94a3b8"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                      >
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.2rem" }}>
                          {t}
                          {isSelected && <span style={{ color: "#16a34a", fontWeight: 400, marginLeft: "0.4rem" }}>&check;</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                          {info.when}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Title with validation ── */}
            <div className="col-12">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                placeholder="e.g. Effects of Sleep Deprivation on Cognitive Performance"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onBlur={() => setTouched({ ...touched, title: true })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusNext("title"); } }}
                required
                style={titleValid && form.title.length > 0 ? validStyle : undefined}
              />
              {(touched.title || form.title.length > 0) && !titleValid && (
                <HintList rules={titleRules} />
              )}
            </div>

            {/* ── Abstract with word counter ── */}
            <div className="col-12">
              <label htmlFor="abstract">Abstract *</label>
              <textarea
                id="abstract"
                rows={6}
                placeholder="e.g. Background: ... Methods: ... Results: ... Conclusion: ... (200-300 words)"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                onBlur={() => setTouched({ ...touched, abstract: true })}
                required
                style={abstractValid && form.abstract.length > 0 ? validStyle : undefined}
              />
              {/* Word counter — always visible when abstract has content */}
              {(form.abstract.length > 0 || touched.abstract) && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.35rem",
                }}>
                  <span style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: wordCountColor(abstractWordCount),
                  }}>
                    {abstractWordCount} {abstractWordCount === 1 ? "word" : "words"}
                    <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: "0.5rem" }}>
                      (recommended: 200-300)
                    </span>
                  </span>
                </div>
              )}
              {(touched.abstract || form.abstract.length > 0) && !abstractValid && (
                <HintList rules={abstractRules} />
              )}
            </div>

            <div className="col-6">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, subject: "" })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-6">
              <label htmlFor="subject">Subject <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(subcategory)</span></label>
              <select
                id="subject"
                value={form.subject}
                onChange={(e) => { setForm({ ...form, subject: e.target.value }); if (e.target.value !== "Other") setCustomSubject(""); }}
              >
                <option value="">— Select subject —</option>
                {(TAXONOMY[form.category] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {form.subject === "Other" && (
                <input
                  type="text"
                  placeholder="e.g. Computational Linguistics"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  style={{ marginTop: "0.5em" }}
                />
              )}
            </div>

            {/* ── Keywords with chips ── */}
            <div className="col-12">
              <label htmlFor="keywords">Keywords * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(3-6 keywords, press Enter to add)</span></label>

              {/* Chips display */}
              {keywordChips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  {keywordChips.map((kw, i) => (
                    <span key={i} style={chipStyle}>
                      {kw}
                      <button type="button" onClick={() => removeChip(i)} style={chipRemoveStyle} aria-label={`Remove ${kw}`}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                id="keywords"
                placeholder={keywordChips.length > 0 ? "Add more keywords..." : "e.g. machine learning, NLP, immigration"}
                value={keywordInput}
                onChange={(e) => handleKeywordChange(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                onBlur={() => {
                  setTouched({ ...touched, keywords: true });
                  commitKeywords();
                }}
                style={keywordsValid ? validStyle : undefined}
              />
              {(touched.keywords || effectiveKeywords.length > 0) && !keywordsValid && (
                <HintList rules={keywordRules} />
              )}
            </div>

            {/* ── Section 2: Authors ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>2. Authors</div>
            </div>

            <div className="col-6">
              <label htmlFor="authorAffiliation">Your affiliation <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(institution)</span></label>
              <input
                type="text"
                id="authorAffiliation"
                placeholder="e.g. MIT, Stanford University"
                value={form.authorAffiliation}
                onChange={(e) => setForm({ ...form, authorAffiliation: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusNext("authorAffiliation"); } }}
              />
            </div>

            {/* ── ORCID with auto-format ── */}
            <div className="col-6">
              <label htmlFor="authorOrcid">Your ORCID iD <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional - <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", textDecoration: "underline" }}>find yours</a>)</span></label>
              <input
                type="text"
                id="authorOrcid"
                placeholder="e.g. 0000-0002-1825-0097"
                value={form.authorOrcid}
                onChange={(e) => setForm({ ...form, authorOrcid: formatOrcid(e.target.value) })}
                onBlur={() => setTouched({ ...touched, orcid: true })}
                maxLength={19}
                style={form.authorOrcid.trim() && orcidValid ? validStyle : undefined}
              />
              {(touched.orcid || form.authorOrcid.length > 0) && form.authorOrcid.trim() && !orcidValid && (
                <HintList rules={orcidRules} />
              )}
            </div>

            {/* ── Co-authors with inline validation ── */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Co-authors</label>
              {coAuthors.map((ca, i) => (
                <div key={i} style={{
                  background: "#f8f6f3",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "0.75rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Co-author {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCoAuthor(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="coauthor-fields-grid" style={{ display: "grid", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Smith"
                        value={ca.name}
                        onChange={(e) => updateCoAuthor(i, "name", e.target.value)}
                        onBlur={() => setCoAuthorTouched({ ...coAuthorTouched, [`ca_${i}_name`]: true })}
                        style={ca.name.trim().length > 0 ? validStyle : undefined}
                      />
                      {coAuthorTouched[`ca_${i}_name`] && !ca.name.trim() && (
                        <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>Name is required</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. jane@university.edu"
                        value={ca.email}
                        onChange={(e) => updateCoAuthor(i, "email", e.target.value)}
                        onBlur={() => setCoAuthorTouched({ ...coAuthorTouched, [`ca_${i}_email`]: true })}
                        style={ca.email.trim() && isValidEmail(ca.email) ? validStyle : undefined}
                      />
                      {coAuthorTouched[`ca_${i}_email`] && ca.email.trim() && !isValidEmail(ca.email) && (
                        <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>Valid email address required</p>
                      )}
                      {coAuthorTouched[`ca_${i}_email`] && !ca.email.trim() && (
                        <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>Email is required</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Affiliation</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={ca.affiliation}
                        onChange={(e) => updateCoAuthor(i, "affiliation", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>ORCID</label>
                      <input
                        type="text"
                        placeholder="e.g. 0000-0002-1234-5678"
                        value={ca.orcid}
                        onChange={(e) => updateCoAuthor(i, "orcid", e.target.value)}
                        maxLength={19}
                      />
                      {ca.orcid.trim() && !isValidOrcid(ca.orcid) && (
                        <p style={{ color: "#ca8a04", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>Format: 0000-0000-0000-0000</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCoAuthor}
                className="button-secondary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
              >
                + Add co-author
              </button>
            </div>

            {/* ── Section 3: Upload ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>3. Upload</div>
            </div>

            {/* ── File upload with info ── */}
            <div className="col-12">
              <label htmlFor="manuscript">Manuscript file * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>Word (.doc, .docx), max 50 MB</span></label>
              <input
                type="file"
                id="manuscript"
                accept=".docx,.doc"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f) {
                    const ext = f.name.split(".").pop()?.toLowerCase();
                    if (!["doc", "docx"].includes(ext || "")) {
                      setFile(null);
                      e.target.value = "";
                      setError("Only Word files (.doc, .docx) are accepted.");
                      return;
                    }
                    setError("");
                  }
                  setFile(f);
                  setTouched({ ...touched, file: true });
                }}
                required
              />
              {file && (
                <div style={{
                  marginTop: "0.4rem",
                  fontSize: "0.82rem",
                  color: fileTooBig ? "#dc2626" : "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}>
                  <span>{fileTooBig ? "\u26A0" : "\u2713"}</span>
                  <span>{file.name} ({formatFileSize(file.size)})</span>
                  {fileTooBig && <span style={{ fontWeight: 600 }}> — exceeds 50 MB limit</span>}
                </div>
              )}
              {touched.file && !file && (
                <HintList rules={fileRules} />
              )}
            </div>

            {/* ── Section 4: Declarations ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>4. Declarations</div>
            </div>

            {/* Ethics / IRB */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Ethics / IRB approval</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noEthics"
                  checked={form.noEthics}
                  onChange={(e) => setForm({ ...form, noEthics: e.target.checked, ethicsApproval: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noEthics" style={{ margin: 0, fontWeight: 400 }}>
                  No human or animal subjects involved
                </label>
              </div>
              {!form.noEthics && (
                <textarea
                  rows={2}
                  placeholder="e.g. Approved by University of Wisconsin IRB, Protocol #2025-0123"
                  value={form.ethicsApproval}
                  onChange={(e) => setForm({ ...form, ethicsApproval: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Funding */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Funding</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noFunding"
                  checked={form.noFunding}
                  onChange={(e) => setForm({ ...form, noFunding: e.target.checked, fundingStatement: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noFunding" style={{ margin: 0, fontWeight: 400 }}>
                  No external funding received
                </label>
              </div>
              {!form.noFunding && (
                <textarea
                  rows={2}
                  placeholder="e.g. NSF Grant #1234567, PI role"
                  value={form.fundingStatement}
                  onChange={(e) => setForm({ ...form, fundingStatement: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Data availability */}
            <div className="col-12">
              <label htmlFor="dataAvailability">Data availability <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(where is data/code accessible?)</span></label>
              <textarea
                id="dataAvailability"
                rows={2}
                placeholder="e.g. Data available at github.com/... or Available upon request"
                value={form.dataAvailability}
                onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}
              />
            </div>

            {/* AI disclosure */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>AI tools disclosure</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noAi"
                  checked={form.noAi}
                  onChange={(e) => setForm({ ...form, noAi: e.target.checked, aiDisclosure: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noAi" style={{ margin: 0, fontWeight: 400 }}>
                  No AI tools were used in writing this manuscript
                </label>
              </div>
              {!form.noAi && (
                <textarea
                  rows={2}
                  placeholder="e.g. ChatGPT was used for grammar editing and literature search"
                  value={form.aiDisclosure}
                  onChange={(e) => setForm({ ...form, aiDisclosure: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Conflict of interest */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Conflict of interest</label>
              <div style={checkboxRowStyle}>
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
                  placeholder="e.g. Author is a consultant for XYZ Corp"
                  value={form.conflictOfInterest}
                  onChange={(e) => setForm({ ...form, conflictOfInterest: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Cover letter */}
            <div className="col-12">
              <label htmlFor="coverLetter">Cover letter <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
              <textarea
                id="coverLetter"
                rows={4}
                placeholder="e.g. This study addresses a gap in multidisciplinary research on..."
                value={form.coverLetter}
                onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              />
            </div>

            {/* Policy agreement */}
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
              {!canSubmit && !submitting && (
                <div style={{
                  fontSize: "0.82rem",
                  color: "#64748b",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  padding: "0.6rem 0.85rem",
                  marginBottom: "1rem",
                  lineHeight: 1.7,
                }}>
                  <span style={{ fontWeight: 600, color: "#475569" }}>Please complete:</span>
                  <ul style={{ margin: "0.25rem 0 0", padding: "0 0 0 1.2rem" }}>
                    {!titleValid && <li>Title (at least 10 characters)</li>}
                    {!abstractValid && <li>Abstract ({abstractWordCount < 150 ? "at least 150 words" : "no more than 500 words"})</li>}
                    {!keywordsValid && <li>Keywords ({effectiveKeywords.length < 3 ? "at least 3" : "no more than 6"})</li>}
                    {!fileValid && <li>Upload manuscript file (.doc or .docx)</li>}
                    {fileTooBig && <li>File exceeds 50 MB limit</li>}
                    {!orcidValid && <li>ORCID format: 0000-0000-0000-0000</li>}
                    {!allCoAuthorsValid && <li>Co-author name and email are required</li>}
                    {!form.policyAgreed && <li>Confirm originality and agree to publication policies</li>}
                  </ul>
                </div>
              )}
              <ul className="actions">
                <li>
                  <button type="submit" className="button primary" disabled={submitting || !canSubmit}>
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
