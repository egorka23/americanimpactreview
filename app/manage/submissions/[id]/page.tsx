"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import StatusBadge from "../../components/StatusBadge";
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

type SubmissionData = {
  id: string;
  title: string;
  abstract: string;
  category: string;
  subject: string | null;
  articleType: string | null;
  keywords: string | null;
  manuscriptUrl: string | null;
  manuscriptName: string | null;
  coAuthors: string | null;
  authorAffiliation: string | null;
  authorOrcid: string | null;
  coverLetter: string | null;
  conflictOfInterest: string | null;
  fundingStatement: string | null;
  ethicsApproval: string | null;
  dataAvailability: string | null;
  aiDisclosure: string | null;
  status: string;
  pipelineStatus: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string | null;
};

export default function SubmissionEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [original, setOriginal] = useState<SubmissionData | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [articleType, setArticleType] = useState("");
  const [keywords, setKeywords] = useState("");
  const [manuscriptUrl, setManuscriptUrl] = useState("");
  const [manuscriptName, setManuscriptName] = useState("");
  const [coAuthors, setCoAuthors] = useState("");
  const [authorAffiliation, setAuthorAffiliation] = useState("");
  const [authorOrcid, setAuthorOrcid] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [conflictOfInterest, setConflictOfInterest] = useState("");
  const [fundingStatement, setFundingStatement] = useState("");
  const [ethicsApproval, setEthicsApproval] = useState("");
  const [dataAvailability, setDataAvailability] = useState("");
  const [aiDisclosure, setAiDisclosure] = useState("");

  // Auth check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = localStorage.getItem("air_admin_authed");
      if (!authed) {
        router.replace("/manage");
      }
    }
  }, [router]);

  // Load submission
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/local-admin/submissions/${id}`);
        if (!res.ok) throw new Error("Failed to load submission");
        const data: SubmissionData = await res.json();
        setOriginal(data);
        setTitle(data.title || "");
        setAbstract(data.abstract || "");
        setCategory(data.category || "");
        setSubject(data.subject || "");
        setArticleType(data.articleType || "");
        setKeywords(data.keywords || "");
        setManuscriptUrl(data.manuscriptUrl || "");
        setManuscriptName(data.manuscriptName || "");
        setCoAuthors(data.coAuthors || "");
        setAuthorAffiliation(data.authorAffiliation || "");
        setAuthorOrcid(data.authorOrcid || "");
        setCoverLetter(data.coverLetter || "");
        setConflictOfInterest(data.conflictOfInterest || "");
        setFundingStatement(data.fundingStatement || "");
        setEthicsApproval(data.ethicsApproval || "");
        setDataAvailability(data.dataAvailability || "");
        setAiDisclosure(data.aiDisclosure || "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const subjects = TAXONOMY[category] || [];

  const handleSave = async () => {
    if (!title.trim()) return setError("Title is required");
    if (!abstract.trim()) return setError("Abstract is required");
    if (!category.trim()) return setError("Category is required");
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/local-admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editFields: {
            title: title.trim(),
            abstract: abstract.trim(),
            category: category.trim(),
            subject: subject.trim() || null,
            articleType: articleType.trim() || null,
            keywords: keywords.trim() || null,
            manuscriptUrl: manuscriptUrl.trim() || null,
            manuscriptName: manuscriptName.trim() || null,
            coAuthors: coAuthors.trim() || null,
            authorAffiliation: authorAffiliation.trim() || null,
            authorOrcid: authorOrcid.trim() || null,
            coverLetter: coverLetter.trim() || null,
            conflictOfInterest: conflictOfInterest.trim() || null,
            fundingStatement: fundingStatement.trim() || null,
            ethicsApproval: ethicsApproval.trim() || null,
            dataAvailability: dataAvailability.trim() || null,
            aiDisclosure: aiDisclosure.trim() || null,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      router.push("/manage");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading submission...</p>
      </div>
    );
  }

  if (!original) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-sm">{error || "Submission not found"}</p>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const sectionCls = "pb-6 mb-6 border-b border-gray-200";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/manage")}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header info */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={original.pipelineStatus || original.status} />
            <span className="text-xs text-gray-400">
              {original.createdAt
                ? new Date(original.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : ""}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Editing: {original.title}</h1>
          {original.userName && (
            <p className="text-sm text-gray-500">
              by {original.userName} {original.userEmail ? `(${original.userEmail})` : ""}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Section 1: Manuscript Details */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Manuscript Details</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Abstract *</label>
              <textarea className={inputCls} rows={6} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Article Type</label>
                <select className={inputCls} value={articleType} onChange={(e) => setArticleType(e.target.value)}>
                  <option value="">— Select —</option>
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Keywords</label>
                <input className={inputCls} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="comma-separated" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category *</label>
              <select
                className={inputCls}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubject("");
                }}
              >
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!subjects.length}>
                <option value="">— Select —</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Authors */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Authors</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Author Affiliation</label>
              <input className={inputCls} value={authorAffiliation} onChange={(e) => setAuthorAffiliation(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Author ORCID</label>
              <input className={inputCls} value={authorOrcid} onChange={(e) => setAuthorOrcid(e.target.value)} placeholder="0000-0000-0000-0000" />
            </div>
            <div>
              <label className={labelCls}>Co-Authors (JSON)</label>
              <textarea className={inputCls} rows={4} value={coAuthors} onChange={(e) => setCoAuthors(e.target.value)} placeholder='[{"name":"...","email":"...","affiliation":"..."}]' />
            </div>
          </div>
        </div>

        {/* Section 4: Documents */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Documents</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Manuscript URL</label>
              <div className="flex items-center gap-2">
                <input className={`${inputCls} flex-1`} value={manuscriptUrl} onChange={(e) => setManuscriptUrl(e.target.value)} />
                {manuscriptUrl && (
                  <a
                    href={manuscriptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm shrink-0"
                  >
                    Open
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Manuscript File Name</label>
              <input className={inputCls} value={manuscriptName} onChange={(e) => setManuscriptName(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 5: Declarations */}
        <div className="pb-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Declarations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cover Letter</label>
              <textarea className={inputCls} rows={3} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Conflict of Interest</label>
              <textarea className={inputCls} rows={3} value={conflictOfInterest} onChange={(e) => setConflictOfInterest(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Funding Statement</label>
              <textarea className={inputCls} rows={3} value={fundingStatement} onChange={(e) => setFundingStatement(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Ethics Approval</label>
              <textarea className={inputCls} rows={3} value={ethicsApproval} onChange={(e) => setEthicsApproval(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Data Availability</label>
              <textarea className={inputCls} rows={3} value={dataAvailability} onChange={(e) => setDataAvailability(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>AI Disclosure</label>
              <textarea className={inputCls} rows={3} value={aiDisclosure} onChange={(e) => setAiDisclosure(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push("/manage")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
