import { useState } from "react";
import StatusBadge from "./StatusBadge";
import SendReviewerModal from "./SendReviewerModal";
import type { Submission } from "./SubmissionsTable";

// Map submission titles to article slugs (filename without .md)
const ARTICLE_SLUG_MAP: Record<string, string> = {
  "Monitoring and Scalability of High-Load Systems": "e2026001",
  "Diagnostic Capabilities of Hardware-Software Systems": "e2026002",
  "Finger Dermatoglyphics as Predictive Markers": "e2026003",
  "Laboratory Assessment of Aerobic and Anaerobic": "e2026004",
  "Genetic Markers for Talent Identification": "e2026005",
  "Longitudinal Physiological Monitoring": "e2026006",
  "Leveraging Artificial Intelligence for Scalable": "e2026007",
};

function getArticleSlug(title: string): string | null {
  for (const [prefix, slug] of Object.entries(ARTICLE_SLUG_MAP)) {
    if (title.startsWith(prefix)) return slug;
  }
  return null;
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
    await updateStatus("accepted");
  });

  const handleRequestRevisions = () => doAction("revisions", async () => {
    await sendDecision("major_revision");
    await updateStatus("revision_requested");
  });

  const handlePublish = () => doAction("publish", async () => {
    await updateStatus("published");
  });

  const handleUnpublish = () => doAction("unpublish", async () => {
    await updateStatus("accepted");
  });

  const handleRemind = async (assignmentId: string) => {
    setActionLoading("remind-" + assignmentId);
    try {
      await fetch(`/api/local-admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invited" }),
      });
      alert("Reminder sent");
    } catch {
      alert("Failed to send reminder");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateManuscript = async (assignmentId: string) => {
    setActionLoading("ms-" + assignmentId);
    try {
      const res = await fetch("/api/local-admin/review-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Generation failed");
      }
      const { url } = await res.json();
      setManuscriptUrls((prev) => ({ ...prev, [assignmentId]: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate manuscript");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-[380px] h-screen border-l border-gray-200 overflow-y-auto flex flex-col shrink-0" style={{ background: "#f9fafb", color: "#111827" }}>
      {/* Header info */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <StatusBadge status={submission.status} showInfo />
        <h3 className="text-base font-semibold mt-3 leading-snug" style={{ color: "#111827" }}>{submission.title}</h3>
        <div className="mt-3 space-y-1.5 text-sm" style={{ color: "#6b7280" }}>
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
          <p><span style={{ color: "#9ca3af" }}>Category:</span> {submission.category}</p>
          <p><span style={{ color: "#9ca3af" }}>Submitted:</span> {formatDate(submission.createdAt)}</p>
          {submission.articleType && <p><span style={{ color: "#9ca3af" }}>Type:</span> {submission.articleType}</p>}
        </div>

      </div>

      {/* Reviewers section (when applicable) */}
      {subAssignments.length > 0 && (
        <div className="p-5 border-b border-gray-200 bg-white">
          <h4 className="text-sm font-medium mb-3" style={{ color: "#374151" }}>Reviewers ({subAssignments.length})</h4>
          <div className="space-y-3">
            {subAssignments.map((a) => {
              const review = subReviews.find((r) => r.assignmentId === a.id);
              return (
                <div key={a.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: "#1f2937" }}>{a.reviewerName || a.reviewerEmail}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review ? "bg-green-100 text-green-700" :
                      a.status === "declined" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {review ? "Submitted" : a.status}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                    Invited {formatDate(a.invitedAt)} · Due {formatDate(a.dueAt)}
                  </p>
                  {review && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg text-xs">
                      <p><strong>Recommendation:</strong> {review.recommendation}</p>
                      {review.score !== null && <p><strong>Score:</strong> {review.score}/10</p>}
                      {review.commentsToEditor && (
                        <p className="mt-1" style={{ color: "#4b5563" }}>{review.commentsToEditor}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {!review && a.status !== "declined" && (
                      <button
                        className="admin-link-btn"
                        onClick={() => handleRemind(a.id)}
                        disabled={actionLoading === "remind-" + a.id}
                      >
                        {actionLoading === "remind-" + a.id ? "Sending…" : "Send Reminder"}
                      </button>
                    )}
                    {manuscriptUrls[a.id] ? (
                      <a
                        href={manuscriptUrls[a.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-link-btn"
                        style={{ color: "#16a34a" }}
                      >
                        View Manuscript
                      </a>
                    ) : (
                      <button
                        className="admin-link-btn"
                        onClick={() => handleGenerateManuscript(a.id)}
                        disabled={actionLoading === "ms-" + a.id}
                      >
                        {actionLoading === "ms-" + a.id ? "Generating…" : "Generate Manuscript"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions by status */}
      <div className="p-5 flex-1">
        <h4 className="text-sm font-medium mb-1" style={{ color: "#374151" }}>Actions</h4>
        <div>

          {/* Always-visible: PDF + manuscript */}
          {submission.manuscriptUrl && (
            <a
              href={submission.manuscriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-outline"
            >
              <IconFileText /> View PDF
            </a>
          )}

          {/* Submitted */}
          {submission.status === "submitted" && (
            <>
              <button className="admin-btn admin-btn-primary" onClick={() => setShowReviewerModal(true)}>
                <IconSend /> Send to Reviewer
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
                </button>
              )}
            </>
          )}

          {/* Under Review */}
          {submission.status === "under_review" && (
            <>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                <IconUserPlus /> Add Another Reviewer
              </button>
              <button className="admin-btn admin-btn-green" onClick={handleAccept} disabled={actionLoading === "accept"}>
                <IconCheck /> {actionLoading === "accept" ? "Processing…" : "Accept"}
              </button>
              <button className="admin-btn admin-btn-orange" onClick={handleRequestRevisions} disabled={actionLoading === "revisions"}>
                <IconEdit /> {actionLoading === "revisions" ? "Processing…" : "Request Revisions"}
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
              </button>
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowReviewerModal(true)}>
                <IconSend /> Send to Reviewer Again
              </button>
            </>
          )}

          {/* Accepted */}
          {submission.status === "accepted" && (
            <button className="admin-btn admin-btn-green" onClick={handlePublish} disabled={actionLoading === "publish"}>
              <IconUpload /> {actionLoading === "publish" ? "Publishing…" : "Publish"}
            </button>
          )}

          {/* Published */}
          {submission.status === "published" && (
            <>
              {getArticleSlug(submission.title) ? (
                <a
                  href={`/article/${getArticleSlug(submission.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-outline"
                >
                  <IconGlobe /> View on Site
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
            </button>
          )}
        </div>
      </div>

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
