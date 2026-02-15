import { useEffect, useMemo, useState } from "react";
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
          {label}: “{evidence}”
        </div>
      )}
    </div>
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
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [sourceOpen, setSourceOpen] = useState<Record<string, boolean>>({});
  const [loadingCreate, setLoadingCreate] = useState(false);
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
    policyAgreed: true,
  });

  useEffect(() => {
    if (!open) return;
    setStage("upload");
    setFile(null);
    setError(null);
    setWarnings([]);
    setEvidence({});
    setIntakeId(null);
    setKeywordInput("");
    setSourceOpen({});
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
      policyAgreed: true,
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

  const keywordValid = keywordChips.length >= 3;
  const titleValid = form.title.trim().length >= 10;
  const abstractValid = wordCount(form.abstract) >= 150;
  const fileValid = !!form.manuscriptUrl;
  const formValid = titleValid && abstractValid && keywordValid && fileValid && form.primaryAuthor.name.trim().length > 0;

  const subjectOptions = useMemo(() => TAXONOMY[form.category] || [], [form.category]);

  const handleKeywordCommit = () => {
    const parsed = parseKeywords(keywordInput);
    if (parsed.length === 0) return;
    const merged = uniqueKeywords([...keywordChips, ...parsed]);
    setForm((prev) => ({ ...prev, keywords: merged }));
    setKeywordInput("");
  };

  const removeKeyword = (idx: number) => {
    setForm((prev) => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== idx) }));
  };

  const handleUpload = async () => {
    if (!file) return;
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
        throw new Error(d.error || "Failed to run AI intake");
      }
      const data = (await res.json()) as IntakeResponse;
      const extracted = data.extracted || {};
      const authors = Array.isArray(extracted.authors) ? extracted.authors : [];
      const primary = authors[0] || { name: "", email: "", affiliation: "", orcid: "" };
      const coAuthors = authors.slice(1);
      const keywords = uniqueKeywords(parseKeywords(extracted.keywords));

      setWarnings(data.warnings || []);
      setEvidence(data.evidence || {});
      setIntakeId(data.intakeId);

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
        policyAgreed: true,
      });

      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("error");
    }
  };

  const handleCreate = async (targetStatus: "draft" | "submitted" | "under_review") => {
    if (!formValid) {
      setError("Please complete required fields (title, abstract, keywords, author, file). ");
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
      onCreated(data.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create submission");
    } finally {
      setLoadingCreate(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload Article (AI Fill)</h2>
            <p className="text-xs text-gray-500 mt-1">Upload Word or PDF — we’ll pre-fill the submission for review.</p>
          </div>
          <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {stage === "upload" && (
            <div className="space-y-4">
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-600">Upload .docx or .pdf (max 50MB)</p>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-3"
                />
                {file && (
                  <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={handleUpload}
                  disabled={!file}
                >
                  Upload & Extract
                </button>
              </div>
            </div>
          )}

          {stage === "processing" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Processing manuscript — please wait.</p>
              <div className="space-y-2">
                {STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${idx <= stepIndex ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className={idx <= stepIndex ? "text-gray-900" : "text-gray-400"}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="text-sm text-red-600">{error || "Something went wrong."}</div>
          )}

          {stage === "review" && (
            <div className="space-y-6">
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg p-4">
                  <div className="font-semibold mb-2">Warnings</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">Article Type *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.articleType}
                    onChange={(e) => setForm((prev) => ({ ...prev, articleType: e.target.value }))}
                  >
                    {ARTICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Category *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value, subject: "" }))}
                  >
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Title *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <SourceHint
                  label="Title"
                  evidence={evidence.title}
                  open={!!sourceOpen.title}
                  onToggle={() => setSourceOpen((s) => ({ ...s, title: !s.title }))}
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Abstract *</label>
                <textarea
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  value={form.abstract}
                  onChange={(e) => setForm((prev) => ({ ...prev, abstract: e.target.value }))}
                />
                <div className={`text-xs mt-1 ${abstractValid ? "text-green-600" : "text-gray-400"}`}>
                  {wordCount(form.abstract)} words (min 150)
                </div>
                <SourceHint
                  label="Abstract"
                  evidence={evidence.abstract}
                  open={!!sourceOpen.abstract}
                  onToggle={() => setSourceOpen((s) => ({ ...s, abstract: !s.abstract }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">Subject</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  >
                    <option value="">— Select —</option>
                    {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Keywords * (3-6)</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {keywordChips.map((kw, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {kw}
                        <button type="button" className="ml-2 text-gray-400" onClick={() => removeKeyword(idx)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                    placeholder="Press Enter to add"
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
                  <SourceHint
                    label="Keywords"
                    evidence={evidence.keywords}
                    open={!!sourceOpen.keywords}
                    onToggle={() => setSourceOpen((s) => ({ ...s, keywords: !s.keywords }))}
                  />
                  {!keywordValid && (
                    <div className="text-xs text-amber-600 mt-1">Add at least 3 keywords.</div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Authors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Primary author name *"
                    value={form.primaryAuthor.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, name: e.target.value } }))}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Primary author email"
                    value={form.primaryAuthor.email || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, email: e.target.value } }))}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Affiliation"
                    value={form.primaryAuthor.affiliation || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, affiliation: e.target.value } }))}
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="ORCID"
                    value={form.primaryAuthor.orcid || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, primaryAuthor: { ...prev.primaryAuthor, orcid: e.target.value } }))}
                  />
                </div>
                <SourceHint
                  label="Authors"
                  evidence={evidence.authors}
                  open={!!sourceOpen.authors}
                  onToggle={() => setSourceOpen((s) => ({ ...s, authors: !s.authors }))}
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Co-authors</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600"
                      onClick={() => setForm((prev) => ({ ...prev, coAuthors: [...prev.coAuthors, { name: "", email: "", affiliation: "", orcid: "" }] }))}
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
                            const next = [...form.coAuthors];
                            next[idx] = { ...next[idx], orcid: e.target.value };
                            setForm((prev) => ({ ...prev, coAuthors: next }));
                          }}
                        />
                        <button
                          type="button"
                          className="text-xs text-red-500"
                          onClick={() => setForm((prev) => ({ ...prev, coAuthors: prev.coAuthors.filter((_, i) => i !== idx) }))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                    onClick={() => setStage("upload")}
                  >
                    Replace file
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Declarations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ethics / IRB approval"
                    value={form.declarations.ethicsApproval || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, ethicsApproval: e.target.value } }))}
                  />
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Funding statement"
                    value={form.declarations.fundingStatement || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, fundingStatement: e.target.value } }))}
                  />
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Data availability"
                    value={form.declarations.dataAvailability || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, dataAvailability: e.target.value } }))}
                  />
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="AI tools disclosure"
                    value={form.declarations.aiDisclosure || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, aiDisclosure: e.target.value } }))}
                  />
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Conflict of interest"
                    value={form.declarations.conflictOfInterest || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, conflictOfInterest: e.target.value } }))}
                  />
                  <textarea
                    rows={2}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Cover letter (optional)"
                    value={form.declarations.coverLetter || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, declarations: { ...prev.declarations, coverLetter: e.target.value } }))}
                  />
                </div>
                <SourceHint
                  label="Declarations"
                  evidence={evidence.declarations}
                  open={!!sourceOpen.declarations}
                  onToggle={() => setSourceOpen((s) => ({ ...s, declarations: !s.declarations }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="policyAgreed"
                  type="checkbox"
                  checked={form.policyAgreed}
                  onChange={(e) => setForm((prev) => ({ ...prev, policyAgreed: e.target.checked }))}
                />
                <label htmlFor="policyAgreed" className="text-xs text-gray-600">
                  Confirm originality & policy agreement
                </label>
              </div>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {stage === "review" && !formValid && "Required fields missing"}
          </div>
          <div className="flex gap-2">
            <button className="admin-btn admin-btn-outline" onClick={onClose}>Cancel</button>
            {stage === "review" && (
              <>
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => handleCreate("draft")}
                  disabled={loadingCreate}
                >
                  {loadingCreate ? "Saving…" : "Save Draft"}
                </button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleCreate("submitted")}
                  disabled={loadingCreate}
                >
                  {loadingCreate ? "Creating…" : "Ready → Add to Pending"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
