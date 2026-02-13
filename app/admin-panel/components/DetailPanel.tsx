import { useState, useRef, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge";
import SendReviewerModal from "./SendReviewerModal";
import type { Submission } from "./SubmissionsTable";
import { TAXONOMY, CATEGORIES, CATEGORY_COLORS } from "@/lib/taxonomy";

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
        className="cursor-help opacity-40 hover:opacity-80 transition-opacity"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {show && (
        <div
          className={`absolute z-50 right-0 w-56 px-3 py-2 rounded-lg text-xs leading-relaxed font-normal text-gray-700 bg-white border border-gray-200 ${
            above ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.13)", pointerEvents: "none" }}
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
function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

const recColor: Record<string, string> = {
  Accept: "#059669",
  "Minor Revision": "#d97706",
  "Major Revision": "#ea580c",
  Reject: "#dc2626",
};

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
              ? review.commentsToAuthor.slice(0, 300) + "…"
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

  // Category/subject inline edit
  const [editingCatSub, setEditingCatSub] = useState(false);
  const [editCat, setEditCat] = useState(submission.category);
  const [editSub, setEditSub] = useState(submission.subject || "");
  const [savingCatSub, setSavingCatSub] = useState(false);
  // Published article slug (fetched after accept)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  // Fetch published slug for this submission
  useEffect(() => {
    if (submission.status === "published") {
      fetch("/api/local-admin/publishing")
        .then((r) => r.json())
        .then((articles: { submissionId?: string; slug: string }[]) => {
          const match = articles.find((a) => a.submissionId === submission.id);
          setPublishedSlug(match?.slug || null);
        })
        .catch(() => {});
    }
  }, [submission.id, submission.status]);

  // Parse co-authors
  const coAuthors: { name: string; email?: string; affiliation?: string }[] = (() => {
    if (!submission.coAuthors) return [];
    try {
      const parsed = JSON.parse(submission.coAuthors);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const totalAuthors = 1 + coAuthors.length;

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

  const updateStatus = async (status: string) => {
    await fetch(`/api/local-admin/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const sendDecision = async (decision: string) => {
    await fetch("/api/local-admin/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: submission.id,
        decision,
        reviewerComments: "",
        editorComments: "",
      }),
    });
  };

  const handleReject = () => doAction("reject", async () => {
    await sendDecision("reject");
    await updateStatus("rejected");
  });

  const handleAccept = () => doAction("accept", async () => {
    await sendDecision("accept");
    // Build authors array from userName + coAuthors
    const authorNames: string[] = [submission.userName || "Unknown"];
    if (submission.coAuthors) {
      try {
        const cas = JSON.parse(submission.coAuthors);
        if (Array.isArray(cas)) cas.forEach((ca: { name?: string }) => { if (ca.name) authorNames.push(ca.name); });
      } catch {}
    }
    const slug = makeSlug(submission.title);
    // Create published article
    const pubRes = await fetch("/api/local-admin/publishing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: submission.id,
        title: submission.title,
        slug,
        abstract: submission.abstract || "",
        category: submission.category,
        subject: submission.subject || "",
        authors: JSON.stringify(authorNames),
        keywords: submission.keywords || "",
        manuscriptUrl: submission.manuscriptUrl || "",
        authorUsername: submission.userName || "",
        articleType: submission.articleType || "",
        status: "published",
        year: new Date().getFullYear(),
      }),
    });
    if (!pubRes.ok) {
      const d = await pubRes.json().catch(() => ({}));
      throw new Error(d.error || "Failed to publish article");
    }
    const pubData = await pubRes.json();
    setPublishedSlug(pubData.slug || slug);
    await updateStatus("published");
  });

  const handleRequestRevisions = () => doAction("revisions", async () => {
    await sendDecision("major_revision");
    await updateStatus("revision_requested");
  });

  const handleUnpublish = () => doAction("unpublish", async () => {
    await updateStatus("accepted");
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
        <StatusBadge status={submission.status} showInfo />
        <h3 className="text-base font-semibold mt-3 leading-snug" style={{ color: "#111827" }}>{submission.title}</h3>

        {/* Pill toggle — only show when there are reviewers */}
        {subAssignments.length > 0 && (
          <div className="pill-toggle mt-4">
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
        )}
      </div>

      {/* TAB: Details (info + actions) */}
      {detailTab === "info" && (
        <>
          <div className="p-5 border-b border-gray-200 bg-white">
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
                        {ca.name}{ca.affiliation ? ` — ${ca.affiliation}` : ""}
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
                    <option value="">— No subject —</option>
                    {(TAXONOMY[editCat] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button className="admin-link-btn" onClick={saveCatSub} disabled={savingCatSub} style={{ fontSize: "0.75rem", color: "#059669" }}>{savingCatSub ? "Saving…" : "Save"}</button>
                    <button className="admin-link-btn" onClick={() => setEditingCatSub(false)} style={{ fontSize: "0.75rem" }}>Cancel</button>
                  </div>
                </div>
              )}
              <p><span style={{ color: "#9ca3af" }}>Submitted:</span> {formatDate(submission.createdAt)}</p>
              {submission.articleType && <p><span style={{ color: "#9ca3af" }}>Type:</span> {submission.articleType}</p>}
            </div>
          </div>

          {/* Actions by status */}
          <div className="p-5 flex-1">
            <h4 className="text-sm font-medium mb-1" style={{ color: "#374151" }}>Actions</h4>
            <div>

          {/* Always-visible: original manuscript source file */}
          {submission.manuscriptUrl && (
            <a
              href={submission.manuscriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-outline"
            >
              <IconFileText /> View Source File
              <ActionHint text="Open the original manuscript file submitted by the author (Word/PDF)." />
            </a>
          )}

          {/* Submitted */}
          {submission.status === "submitted" && (
            <>
              <button className="admin-btn admin-btn-primary" onClick={() => setShowReviewerModal(true)}>
                <IconSend /> Send to Reviewer
                <ActionHint text="Assign a peer reviewer. They will receive an email invitation with a review copy PDF." />
              </button>
              {confirmAction === "reject" ? (
                <div className="flex gap-2" style={{ padding: "0.5rem 0" }}>
                  <button className="admin-btn admin-btn-red admin-btn-half" onClick={handleReject} disabled={actionLoading === "reject"}>
                    {actionLoading === "reject" ? "…" : "Confirm Reject"}
                  </button>
                  <button className="admin-btn admin-btn-outline admin-btn-half" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="admin-btn admin-btn-red-outline" onClick={() => setConfirmAction("reject")}>
                  <IconX /> Reject
                  <ActionHint text="Decline the manuscript without sending for review. The author will be notified." />
                </button>
              )}
            </>
          )}

          {/* Under Review */}
          {submission.status === "under_review" && (
            <>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                <IconUserPlus /> Add Another Reviewer
                <ActionHint text="Invite an additional reviewer for a broader evaluation." />
              </button>
              <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                <IconCheck /> {actionLoading === "accept" ? "Processing…" : "Accept"}
                <ActionHint text="Accept the manuscript for publication based on reviewer recommendations." />
              </button>
              <button className="admin-btn admin-btn-orange" onClick={handleRequestRevisions} disabled={actionLoading === "revisions"}>
                <IconEdit /> {actionLoading === "revisions" ? "Processing…" : "Request Revisions"}
                <ActionHint text="Ask the author to revise based on reviewer feedback before a final decision." />
              </button>
              {confirmAction === "reject-review" ? (
                <div className="flex gap-2" style={{ padding: "0.5rem 0" }}>
                  <button className="admin-btn admin-btn-red admin-btn-half" onClick={handleReject} disabled={actionLoading === "reject"}>
                    {actionLoading === "reject" ? "…" : "Confirm Reject"}
                  </button>
                  <button className="admin-btn admin-btn-outline admin-btn-half" onClick={() => setConfirmAction(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="admin-btn admin-btn-red-outline" onClick={() => setConfirmAction("reject-review")}>
                  <IconX /> Reject
                  <ActionHint text="Decline the manuscript after peer review. The author will be notified." />
                </button>
              )}
            </>
          )}

          {/* Revision Requested */}
          {submission.status === "revision_requested" && (
            <>
              <p className="text-sm italic" style={{ color: "#6b7280", padding: "0.5rem 1rem" }}>Waiting for author revision…</p>
              <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                <IconCheck /> {actionLoading === "accept" ? "Processing…" : "Accept Revision"}
                <ActionHint text="Accept the revised manuscript for publication." />
              </button>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                <IconSend /> Send to Reviewer Again
                <ActionHint text="Send the revised manuscript back to reviewers for re-evaluation." />
              </button>
            </>
          )}

          {/* Accepted — article was already published via Accept */}
          {submission.status === "accepted" && (
            <p className="text-sm" style={{ color: "#6b7280", padding: "0.5rem 1rem" }}>
              Accepted — use the Accept action from Under Review to publish.
            </p>
          )}

          {/* Published */}
          {submission.status === "published" && (
            <>
              {publishedSlug ? (
                <a
                  href={`/article/${publishedSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-outline"
                >
                  <IconGlobe /> View on Site
                  <ActionHint text="Open the published article on americanimpactreview.com." />
                </a>
              ) : (
                <span className="block text-sm" style={{ color: "#9ca3af", padding: "0.75rem 1rem" }}>
                  No article page linked
                </span>
              )}
              {confirmAction === "unpublish" ? (
                <div className="flex gap-2" style={{ padding: "0.5rem 0" }}>
                  <button className="admin-btn admin-btn-red admin-btn-half" onClick={handleUnpublish} disabled={actionLoading === "unpublish"}>
                    {actionLoading === "unpublish" ? "…" : "Confirm Unpublish"}
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
            <p className="text-sm italic" style={{ color: "#9ca3af", padding: "0.75rem 1rem" }}>This submission has been rejected.</p>
          )}

          {/* Abstract — always last */}
          {submission.abstract && (
            <button className="admin-btn admin-btn-outline" onClick={() => setShowAbstract(true)}>
              <IconFileText /> View Abstract
              <ActionHint text="View the full abstract of this submission." />
            </button>
          )}
        </div>
      </div>
        </>
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
                      Invited {formatDate(a.invitedAt)} · Due {formatDate(a.dueAt)}
                    </div>
                    <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
                      {manuscriptUrls[a.id] ? (
                        <a href={manuscriptUrls[a.id]} target="_blank" rel="noopener noreferrer" className="admin-link-btn" style={{ fontSize: "0.7rem", color: "#16a34a" }}>
                          View Manuscript
                        </a>
                      ) : (
                        <button className="admin-link-btn" onClick={() => loadManuscriptUrl(a.id)} disabled={msLoading[a.id]} style={{ fontSize: "0.7rem" }}>
                          {msLoading[a.id] ? "Loading…" : "View Manuscript"}
                        </button>
                      )}
                    </div>
                    {review && <ReviewBlock review={review} />}
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
                ✕
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
    </div>
  );
}
