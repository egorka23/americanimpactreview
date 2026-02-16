import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, TAXONOMY } from "@/lib/taxonomy";

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

const STEPS = [
  "Extract text",
  "Detect sections",
  "Extract declarations",
  "Suggest category/subject",
  "Build draft submission",
];

const MAX_FILE_MB = 50;

type IntakeAuthor = {
  name: string;
  email?: string | null;
  affiliation?: string | null;
  orcid?: string | null;
};

type IntakeDeclarations = {
  ethicsApproval?: string | null;
  fundingStatement?: string | null;
  dataAvailability?: string | null;
  aiDisclosure?: string | null;
  conflictOfInterest?: string | null;
  coverLetter?: string | null;
};

type IntakeExtracted = {
  title?: string;
  abstract?: string;
  keywords?: string[] | string;
  articleType?: string;
  category?: string;
  subject?: string;
  authors?: IntakeAuthor[];
  declarations?: IntakeDeclarations;
};

type IntakeResponse = {
  intakeId: string;
  extracted: IntakeExtracted;
  confidence: Record<string, number>;
  warnings: string[];
  evidence: Record<string, string>;
  file: { name: string; url: string };
};

type FormState = {
  title: string;
  abstract: string;
  articleType: string;
  category: string;
  subject: string;
  keywords: string[];
  manuscriptUrl: string;
  manuscriptName: string;
  primaryAuthor: IntakeAuthor;
  coAuthors: IntakeAuthor[];
  declarations: IntakeDeclarations;
  policyAgreed: boolean;
};

function parseKeywords(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((k) => k.trim()).filter(Boolean);
  return raw
    .split(/[,;|]/g)
    .map((k) => k.trim())
    .filter(Boolean);
}

function uniqueKeywords(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  list.forEach((k) => {
    const key = k.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(k);
    }
  });
  return out;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── tiny info tooltip ── */
function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold leading-none inline-flex items-center justify-center hover:bg-gray-300"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
      >
        ?
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>
      )}
    </span>
  );
}

/* ── "not found" badge ── */
function NotFound({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-full ml-2">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {label || "AI not found"}
    </span>
  );
}

function SourceHint({
  label,
  evidence,
  open,
  onToggle,
}: {
  label: string;
  evidence?: string;
  open: boolean;
  onToggle: () => void;
}) {
  if (!evidence) return null;
  return (
    <div className="mt-1">
      <button
        type="button"
        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        onClick={onToggle}
      >
        {open ? "Hide source" : "Show source"}
      </button>
      {open && (
        <div className="mt-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-2">
          {label}: &ldquo;{evidence}&rdquo;
        </div>
      )}
    </div>
  );
}

