import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
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
    <span className="relative inline-block ml-0.5 align-middle">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] text-gray-400 cursor-help hover:text-gray-600"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </span>
      {show && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-2.5 py-2 shadow-lg z-50 pointer-events-none">
          {text}
          <div className="absolute bottom-full left-3 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-900" />
        </div>
      )}
    </span>
  );
}

/* ── field status badge ── */
function FieldStatus({ aiFound, filled }: { aiFound: boolean; filled: boolean }) {
  if (aiFound && filled) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        OK
      </span>
    );
  }
  if (!aiFound && filled) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Filled
      </span>
    );
  }
  if (!aiFound && !filled) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Fill manually
      </span>
    );
  }
  return null;
}

/* ── "not found" badge (for required fields) ── */
function NotFound({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {label || "Fill manually"}
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
  const [stage, setStage] = useState<"upload" | "processing" | "manual" | "review" | "error">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [manualFileInfo, setManualFileInfo] = useState<{ name: string; url: string } | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [submissionCreated, setSubmissionCreated] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
    setAiEmpty({});
    setManualFileInfo(null);
    setPromptCopied(false);
    setPollingActive(false);
    setSubmissionCreated(false);
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
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

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (stage !== "processing") return;
    setStepIndex(0);
    setElapsed(0);
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 750);
    const timerInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => { clearInterval(stepInterval); clearInterval(timerInterval); };
  }, [stage]);

  // Polling for submission created via Claude Code
  const startPolling = () => {
    if (!intakeId || pollingRef.current) return;
    setPollingActive(true);
    setSubmissionCreated(false);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/local-admin/ai-intake/${intakeId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed") {
          setSubmissionCreated(true);
          setPollingActive(false);
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        }
      } catch { /* ignore polling errors */ }
    }, 5000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, []);

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
  const formValid = titleValid && abstractMinOk && keywordsMinOk && fileValid && authorNameValid && authorEmailValid;

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
      // Step 1: Upload file directly to Vercel Blob (bypasses 4.5MB serverless limit)
      const blob = await upload(`ai-intake/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/local-admin/ai-intake/upload",
      });

      // Step 2: Send blob URL to API for AI processing
      const adminId = typeof window !== "undefined" ? localStorage.getItem("air_admin_id") : null;
      const res = await fetch("/api/local-admin/ai-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          createdBy: adminId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msg = d.error || "Failed to run AI intake";
        throw new Error(
          msg.includes("Claude CLI") ? "Claude CLI is not available. Make sure it is installed and you are running locally." :
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
      if (!extracted.articleType || !ARTICLE_TYPES.includes(extracted.articleType)) empty.articleType = true;
      if (!extracted.category || !CATEGORIES.includes(extracted.category)) empty.category = true;
      if (!extracted.subject) empty.subject = true;
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

  const handleManualUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      // Step 1: Upload file directly to Vercel Blob (bypasses 4.5MB serverless limit)
      const blob = await upload(`ai-intake/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/local-admin/ai-intake/upload",
      });

      // Step 2: Send blob URL to API for record creation
      const adminId = typeof window !== "undefined" ? localStorage.getItem("air_admin_id") : null;
      const res = await fetch("/api/local-admin/ai-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          skipAi: true,
          createdBy: adminId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to upload file");
      }
      const data = await res.json();
      setIntakeId(data.intakeId);
      setManualFileInfo(data.file);
      setForm((prev) => ({
        ...prev,
        manuscriptUrl: data.file.url,
        manuscriptName: data.file.name,
      }));
      setStage("manual");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    } finally {
      setUploading(false);
    }
  };

  const buildPromptText = () => {
    if (!manualFileInfo) return "";
    const subjectLines = Object.entries(TAXONOMY)
      .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
      .join("\n");
    const taxonomyBlock = `Categories: ${CATEGORIES.join(", ")}.\nSubjects by category:\n${subjectLines}`;
    const apiBase = typeof window !== "undefined" ? window.location.origin : "https://americanimpactreview.com";
    return [
      `TASK: Create a journal submission on American Impact Review from a manuscript file.`,
      `IMPORTANT: Do everything automatically. Do NOT ask the user any questions. If any data is missing from the manuscript, use sensible defaults. For missing author email use "pending@americanimpactreview.com".`,
      ``,
      `STEP 1 — Download the manuscript:`,
      `curl -sL -o /tmp/air-manuscript.docx "${manualFileInfo.url}"`,
      ``,
      `STEP 2 — Extract text from the .docx file:`,
      `Run: python3 -c "import zipfile, xml.etree.ElementTree as ET; z=zipfile.ZipFile('/tmp/air-manuscript.docx'); doc=ET.parse(z.open('word/document.xml')); print('\\n'.join(t.text for t in doc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text))"`,
      `This outputs the full text of the manuscript.`,
      ``,
      `STEP 3 — Extract metadata from the manuscript text.`,
      `Build a JSON payload with this structure:`,
      `{`,
      `  "intakeId": "${intakeId || ""}",`,
      `  "targetStatus": "submitted",`,
      `  "payload": {`,
      `    "title": "full manuscript title",`,
      `    "abstract": "full abstract copied verbatim (150-500 words)",`,
      `    "category": "one of the categories below",`,
      `    "subject": "one of the subjects below or empty",`,
      `    "articleType": "Original Research | Review Article | Theoretical Article | Policy Analysis | Case Study | Short Communication | Commentary / Opinion | Meta-Analysis",`,
      `    "keywords": ["3 to 6 keyword phrases"],`,
      `    "manuscriptUrl": "${manualFileInfo.url}",`,
      `    "manuscriptName": "${manualFileInfo.name}",`,
      `    "primaryAuthor": { "name": "", "email": "", "affiliation": "", "orcid": "" },`,
      `    "coAuthors": [{ "name": "", "email": "", "affiliation": "", "orcid": "" }],`,
      `    "declarations": {`,
      `      "ethicsApproval": "",`,
      `      "fundingStatement": "",`,
      `      "dataAvailability": "",`,
      `      "aiDisclosure": "",`,
      `      "conflictOfInterest": "",`,
      `      "coverLetter": ""`,
      `    },`,
      `    "policyAgreed": true`,
      `  }`,
      `}`,
      ``,
      `Extraction rules:`,
      `- Extract the FULL abstract verbatim, not a summary.`,
      `- For authors: check first page, footnotes, corresponding author section for names, emails, affiliations, ORCID.`,
      `- For declarations: look for Ethics/IRB, Funding/Acknowledgments, Data Availability, AI Disclosure, Conflict of Interest sections.`,
      `- If a field is not found, use empty string. For missing declarations use "Not stated in manuscript".`,
      `- If author email is not found in the manuscript, use "pending@americanimpactreview.com". NEVER ask the user for email — always use this default.`,
      `- Keywords: 3-6 short phrases.`,
      `- Choose category and subject ONLY from this list:`,
      `${taxonomyBlock}`,
      ``,
      `STEP 4 — Submit via API:`,
      `Run this curl command with the JSON you built (replace the JSON placeholder):`,
      `curl -X POST "${apiBase}/api/local-admin/submissions/from-ai-intake" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -H "Cookie: air_admin=1" \\`,
      `  -d '<YOUR_JSON_HERE>'`,
      ``,
      `If the API returns {"id":"..."} — success! Tell the user the submission was created.`,
      `If it returns an error, fix the issue and retry.`,
    ].join("\n");
  };

  const handleCreate = async (targetStatus: "submitted" | "under_review") => {
    if (!formValid) {
      const missing: string[] = [];
      if (!titleValid) missing.push("title (min 10 chars)");
      if (!abstractMinOk) missing.push("abstract (min 150 words)");
      if (!keywordsMinOk) missing.push("keywords (min 3)");
      if (!authorNameValid) missing.push("author name");
      if (!authorEmailValid) missing.push("valid author email");
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
            policyAgreed: true,
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
  const filledBorder = "border-green-400 bg-green-50/20";

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
                <strong>How it works:</strong> Upload a .docx manuscript. Use <strong>AI Fill</strong> to auto-extract with Claude CLI (local only),
                or <strong>Manual</strong> to upload the file and fill fields via copy-paste prompt.
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
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="font-medium">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
              {file && (
                <div className="flex gap-3 justify-end">
                  <button
                    className="modal-action-btn"
                    style={{ opacity: uploading ? 0.4 : 1, "--mab-bg": "#3b82f6", "--mab-color": "#fff" } as React.CSSProperties}
                    onClick={handleManualUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload & Copy Prompt"}
                  </button>
                  <button className="modal-action-btn" onClick={safeClose}>Cancel</button>
                </div>
              )}
            </div>
          )}

          {/* PROCESSING stage */}
          {stage === "processing" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Processing manuscript. Please wait.</p>
              <div className="space-y-2">
                {STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    {idx <= stepIndex ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    ) : idx === stepIndex + 1 ? (
                      <span className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    )}
                    <span className={idx <= stepIndex ? "text-gray-900" : "text-gray-400"}>{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                {elapsed < 60 ? `${elapsed}s elapsed` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed`}
                {elapsed > 15 && <span className="text-gray-400 ml-1">— typically takes 10-30s</span>}
              </div>
            </div>
          )}

          {/* MANUAL stage */}
          {stage === "manual" && manualFileInfo && (
            <div className="space-y-4">
              {submissionCreated ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="text-lg font-semibold text-green-800">Submission Created</div>
                    <div className="text-sm text-green-600 mt-1">Claude Code has successfully created the submission.</div>
                  </div>
                  <button
                    className="modal-action-btn"
                    style={{ width: "100%", "--mab-bg": "#16a34a", "--mab-color": "#fff" } as React.CSSProperties}
                    onClick={() => { formDirtyRef.current = false; onClose(); window.location.reload(); }}
                  >
                    Close & Refresh List
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                    <strong>File uploaded.</strong> Copy the prompt below and paste it into any Claude Code terminal. Claude will read the manuscript and create the submission automatically.
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-700">Prompt for Claude Code</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          File: <a href={manualFileInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{manualFileInfo.name}</a>
                        </div>
                      </div>
                      <button
                        className="modal-action-btn"
                        style={{
                          "--mab-bg": promptCopied ? "#dcfce7" : "#3b82f6",
                          "--mab-color": promptCopied ? "#15803d" : "#fff",
                        } as React.CSSProperties}
                        onClick={() => {
                          navigator.clipboard.writeText(buildPromptText());
                          setPromptCopied(true);
                          startPolling();
                          setTimeout(() => setPromptCopied(false), 3000);
                        }}
                      >
                        {promptCopied ? "Copied!" : "Copy Prompt"}
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                        <span>Copy prompt (button above)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                        <span>Paste into Claude Code terminal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                        <span>Claude reads the file and creates the submission automatically</span>
                      </div>
                    </div>
                  </div>

                  {pollingActive && (
                    <div className="flex items-center justify-center gap-3 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-blue-700">Waiting for Claude Code to create submission...</span>
                    </div>
                  )}

                  {!pollingActive && (
                    <button
                      className="modal-action-btn"
                      style={{ width: "100%" } as React.CSSProperties}
                      onClick={() => { setStage("upload"); setManualFileInfo(null); }}
                    >
                      Upload a different file
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ERROR stage */}
          {stage === "error" && (
            <div className="space-y-4">
              <div className="text-sm text-red-600">{error || "Something went wrong."}</div>
              <button
                className="modal-action-btn"
                style={{ "--mab-bg": "#3b82f6", "--mab-color": "#fff" } as React.CSSProperties}
                onClick={() => { setStage("upload"); setError(null); }}
              >
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
                    className={`w-full border rounded-lg px-3 py-2 mt-1 ${!aiEmpty.articleType ? filledBorder : emptyBorder}`}
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
                  </label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 mt-1 ${!aiEmpty.category ? filledBorder : emptyBorder}`}
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
                  <NotFound show={!!aiEmpty.title} />
                </label>
                <input
                  className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.title && !form.title ? emptyBorder : !aiEmpty.title ? filledBorder : "border-gray-300"}`}
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                />
                {!titleValid && form.title.length > 0 && (
                  <div className="text-xs text-amber-600 mt-1">Title must be at least 10 characters.</div>
                )}
              </div>

              {/* abstract */}
              <div>
                <label className="text-sm font-semibold">
                  Abstract *
                  <Tip text="Full abstract from the manuscript. Required: 150-500 words." />
                  <NotFound show={!!aiEmpty.abstract} />
                </label>
                <textarea
                  rows={5}
                  className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.abstract && !form.abstract ? emptyBorder : !aiEmpty.abstract ? filledBorder : "border-gray-300"}`}
                  value={form.abstract}
                  onChange={(e) => updateForm({ abstract: e.target.value })}
                />
                <div className={`text-xs mt-1 ${abstractValid ? "text-green-600" : wc > 500 ? "text-red-600" : "text-gray-400"}`}>
                  {wc} words {wc < 150 ? "(min 150)" : wc > 500 ? "(max 500)" : ""}
                </div>
              </div>

              {/* subject + keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">
                    Subject
                    <Tip text="Narrow sub-discipline within the selected category. Optional." />
                  </label>
                  <select
                    className={`w-full border rounded-lg px-3 py-2 mt-1 ${!aiEmpty.subject && form.subject ? filledBorder : aiEmpty.subject && !form.subject ? emptyBorder : "border-gray-300"}`}
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
                    <NotFound show={!!aiEmpty.keywords} />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {keywordChips.map((kw, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg">
                        {kw}
                        <button type="button" className="text-blue-400 hover:text-blue-600 transition-colors" onClick={() => removeKeyword(idx)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
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
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        className={`border rounded-lg px-3 py-2 w-full ${!authorNameValid ? "border-red-300" : aiEmpty.authorName && !form.primaryAuthor.name ? emptyBorder : !aiEmpty.authorName ? filledBorder : "border-gray-300"}`}
                        placeholder="Full name *"
                        value={form.primaryAuthor.name}
                        onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, name: e.target.value } })); }}
                      />
                      {!authorNameValid && <div className="text-xs text-red-600 mt-1">Required: author name</div>}
                      <NotFound show={!!aiEmpty.authorName} />
                    </div>
                    <div>
                      <input
                        className={`border rounded-lg px-3 py-2 w-full ${!authorEmailValid && form.primaryAuthor.email ? "border-red-300" : aiEmpty.authorEmail && !form.primaryAuthor.email ? emptyBorder : !aiEmpty.authorEmail ? filledBorder : "border-gray-300"}`}
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
                  </div>
                  <div>
                    <input
                      className={`border rounded-lg px-3 py-2 w-full ${aiEmpty.affiliation && !form.primaryAuthor.affiliation ? emptyBorder : !aiEmpty.affiliation ? filledBorder : "border-gray-300"}`}
                      placeholder="Affiliation (university, institution)"
                      value={form.primaryAuthor.affiliation || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, affiliation: e.target.value } })); }}
                    />
                    <NotFound show={!!aiEmpty.affiliation} />
                  </div>
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    placeholder="ORCID (e.g. 0000-0002-1234-5678)"
                    value={form.primaryAuthor.orcid || ""}
                    onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, orcid: e.target.value } })); }}
                  />
                </div>

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
                    <div key={idx} className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Co-author {idx + 1}</span>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={() => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, coAuthors: prev.coAuthors.filter((_, i) => i !== idx) })); }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
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
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          placeholder="Email"
                          value={ca.email || ""}
                          onChange={(e) => {
                            formDirtyRef.current = true;
                            const next = [...form.coAuthors];
                            next[idx] = { ...next[idx], email: e.target.value };
                            setForm((prev) => ({ ...prev, coAuthors: next }));
                          }}
                        />
                      </div>
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        placeholder="Affiliation"
                        value={ca.affiliation || ""}
                        onChange={(e) => {
                          formDirtyRef.current = true;
                          const next = [...form.coAuthors];
                          next[idx] = { ...next[idx], affiliation: e.target.value };
                          setForm((prev) => ({ ...prev, coAuthors: next }));
                        }}
                      />
                      <input
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                        placeholder="ORCID"
                        value={ca.orcid || ""}
                        onChange={(e) => {
                          formDirtyRef.current = true;
                          const next = [...form.coAuthors];
                          next[idx] = { ...next[idx], orcid: e.target.value };
                          setForm((prev) => ({ ...prev, coAuthors: next }));
                        }}
                      />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Ethics / IRB Approval
                      <Tip text="IRB/Ethics committee approval number. If no human subjects: 'Not applicable'." />
                      <FieldStatus aiFound={!aiEmpty.ethics} filled={!!form.declarations.ethicsApproval?.trim()} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.ethics && !form.declarations.ethicsApproval ? emptyBorder : !aiEmpty.ethics ? filledBorder : "border-gray-300"}`}
                      placeholder="e.g. IRB #2024-123 approved by University Ethics Board"
                      value={form.declarations.ethicsApproval || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, ethicsApproval: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Funding Statement
                      <Tip text="Grant numbers, sponsor names. If none: 'No external funding received'." />
                      <FieldStatus aiFound={!aiEmpty.funding} filled={!!form.declarations.fundingStatement?.trim()} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.funding && !form.declarations.fundingStatement ? emptyBorder : !aiEmpty.funding ? filledBorder : "border-gray-300"}`}
                      placeholder="e.g. Funded by NSF Grant #1234567"
                      value={form.declarations.fundingStatement || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, fundingStatement: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Data Availability
                      <Tip text="Where can reviewers/readers access the underlying data? Or: 'Data available upon request'." />
                      <FieldStatus aiFound={!aiEmpty.data} filled={!!form.declarations.dataAvailability?.trim()} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.data && !form.declarations.dataAvailability ? emptyBorder : !aiEmpty.data ? filledBorder : "border-gray-300"}`}
                      placeholder="e.g. Data deposited at [repository URL]"
                      value={form.declarations.dataAvailability || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, dataAvailability: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      AI Tools Disclosure
                      <Tip text="Which AI tools were used (ChatGPT, Copilot, etc.) and for what purpose. If none: 'No AI tools used'." />
                      <FieldStatus aiFound={!aiEmpty.ai} filled={!!form.declarations.aiDisclosure?.trim()} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.ai && !form.declarations.aiDisclosure ? emptyBorder : !aiEmpty.ai ? filledBorder : "border-gray-300"}`}
                      placeholder="e.g. ChatGPT used for language editing"
                      value={form.declarations.aiDisclosure || ""}
                      onChange={(e) => { formDirtyRef.current = true; setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, aiDisclosure: e.target.value } })); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Conflict of Interest
                      <Tip text="Financial or personal relationships that could influence this work. If none: 'No competing interests declared'." />
                      <FieldStatus aiFound={!aiEmpty.conflict} filled={!!form.declarations.conflictOfInterest?.trim()} />
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full border rounded-lg px-3 py-2 mt-1 ${aiEmpty.conflict && !form.declarations.conflictOfInterest ? emptyBorder : !aiEmpty.conflict ? filledBorder : "border-gray-300"}`}
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
              </div>

              {/* ── admin note ── */}
              <div className="text-xs text-gray-400 mt-2">
                Submitted via Admin AI Intake. <a href="/policies" target="_blank" className="text-blue-600 underline">Publication policies</a> apply.
              </div>

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
          <div className="flex gap-3">
            {!(stage === "upload" && file) && (
              <button className="modal-action-btn" onClick={safeClose}>Cancel</button>
            )}
            {stage === "review" && !confirmSubmit && (
              <button
                className="modal-action-btn"
                style={{ opacity: loadingCreate ? 0.4 : 1, "--mab-bg": "#3b82f6", "--mab-color": "#fff" } as React.CSSProperties}
                onClick={() => {
                  if (!formValid) {
                    const missing: string[] = [];
                    if (!titleValid) missing.push("title");
                    if (!abstractMinOk) missing.push("abstract (150+ words)");
                    if (!keywordsMinOk) missing.push("keywords (3+)");
                    if (!authorNameValid) missing.push("author name");
                    if (!authorEmailValid) missing.push("author email");
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
                <span className="text-xs text-gray-500">Confirm?</span>
                <button
                  className="modal-action-btn"
                  onClick={() => setConfirmSubmit(false)}
                  disabled={loadingCreate}
                >
                  Back
                </button>
                <button
                  className="modal-action-btn"
                  style={{ opacity: loadingCreate ? 0.4 : 1, "--mab-bg": "#3b82f6", "--mab-color": "#fff" } as React.CSSProperties}
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
