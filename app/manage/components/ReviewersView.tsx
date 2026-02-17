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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [editCount, setEditCount] = useState(0);
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
    const assignmentsCount = assignmentsByReviewer.get(selectedId)?.length || 0;
    const range = dateRangeByReviewer.get(selectedId);
    setReviewCount(revCount);
    setEditCount(assignmentsCount);
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
        editCount,
        periodFrom: periodFrom ? toDateLabel(periodFrom) : "—",
        periodTo: periodTo ? toDateLabel(periodTo) : "—",
      });
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
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
                <tr key={r.id} className="relative">
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
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                    >
                      Actions ▾
                    </button>
                    {openMenuId === r.id && (
                      <div className="absolute right-4 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onClick={() => {
                            setSelectedId(r.id);
                            setOpenMenuId(null);
                            setShowSurvey(true);
                          }}
                        >
                          Generate Certificate
                        </button>
                      </div>
                    )}
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

      {showSurvey && selectedReviewer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShowSurvey(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reviewer Certificate</h3>
                <p className="text-xs text-gray-500 mt-1">Confirm details and generate the PDF.</p>
              </div>
              <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={() => setShowSurvey(false)}>&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold">Reviewer</label>
                <div className="text-sm text-gray-700 mt-1">{selectedReviewer.name} ({selectedReviewer.email})</div>
              </div>
              <div>
                <label className="text-sm font-semibold">Area of Expertise</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  value={expertise}
                  onChange={(e) => { setExpertise(e.target.value); if (e.target.value !== "__custom__") setCustomExpertise(""); }}
                >
                  <option value="">— Select area —</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">Other (type manually)</option>
                </select>
                {expertise === "__custom__" && (
                  <input
                    type="text"
                    placeholder="e.g. Molecular Biology"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2"
                    value={customExpertise}
                    onChange={(e) => setCustomExpertise(e.target.value)}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Total Reviews Completed</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={reviewCount}
                    onChange={(e) => setReviewCount(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Total Editorial Evaluations</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={editCount}
                    onChange={(e) => setEditCount(Number(e.target.value || 0))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Review Period (From)</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Review Period (To)</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowSurvey(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