/* ── confidence badge ── */
function ConfBadge({ value }: { value?: number }) {
  if (value === undefined || value === null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 ${color}`}>
      {pct}%
    </span>
  );
}

export default function AiIntakeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [stage, setStage] = useState<"upload" | "processing" | "review" | "error">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [sourceOpen, setSourceOpen] = useState<Record<string, boolean>>({});
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [dragging, setDragging] = useState(false);
  /* track which fields AI left empty */
  const [aiEmpty, setAiEmpty] = useState<Record<string, boolean>>({});
  const formDirtyRef = useRef(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    abstract: "",
    articleType: "Original Research",
    category: CATEGORIES[0] || "Other",
    subject: "",
    keywords: [],
    manuscriptUrl: "",
    manuscriptName: "",
    primaryAuthor: { name: "", email: "", affiliation: "", orcid: "" },
    coAuthors: [],
    declarations: {
      ethicsApproval: "",
      fundingStatement: "",
      dataAvailability: "",
      aiDisclosure: "",
      conflictOfInterest: "",
      coverLetter: "",
    },
    policyAgreed: false,
  });

  useEffect(() => {
    if (!open) return;
    setStage("upload");
    setFile(null);
    setError(null);
    setWarnings([]);
    setEvidence({});
    setConfidence({});
    setIntakeId(null);
    setKeywordInput("");
    setSourceOpen({});
    setAiEmpty({});
    setConfirmSubmit(false);
    formDirtyRef.current = false;
    setForm({
      title: "",
      abstract: "",
      articleType: "Original Research",
      category: CATEGORIES[0] || "Other",
      subject: "",
      keywords: [],
      manuscriptUrl: "",
      manuscriptName: "",
      primaryAuthor: { name: "", email: "", affiliation: "", orcid: "" },
      coAuthors: [],
      declarations: {
        ethicsApproval: "",
        fundingStatement: "",
        dataAvailability: "",
        aiDisclosure: "",
        conflictOfInterest: "",
        coverLetter: "",
      },
      policyAgreed: false,
    });
  }, [open]);

  useEffect(() => {
    if (stage !== "processing") return;
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 750);
    return () => clearInterval(interval);
  }, [stage]);

  const keywordChips = form.keywords;

  const keywordValid = keywordChips.length >= 3 && keywordChips.length <= 6;
  const keywordsMinOk = keywordChips.length >= 3;
  const titleValid = form.title.trim().length >= 10;
  const wc = wordCount(form.abstract);
  const abstractValid = wc >= 150 && wc <= 500;
  const abstractMinOk = wc >= 150;
  const fileValid = !!form.manuscriptUrl;
  const authorNameValid = form.primaryAuthor.name.trim().length > 0;
  const authorEmailValid = !!form.primaryAuthor.email?.trim() && EMAIL_RE.test(form.primaryAuthor.email.trim());
  const formValid = titleValid && abstractMinOk && keywordsMinOk && fileValid && authorNameValid && authorEmailValid && form.policyAgreed;

  const subjectOptions = useMemo(() => TAXONOMY[form.category] || [], [form.category]);

  const handleKeywordCommit = () => {
    const parsed = parseKeywords(keywordInput);
    if (parsed.length === 0) return;
    const merged = uniqueKeywords([...keywordChips, ...parsed]).slice(0, 6);
    setForm((prev) => ({ ...prev, keywords: merged }));
    setKeywordInput("");
    formDirtyRef.current = true;
  };

  const removeKeyword = (idx: number) => {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== idx) }));
    formDirtyRef.current = true;
  };

  const updateForm = (patch: Partial<FormState>) => {
    formDirtyRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const safeClose = () => {
    if (stage === "review" && formDirtyRef.current) {
      if (!window.confirm("You have unsaved changes. Close anyway?")) return;
    }
    onClose();
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setStage("processing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const adminId = typeof window !== "undefined" ? localStorage.getItem("air_admin_id") : null;
      if (adminId) fd.append("createdBy", adminId);

      const res = await fetch("/api/local-admin/ai-intake", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = d.error || "Failed to run AI intake";
        throw new Error(
          msg.includes("OPENAI_API_KEY") ? "AI service is not configured. Please contact the administrator." :
          msg.includes("parse") ? "AI could not parse this document. Try a different file or format." :
          msg
        );
      }
      const data = (await res.json()) as IntakeResponse;
      const extracted = data.extracted || {};
      const authors = Array.isArray(extracted.authors) ? extracted.authors : [];
      const primary = authors[0] || { name: "", email: "", affiliation: "", orcid: "" };
      const coAuthors = authors.slice(1);
      const keywords = uniqueKeywords(parseKeywords(extracted.keywords)).slice(0, 6);

      setWarnings(data.warnings || []);
      setEvidence(data.evidence || {});
      setConfidence(data.confidence || {});
      setIntakeId(data.intakeId);

      /* track what AI left empty */
      const empty: Record<string, boolean> = {};
      if (!extracted.title) empty.title = true;
      if (!extracted.abstract) empty.abstract = true;
      if (!keywords.length) empty.keywords = true;
      if (!primary.name) empty.authorName = true;
      if (!primary.email) empty.authorEmail = true;
      if (!primary.affiliation) empty.affiliation = true;
      if (!extracted.declarations?.ethicsApproval) empty.ethics = true;
      if (!extracted.declarations?.fundingStatement) empty.funding = true;
      if (!extracted.declarations?.dataAvailability) empty.data = true;
      if (!extracted.declarations?.aiDisclosure) empty.ai = true;
      if (!extracted.declarations?.conflictOfInterest) empty.conflict = true;
      setAiEmpty(empty);

      setForm({
        title: extracted.title || "",
        abstract: extracted.abstract || "",
        articleType: ARTICLE_TYPES.includes(extracted.articleType || "") ? (extracted.articleType as string) : "Original Research",
        category: CATEGORIES.includes(extracted.category || "") ? (extracted.category as string) : (CATEGORIES[0] || "Other"),
        subject: extracted.subject || "",
        keywords,
        manuscriptUrl: data.file.url,
        manuscriptName: data.file.name,
        primaryAuthor: {
          name: primary.name || "",
          email: primary.email || "",
          affiliation: primary.affiliation || "",
          orcid: primary.orcid || "",
        },
        coAuthors: coAuthors.map((a) => ({
          name: a.name || "",
          email: a.email || "",
          affiliation: a.affiliation || "",
          orcid: a.orcid || "",
        })),
        declarations: {
          ethicsApproval: extracted.declarations?.ethicsApproval || "",
          fundingStatement: extracted.declarations?.fundingStatement || "",
          dataAvailability: extracted.declarations?.dataAvailability || "",
          aiDisclosure: extracted.declarations?.aiDisclosure || "",
          conflictOfInterest: extracted.declarations?.conflictOfInterest || "",
          coverLetter: extracted.declarations?.coverLetter || "",
        },
        policyAgreed: false,
      });

      formDirtyRef.current = false;
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (targetStatus: "submitted" | "under_review") => {
    if (!formValid) {
      const missing: string[] = [];
      if (!titleValid) missing.push("title (min 10 chars)");
      if (!abstractMinOk) missing.push("abstract (min 150 words)");
      if (!keywordsMinOk) missing.push("keywords (min 3)");
      if (!authorNameValid) missing.push("author name");
      if (!authorEmailValid) missing.push("valid author email");
      if (!form.policyAgreed) missing.push("policy agreement checkbox");
      setError(`Missing: ${missing.join(", ")}`);
      return;
    }
    setLoadingCreate(true);
    setError(null);
    try {
      const res = await fetch("/api/local-admin/submissions/from-ai-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId,
          targetStatus,
          payload: {
            title: form.title,
            abstract: form.abstract,
            category: form.category,
            subject: form.subject,
            articleType: form.articleType,
            keywords: form.keywords,
            manuscriptUrl: form.manuscriptUrl,
            manuscriptName: form.manuscriptName,
            primaryAuthor: form.primaryAuthor,
            coAuthors: form.coAuthors,
            declarations: form.declarations,
            policyAgreed: form.policyAgreed,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create submission");
      }
      const data = await res.json();
      formDirtyRef.current = false;
      onCreated(data.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create submission");
    } finally {
      setLoadingCreate(false);
    }
  };

  if (!open) return null;

  const emptyBorder = "border-amber-300 bg-amber-50/30";

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
      onClick={safeClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── header ── */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Upload Article (AI Fill)
              {stage === "review" && form.manuscriptName && (
                <span className="text-xs font-normal text-gray-400 ml-3">{form.manuscriptName}</span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload a Word document (.docx). AI will pre-fill all fields for your review.
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1" onClick={safeClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* UPLOAD stage */}
          {stage === "upload" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>How it works:</strong> Upload a .docx manuscript. AI will extract title, abstract, authors, keywords, and declarations.
                Review and correct the extracted data, then create the submission.
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragging ? "border-blue-500 bg-blue-50" : file ? "border-green-400 bg-green-50/30" : "border-gray-300"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0] || null;
                  if (!f) return;
                  if (!f.name.toLowerCase().endsWith(".docx")) {
                    setError("Only .docx files are accepted. Please convert your document to Word format.");
                    return;
                  }
                  if (f.size > MAX_FILE_MB * 1024 * 1024) {
                    setError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum ${MAX_FILE_MB}MB.`);
                    return;
                  }
                  setError(null);
                  setFile(f);
                  // auto-start upload
                  setTimeout(() => {
                    const btn = document.getElementById("ai-intake-upload-btn") as HTMLButtonElement;
                    btn?.click();
                  }, 100);
                }}
                onClick={() => {
                  const input = document.getElementById("ai-intake-file-input") as HTMLInputElement;
                  input?.click();
                }}
              >
                <input
                  id="ai-intake-file-input"
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && !f.name.toLowerCase().endsWith(".docx")) {
                      setError("Only .docx files are accepted. Please convert your document to Word format.");
                      setFile(null);
                      e.target.value = "";
                      return;
                    }
                    if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
                      setError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum ${MAX_FILE_MB}MB.`);
                      setFile(null);
                      e.target.value = "";
                      return;
                    }
                    setError(null);
                    setFile(f);
                    // auto-start upload
                    if (f) {
                      setTimeout(() => {
                        const btn = document.getElementById("ai-intake-upload-btn") as HTMLButtonElement;
                        btn?.click();
                      }, 100);
                    }
                  }}
                />
                <div>
                  <div className="text-gray-400 mb-2">
                    <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {dragging ? "Drop file here" : "Drag & drop .docx file here"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">or click to browse (max {MAX_FILE_MB}MB)</p>
                </div>
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button
                id="ai-intake-upload-btn"
                className="hidden"
                onClick={handleUpload}
                disabled={!file || uploading}
              />
            </div>
          )}

          {/* PROCESSING stage */}
          {stage === "processing" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Processing manuscript. Please wait.</p>
              <div className="space-y-2">
                {STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${idx <= stepIndex ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className={idx <= stepIndex ? "text-gray-900" : "text-gray-400"}>{step}</span>
                  </div>
                ))}
              </div>
              {stepIndex >= STEPS.length - 1 && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  AI is still processing...
                </div>
              )}
            </div>
          )}

          {/* ERROR stage */}
          {stage === "error" && (
            <div className="space-y-4">
              <div className="text-sm text-red-600">{error || "Something went wrong."}</div>
              <button className="admin-btn admin-btn-outline" onClick={() => { setStage("upload"); setError(null); }}>
                Try again
              </button>
            </div>
          )}

          {/* REVIEW stage */}
          {stage === "review" && (
            <div className="space-y-6">
              {/* warnings */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-4">
                  <div className="font-semibold mb-2">AI Extraction Warnings</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* article type + category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">
                    Article Type *
                    <Tip text="Choose the type that best describes this manuscript: original research, review, case study, etc." />
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.articleType}
                    onChange={(e) => updateForm({ articleType: e.target.value })}
                  >
                    {ARTICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">
                    Category *
                    <Tip text="Select the academic discipline. Subject will update based on category." />
                    <ConfBadge value={confidence.category} />
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.category}
                    onChange={(e) => updateForm({ category: e.target.value, subject: "" })}
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* title */}
              <div>
                <label className="text-sm font-semibold">
                  Title *
                  <Tip text="Full manuscript title. Min 10 characters." />
                  <ConfBadge value={confidence.title} />
                  <NotFound show={!!aiEmpty.title} />
                </label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.title && !form.title ? emptyBorder : "border-gray-300"}`}
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                />
                {!titleValid && form.title.length > 0 && (
                  <div className="text-xs text-amber-600 mt-1">Title must be at least 10 characters.</div>
                )}
                <SourceHint
                  label="Title"
                  evidence={evidence.title}
                  open={!!sourceOpen.title}
                  onToggle={() => setSourceOpen((s) => ({ ...s, title: !s.title }))}
                />
              </div>

              {/* abstract */}
              <div>
                <label className="text-sm font-semibold">
                  Abstract *
                  <Tip text="Full abstract from the manuscript. Required: 150-500 words." />
                  <ConfBadge value={confidence.abstract} />
                  <NotFound show={!!aiEmpty.abstract} />
                </label>
                <textarea
                  rows={5}
                  className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.abstract && !form.abstract ? emptyBorder : "border-gray-300"}`}
                  value={form.abstract}
                  onChange={(e) => updateForm({ abstract: e.target.value })}
                />
                <div className={`text-xs mt-1 ${abstractValid ? "text-green-600" : wc > 500 ? "text-red-600" : "text-gray-400"}`}>
                  {wc} words {wc < 150 ? "(min 150)" : wc > 500 ? "(max 500)" : ""}
                </div>
                <SourceHint
                  label="Abstract"
                  evidence={evidence.abstract}
                  open={!!sourceOpen.abstract}
                  onToggle={() => setSourceOpen((s) => ({ ...s, abstract: !s.abstract }))}
                />
              </div>

              {/* subject + keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">
                    Subject
                    <Tip text="Narrow sub-discipline within the selected category. Optional." />
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.subject}
                    onChange={(e) => updateForm({ subject: e.target.value })}
                  >
                    <option value="">Select</option>
                    {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">
                    Keywords * (3-6)
                    <Tip text="3 to 6 short keyword phrases. Press Enter to add each one." />
                    <ConfBadge value={confidence.keywords} />
                    <NotFound show={!!aiEmpty.keywords} />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {keywordChips.map((kw, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {kw}
                        <button type="button" className="ml-2 text-gray-400" onClick={() => removeKeyword(idx)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  {keywordChips.length < 6 && (
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                      placeholder="Type keyword, press Enter"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleKeywordCommit();
                        }
                      }}
                      onBlur={handleKeywordCommit}
                    />
                  )}
                  <SourceHint
                    label="Keywords"
                    evidence={evidence.keywords}
                    open={!!sourceOpen.keywords}
                    onToggle={() => setSourceOpen((s) => ({ ...s, keywords: !s.keywords }))}
                  />
                  {keywordChips.length < 3 && (
                    <div className="text-xs text-amber-600 mt-1">Add at least 3 keywords.</div>
                  )}
                  {keywordChips.length >= 6 && (
                    <div className="text-xs text-gray-400 mt-1">Maximum 6 keywords reached.</div>
                  )}
                </div>
              </div>

              {/* ── AUTHORS ── */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Primary Author
                  <Tip text="Corresponding author. Name and email are required. Email is used for all editorial communications." />
                  <ConfBadge value={confidence.authors} />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      className={`border rounded-lg px-3 py-2 w-full ${!authorNameValid ? "border-red-300" : aiEmpty.authorName ? emptyBorder : "border-gray-300"}`}
                      placeholder="Full name *"
                      value={form.primaryAuthor.name}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, name: e.target.value } })); }}
                    />
                    {!authorNameValid && <div className="text-xs text-red-600 mt-1">Required: author name</div>}
                    <NotFound show={!!aiEmpty.authorName} />
                  </div>
                  <div>
                    <input
                      className={`border rounded-lg px-3 py-2 w-full ${!authorEmailValid && form.primaryAuthor.email ? "border-red-300" : aiEmpty.authorEmail ? emptyBorder : "border-gray-300"}`}
                      placeholder="Email * (used for all communications)"
                      value={form.primaryAuthor.email || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, email: e.target.value } })); }}
                    />
                    {!authorEmailValid && form.primaryAuthor.email && (
                      <div className="text-xs text-red-600 mt-1">Enter a valid email (e.g. author@university.edu)</div>
                    )}
                    {!form.primaryAuthor.email && <div className="text-xs text-red-600 mt-1">Required: author email</div>}
                    <NotFound show={!!aiEmpty.authorEmail} />
                  </div>
                  <div>
                    <input
                      className={`border rounded-lg px-3 py-2 w-full ${aiEmpty.affiliation && !form.primaryAuthor.affiliation ? emptyBorder : "border-gray-300"}`}
                      placeholder="Affiliation (university, institution)"
                      value={form.primaryAuthor.affiliation || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, affiliation: e.target.value } })); }}
                    />
                    <NotFound show={!!aiEmpty.affiliation} />
                  </div>
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ORCID (e.g. 0000-0002-1234-5678)"
                    value={form.primaryAuthor.orcid || ""}
                    onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, orcid: e.target.value } })); }}
                  />
                </div>
                <SourceHint
                  label="Authors"
                  evidence={evidence.authors}
                  open={!!sourceOpen.authors}
                  onToggle={() => setSourceOpen((s) => ({ ...s, authors: !s.authors }))}
                />

                {/* co-authors */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Co-authors
                      <Tip text="Additional authors. Name and email recommended for each." />
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600"
                      onClick={() => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, coAuthors: [...prev.coAuthors, { name: "", email: "", affiliation: "", orcid: "" }] })); }}
                    >
                      + Add
                    </button>
                  </div>
                  {form.coAuthors.map((ca, idx) => (
                    <div key={idx} className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Name"
                        value={ca.name}
                        onChange={(e) => {
                          formDirtyRef.current = true;
                          const next = [...form.coAuthors];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setForm((prev) => ({ ...prev, coAuthors: next }));
                        }}
                      />
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Email"
                        value={ca.email || ""}
                        onChange={(e) => {
                          formDirtyRef.current = true;
                          const next = [...form.coAuthors];
                          next[idx] = { ...next[idx], email: e.target.value };
                          setForm((prev) => ({ ...prev, coAuthors: next }));
                        }}
                      />
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Affiliation"
                        value={ca.affiliation || ""}
                        onChange={(e) => {
                          formDirtyRef.current = true;
                          const next = [...form.coAuthors];
                          next[idx] = { ...next[idx], affiliation: e.target.value };
                          setForm((prev) => ({ ...prev, coAuthors: next }));
                        }}
                      />
                      <div className="flex gap-2">
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                          placeholder="ORCID"
                          value={ca.orcid || ""}
                          onChange={(e) => {
                            formDirtyRef.current = true;
                            const next = [...form.coAuthors];
                            next[idx] = { ...next[idx], orcid: e.target.value };
                            setForm((prev) => ({ ...prev, coAuthors: next }));
                          }}
                        />
                        <button
                          type="button"
                          className="text-xs text-red-500"
                          onClick={() => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, coAuthors: prev.coAuthors.filter((_, i) => i !== idx) })); }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── MANUSCRIPT ── */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Manuscript</h3>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <div>
                    <div className="font-semibold">{form.manuscriptName || "File attached"}</div>
                    <div className="text-xs text-gray-500">{form.manuscriptUrl ? "Ready" : "Missing"}</div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-blue-600"
                    onClick={() => {
                      if (formDirtyRef.current) {
                        if (!window.confirm("Replacing the file will re-run AI extraction and overwrite your edits. Continue?")) return;
                      }
                      setStage("upload");
                    }}
                  >
                    Replace file
                  </button>
                </div>
              </div>

              {/* ── DECLARATIONS ── */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Declarations
                  <Tip text="Statements about ethics, funding, data sharing, AI use, and conflicts. If the manuscript doesn't mention these, fill in 'Not applicable' or 'None declared'." />
                </h3>
                <p className="text-xs text-gray-500 mb-3">Fields highlighted in amber were not found by AI. Please fill manually or write &quot;Not applicable&quot;.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Ethics / IRB Approval
                      <Tip text="IRB/Ethics committee approval number. If no human subjects: 'Not applicable'." />
                      <NotFound show={!!aiEmpty.ethics} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.ethics && !form.declarations.ethicsApproval ? emptyBorder : "border-gray-300"}`}
                      placeholder="e.g. IRB #2024-123 approved by University Ethics Board"
                      value={form.declarations.ethicsApproval || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, ethicsApproval: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Funding Statement
                      <Tip text="Grant numbers, sponsor names. If none: 'No external funding received'." />
                      <NotFound show={!!aiEmpty.funding} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.funding && !form.declarations.fundingStatement ? emptyBorder : "border-gray-300"}`}
                      placeholder="e.g. Funded by NSF Grant #1234567"
                      value={form.declarations.fundingStatement || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, fundingStatement: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Data Availability
                      <Tip text="Where can reviewers/readers access the underlying data? Or: 'Data available upon request'." />
                      <NotFound show={!!aiEmpty.data} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.data && !form.declarations.dataAvailability ? emptyBorder : "border-gray-300"}`}
                      placeholder="e.g. Data deposited at [repository URL]"
                      value={form.declarations.dataAvailability || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, dataAvailability: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      AI Tools Disclosure
                      <Tip text="Which AI tools were used (ChatGPT, Copilot, etc.) and for what purpose. If none: 'No AI tools used'." />
                      <NotFound show={!!aiEmpty.ai} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.ai && !form.declarations.aiDisclosure ? emptyBorder : "border-gray-300"}`}
                      placeholder="e.g. ChatGPT used for language editing"
                      value={form.declarations.aiDisclosure || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, aiDisclosure: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Conflict of Interest
                      <Tip text="Financial or personal relationships that could influence this work. If none: 'No competing interests declared'." />
                      <NotFound show={!!aiEmpty.conflict} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.conflict && !form.declarations.conflictOfInterest ? emptyBorder : "border-gray-300"}`}
                      placeholder="e.g. The authors declare no conflicts of interest"
                      value={form.declarations.conflictOfInterest || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, conflictOfInterest: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Cover Letter (optional)
                      <Tip text="Optional cover letter to the editor. Not required." />
                    </label>
                    <textarea
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                      placeholder="Optional"
                      value={form.declarations.coverLetter || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, coverLetter: e.target.value } })); }}
                    />
                  </div>
                </div>
                <SourceHint
                  label="Declarations"
                  evidence={evidence.declarations}
                  open={!!sourceOpen.declarations}
                  onToggle={() => setSourceOpen((s) => ({ ...s, declarations: !s.declarations }))}
                />
              </div>

              {/* ── policy ── */}
              <div className="flex items-start gap-2 mt-2">
                <input
                  id="policyAgreed"
                  type="checkbox"
                  checked={form.policyAgreed}
                  onChange={(e) => updateForm({ policyAgreed: e.target.checked })}
                  className="mt-0.5"
                />
                <label htmlFor="policyAgreed" className="text-xs text-gray-600">
                  I confirm the author has agreed to AIR&apos;s{" "}
                  <a href="/policies" target="_blank" className="text-blue-600 underline">publication policies</a>{" "}
                  and that this submission is original work.
                </label>
              </div>
              {!form.policyAgreed && (
                <div className="text-xs text-amber-600">You must check this box before creating the submission.</div>
              )}

              {error && (
                <div className="text-sm text-red-600 mt-2">{error}</div>
              )}
            </div>
          )}
        </div>

        {/* ── footer bar ── */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {stage === "review" && !formValid && (
              <span className="text-amber-600">Complete required fields to submit</span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="admin-btn admin-btn-outline" onClick={safeClose}>Cancel</button>
            {stage === "review" && !confirmSubmit && (
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                onClick={() => {
                  if (!formValid) {
                    const missing: string[] = [];
                    if (!titleValid) missing.push("title");
                    if (!abstractMinOk) missing.push("abstract (150+ words)");
                    if (!keywordsMinOk) missing.push("keywords (3+)");
                    if (!authorNameValid) missing.push("author name");
                    if (!authorEmailValid) missing.push("author email");
                    if (!form.policyAgreed) missing.push("policy checkbox");
                    setError(`Missing: ${missing.join(", ")}`);
                    return;
                  }
                  setConfirmSubmit(true);
                }}
                disabled={loadingCreate}
              >
                Create Submission
              </button>
            )}
            {stage === "review" && confirmSubmit && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Confirm?</span>
                <button
                  className="admin-btn admin-btn-outline text-xs"
                  onClick={() => setConfirmSubmit(false)}
                  disabled={loadingCreate}
                >
                  Back
                </button>
                <button
                  className="admin-btn admin-btn-primary text-xs"
                  onClick={() => handleCreate("submitted")}
                  disabled={loadingCreate}
                >
                  {loadingCreate ? "Creating..." : "Yes, Create (Submitted)"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
