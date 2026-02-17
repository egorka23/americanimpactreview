import { useEffect, useMemo, useState } from "react";
import { generateReviewerCertificate } from "@/lib/generate-reviewer-certificate";
import { CATEGORIES } from "@/lib/taxonomy";

type Reviewer = {
  id: string;
  name: string;
  email: string;
  affiliation?: string | null;
  expertise?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type Assignment = {
  id: string;
  reviewerId: string;
  invitedAt: string | null;
  completedAt: string | null;
};

type Review = {
  id: string;
  assignmentId: string;
  submittedAt: string | null;
};

function toDateLabel(input?: string) {
  if (!input) return "—";
  try {
    return new Date(input).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return input;
  }
}

function toDateInput(input?: string | null) {
  if (!input) return "";
  try {
    const d = new Date(input);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

export default function ReviewersView({
  reviewers,
  assignments,
  reviews,
}: {
  reviewers: Reviewer[];
  assignments: Assignment[];
  reviews: Review[];
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [showSurvey, setShowSurvey] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [expertise, setExpertise] = useState("");
  const [customExpertise, setCustomExpertise] = useState("");
  const [generating, setGenerating] = useState(false);

  const reviewerMap = useMemo(() => {
    const map = new Map<string, Reviewer>();
    reviewers.forEach((r) => map.set(r.id, r));
    return map;
  }, [reviewers]);

  const assignmentsByReviewer = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      if (!map.has(a.reviewerId)) map.set(a.reviewerId, []);
      map.get(a.reviewerId)!.push(a);
    });
    return map;
  }, [assignments]);

  const reviewCountByReviewer = useMemo(() => {
    const assignmentToReviewer = new Map<string, string>();
    assignments.forEach((a) => assignmentToReviewer.set(a.id, a.reviewerId));
    const counts = new Map<string, number>();
    reviews.forEach((r) => {
      const reviewerId = assignmentToReviewer.get(r.assignmentId);
      if (!reviewerId) return;
      counts.set(reviewerId, (counts.get(reviewerId) || 0) + 1);
    });
    return counts;
  }, [assignments, reviews]);

  const dateRangeByReviewer = useMemo(() => {
    const assignmentToReviewer = new Map<string, string>();
    assignments.forEach((a) => assignmentToReviewer.set(a.id, a.reviewerId));

    const ranges = new Map<string, { from?: string; to?: string }>();
    reviews.forEach((r) => {
      const reviewerId = assignmentToReviewer.get(r.assignmentId);
      if (!reviewerId || !r.submittedAt) return;
      const prev = ranges.get(reviewerId) || {};
      if (!prev.from || r.submittedAt < prev.from) prev.from = r.submittedAt;
      if (!prev.to || r.submittedAt > prev.to) prev.to = r.submittedAt;
      ranges.set(reviewerId, prev);
    });
    return ranges;
  }, [assignments, reviews]);

  useEffect(() => {
    if (!selectedId) return;
    const revCount = reviewCountByReviewer.get(selectedId) || 0;
    const range = dateRangeByReviewer.get(selectedId);
    setReviewCount(revCount);
    setPeriodFrom(toDateInput(range?.from || null));
    setPeriodTo(toDateInput(range?.to || null));
    const reviewer = reviewerMap.get(selectedId);
    const exp = reviewer?.expertise || "";
    if (CATEGORIES.includes(exp)) {
      setExpertise(exp);
      setCustomExpertise("");
    } else if (exp) {
      setExpertise("__custom__");
      setCustomExpertise(exp);
    } else {
      setExpertise("");
      setCustomExpertise("");
    }
  }, [selectedId, reviewCountByReviewer, assignmentsByReviewer, dateRangeByReviewer, reviewerMap]);

  const selectedReviewer = reviewerMap.get(selectedId);

  const handleGenerate = async () => {
    if (!selectedReviewer) return;
    setGenerating(true);
    try {
      const finalExpertise = expertise === "__custom__" ? customExpertise : expertise;
      const pdfBytes = await generateReviewerCertificate({
        reviewerName: selectedReviewer.name,
        expertise: finalExpertise || "",
        reviewCount,
        periodFrom: periodFrom ? toDateLabel(periodFrom) : "—",
        periodTo: periodTo ? toDateLabel(periodTo) : "—",
      });
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safeName = selectedReviewer.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
      const a = document.createElement("a");
      a.href = url;
      const now = new Date();
      const monthShort = now.toLocaleDateString("en-US", { month: "short" });
      const year = now.getFullYear();
      a.download = `Reviewer-Certificate-${safeName}-${monthShort}-${year}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Reviewers</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviewers.map((r) => (
                <tr key={r.id} className="relative hover:bg-blue-100 transition-colors duration-150 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {reviewCountByReviewer.get(r.id) || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {assignmentsByReviewer.get(r.id)?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.status || "active"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all duration-150 hover:shadow-md active:scale-95"
                      onClick={() => {
                        setSelectedId(r.id);
                        setShowSurvey(true);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      Certificate
                    </button>
                  </td>
                </tr>
              ))}
              {reviewers.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-400" colSpan={5}>No reviewers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSurvey && selectedReviewer && (() => {
        const finalExpertise = expertise === "__custom__" ? customExpertise : expertise;
        const canGenerate = finalExpertise && reviewCount > 0 && periodFrom && periodTo;
        const initials = selectedReviewer.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSurvey(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Generate Certificate</h3>
                    <p className="text-sm text-gray-500">{selectedReviewer.name}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors" onClick={() => setShowSurvey(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Reviewer info card */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{selectedReviewer.name}</div>
                  <div className="text-xs text-gray-500 truncate">{selectedReviewer.email}</div>
                  {selectedReviewer.affiliation && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">{selectedReviewer.affiliation}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{reviewCountByReviewer.get(selectedId) || 0}</div>
                  <div className="text-xs text-gray-500">reviews done</div>
                </div>
              </div>

              {/* Expertise */}
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  Area of Expertise
                  {!finalExpertise && <span className="text-red-400 text-xs font-normal ml-1">Required</span>}
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 mt-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                  value={expertise}
                  onChange={(e) => { setExpertise(e.target.value); if (e.target.value !== "__custom__") setCustomExpertise(""); }}
                >
                  <option value="">Select area...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">Other (type manually)</option>
                </select>
                {expertise === "__custom__" && (
                  <input
                    type="text"
                    placeholder="e.g. Molecular Biology"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 mt-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                  />
                )}
              </div>

              {/* Review count + period */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Reviews</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 mt-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                    value={reviewCount}
                    onChange={(e) => setReviewCount(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">From</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 mt-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">To</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 mt-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview summary */}
              {canGenerate && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800">
                  <div className="font-medium mb-1">Certificate Preview</div>
                  <div className="text-blue-600 text-xs space-y-0.5">
                    <div>{selectedReviewer.name} — {finalExpertise}</div>
                    <div>{reviewCount} manuscript review{reviewCount !== 1 ? "s" : ""}, {toDateLabel(periodFrom)} — {toDateLabel(periodTo)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50 rounded-b-2xl">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                onClick={() => setShowSurvey(false)}
              >
                Cancel
              </button>
              <button
                className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 ${
                  canGenerate && !generating
                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
              >
                {generating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
