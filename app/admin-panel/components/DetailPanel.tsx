import { useState } from "react";
import StatusBadge from "./StatusBadge";
import SendReviewerModal from "./SendReviewerModal";
import type { Submission } from "./SubmissionsTable";

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
  if (!dateStr) return "—";
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

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
      // Re-send by updating assignment (triggers email in some setups)
      // For now, we'll create a new assignment notification
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

  return (
    <div className="w-[380px] h-screen border-l border-gray-200 bg-gray-50 overflow-y-auto flex flex-col shrink-0">
      {/* Header info */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <StatusBadge status={submission.status} />
        <h3 className="text-base font-semibold text-gray-900 mt-3 leading-snug">{submission.title}</h3>
        <div className="mt-3 space-y-1.5 text-sm text-gray-500">
          <p><span className="text-gray-400">Author:</span> {submission.userName || "Unknown"}</p>
          {submission.userEmail && <p><span className="text-gray-400">Email:</span> {submission.userEmail}</p>}
          <p><span className="text-gray-400">Category:</span> {submission.category}</p>
          <p><span className="text-gray-400">Submitted:</span> {formatDate(submission.createdAt)}</p>
          {submission.articleType && <p><span className="text-gray-400">Type:</span> {submission.articleType}</p>}
        </div>

        {submission.manuscriptUrl && (
          <a
            href={submission.manuscriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            📎 {submission.manuscriptName || "Download Manuscript"}
          </a>
        )}
      </div>

      {/* Reviewers section (when applicable) */}
      {subAssignments.length > 0 && (
        <div className="p-5 border-b border-gray-200 bg-white">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Reviewers ({subAssignments.length})</h4>
          <div className="space-y-3">
            {subAssignments.map((a) => {
              const review = subReviews.find((r) => r.assignmentId === a.id);
              return (
                <div key={a.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{a.reviewerName || a.reviewerEmail}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review ? "bg-green-100 text-green-700" :
                      a.status === "declined" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {review ? "Submitted" : a.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Invited {formatDate(a.invitedAt)} · Due {formatDate(a.dueAt)}
                  </p>
                  {review && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg text-xs">
                      <p><strong>Recommendation:</strong> {review.recommendation}</p>
                      {review.score !== null && <p><strong>Score:</strong> {review.score}/10</p>}
                      {review.commentsToEditor && (
                        <p className="mt-1 text-gray-600">{review.commentsToEditor}</p>
                      )}
                    </div>
                  )}
                  {!review && a.status !== "declined" && (
                    <button
                      onClick={() => handleRemind(a.id)}
                      disabled={actionLoading === "remind-" + a.id}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {actionLoading === "remind-" + a.id ? "Sending…" : "Send Reminder"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions by status */}
      <div className="p-5 flex-1">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
        <div className="space-y-2.5">

          {/* Submitted */}
          {submission.status === "submitted" && (
            <>
              <button
                onClick={() => setShowReviewerModal(true)}
                className="w-full px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Send to Reviewer
              </button>
              {confirmAction === "reject" ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === "reject"}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === "reject" ? "…" : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction("reject")}
                  className="w-full px-4 py-2.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
              )}
            </>
          )}

          {/* Under Review */}
          {submission.status === "under_review" && (
            <>
              <button
                onClick={() => setShowReviewerModal(true)}
                className="w-full px-4 py-2.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Add Another Reviewer
              </button>
              <button
                onClick={handleAccept}
                disabled={actionLoading === "accept"}
                className="w-full px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading === "accept" ? "Processing…" : "Accept"}
              </button>
              <button
                onClick={handleRequestRevisions}
                disabled={actionLoading === "revisions"}
                className="w-full px-4 py-2.5 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {actionLoading === "revisions" ? "Processing…" : "Request Revisions"}
              </button>
              {confirmAction === "reject-review" ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === "reject"}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === "reject" ? "…" : "Confirm Reject"}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction("reject-review")}
                  className="w-full px-4 py-2.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
              )}
            </>
          )}

          {/* Revision Requested */}
          {submission.status === "revision_requested" && (
            <>
              <p className="text-sm text-gray-500 italic">Waiting for author revision…</p>
              <button
                onClick={handleAccept}
                disabled={actionLoading === "accept"}
                className="w-full px-4 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading === "accept" ? "Processing…" : "Accept Revision"}
              </button>
              <button
                onClick={() => setShowReviewerModal(true)}
                className="w-full px-4 py-2.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Send to Reviewer Again
              </button>
            </>
          )}

          {/* Accepted */}
          {submission.status === "accepted" && (
            <button
              onClick={handlePublish}
              disabled={actionLoading === "publish"}
              className="w-full px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {actionLoading === "publish" ? "Publishing…" : "Publish"}
            </button>
          )}

          {/* Published */}
          {submission.status === "published" && (
            <>
              <a
                href={`/article/${submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2.5 text-sm text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View on Site
              </a>
              {confirmAction === "unpublish" ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleUnpublish}
                    disabled={actionLoading === "unpublish"}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === "unpublish" ? "…" : "Confirm Unpublish"}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction("unpublish")}
                  className="w-full px-4 py-2.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Unpublish
                </button>
              )}
            </>
          )}

          {/* Rejected */}
          {submission.status === "rejected" && (
            <p className="text-sm text-gray-400 italic">This submission has been rejected.</p>
          )}
        </div>
      </div>

      {/* Abstract section at bottom */}
      {submission.abstract && (
        <div className="p-5 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Abstract</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{submission.abstract}</p>
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
