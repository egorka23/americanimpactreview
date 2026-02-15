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
      fontSize: "0.92rem",
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
const FIELD_ORDER = ["articleType", "title", "abstract", "category", "subject", "keywords", "authorAffiliation", "authorOrcid", "manuscript", "noEthics", "noFunding", "dataAvailability", "noAi", "noConflict", "coverLetter", "policyAgreed"];

function focusNext(currentId: string) {
  const idx = FIELD_ORDER.indexOf(currentId);
  if (idx >= 0 && idx < FIELD_ORDER.length - 1) {
    const next = document.getElementById(FIELD_ORDER[idx + 1]);
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

/* ── valid-field green border style ── */
const validStyle: React.CSSProperties = {
  borderColor: "#93c5fd",
  boxShadow: "0 0 0 3px rgba(147, 197, 253, 0.2)",
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
  const [duplicateKw, setDuplicateKw] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [draftsRestored, setDraftsRestored] = useState(false);
  const [typeInteracted, setTypeInteracted] = useState(false);
  const [showFixedBar, setShowFixedBar] = useState(false);

  /* ── show fixed progress bar only after scrolling past hero ── */
  useEffect(() => {
    const onScroll = () => setShowFixedBar(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        if (draft.typeInteracted) setTypeInteracted(true);
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
        typeInteracted,
      }));
    } catch { /* ignore quota errors */ }
  }, [form, coAuthors, customSubject, keywordChips, keywordInput, typeInteracted]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  // Clear draft on successful submission
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const resetForm = () => {
    clearDraft();
    setForm({ articleType: ARTICLE_TYPES[0], title: "", abstract: "", category: CATEGORIES[0], subject: "", keywords: "", authorAffiliation: "", authorOrcid: "", coverLetter: "", conflictOfInterest: "", noConflict: true, policyAgreed: false, noEthics: true, ethicsApproval: "", noFunding: true, fundingStatement: "", dataAvailability: "", noAi: true, aiDisclosure: "" });
    setCoAuthors([]);
    setCustomSubject("");
    setKeywordChips([]);
    setKeywordInput("");
    setFile(null);
    setTouched({});
    setCoAuthorTouched({});
    setTypeInteracted(false);
    setDraftsRestored(false);
    setSubmitAttempted(false);
    setShowClearConfirm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const formHasContent = form.title.trim().length > 0 || form.abstract.trim().length > 0 || keywordChips.length > 0 || file !== null || typeInteracted || form.authorAffiliation.trim().length > 0 || form.authorOrcid.trim().length > 0 || form.coverLetter.trim().length > 0 || coAuthors.length > 0 || keywordInput.trim().length > 0;

  /* ── progress bar ── */
  const steps = [
    { label: "Type", done: typeInteracted },
    { label: "Title", done: titleValid },
    { label: "Abstract", done: abstractValid },
    { label: "Keywords", done: keywordsValid },
    { label: "Upload", done: fileValid && !fileTooBig },
    { label: "Declarations", done: form.policyAgreed && (form.noConflict || form.conflictOfInterest.trim().length > 0) },
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
      const existingLower = new Set(keywordChips.map((k) => k.toLowerCase()));
      const dupes = newKw.filter((k) => existingLower.has(k.toLowerCase()));
      const merged = uniqueKeywords([...keywordChips, ...newKw]);
      if (dupes.length > 0 && merged.length === keywordChips.length) {
        setDuplicateKw(dupes.join(", "));
        setTimeout(() => setDuplicateKw(""), 2000);
      }
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
    setUploadProgress(0);
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

      const data = await new Promise<{ id?: string; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/submissions");
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(json);
            } else {
              resolve({ error: json.error || "Submission failed." });
            }
          } catch {
            reject(new Error("Invalid response"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.send(formData);
      });

      if (data.error) {
        setError(data.error);
        return;
      }

      clearDraft();
      setSuccess(data.id || "");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const sectionHeadingStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0a1628",
    letterSpacing: "-0.02em",
    margin: 0,
  };

  const sectionBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1e3a5f",
    color: "#fff",
    fontSize: "0.92rem",
    fontWeight: 700,
    width: "1.7rem",
    height: "1.7rem",
    borderRadius: "0.5rem",
    flexShrink: 0,
  };

  const sectionCardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "none",
    borderRadius: "1rem",
    padding: "2rem 1.75rem",
    marginTop: "2rem",
    boxShadow: "0 8px 32px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06)",
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
    gap: "0.25rem",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.78rem",
    color: "#334155",
    lineHeight: 1.4,
    fontWeight: 500,
    letterSpacing: "0.01em",
  };

  const chipRemoveStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "0.7rem",
    padding: "0",
    marginLeft: "0.15rem",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    width: "14px",
    height: "14px",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "background 0.15s, color 0.15s",
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

      {/* ── Fixed progress bar (appears on scroll) ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(250,248,245,0.95)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: "1px solid #e2e0dc", padding: "0.6rem 0", transform: showFixedBar ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.3s ease", pointerEvents: showFixedBar ? "auto" : "none" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.92rem", fontWeight: 600, color: progressPct === 100 ? "#16a34a" : "#475569" }}>
              {progressPct === 100 ? "Ready to submit" : `${stepsComplete} of ${steps.length} completed`}
            </span>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{progressPct}%</span>
          </div>
          <div style={{
            height: 5,
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
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
            {steps.map((s) => (
              <span key={s.label} style={{
                fontSize: "0.68rem",
                color: s.done ? "#16a34a" : "#94a3b8",
                fontWeight: s.done ? 600 : 400,
                transition: "color 0.2s",
              }}>
                {s.done ? "\u2713" : "\u2022"} {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="page-section" style={{ maxWidth: 860, margin: "0 auto" }}>

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

            {/* ── Section 1: Manuscript ── */}
            <div style={sectionCardStyle}>
              <div style={sectionHeadingStyle}><span style={sectionBadgeStyle}>1</span>Manuscript</div>
            <div className="row gtr-uniform" style={{ marginTop: "1rem" }}>

            <div className="col-12">
              <label htmlFor="articleType">Article Type *</label>
              <select
                id="articleType"
                value={form.articleType}
                onChange={(e) => { setForm({ ...form, articleType: e.target.value }); setTypeInteracted(true); focusNext("articleType"); }}
              >
                {ARTICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Current selection description */}
              {ARTICLE_TYPE_INFO[form.articleType] && (
                <p style={{ fontSize: "0.92rem", color: "#4b5563", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
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
                  fontSize: "0.92rem",
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
                        onClick={() => { setForm({ ...form, articleType: t }); setTypeInteracted(true); }}
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
                        <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.2rem" }}>
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
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); focusNext("abstract"); } }}
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
                    fontSize: "0.92rem",
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
                onChange={(e) => { setForm({ ...form, category: e.target.value, subject: "" }); focusNext("category"); }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-6">
              <label htmlFor="subject">Subject <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(subcategory)</span></label>
              <select
                id="subject"
                value={form.subject}
                onChange={(e) => { setForm({ ...form, subject: e.target.value }); if (e.target.value !== "Other") { setCustomSubject(""); focusNext("subject"); } }}
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
              <label htmlFor="keywords">Keywords * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(3-6 keywords, press Enter to add)</span></label>

              {/* Chips display */}
              {keywordChips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
                  {keywordChips.map((kw, i) => (
                    <span key={i} style={chipStyle}>
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeChip(i)}
                        style={chipRemoveStyle}
                        aria-label={`Remove ${kw}`}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
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
              {duplicateKw && (
                <p style={{ fontSize: "0.8rem", color: "#ca8a04", margin: "0.35rem 0 0", transition: "opacity 0.3s" }}>
                  &ldquo;{duplicateKw}&rdquo; already added
                </p>
              )}
              {(touched.keywords || effectiveKeywords.length > 0) && !keywordsValid && (
                <HintList rules={keywordRules} />
              )}
            </div>

            </div>{/* end row Section 1 */}
            </div>{/* end card Section 1 */}

            {/* ── Section 2: Authors ── */}
            <div style={sectionCardStyle}>
              <div style={sectionHeadingStyle}><span style={sectionBadgeStyle}>2</span>Authors</div>
            <div className="row gtr-uniform" style={{ marginTop: "1rem" }}>

            <div className="col-6">
              <label htmlFor="authorAffiliation">Your affiliation <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(institution)</span></label>
              <textarea
                id="authorAffiliation"
                rows={1}
                placeholder="e.g. MIT, Stanford University"
                value={form.authorAffiliation}
                onChange={(e) => {
                  setForm({ ...form, authorAffiliation: e.target.value });
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusNext("authorAffiliation"); } }}
                style={{ resize: "none", overflow: "hidden", minHeight: "2.6rem" }}
              />
            </div>

            {/* ── ORCID with auto-format ── */}
            <div className="col-6">
              <label htmlFor="authorOrcid">Your ORCID iD <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(optional - <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" style={{ color: "#1e3a5f", textDecoration: "underline" }}>find yours</a>)</span></label>
              <input
                type="text"
                id="authorOrcid"
                placeholder="e.g. 0000-0002-1825-0097"
                value={form.authorOrcid}
                onChange={(e) => setForm({ ...form, authorOrcid: formatOrcid(e.target.value) })}
                onBlur={() => setTouched({ ...touched, orcid: true })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusNext("authorOrcid"); } }}
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
                        fontSize: "0.92rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="coauthor-fields-grid" style={{ display: "grid", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.92rem" }}>Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Smith"
                        value={ca.name}
                        onChange={(e) => updateCoAuthor(i, "name", e.target.value)}
                        onBlur={() => setCoAuthorTouched({ ...coAuthorTouched, [`ca_${i}_name`]: true })}
                        style={ca.name.trim().length > 0 ? validStyle : undefined}
                      />
                      {coAuthorTouched[`ca_${i}_name`] && !ca.name.trim() && (
                        <p style={{ color: "#dc2626", fontSize: "0.92rem", margin: "0.35rem 0 0" }}>Name is required</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.92rem" }}>Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. jane@university.edu"
                        value={ca.email}
                        onChange={(e) => updateCoAuthor(i, "email", e.target.value)}
                        onBlur={() => setCoAuthorTouched({ ...coAuthorTouched, [`ca_${i}_email`]: true })}
                        style={ca.email.trim() && isValidEmail(ca.email) ? validStyle : undefined}
                      />
                      {coAuthorTouched[`ca_${i}_email`] && ca.email.trim() && !isValidEmail(ca.email) && (
                        <p style={{ color: "#dc2626", fontSize: "0.92rem", margin: "0.35rem 0 0" }}>Valid email address required</p>
                      )}
                      {coAuthorTouched[`ca_${i}_email`] && !ca.email.trim() && (
                        <p style={{ color: "#dc2626", fontSize: "0.92rem", margin: "0.35rem 0 0" }}>Email is required</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: "0.92rem" }}>Affiliation</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={ca.affiliation}
                        onChange={(e) => updateCoAuthor(i, "affiliation", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.92rem" }}>ORCID</label>
                      <input
                        type="text"
                        placeholder="e.g. 0000-0002-1234-5678"
                        value={ca.orcid}
                        onChange={(e) => updateCoAuthor(i, "orcid", e.target.value)}
                        maxLength={19}
                      />
                      {ca.orcid.trim() && !isValidOrcid(ca.orcid) && (
                        <p style={{ color: "#ca8a04", fontSize: "0.92rem", margin: "0.35rem 0 0" }}>Format: 0000-0000-0000-0000</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCoAuthor}
                className="button-secondary"
                style={{ fontSize: "0.92rem", padding: "0.4rem 1rem" }}
              >
                + Add co-author
              </button>
            </div>

            </div>{/* end row Section 2 */}
            </div>{/* end card Section 2 */}

            {/* ── Section 3: Upload ── */}
            <div style={sectionCardStyle}>
              <div style={sectionHeadingStyle}><span style={sectionBadgeStyle}>3</span>Upload</div>
            <div className="row gtr-uniform" style={{ marginTop: "1rem" }}>

            {/* ── File upload with info ── */}
            <div className="col-12">
              <label htmlFor="manuscript">Manuscript file *</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  setFileError("");
                  const f = e.dataTransfer.files?.[0] || null;
                  if (f) {
                    const ext = f.name.split(".").pop()?.toLowerCase();
                    if (!["doc", "docx"].includes(ext || "")) {
                      setFile(null);
                      setFileError(`"${f.name}" is not a Word file. Only .doc and .docx are accepted.`);
                      return;
                    }
                    if (f.size > 50 * 1024 * 1024) {
                      setFile(null);
                      setFileError(`File is too large (${formatFileSize(f.size)}). Maximum size is 50 MB.`);
                      return;
                    }
                    setError("");
                    setFile(f);
                    setTouched({ ...touched, file: true });
                  }
                }}
                onClick={() => document.getElementById("manuscript")?.click()}
                style={{
                  background: dragging ? "#eff6ff" : file ? "#f0fdf4" : fileError ? "#fef2f2" : "#f8fafc",
                  border: dragging ? "2px dashed #3b82f6" : file ? "2px solid #93c5fd" : fileError ? "2px dashed #fca5a5" : "2px dashed #cbd5e1",
                  borderRadius: "0.75rem",
                  padding: "1.5rem 1.25rem",
                  marginBottom: "0.5rem",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                  textAlign: "center",
                }}
              >
                <input
                  type="file"
                  id="manuscript"
                  accept=".docx,.doc"
                  onChange={(e) => {
                    setFileError("");
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      const ext = f.name.split(".").pop()?.toLowerCase();
                      if (!["doc", "docx"].includes(ext || "")) {
                        setFile(null);
                        e.target.value = "";
                        setFileError(`"${f.name}" is not a Word file. Only .doc and .docx are accepted.`);
                        return;
                      }
                      if (f.size > 50 * 1024 * 1024) {
                        setFile(null);
                        e.target.value = "";
                        setFileError(`File is too large (${formatFileSize(f.size)}). Maximum size is 50 MB.`);
                        return;
                      }
                      setError("");
                    }
                    setFile(f);
                    setTouched({ ...touched, file: true });
                  }}
                  required
                  style={{ display: "none" }}
                />

                {file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <rect x="6" y="2" width="20" height="28" rx="2" fill="#2B579A"/>
                      <text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">W</text>
                    </svg>
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#166534" }}>{file.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#16a34a" }}>{formatFileSize(file.size)}{fileTooBig ? " — exceeds 50 MB limit" : " — ready"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(""); const input = document.getElementById("manuscript") as HTMLInputElement; if (input) input.value = ""; }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.78rem", padding: "0.3rem 0.5rem", borderRadius: "0.3rem", transition: "all 0.15s", textTransform: "none", letterSpacing: "normal" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "none"; }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: "0 auto 0.5rem", display: "block" }}>
                      <path d="M18 6L18 22M18 6L12 12M18 6L24 12" stroke={dragging ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 24L6 28C6 29.1 6.9 30 8 30L28 30C29.1 30 30 29.1 30 28L30 24" stroke={dragging ? "#3b82f6" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: dragging ? "#2563eb" : "#334155", marginBottom: "0.2rem" }}>
                      {dragging ? "Drop your file here" : "Drag & drop or click to upload"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <rect x="6" y="2" width="20" height="28" rx="2" fill="#2B579A"/>
                        <text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">W</text>
                      </svg>
                      <span style={{ fontSize: "0.92rem", color: "#475569" }}>Word only (.doc, .docx) · max 50 MB</span>
                    </div>
                  </>
                )}
              </div>
              {fileError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", margin: "0.5rem 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5"/>
                    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: "0.92rem", color: "#b91c1c", lineHeight: 1.4 }}>{fileError}</span>
                </div>
              )}
              {!file && !fileError && (
                <p style={{ fontSize: "0.92rem", color: "#64748b", margin: "0.4rem 0 0", textAlign: "center", lineHeight: 1.6 }}>
                  Have a PDF? Convert it to Word first. See <a href="/for-authors" style={{ color: "#1e3a5f", textDecoration: "underline", textUnderlineOffset: "2px" }}>author guidelines</a>.
                </p>
              )}
              {file && (
                <div style={{
                  marginTop: "0.4rem",
                  fontSize: "0.92rem",
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

            </div>{/* end row Section 3 */}
            </div>{/* end card Section 3 */}

            {/* ── Section 4: Declarations ── */}
            <div style={sectionCardStyle}>
              <div style={sectionHeadingStyle}><span style={sectionBadgeStyle}>4</span>Declarations</div>
            <div className="row gtr-uniform" style={{ marginTop: "1rem" }}>

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
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                    Describe your ethics or IRB approval — committee name, protocol number, approval date.
                  </p>
                  <textarea
                    rows={4}
                    placeholder="e.g. Approved by University of Wisconsin IRB, Protocol #2025-0123, dated Jan 2026"
                    value={form.ethicsApproval}
                    onChange={(e) => setForm({ ...form, ethicsApproval: e.target.value })}
                  />
                </div>
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
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                    List funding sources — agency name, grant number, and your role.
                  </p>
                  <textarea
                    rows={4}
                    placeholder="e.g. NSF Grant #1234567, PI role; NIH R01-GM123456, Co-PI"
                    value={form.fundingStatement}
                    onChange={(e) => setForm({ ...form, fundingStatement: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Data availability */}
            <div className="col-12">
              <label htmlFor="dataAvailability">Data availability <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(where is data/code accessible?)</span></label>
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
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                    Describe which AI tools were used, for what purpose, and how the output was verified.
                  </p>
                  <textarea
                    rows={4}
                    placeholder="e.g. ChatGPT-4 was used for grammar editing and literature search; all outputs were manually reviewed"
                    value={form.aiDisclosure}
                    onChange={(e) => setForm({ ...form, aiDisclosure: e.target.value })}
                  />
                </div>
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
                <div style={{ marginTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                    Describe any financial or personal relationships that could influence your work.
                  </p>
                  <textarea
                    id="conflictOfInterest"
                    rows={4}
                    placeholder="e.g. Author is a paid consultant for XYZ Corp; co-author holds equity in ABC Inc."
                    value={form.conflictOfInterest}
                    onChange={(e) => setForm({ ...form, conflictOfInterest: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div className="col-12">
              <label htmlFor="coverLetter">Cover letter <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.92rem" }}>(optional)</span></label>
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
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                border: submitAttempted && !form.policyAgreed ? "1.5px solid #ef4444" : "1.5px solid transparent",
                background: submitAttempted && !form.policyAgreed ? "#fef2f2" : "transparent",
                transition: "all 0.3s ease",
              }}>
                <input
                  type="checkbox"
                  id="policyAgreed"
                  checked={form.policyAgreed}
                  onChange={(e) => { setForm({ ...form, policyAgreed: e.target.checked }); if (e.target.checked) setSubmitAttempted(false); }}
                  style={{ width: "auto", margin: 0, marginTop: "0.25rem" }}
                />
                <label htmlFor="policyAgreed" style={{ margin: 0, fontWeight: 400 }}>
                  I confirm this manuscript is original work, not published or under review elsewhere, and I agree to AIR&apos;s publication policies *
                </label>
              </div>
              {submitAttempted && !form.policyAgreed && (
                <p style={{ fontSize: "0.8rem", color: "#dc2626", margin: "0.2rem 0 0 0.8rem" }}>
                  Please check this box to continue
                </p>
              )}
            </div>

            </div>{/* end row Section 4 */}
            </div>{/* end card Section 4 */}

            {/* ── Submit ── */}
            <div style={{ marginTop: "2rem" }}>
            <div className="row gtr-uniform">
            <div className="col-12">
              {!canSubmit && !submitting && (
                <div style={{
                  fontSize: "0.92rem",
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", marginTop: "1.5rem", paddingBottom: "1rem" }}>
                <button
                  type={canSubmit ? "submit" : "button"}
                  className={canSubmit ? "button primary" : "button"}
                  disabled={submitting || !canSubmit}
                  onClick={!canSubmit && !submitting ? (e) => {
                    e.preventDefault();
                    setSubmitAttempted(true);
                    if (!form.policyAgreed) {
                      document.getElementById("policyAgreed")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  } : undefined}
                  title={!canSubmit && !submitting ? `Complete all required fields to submit — ${progressPct}% done` : undefined}
                  style={{ minWidth: 220 }}
                >
                  {submitting ? (uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Submitting...") : "Submit manuscript"}
                </button>
                {submitting && uploadProgress > 0 && (
                  <div style={{ width: 220, height: 4, borderRadius: 2, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      borderRadius: 2,
                      background: uploadProgress === 100 ? "#16a34a" : "#3b82f6",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                )}
                {!canSubmit && !submitting && (
                  <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0, textAlign: "center" }}>
                    Fill in all required fields — <span style={{ color: progressPct >= 80 ? "#16a34a" : progressPct >= 50 ? "#ca8a04" : "#3b82f6", fontWeight: 600 }}>{progressPct}%</span> complete
                  </p>
                )}
                <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", alignItems: "center" }}>
                  <Link href="/for-authors" style={{ fontSize: "0.78rem", color: "#64748b", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "rgba(100,116,139,0.3)" }}>
                    Need help? Read author guidelines
                  </Link>
                  <span style={{ color: "#e2e8f0" }}>|</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowClearConfirm(true)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowClearConfirm(true); }}
                    style={{ fontSize: "0.78rem", color: "#94a3b8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "rgba(148,163,184,0.3)", textTransform: "none", letterSpacing: "normal", transition: "color 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                  >
                    Clear form
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>{/* end submit wrapper */}
        </form>
      </section>

      {/* ── Floating clear form button ── */}

      {/* ── Clear form confirmation popup ── */}
      {showClearConfirm && (
        <div
          onClick={() => setShowClearConfirm(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "0.75rem", padding: "1.5rem 2rem", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}
          >
            {formHasContent ? (
              <>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0a1628", margin: "0 0 0.5rem" }}>Clear entire form?</p>
                <p style={{ fontSize: "0.92rem", color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.5 }}>This will erase all fields and your saved draft. This action cannot be undone.</p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button type="button" onClick={() => setShowClearConfirm(false)} className="button-secondary" style={{ fontSize: "0.92rem", padding: "0.5rem 1.25rem" }}>Cancel</button>
                  <button type="button" onClick={resetForm} style={{ fontSize: "0.92rem", padding: "0.5rem 1.25rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer", fontWeight: 600 }}>Clear form</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0a1628", margin: "0 0 0.5rem" }}>Form is empty</p>
                <p style={{ fontSize: "0.92rem", color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.5 }}>Nothing to clear — start filling in the form.</p>
                <button type="button" onClick={() => setShowClearConfirm(false)} className="button-secondary" style={{ fontSize: "0.92rem", padding: "0.5rem 1.25rem" }}>OK</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
