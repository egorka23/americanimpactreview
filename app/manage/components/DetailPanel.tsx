import { useState, useRef, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge";
import SendReviewerModal from "./SendReviewerModal";
import type { Submission } from "./SubmissionsTable";
import { TAXONOMY, CATEGORIES, CATEGORY_COLORS } from "@/lib/taxonomy";
import {
  generatePublicationCertificate,
  type PublicationCertificateData,
} from "@/lib/generate-publication-certificate";
// PDF regeneration uses a print-ready HTML page served by the API

/** Inline ? icon with tooltip — sits inside a button via ml-auto */
function ActionHint({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const [above, setAbove] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const checkPos = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setAbove(window.innerHeight - rect.bottom < 100);
  }, []);

  useEffect(() => {
    if (show) checkPos();
  }, [show, checkPos]);

  return (
    <span
      ref={ref}
      className="relative ml-auto shrink-0"
      onMouseEnter={(e) => { e.stopPropagation(); setShow(true); }}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShow((v) => !v); }}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="cursor-help opacity-60 hover:opacity-100 transition-opacity"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {show && (
        <div
          className={`absolute z-50 right-0 w-56 px-3 py-2 rounded-lg text-xs leading-relaxed font-normal ${
            above ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ background: "#1f2937", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", pointerEvents: "none" }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

type Assignment = {
  id: string;
  submissionId: string;
  reviewerId: string;
  status: string;
  invitedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
};

type Review = {
  id: string;
  assignmentId: string;
  recommendation: string | null;
  score: number | null;
  commentsToAuthor: string | null;
  commentsToEditor: string | null;
  submittedAt: string | null;
  reviewerName: string | null;
  submissionId: string | null;
};

type AiReviewResult = {
  readiness: "ready" | "needs_revision" | "not_ready";
  confidence: "low" | "medium" | "high";
  summary: string;
  details?: string[];
  metrics?: {
    keywordCount: number;
    keywordMatchCount: number;
    keywordAlignmentScore: number;
    keywordAlignment: "low" | "medium" | "high";
    pageCount: number | null;
    abstractWordCount: number;
    numberMentions: number;
    methodSignals: number;
  };
  checklist?: {
    label: string;
    status: "yes" | "no" | "unknown";
    note?: string;
  }[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Simple SVG icons for action items
function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.1 18.1 0 015.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a18.03 18.03 0 01-4.23 5.7" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconArchive() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}
function IconBookClosed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
    </svg>
  );
}
function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l1.5 3.5L10 8l-3.5 1.5L5 13l-1.5-3.5L0 8l3.5-1.5L5 3z" />
      <path d="M18 4l1.2 2.6L22 8l-2.8 1.4L18 12l-1.2-2.6L14 8l2.8-1.4L18 4z" />
      <path d="M12 12l1.4 3.2L17 16l-3.6 1.6L12 21l-1.4-3.4L7 16l3.6-1.8L12 12z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

type DecisionType = "major_revision" | "minor_revision" | "reject";

const decisionLabels: Record<DecisionType, string> = {
  major_revision: "Major Revisions Required",
  minor_revision: "Minor Revisions Required",
  reject: "Reject Manuscript",
};

const decisionColors: Record<DecisionType, { color: string; bg: string }> = {
  major_revision: { color: "#ea580c", bg: "#fff7ed" },
  minor_revision: { color: "#d97706", bg: "#fffbeb" },
  reject: { color: "#dc2626", bg: "#fef2f2" },
};

function buildReviewerComments(
  assignments: Assignment[],
  reviews: Review[],
  submissionId: string,
): string {
  const subAssignments = assignments.filter((a) => a.submissionId === submissionId);
  const parts: string[] = [];
  let idx = 1;
  for (const a of subAssignments) {
    const review = reviews.find((r) => r.assignmentId === a.id);
    if (!review) continue;
    const name = a.reviewerName || a.reviewerEmail || `Reviewer ${idx}`;
    parts.push(`--- Reviewer ${idx} (${name}) ---`);
    if (review.recommendation) {
      parts.push(`Recommendation: ${review.recommendation}`);
    }
    if (review.score !== null) {
      parts.push(`Score: ${review.score}/5`);
    }
    if (review.commentsToAuthor) {
      parts.push("");
      parts.push(review.commentsToAuthor);
    }
    parts.push("");
    idx++;
  }
  return parts.join("\n").trim();
}

function defaultDeadline(type: DecisionType): string {
  const d = new Date();
  d.setDate(d.getDate() + (type === "minor_revision" ? 14 : 30));
  return d.toISOString().split("T")[0];
}

/** Modal for editor decisions (revisions / reject) */
function DecisionModal({
  type,
  submissionTitle,
  initialReviewerComments,
  onSend,
  onClose,
}: {
  type: DecisionType;
  submissionTitle: string;
  initialReviewerComments: string;
  onSend: (data: {
    reviewerComments: string;
    editorComments: string;
    revisionDeadline?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [reviewerComments, setReviewerComments] = useState(initialReviewerComments);
  const [editorComments, setEditorComments] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline(type));
  const [sending, setSending] = useState(false);

  const isRevision = type !== "reject";
  const { color, bg } = decisionColors[type];

  const handleSubmit = async () => {
    setSending(true);
    try {
      await onSend({
        reviewerComments: reviewerComments.trim(),
        editorComments: editorComments.trim(),
        revisionDeadline: isRevision ? deadline : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="flex items-start justify-between">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color,
                  background: bg,
                  marginBottom: 8,
                }}
              >
                {decisionLabels[type]}
              </div>
              <p
                className="truncate"
                style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 4 }}
                title={submissionTitle}
              >
                {submissionTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: "1.5rem",
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Reviewer Comments */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Reviewer Comments
            </label>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 6 }}>
              Auto-collected from submitted reviews. Edit before sending to the author.
            </p>
            <textarea
              value={reviewerComments}
              onChange={(e) => setReviewerComments(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.5, resize: "vertical" }}
              placeholder="No reviewer comments available. You can add them manually."
            />
          </div>

          {/* Editor Comments */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Editor Comments
            </label>
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 6 }}>
              Your synthesis, instructions, or additional notes for the author.
            </p>
            <textarea
              value={editorComments}
              onChange={(e) => setEditorComments(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ resize: "vertical" }}
              placeholder="e.g. Please address each reviewer's concern and highlight changes in the revised manuscript."
            />
          </div>

          {/* Revision Deadline — only for revision decisions */}
          {isRevision && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                Revision Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-6 pt-4 flex gap-3"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          <button
            className="admin-btn admin-btn-outline admin-btn-half"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            className={`admin-btn admin-btn-half ${type === "reject" ? "admin-btn-red" : "admin-btn-orange"}`}
            onClick={handleSubmit}
            disabled={sending}
          >
            {sending ? "Sending\u2026" : type === "reject" ? "Send Rejection" : "Send Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

const recColor: Record<string, string> = {
  Accept: "#059669",
  "Minor Revision": "#d97706",
  "Major Revision": "#ea580c",
  Reject: "#dc2626",
};

const recBg: Record<string, string> = {
  Accept: "#ecfdf5",
  "Minor Revision": "#fffbeb",
  "Major Revision": "#fff7ed",
  Reject: "#fef2f2",
};

const aiReadinessLabel: Record<AiReviewResult["readiness"], string> = {
  ready: "Ready for Publish",
  needs_revision: "Needs Revision",
  not_ready: "Not Ready",
};

const aiReadinessStyle: Record<AiReviewResult["readiness"], { color: string; bg: string }> = {
  ready: { color: "#059669", bg: "#ecfdf5" },
  needs_revision: { color: "#d97706", bg: "#fffbeb" },
  not_ready: { color: "#dc2626", bg: "#fef2f2" },
};

const yesNoIcon = (val: string) => {
  if (val === "Yes") return { icon: "\u2713", color: "#059669", bg: "#ecfdf5" };
  if (val === "No") return { icon: "\u2717", color: "#dc2626", bg: "#fef2f2" };
  return { icon: "\u2014", color: "#9ca3af", bg: "#f9fafb" };
};

const checklistIcon = (val: "yes" | "no" | "unknown") => {
  if (val === "yes") return { icon: "\u2713", color: "#059669", bg: "#ecfdf5" };
  if (val === "no") return { icon: "\u2717", color: "#dc2626", bg: "#fef2f2" };
  return { icon: "\u2014", color: "#9ca3af", bg: "#f9fafb" };
};

const ratingDots = (val: string) => {
  const map: Record<string, number> = { Poor: 1, "Below Average": 2, Average: 3, Good: 4, Excellent: 5 };
  const n = map[val] || 0;
  const color = n >= 4 ? "#059669" : n === 3 ? "#d97706" : n >= 1 ? "#dc2626" : "#d1d5db";
  return { n, color };
};

/** Full review report modal */
function ReviewReportModal({
  review,
  reviewerName,
  submissionTitle,
  onClose,
}: {
  review: Review;
  reviewerName: string;
  submissionTitle: string;
  onClose: () => void;
}) {
  const color = recColor[review.recommendation || ""] || "#374151";
  const bg = recBg[review.recommendation || ""] || "#f9fafb";

  // Parse structured data from commentsToEditor
  const lines = (review.commentsToEditor || "").split("\n").filter(Boolean);
  const data: Record<string, string> = {};
  const extras: string[] = [];
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0 && idx < 40) {
      data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    } else {
      extras.push(line);
    }
  }

  // Parse commentsToAuthor sections
  const authorText = review.commentsToAuthor || "";
  const sections = authorText.split("\n\n").filter(Boolean);

  const yesNoFields = [
    { key: "Objectives clear", label: "Research objectives clearly stated" },
    { key: "Literature adequate", label: "Literature review adequate" },
    { key: "Methods reproducible", label: "Methods reproducible" },
    { key: "Statistics appropriate", label: "Statistical analysis appropriate" },
    { key: "Results presented clearly", label: "Results presented clearly" },
    { key: "Tables/figures appropriate", label: "Tables & figures appropriate" },
    { key: "Conclusions supported", label: "Conclusions supported by data" },
    { key: "Limitations stated", label: "Limitations clearly stated" },
    { key: "Language editing needed", label: "Language editing needed" },
  ];

  const ratingFields = [
    { key: "Originality", label: "Originality" },
    { key: "Methodology", label: "Methodology" },
    { key: "Clarity", label: "Clarity" },
    { key: "Significance", label: "Significance" },
  ];

  // Find rating values from structured comments or extras
  const findRating = (key: string) => {
    for (const [k, v] of Object.entries(data)) {
      if (k.toLowerCase().includes(key.toLowerCase()) && !yesNoFields.some((f) => f.key === k)) {
        return v;
      }
    }
    return "";
  };

  const commentFields = [
    { key: "Intro comments", label: "Introduction" },
    { key: "Methods comments", label: "Methods" },
    { key: "Results comments", label: "Results" },
    { key: "Discussion comments", label: "Discussion" },
    { key: "Confidential comments", label: "Confidential (Editor Only)" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 4 }}>
                Review Report
              </p>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                {reviewerName}
              </h3>
              {review.submittedAt && (
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
                  Submitted {formatDate(review.submittedAt)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.5rem", lineHeight: 1, padding: "0 4px" }}
            >
              &#x2715;
            </button>
          </div>

          {/* Recommendation badge */}
          <div
            className="mt-4 flex items-center justify-between"
            style={{ background: bg, borderRadius: 10, padding: "12px 16px" }}
          >
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 2 }}>
                Recommendation
              </p>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{review.recommendation}</p>
            </div>
            {review.score !== null && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 2 }}>
                  Score
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{review.score}<span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#9ca3af" }}>/5</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Checklist section */}
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 10 }}>
            Evaluation Checklist
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {yesNoFields.map((f) => {
              const val = data[f.key] || "-";
              const { icon, color: c, bg: b } = yesNoIcon(val);
              return (
                <div key={f.key} className="flex items-center justify-between" style={{ fontSize: "0.8rem" }}>
                  <span style={{ color: "#4b5563" }}>{f.label}</span>
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 22, borderRadius: 6,
                      fontSize: "0.75rem", fontWeight: 700,
                      color: c, background: b,
                    }}
                  >
                    {icon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ratings section */}
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 10 }}>
            Quality Ratings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ratingFields.map((f) => {
              const val = findRating(f.key) || data[f.key] || "-";
              const { n, color: dotColor } = ratingDots(val);
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between" style={{ fontSize: "0.8rem", marginBottom: 3 }}>
                    <span style={{ color: "#4b5563" }}>{f.label}</span>
                    <span style={{ fontWeight: 600, color: dotColor, fontSize: "0.75rem" }}>{val}</span>
                  </div>
                  {/* Dot bar */}
                  <div style={{ display: "flex", gap: 3 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= n ? dotColor : "#e5e7eb",
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section comments */}
        {commentFields.some((f) => data[f.key]) && (
          <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 10 }}>
              Section Comments
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {commentFields.map((f) => {
                const val = data[f.key];
                if (!val) return null;
                const isConfidential = f.key.includes("Confidential");
                return (
                  <div key={f.key}>
                    <p style={{
                      fontSize: "0.7rem", fontWeight: 600, color: isConfidential ? "#dc2626" : "#6b7280",
                      marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {f.label} {isConfidential && "\uD83D\uDD12"}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{val}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments to Author */}
        {authorText && (
          <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", marginBottom: 10 }}>
              Comments to Author
            </p>
            {sections.map((s, i) => (
              <p key={i} style={{ fontSize: "0.8rem", color: "#374151", lineHeight: 1.65, whiteSpace: "pre-wrap", marginBottom: i < sections.length - 1 ? 10 : 0 }}>{s}</p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 pt-4">
          <p style={{ fontSize: "0.7rem", color: "#d1d5db", textAlign: "center" }}>
            {submissionTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);

  // Parse commentsToEditor into structured lines
  const editorLines = (review.commentsToEditor || "").split("\n").filter(Boolean);
  const structured: { label: string; value: string }[] = [];
  const freeText: string[] = [];
  for (const line of editorLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      structured.push({ label: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() });
    } else {
      freeText.push(line);
    }
  }

  const color = recColor[review.recommendation || ""] || "#374151";

  return (
    <div className="mt-2 p-2.5 rounded-lg text-xs" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 700, color }}>
          {review.recommendation}
        </span>
        {review.score !== null && (
          <span style={{ color: "#6b7280", fontWeight: 500 }}>
            {review.score}/5
          </span>
        )}
      </div>

      {review.submittedAt && (
        <p style={{ color: "#9ca3af", marginTop: 2 }}>
          Submitted {formatDate(review.submittedAt)}
        </p>
      )}

      {/* Comments to Author — always visible if exists */}
      {review.commentsToAuthor && (
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontWeight: 600, color: "#374151", marginBottom: 2 }}>Comments to Author</p>
          <p style={{ color: "#4b5563", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {review.commentsToAuthor.length > 300 && !expanded
              ? review.commentsToAuthor.slice(0, 300) + "\u2026"
              : review.commentsToAuthor}
          </p>
        </div>
      )}

      {/* Expand/collapse for detailed evaluation */}
      {structured.length > 0 && (
        <>
          <button
            className="admin-link-btn mt-2"
            style={{ fontSize: "0.7rem" }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide detailed evaluation" : "Show detailed evaluation"}
          </button>
          {expanded && (
            <div className="mt-2 pt-2 space-y-1" style={{ borderTop: "1px solid #e5e7eb" }}>
              {structured.map((s, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span style={{ color: "#6b7280" }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right", flexShrink: 0 }}>{s.value}</span>
                </div>
              ))}
              {freeText.length > 0 && (
                <div className="mt-2 pt-1" style={{ borderTop: "1px dashed #d1d5db" }}>
                  {freeText.map((t, i) => (
                    <p key={i} style={{ color: "#4b5563", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{t}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Modal for sending a Stripe payment link to the author */
function PaymentLinkModal({
  submissionId,
  submissionTitle,
  onClose,
  onSent,
}: {
  submissionId: string;
  submissionTitle: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [amount, setAmount] = useState("200");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 100) {
      setError("Amount must be at least $1.00");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/local-admin/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, amount: cents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send payment link");
      }
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="flex items-start justify-between">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0a1628", margin: 0 }}>
                Send Payment Link
              </h3>
              <p
                className="truncate"
                style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: 4 }}
                title={submissionTitle}
              >
                {submissionTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.5rem", lineHeight: 1, padding: "0 4px" }}
            >
              &#x2715;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              Amount (USD)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ paddingLeft: 28, paddingRight: 12 }}
                disabled={sending}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: 0 }}>{error}</p>
          )}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            className="admin-btn admin-btn-outline admin-btn-half"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-green admin-btn-half"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending\u2026" : "Send Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetailPanel({
  submission,
  assignments,
  reviews,
  onRefresh,
}: {
  submission: Submission;
  assignments: Assignment[];
  reviews: Review[];
  onRefresh: () => void;
}) {
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [manuscriptUrls, setManuscriptUrls] = useState<Record<string, string>>({});
  const [msLoading, setMsLoading] = useState<Record<string, boolean>>({});
  const [detailTab, setDetailTab] = useState<"info" | "reviewers">("info");
  const [reviewReport, setReviewReport] = useState<{ review: Review; name: string } | null>(null);
  const [certLoading, setCertLoading] = useState<string | false>(false);
  const [showCertPopup, setShowCertPopup] = useState(false);
  const [decisionModal, setDecisionModal] = useState<DecisionType | null>(null);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [aiReviewResult, setAiReviewResult] = useState<AiReviewResult | null>(null);
  const [aiReviewShowDetails, setAiReviewShowDetails] = useState(false);

  // Category/subject inline edit
  const [editingCatSub, setEditingCatSub] = useState(false);
  const [editCat, setEditCat] = useState(submission.category);
  const [editSub, setEditSub] = useState(submission.subject || "");
  const [savingCatSub, setSavingCatSub] = useState(false);

  // Published article slug (fetched after accept)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishedArticleId, setPublishedArticleId] = useState<string | null>(null);
  const [publishedVisibility, setPublishedVisibility] = useState<"public" | "private">("public");
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [pdfRegenerating, setPdfRegenerating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    size: number;
    pageCount: number;
    pdfUrl: string;
    slug: string;
    title: string;
  } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Publish / unpublish popup state
  const [publishPopup, setPublishPopup] = useState<{
    slug: string;
    title: string;
    live: boolean;
    checking: boolean;
  } | null>(null);
  const [unpublishPopup, setUnpublishPopup] = useState<{
    slug: string;
    title: string;
    checks: {
      articlePage: "pending" | "pass" | "fail";
      explore: "pending" | "pass" | "fail";
      homepage: "pending" | "pass" | "fail";
      adminStatus: "pending" | "pass" | "fail";
    };
    done: boolean;
    allPassed: boolean;
  } | null>(null);

  // Fetch published slug + visibility + article ID for this submission
  useEffect(() => {
    fetch(`/api/local-admin/publishing/by-submission/${submission.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((article: { id?: string; slug?: string; visibility?: string } | null) => {
        setPublishedSlug(article?.slug || null);
        setPublishedArticleId(article?.id || null);
        setPublishedVisibility(article?.visibility === "private" ? "private" : "public");
      })
      .catch(() => {
        setPublishedSlug(null);
        setPublishedArticleId(null);
        setPublishedVisibility("public");
      });
    setConfirmArchive(false);
  }, [submission.id, submission.status]);

  useEffect(() => {
    setAiReviewOpen(false);
    setAiReviewLoading(false);
    setAiReviewError(null);
    setAiReviewResult(null);
    setAiReviewShowDetails(false);
  }, [submission.id]);

  // Parse co-authors
  const coAuthors: { name: string; email?: string; affiliation?: string }[] = (() => {
    if (!submission.coAuthors) return [];
    try {
      const parsed = JSON.parse(submission.coAuthors);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const totalAuthors = 1 + coAuthors.length;

  const allAuthors: string[] = (() => {
    const primary = submission.userName || "Unknown";
    const extras = coAuthors.map((c) => c.name).filter(Boolean);
    return [primary, ...extras];
  })();

  const subAssignments = assignments.filter((a) => a.submissionId === submission.id);
  const subReviews = reviews.filter((r) => r.submissionId === submission.id);

  const doAction = async (action: string, execute: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await execute();
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleArchive = async () => {
    const typed = window.prompt(
      `To confirm archiving, type the article title:\n\n${submission.title}`
    );
    if (typed !== submission.title) {
      if (typed !== null) alert("Title does not match. Archive cancelled.");
      setConfirmArchive(false);
      return;
    }
    await doAction("archive", async () => {
      if (publishedArticleId) {
        // DELETE on publishing endpoint does cascading archive:
        // published_articles → archived, submission → archived, review_assignments/reviews → deleted
        const res = await fetch(`/api/local-admin/publishing/${publishedArticleId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to archive article.");
        }
      } else {
        // No published article — just mark submission as rejected/withdrawn
        const res = await fetch(`/api/local-admin/submissions/${submission.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
        if (!res.ok) throw new Error("Failed to archive submission.");
      }
    });
    setConfirmArchive(false);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/local-admin/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const sendDecision = async (
    decision: string,
    reviewerComments = "",
    editorComments = "",
    revisionDeadline?: string,
  ) => {
    await fetch("/api/local-admin/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: submission.id,
        decision,
        reviewerComments,
        editorComments,
        revisionDeadline: revisionDeadline || "",
      }),
    });
  };

  const handleDecisionSend = async (data: {
    reviewerComments: string;
    editorComments: string;
    revisionDeadline?: string;
  }) => {
    const type = decisionModal!;
    const actionKey = type === "reject" ? "reject" : "revisions";
    setDecisionModal(null);
    await doAction(actionKey, async () => {
      await sendDecision(type, data.reviewerComments, data.editorComments, data.revisionDeadline);
      await updateStatus(type === "reject" ? "rejected" : "revision_requested");
    });
  };

  const handleReject = () => {
    setConfirmAction(null);
    setDecisionModal("reject");
  };

  const handleRequestRevisions = () => {
    setDecisionModal("major_revision");
  };

  const handleMinorRevisions = () => {
    setDecisionModal("minor_revision");
  };

  const handleReopen = () => doAction("reopen", async () => {
    await updateStatus("submitted");
  });

  const handleAccept = () => doAction("accept", async () => {
    await sendDecision("accept");
    await updateStatus("accepted");
  });

  const handlePublish = () => doAction("publish", async () => {
    let finalSlug: string;

    // Try to re-publish existing record first
    const existingRes = await fetch(`/api/local-admin/publishing/by-submission/${submission.id}`);
    if (existingRes.ok) {
      // Record exists — just flip status back to published
      const existing = await existingRes.json();
      await fetch(`/api/local-admin/publishing/by-submission/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      finalSlug = existing.slug;
    } else {
      // No existing record — use server-side publish endpoint
      // which extracts content from manuscript, generates e2026XXX slug, etc.
      const pubRes = await fetch(`/api/local-admin/publish-submission/${submission.id}`, {
        method: "POST",
      });
      if (!pubRes.ok) {
        const d = await pubRes.json().catch(() => ({}));
        throw new Error(d.error || "Failed to publish article");
      }
      const pubData = await pubRes.json();
      finalSlug = pubData.slug;
    }
    setPublishedSlug(finalSlug);
    setPublishedVisibility("private");

    // Verify the article is actually live on the site (retry up to 10 times with delay)
    const articleUrl = `/article/${finalSlug}`;
    let isLive = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const check = await fetch(articleUrl, { method: "HEAD", cache: "no-store" });
        if (check.ok) {
          isLive = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Auto-generate PDF after publishing
    try {
      await fetch(`/api/local-admin/regenerate-pdf/${finalSlug}`, { method: "POST" });
    } catch {}

    setPublishPopup({ slug: finalSlug, title: submission.title, live: isLive, checking: false });
  });

  const handleToggleVisibility = async () => {
    if (visibilityLoading) return;
    const next = publishedVisibility === "public" ? "private" : "public";
    setVisibilityLoading(true);
    try {
      const res = await fetch(`/api/local-admin/publishing/by-submission/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update visibility");
      }
      setPublishedVisibility(next);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setVisibilityLoading(false);
    }
  };

  const handleUnpublish = () => doAction("unpublish", async () => {
    // Remember slug before unpublishing
    const slug = publishedSlug || makeSlug(submission.title);

    // 1. Mark published_articles record as draft
    await fetch(`/api/local-admin/publishing/by-submission/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });

    // 2. Update submission status
    await updateStatus("accepted");

    // 3. Show popup and run comprehensive verification
    type CheckVal = "pending" | "pass" | "fail";
    const results = { articlePage: "pending" as CheckVal, explore: "pending" as CheckVal, homepage: "pending" as CheckVal, adminStatus: "pending" as CheckVal };
    const setResults = () => {
      const vals = Object.values(results);
      const done = vals.every((v) => v !== "pending");
      setUnpublishPopup({
        slug, title: submission.title,
        checks: { ...results },
        done,
        allPassed: done && vals.every((v) => v === "pass"),
      });
    };
    setResults();

    // Small delay to let the DB propagate
    await new Promise((r) => setTimeout(r, 1000));

    // Check 1: Article page should return 404
    try {
      const res = await fetch(`/article/${slug}`, { cache: "no-store" });
      results.articlePage = (res.status === 404 || !res.ok) ? "pass" : "fail";
    } catch {
      results.articlePage = "pass";
    }
    setResults();

    // Check 2: Explore page should NOT contain the article title
    try {
      const res = await fetch("/explore", { cache: "no-store" });
      if (res.ok) {
        const html = await res.text();
        results.explore = html.includes(submission.title) ? "fail" : "pass";
      } else {
        results.explore = "fail";
      }
    } catch {
      results.explore = "fail";
    }
    setResults();

    // Check 3: Homepage should NOT contain the article title
    try {
      const res = await fetch("/", { cache: "no-store" });
      if (res.ok) {
        const html = await res.text();
        results.homepage = html.includes(submission.title) ? "fail" : "pass";
      } else {
        results.homepage = "fail";
      }
    } catch {
      results.homepage = "fail";
    }
    setResults();

    // Check 4: Admin API should show status != "published"
    try {
      const res = await fetch(`/api/local-admin/publishing/by-submission/${submission.id}`);
      if (res.ok) {
        const data = await res.json();
        results.adminStatus = data.status !== "published" ? "pass" : "fail";
      } else {
        results.adminStatus = "pass";
      }
    } catch {
      results.adminStatus = "fail";
    }
    setResults();
  });

  const saveCatSub = async () => {
    setSavingCatSub(true);
    try {
      await fetch(`/api/local-admin/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: submission.pipelineStatus || submission.status, category: editCat, subject: editSub }),
      });
      setEditingCatSub(false);
      onRefresh();
    } catch {
      alert("Failed to save category/subject");
    } finally {
      setSavingCatSub(false);
    }
  };

  const generateCertForAuthor = async (authorName: string) => {
    setCertLoading(authorName);
    try {
      const receivedDate = submission.createdAt
        ? new Date(submission.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";
      const publishedDate = submission.updatedAt
        ? new Date(submission.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

      const data: PublicationCertificateData = {
        title: submission.title,
        authorName,
        receivedDate,
        publishedDate,
        doi: "Pending",
        issn: "0000-0000",
      };

      const pdfBytes = await generatePublicationCertificate(data);
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate certificate");
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertificatePreview = async () => {
    if (allAuthors.length > 1) {
      setShowCertPopup(true);
    } else {
      await generateCertForAuthor(allAuthors[0]);
    }
  };

  const handleRegeneratePdf = async () => {
    if (!publishedSlug) return;
    setPdfRegenerating(true);
    try {
      const res = await fetch(`/api/local-admin/regenerate-pdf/${publishedSlug}`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "PDF generation failed");
      }
      const data = await res.json();
      setPdfResult({
        size: data.size,
        pageCount: data.pageCount,
        pdfUrl: data.pdfUrl,
        slug: data.slug,
        title: data.title,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setPdfRegenerating(false);
    }
  };

  const requestAiReview = async () => {
    setAiReviewOpen(true);
    setAiReviewLoading(true);
    setAiReviewError(null);
    setAiReviewShowDetails(false);
    try {
      const res = await fetch("/api/local-admin/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id, depth: 3 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to generate AI review");
      }
      const data = (await res.json()) as AiReviewResult;
      setAiReviewResult(data);
    } catch (err) {
      setAiReviewError(err instanceof Error ? err.message : "Failed to generate AI review");
    } finally {
      setAiReviewLoading(false);
    }
  };

  const handleAiReviewClick = async () => {
    setAiReviewOpen(true);
    if (!aiReviewResult) {
      await requestAiReview();
    }
  };

  const loadManuscriptUrl = async (assignmentId: string) => {
    setMsLoading((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      const res = await fetch("/api/local-admin/review-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load manuscript");
      }
      const { url } = await res.json();
      setManuscriptUrls((prev) => ({ ...prev, [assignmentId]: url }));
      // Auto-open the PDF in a new tab
      window.open(url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load manuscript");
    } finally {
      setMsLoading((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  return (
    <div className="w-[380px] h-screen border-l border-gray-200 overflow-y-auto flex flex-col shrink-0" style={{ background: "#fff", color: "#111827" }}>
      {/* Header: title + status + pill toggle */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <StatusBadge status={submission.status} showInfo visibility={submission.status === "published" ? publishedVisibility : undefined} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12 }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.35, color: "#1e293b", flex: 1 }}>{submission.title}</h3>
          <a
            href={`/manage/submissions/${submission.id}`}
            style={{ color: "#2563eb", fontSize: "0.8rem", fontWeight: 500, whiteSpace: "nowrap", marginTop: 3, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Edit
          </a>
        </div>

        {/* Pill toggle + dots card */}
        {subAssignments.length > 0 && (
          <div style={{
            marginTop: 16,
            background: "#f9fafb",
            borderRadius: 12,
            padding: "12px 14px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
          }}>
            {/* Toggle */}
            <div className="pill-toggle">
              <button
                className={`pill-toggle-btn${detailTab === "info" ? " active" : ""}`}
                onClick={() => setDetailTab("info")}
              >
                Details
              </button>
              <button
                className={`pill-toggle-btn${detailTab === "reviewers" ? " active" : ""}`}
                onClick={() => setDetailTab("reviewers")}
              >
                Reviewers ({subAssignments.length})
              </button>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {subAssignments.map((a) => {
                  const rev = subReviews.find((r) => r.assignmentId === a.id);
                  const dotColor = !rev ? "#d1d5db"
                    : rev.recommendation === "Accept" ? "#059669"
                    : rev.recommendation === "Reject" ? "#dc2626"
                    : "#d97706";
                  const name = a.reviewerName || a.reviewerEmail || "Reviewer";
                  const label = rev ? `${name}: ${rev.recommendation}` : `${name}: pending`;
                  return (
                    <span key={a.id} className="relative" style={{ display: "inline-block" }}>
                      <span
                        style={{
                          width: 14, height: 14, borderRadius: "50%",
                          background: dotColor, display: "block", cursor: "default",
                          boxShadow: rev ? `0 0 0 2px ${dotColor}25` : "none",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.4)";
                          const tip = e.currentTarget.nextElementSibling as HTMLElement;
                          if (tip) tip.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                          const tip = e.currentTarget.nextElementSibling as HTMLElement;
                          if (tip) tip.style.opacity = "0";
                        }}
                      />
                      <span style={{
                        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                        background: "#1f2937", color: "#fff", fontSize: "0.8rem", fontWeight: 500,
                        padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
                        opacity: 0, transition: "opacity 0.15s", pointerEvents: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10,
                      }}>
                        {label}
                      </span>
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                {subReviews.length} of {subAssignments.length} reviewed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TAB: Details (info + actions) */}
      {detailTab === "info" && (
        <>
          <div className="px-5 pt-5 pb-4">
            <div style={{
              background: "#f9fafb",
              borderRadius: 12,
              padding: "14px 16px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <h4 className="card-heading">Submission Info</h4>
              <div className="space-y-1.5 text-sm" style={{ color: "#6b7280" }}>
                <div>
                  <span style={{ color: "#9ca3af" }}>{totalAuthors === 1 ? "Author:" : "Authors:"}</span>{" "}
                  {submission.userName || "Unknown"}
                  {coAuthors.length > 0 && !showAllAuthors && (
                    <button
                      className="admin-link-btn"
                      onClick={() => setShowAllAuthors(true)}
                      style={{ marginLeft: "0.25rem" }}
                    >
                      +{coAuthors.length} more
                    </button>
                  )}
                  {coAuthors.length > 0 && showAllAuthors && (
                    <>
                      {coAuthors.map((ca, i) => (
                        <span key={i} style={{ display: "block", paddingLeft: "3.5rem", color: "#6b7280" }}>
                          {ca.name}{ca.affiliation ? ` \u2014 ${ca.affiliation}` : ""}
                        </span>
                      ))}
                      <button
                        className="admin-link-btn"
                        onClick={() => setShowAllAuthors(false)}
                        style={{ marginLeft: "0.25rem" }}
                      >
                        collapse
                      </button>
                    </>
                  )}
                </div>
                {submission.userEmail && <p><span style={{ color: "#9ca3af" }}>Email:</span> {submission.userEmail}</p>}
                {!editingCatSub ? (
                  <>
                    <p>
                      <span style={{ color: "#9ca3af" }}>Category:</span> {submission.category}
                      {submission.subject && <> &middot; <span style={{ color: "#9ca3af" }}>Subject:</span> {submission.subject}</>}
                      <button className="admin-link-btn" onClick={() => { setEditCat(submission.category); setEditSub(submission.subject || ""); setEditingCatSub(true); }} style={{ marginLeft: "0.4rem", fontSize: "0.7rem" }}>edit</button>
                    </p>
                  </>
                ) : (
                  <div style={{ marginTop: "0.25rem" }}>
                    <select value={editCat} onChange={(e) => { setEditCat(e.target.value); setEditSub(""); }} style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem", width: "100%", marginBottom: "0.35rem" }}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={editSub} onChange={(e) => setEditSub(e.target.value)} style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem", width: "100%", marginBottom: "0.35rem" }}>
                      <option value="">&mdash; No subject &mdash;</option>
                      {(TAXONOMY[editCat] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    <div className="flex gap-2">
                      <button className="admin-link-btn" onClick={saveCatSub} disabled={savingCatSub} style={{ fontSize: "0.75rem", color: "#059669" }}>{savingCatSub ? "Saving\u2026" : "Save"}</button>
                      <button className="admin-link-btn" onClick={() => setEditingCatSub(false)} style={{ fontSize: "0.75rem" }}>Cancel</button>
                    </div>
                  </div>
                )}
                <p><span style={{ color: "#9ca3af" }}>Submitted:</span> {formatDate(submission.createdAt)}</p>
                {submission.articleType && <p><span style={{ color: "#9ca3af" }}>Type:</span> {submission.articleType}</p>}
              </div>
            </div>
          </div>

          {/* Documents & Editorial Decision cards */}
          <div className="px-5 pt-2 pb-5 flex-1" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Card 1: Documents */}
            <div style={{
              background: "#f9fafb",
              borderRadius: 12,
              padding: "14px 10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <h4 className="card-heading">Documents</h4>

              {submission.manuscriptUrl && (
                <a
                  href={submission.manuscriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-outline"
                >
                  <IconFileText /> View Source
                  <ActionHint text="Open the original manuscript file submitted by the author." />
                </a>
              )}

              <button
                className="admin-btn admin-btn-outline"
                onClick={handleAiReviewClick}
                disabled={aiReviewLoading}
              >
                <IconSparkles /> {aiReviewLoading ? "Running AI Review\u2026" : "View AI Review"}
                <ActionHint text="Generate a short AI readiness summary (3-level verdict + 2\u20133 sentence rationale)." />
              </button>

              {submission.abstract && (
                <button className="admin-btn admin-btn-outline" onClick={() => setShowAbstract(true)}>
                  <IconFileText /> View Abstract
                  <ActionHint text="View the full abstract of this submission." />
                </button>
              )}

              {submission.status === "published" && (
                <>
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={handleCertificatePreview}
                    disabled={!!certLoading}
                  >
                    <IconFileText /> {certLoading ? "Generating\u2026" : "Download Certificate"}
                    <ActionHint text={allAuthors.length > 1 ? "Choose an author to generate their individual publication certificate." : "Generate a publication certificate for the author."} />
                  </button>
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={handleRegeneratePdf}
                    disabled={pdfRegenerating}
                  >
                    {pdfRegenerating ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <IconRefresh />
                    )}
                    {pdfRegenerating ? "Generating PDF\u2026" : "Regenerate PDF"}
                    <ActionHint text="Regenerate the article PDF and update the download link on the site." />
                  </button>
                </>
              )}
            </div>

            {/* Card 2: Editorial Decision */}
            <div style={{
              background: "#f9fafb",
              borderRadius: 12,
              padding: "14px 10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <h4 className="card-heading">Editorial Decision</h4>

              {/* Submitted */}
              {submission.status === "submitted" && (
                <>
                  <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                    <IconCheck /> {actionLoading === "accept" ? "Processing\u2026" : "Accept (Editor Decision)"}
                    <ActionHint text="Accept without peer review. Use when you have reviewed the manuscript yourself." />
                  </button>
                  <button className="admin-btn admin-btn-primary" onClick={() => setShowReviewerModal(true)}>
                    <IconSend /> Send to Reviewer
                    <ActionHint text="Assign a peer reviewer. They will receive an email invitation with a review copy PDF." />
                  </button>
                  <button className="admin-btn admin-btn-red-outline" onClick={handleReject}>
                    <IconX /> Reject
                    <ActionHint text="Decline the manuscript. Opens a decision letter editor so you can include feedback." />
                  </button>
                </>
              )}

              {/* Under Review */}
              {submission.status === "under_review" && (
                <>
                  <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                    <IconCheck /> {actionLoading === "accept" ? "Processing\u2026" : "Accept"}
                    <ActionHint text="Accept the manuscript for publication based on reviewer recommendations." />
                  </button>
                  <button className="admin-btn admin-btn-orange" onClick={handleRequestRevisions} disabled={actionLoading === "revisions"}>
                    <IconEdit /> {actionLoading === "revisions" ? "Processing\u2026" : "Major Revisions"}
                    <ActionHint text="Request major revisions. Opens a decision letter editor with reviewer comments and deadline." />
                  </button>
                  <button className="admin-btn admin-btn-outline" onClick={handleMinorRevisions} disabled={actionLoading === "revisions"}>
                    <IconEdit /> Minor Revisions
                    <ActionHint text="Request minor revisions. Opens a decision letter editor with reviewer comments and a shorter deadline." />
                  </button>
                  <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                    <IconUserPlus /> Add Another Reviewer
                    <ActionHint text="Invite an additional reviewer for a broader evaluation." />
                  </button>
                  <button className="admin-btn admin-btn-red-outline" onClick={handleReject}>
                    <IconX /> Reject
                    <ActionHint text="Reject the manuscript. Opens a decision letter editor so you can include reviewer feedback." />
                  </button>
                </>
              )}

              {/* Revision Requested */}
              {submission.status === "revision_requested" && (
                <>
                  <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                    <IconCheck /> {actionLoading === "accept" ? "Processing\u2026" : "Accept Revision"}
                    <ActionHint text="Accept the revised manuscript for publication." />
                  </button>
                  <button className="admin-btn admin-btn-orange" onClick={handleRequestRevisions} disabled={actionLoading === "revisions"}>
                    <IconEdit /> {actionLoading === "revisions" ? "Processing\u2026" : "Major Revisions"}
                    <ActionHint text="Request major revisions again. Opens a decision letter editor with reviewer comments and deadline." />
                  </button>
                  <button className="admin-btn admin-btn-outline" onClick={handleMinorRevisions} disabled={actionLoading === "revisions"}>
                    <IconEdit /> Minor Revisions
                    <ActionHint text="Request minor revisions. Opens a decision letter editor with reviewer comments and a shorter deadline." />
                  </button>
                  <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                    <IconSend /> Send to Reviewer Again
                    <ActionHint text="Send the revised manuscript back to reviewers for re-evaluation." />
                  </button>
                  <button className="admin-btn admin-btn-red-outline" onClick={handleReject}>
                    <IconX /> Reject
                    <ActionHint text="Reject the revised manuscript. Opens a decision letter editor so you can include feedback." />
                  </button>
                </>
              )}

              {/* Accepted */}
              {submission.status === "accepted" && (
                  <button className="admin-btn admin-btn-green" onClick={handlePublish} disabled={actionLoading === "publish"}>
                    <IconUpload /> {actionLoading === "publish" ? "Publishing\u2026" : "Publish"}
                    <ActionHint text="Publish the article as PRIVATE first so you can preview formatting before making it public." />
                  </button>
              )}

              {/* Published */}
              {submission.status === "published" && (
                <>
                  {publishedVisibility === "private" ? (
                    <div style={{
                      background: "#fef2f2",
                      border: "2px solid #fca5a5",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <span style={{ fontSize: "1.1rem" }}>🔒</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#b91c1c" }}>
                          Private — Not Visible on Site
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#991b1b", marginTop: 2 }}>
                          Only admins can see this article. Click &quot;Make Public&quot; when ready.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: "8px 14px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      <span style={{ fontSize: "1rem" }}>✅</span>
                      <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#16a34a" }}>
                        Public — Live on Site
                      </span>
                    </div>
                  )}
                  {publishedSlug ? (
                    <a
                      href={`/article/${publishedSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-outline"
                    >
                      <IconGlobe /> {publishedVisibility === "private" ? "Preview on Site" : "View on Site"}
                      <ActionHint text={publishedVisibility === "private"
                        ? "Preview the article while it is private (only admins can see it)."
                        : "Open the published article on americanimpactreview.com."}
                      />
                    </a>
                  ) : (
                    <span className="block text-sm" style={{ color: "#9ca3af", padding: "0.75rem 1rem" }}>
                      No article page linked
                    </span>
                  )}
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={handleToggleVisibility}
                    disabled={visibilityLoading}
                  >
                    {publishedVisibility === "public" ? <IconEyeOff /> : <IconEye />}
                    {visibilityLoading
                      ? "Updating\u2026"
                      : publishedVisibility === "public"
                        ? "Make Private"
                        : "Make Public"}
                    <ActionHint text={publishedVisibility === "public"
                      ? "Hide this article from the public site (keeps it published in admin)."
                      : "Make this article visible on the public site again."}
                    />
                  </button>
                  {confirmAction === "unpublish" ? (
                    <div className="flex gap-2" style={{ padding: "0.5rem 0" }}>
                      <button className="admin-btn admin-btn-red admin-btn-half" onClick={handleUnpublish} disabled={actionLoading === "unpublish"}>
                        {actionLoading === "unpublish" ? "\u2026" : "Confirm Unpublish"}
                      </button>
                      <button className="admin-btn admin-btn-outline admin-btn-half" onClick={() => setConfirmAction(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="admin-btn admin-btn-red-outline" onClick={() => setConfirmAction("unpublish")}>
                      <IconArchive /> Unpublish
                      <ActionHint text="Remove the article from the public site. It will revert to Accepted status." />
                    </button>
                  )}
                </>
              )}

              {/* Rejected */}
              {submission.status === "rejected" && (
                <button className="admin-btn admin-btn-outline" onClick={handleReopen} disabled={actionLoading === "reopen"}>
                  <IconRefresh /> {actionLoading === "reopen" ? "Reopening\u2026" : "Reopen"}
                  <ActionHint text="Return this submission to Submitted status for reconsideration." />
                </button>
              )}

              {/* Archive */}
              <div style={{ borderTop: "1px dashed #e5e7eb", marginTop: 12, paddingTop: 10 }}>
                {confirmArchive ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="admin-btn admin-btn-red-outline admin-btn-half"
                      onClick={handleArchive}
                      disabled={actionLoading === "archive"}
                    >
                      {actionLoading === "archive" ? "Archiving\u2026" : "Yes, archive"}
                    </button>
                    <button
                      className="admin-btn admin-btn-outline admin-btn-half"
                      onClick={() => setConfirmArchive(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="admin-btn admin-btn-indigo"
                    onClick={() => setConfirmArchive(true)}
                    disabled={!!actionLoading}
                  >
                    <IconBookClosed /> Archive article
                    <ActionHint text="Permanently move this article to the archive. If published, it will be removed from the public site. You will be asked to confirm by typing the article title." />
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Payment */}
            <div style={{
              background: "#f9fafb",
              borderRadius: 12,
              padding: "14px 10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <h4 className="card-heading">Payment</h4>

              {/* Status indicator */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 10,
                background: submission.paymentStatus === "paid" ? "#f0fdf4"
                  : submission.paymentStatus === "pending" ? "#fffbeb"
                  : "#f9fafb",
                border: `1px solid ${
                  submission.paymentStatus === "paid" ? "#bbf7d0"
                  : submission.paymentStatus === "pending" ? "#fde68a"
                  : "#e5e7eb"
                }`,
              }}>
                <span style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: submission.paymentStatus === "paid" ? "#16a34a"
                    : submission.paymentStatus === "pending" ? "#d97706"
                    : "#9ca3af",
                }} />
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: submission.paymentStatus === "paid" ? "#16a34a"
                    : submission.paymentStatus === "pending" ? "#d97706"
                    : "#6b7280",
                }}>
                  {submission.paymentStatus === "paid" ? "Paid" : submission.paymentStatus === "pending" ? "Pending" : submission.paymentStatus === "failed" ? "Failed" : "Unpaid"}
                </span>
                {submission.paymentAmount ? (
                  <span style={{ fontSize: "0.78rem", color: "#6b7280", marginLeft: "auto" }}>
                    ${(submission.paymentAmount / 100).toFixed(2)}
                  </span>
                ) : null}
                {submission.paidAt ? (
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {formatDate(submission.paidAt)}
                  </span>
                ) : null}
              </div>

              {/* Send Payment Link button — show when unpaid or failed */}
              {(!submission.paymentStatus || submission.paymentStatus === "unpaid" || submission.paymentStatus === "failed") && (
                <button
                  className="admin-btn admin-btn-green"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <IconSend /> Send Payment Link
                  <ActionHint text="Create a Stripe checkout link and email it to the author." />
                </button>
              )}

              {/* Resend when pending */}
              {submission.paymentStatus === "pending" && (
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <IconSend /> Resend Payment Link
                  <ActionHint text="Create a new Stripe checkout link and email it again." />
                </button>
              )}
            </div>

          </div>
        </>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentLinkModal
          submissionId={submission.id}
          submissionTitle={submission.title}
          onClose={() => setShowPaymentModal(false)}
          onSent={() => {
            setShowPaymentModal(false);
            onRefresh();
          }}
        />
      )}

      {/* TAB: Reviewers */}
      {detailTab === "reviewers" && (
        <div className="p-5 flex-1 bg-white">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subAssignments.map((a) => {
              const review = subReviews.find((r) => r.assignmentId === a.id);
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#fff",
                    border: "none",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 6px 20px rgba(37,99,235,0.22), 0 2px 8px rgba(37,99,235,0.12)"; el.style.background = "#e8f0fe"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "0 3px 12px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)"; el.style.background = "#fff"; }}
                >
                  {/* User icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.875rem" }} className="truncate">
                        {a.reviewerName || a.reviewerEmail}
                      </span>
                      <span
                        className={`shrink-0 ${
                          review ? "bg-green-100 text-green-700" :
                          a.status === "declined" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}
                        style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: 999, lineHeight: 1.2 }}
                      >
                        {review ? "submitted" : a.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>
                      Invited {formatDate(a.invitedAt)} &middot; Due {formatDate(a.dueAt)}
                    </div>
                    <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
                      {manuscriptUrls[a.id] ? (
                        <a href={manuscriptUrls[a.id]} target="_blank" rel="noopener noreferrer" className="admin-link-btn" style={{ fontSize: "0.7rem", color: "#16a34a" }}>
                          View Manuscript
                        </a>
                      ) : (
                        <button className="admin-link-btn" onClick={() => loadManuscriptUrl(a.id)} disabled={msLoading[a.id]} style={{ fontSize: "0.7rem" }}>
                          {msLoading[a.id] ? "Loading\u2026" : "View Manuscript"}
                        </button>
                      )}
                      {review && (
                        <button
                          className="admin-link-btn"
                          style={{ fontSize: "0.7rem", color: "#2563eb" }}
                          onClick={() => setReviewReport({ review, name: a.reviewerName || a.reviewerEmail || "Reviewer" })}
                        >
                          View Report
                        </button>
                      )}
                    </div>
                    {/* Compact summary when review submitted */}
                    {review && (
                      <div
                        className="mt-2 flex items-center gap-2 cursor-pointer"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => setReviewReport({ review, name: a.reviewerName || a.reviewerEmail || "Reviewer" })}
                      >
                        <span style={{ fontWeight: 700, color: recColor[review.recommendation || ""] || "#374151" }}>
                          {review.recommendation}
                        </span>
                        {review.score !== null && (
                          <span style={{ color: "#9ca3af" }}>{review.score}/5</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add reviewer action — available from reviewers tab too */}
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => setShowReviewerModal(true)}
            style={{ marginTop: 12 }}
          >
            <IconUserPlus /> Add Reviewer
          </button>
        </div>
      )}

      {/* Certificate author selection popup */}
      {showCertPopup && (
        <div
          className="cert-popup-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setShowCertPopup(false)}
        >
          <div
            className="cert-popup-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="cert-popup-header">
              <div className="flex items-center justify-between">
                <h2 style={{ color: "#ffffff", fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                  Download Certificate
                </h2>
                <button
                  className="cert-popup-close"
                  onClick={() => setShowCertPopup(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", marginTop: "0.375rem" }}>
                Select an author to generate their individual certificate
              </p>
            </div>

            {/* Author list */}
            <div style={{ padding: "1rem 1.25rem" }}>
              {allAuthors.map((name, i) => (
                <button
                  key={i}
                  className={`cert-author-btn${certLoading === name ? " loading" : ""}`}
                  onClick={() => generateCertForAuthor(name)}
                  disabled={certLoading === name}
                >
                  {/* Author avatar circle */}
                  <div
                    className="cert-author-avatar"
                    style={{
                      background: `linear-gradient(135deg, ${["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][i % 5]}, ${["#1d4ed8", "#6d28d9", "#0891b2", "#059669", "#d97706"][i % 5]})`,
                    }}
                  >
                    {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cert-author-name">{name}</p>
                    <p className="cert-author-role">
                      {i === 0 ? "Primary Author" : "Co-Author"}
                    </p>
                  </div>
                  {/* Download icon or spinner */}
                  {certLoading === name ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="animate-spin" style={{ flexShrink: 0 }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.5rem 1.75rem 1.25rem", textAlign: "center" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                Each author receives a personalized certificate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI readiness popup */}
      {aiReviewOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={() => setAiReviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>AI Readiness Review</h2>
                <p className="text-xs text-gray-500 mt-1">Short, human-style verdict for editorial triage</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1" onClick={() => setAiReviewOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
              {aiReviewLoading && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin text-blue-600">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  Generating review… this may take a few seconds.
                </div>
              )}

              {!aiReviewLoading && aiReviewError && (
                <div className="text-sm text-red-600">
                  {aiReviewError}
                </div>
              )}

              {!aiReviewLoading && aiReviewResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: aiReadinessStyle[aiReviewResult.readiness].bg,
                        color: aiReadinessStyle[aiReviewResult.readiness].color,
                      }}
                    >
                      {aiReadinessLabel[aiReviewResult.readiness]}
                    </span>
                    <span className="text-xs text-gray-500">
                      Confidence: {aiReviewResult.confidence}
                    </span>
                  </div>

                  {aiReviewResult.metrics && (
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                      <div className="rounded-lg border border-gray-200 p-2">
                        <div className="text-gray-400">Keyword alignment</div>
                        <div className="font-semibold">
                          {aiReviewResult.metrics.keywordAlignmentScore}% ({aiReviewResult.metrics.keywordAlignment})
                        </div>
                        <div className="text-gray-400">
                          {aiReviewResult.metrics.keywordMatchCount}/{aiReviewResult.metrics.keywordCount} matched
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-2">
                        <div className="text-gray-400">Pages</div>
                        <div className="font-semibold">
                          {aiReviewResult.metrics.pageCount ?? "\u2014"}
                        </div>
                        <div className="text-gray-400">from PDF</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-2">
                        <div className="text-gray-400">Abstract words</div>
                        <div className="font-semibold">{aiReviewResult.metrics.abstractWordCount}</div>
                        <div className="text-gray-400">estimate</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-2">
                        <div className="text-gray-400">Numbers in abstract</div>
                        <div className="font-semibold">{aiReviewResult.metrics.numberMentions}</div>
                        <div className="text-gray-400">quant signals</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-2">
                        <div className="text-gray-400">Method signals</div>
                        <div className="font-semibold">{aiReviewResult.metrics.methodSignals}</div>
                        <div className="text-gray-400">keyword hits</div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 leading-relaxed">{aiReviewResult.summary}</p>

                  {aiReviewResult.checklist && aiReviewResult.checklist.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        Checklist
                      </div>
                      <div className="mt-2 space-y-2">
                        {aiReviewResult.checklist.map((item, idx) => {
                          const icon = checklistIcon(item.status);
                          return (
                            <div key={`${item.label}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                              <div className="text-gray-700">{item.label}</div>
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ color: icon.color, background: icon.bg }}
                              >
                                {icon.icon} {item.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {aiReviewResult.details && aiReviewResult.details.length > 0 && (
                    <div>
                      <button
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        onClick={() => setAiReviewShowDetails((v) => !v)}
                      >
                        {aiReviewShowDetails ? "Hide details" : "View details"}
                      </button>
                      {aiReviewShowDetails && (
                        <ul className="mt-2 text-sm text-gray-700 space-y-1">
                          {aiReviewResult.details.map((item, idx) => (
                            <li key={`${item}-${idx}`} className="flex gap-2">
                              <span className="mt-[2px] text-gray-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="admin-btn admin-btn-outline"
                onClick={requestAiReview}
                disabled={aiReviewLoading}
              >
                {aiReviewLoading ? "Running…" : aiReviewResult ? "Run Again" : "Generate"}
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => setAiReviewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abstract popup */}
      {showAbstract && submission.abstract && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setShowAbstract(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 10px 24px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <button
                className="admin-link-btn"
                onClick={() => setShowAbstract(false)}
                style={{ fontSize: "1.5rem", lineHeight: 1, color: "#9ca3af" }}
              >
                &#x2715;
              </button>
            </div>

            {/* Title */}
            <h2 style={{ color: "#111827", fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4, marginBottom: "0.75rem" }}>
              {submission.title}
            </h2>

            {/* Authors */}
            <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {submission.userName || "Unknown"}
              {coAuthors.map((ca, i) => (
                <span key={i}>, {ca.name}</span>
              ))}
            </p>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: "1.25rem" }} />

            {/* Abstract label */}
            <h3 style={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Abstract
            </h3>

            {/* Abstract text */}
            <p style={{ color: "#374151", fontSize: "0.875rem", lineHeight: 1.85, textAlign: "justify" }}>
              {submission.abstract}
            </p>
          </div>
        </div>
      )}

      {/* Publish success popup */}
      {publishPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setPublishPopup(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 10px 24px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top banner */}
            <div
              style={{
                background: publishPopup.live
                  ? "linear-gradient(135deg, #059669, #10b981)"
                  : "linear-gradient(135deg, #d97706, #f59e0b)",
                padding: "2rem 2rem 1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                {publishPopup.live ? "\u2713" : "!"}
              </div>
              <h2 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {publishPopup.live ? "Article Published" : "Published with Warning"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {publishPopup.live
                  ? "The article is live and accessible on the site"
                  : "The database was updated but the page could not be verified"}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem 2rem 2rem" }}>
              <p style={{ color: "#6b7280", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Article</p>
              <p style={{ color: "#111827", fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.4, marginBottom: "1.25rem" }}>
                {publishPopup.title}
              </p>

              {/* Link */}
              <a
                href={`https://americanimpactreview.com/article/${publishPopup.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.875rem 1rem",
                  background: publishPopup.live ? "#f0fdf4" : "#fffbeb",
                  border: publishPopup.live ? "1px solid #bbf7d0" : "1px solid #fde68a",
                  borderRadius: "0.75rem",
                  color: publishPopup.live ? "#166534" : "#92400e",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  marginBottom: "1rem",
                  transition: "background 0.15s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  americanimpactreview.com/article/{publishPopup.slug}
                </span>
                {publishPopup.live && (
                  <span style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    flexShrink: 0,
                  }} />
                )}
              </a>

              {!publishPopup.live && (
                <p style={{ color: "#92400e", fontSize: "0.8125rem", lineHeight: 1.5, marginBottom: "1rem" }}>
                  The page may take a moment to appear. Try the link above &mdash; if it doesn&apos;t load, check the Explore page or the article slug.
                </p>
              )}

              <button
                onClick={() => setPublishPopup(null)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish verification popup */}
      {unpublishPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => { if (unpublishPopup.done) setUnpublishPopup(null); }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 10px 24px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top banner */}
            <div
              style={{
                background: !unpublishPopup.done
                  ? "linear-gradient(135deg, #475569, #64748b)"
                  : unpublishPopup.allPassed
                    ? "linear-gradient(135deg, #059669, #10b981)"
                    : "linear-gradient(135deg, #d97706, #f59e0b)",
                padding: "2rem 2rem 1.5rem",
                textAlign: "center",
              }}
            >
              {!unpublishPopup.done ? (
                <div style={{ marginBottom: "0.5rem" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="animate-spin" style={{ display: "inline-block" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </div>
              ) : (
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                  {unpublishPopup.allPassed ? "\u2713" : "!"}
                </div>
              )}
              <h2 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                {!unpublishPopup.done
                  ? "Verifying Removal\u2026"
                  : unpublishPopup.allPassed
                    ? "Article Removed"
                    : "Removed with Warnings"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                {!unpublishPopup.done
                  ? "Checking that the article is gone from all pages"
                  : unpublishPopup.allPassed
                    ? "The article has been completely removed from the site"
                    : "Some checks did not pass \u2014 see details below"}
              </p>
            </div>

            {/* Checks list */}
            <div style={{ padding: "1.5rem 2rem 0.5rem" }}>
              <p style={{ color: "#6b7280", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Article</p>
              <p style={{ color: "#111827", fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.4, marginBottom: "1.25rem" }}>
                {unpublishPopup.title}
              </p>

              {[
                { key: "articlePage" as const, label: "Article page returns 404", desc: `/article/${unpublishPopup.slug}` },
                { key: "explore" as const, label: "Removed from Explore", desc: "Not listed in article grid or filters" },
                { key: "homepage" as const, label: "Removed from Homepage", desc: "Not shown in Latest Articles" },
                { key: "adminStatus" as const, label: "Database status updated", desc: "Status changed from Published" },
              ].map((item) => {
                const status = unpublishPopup.checks[item.key];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {/* Status indicator */}
                    <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {status === "pending" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="animate-spin">
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                      )}
                      {status === "pass" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {status === "fail" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </div>
                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: status === "pass" ? "#166534" : status === "fail" ? "#dc2626" : "#374151",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        margin: 0,
                      }}>
                        {item.label}
                      </p>
                      <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: "0.125rem 0 0" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 2rem 2rem" }}>
              <button
                onClick={() => setUnpublishPopup(null)}
                disabled={!unpublishPopup.done}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  border: "1px solid #e5e7eb",
                  background: unpublishPopup.done ? "#ffffff" : "#f9fafb",
                  color: unpublishPopup.done ? "#374151" : "#9ca3af",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: unpublishPopup.done ? "pointer" : "not-allowed",
                }}
              >
                {unpublishPopup.done ? "Close" : "Verifying\u2026"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF regeneration loading overlay */}
      {pdfRegenerating && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 360,
              padding: "2.5rem 2rem",
              textAlign: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", margin: "0 0 6px" }}>
              Generating PDF&hellip;
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>
              This usually takes 10–20 seconds.<br />Please don&apos;t close this panel.
            </p>
          </div>
        </div>
      )}

      {/* PDF regeneration result popup */}
      {pdfResult && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setPdfResult(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "1.5rem 2rem 1rem", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>&#10003;</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111", margin: 0 }}>
                PDF Regenerated
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 4 }}>
                {pdfResult.title}
              </p>
            </div>

            {/* Stats */}
            <div style={{ padding: "0 2rem 1.25rem", display: "flex", gap: 12, justifyContent: "center" }}>
              <div style={{
                flex: 1, textAlign: "center", padding: "0.75rem", borderRadius: 10,
                background: "#f0fdf4",
              }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#16a34a" }}>
                  {pdfResult.pageCount}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>pages</div>
              </div>
              <div style={{
                flex: 1, textAlign: "center", padding: "0.75rem", borderRadius: 10,
                background: "#eff6ff",
              }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#2563eb" }}>
                  {(pdfResult.size / 1024).toFixed(0)} KB
                </div>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>file size</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 2rem 1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => {
                  window.open(`https://americanimpactreview.com/article/${pdfResult.slug}`, "_blank");
                }}
                style={{
                  width: "100%", padding: "0.7rem", borderRadius: 10, border: "none",
                  background: "#2563eb", color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View article
              </button>
              <button
                onClick={() => {
                  window.open(pdfResult.pdfUrl, "_blank");
                }}
                style={{
                  width: "100%", padding: "0.7rem", borderRadius: 10,
                  border: "1px solid #e5e7eb", background: "#fff",
                  color: "#374151", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
                }}
              >
                Download PDF
              </button>
              <button
                onClick={() => setPdfResult(null)}
                style={{
                  width: "100%", padding: "0.5rem", borderRadius: 10,
                  border: "none", background: "transparent",
                  color: "#9ca3af", fontSize: "0.8rem", cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review report modal */}
      {reviewReport && (
        <ReviewReportModal
          review={reviewReport.review}
          reviewerName={reviewReport.name}
          submissionTitle={submission.title}
          onClose={() => setReviewReport(null)}
        />
      )}

      {/* Reviewer modal */}
      {showReviewerModal && (
        <SendReviewerModal
          submissionId={submission.id}
          onClose={() => setShowReviewerModal(false)}
          onSent={() => {
            setShowReviewerModal(false);
            onRefresh();
          }}
        />
      )}

      {/* Decision modal (revisions / reject) */}
      {decisionModal && (
        <DecisionModal
          type={decisionModal}
          submissionTitle={submission.title}
          initialReviewerComments={buildReviewerComments(assignments, reviews, submission.id)}
          onSend={handleDecisionSend}
          onClose={() => setDecisionModal(null)}
        />
      )}
    </div>
  );
}
