import { useState, useRef, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge";
import SendReviewerModal from "./SendReviewerModal";
import type { Submission } from "./SubmissionsTable";
import {
  generatePublicationCertificate,
  type PublicationCertificateData,
} from "@/lib/generate-publication-certificate";

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
  const [certLoading, setCertLoading] = useState<string | false>(false);
  const [showCertPopup, setShowCertPopup] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
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
    } else {
      setPublishedSlug(null);
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

  const buildAuthorLine = () => {
    const primary = submission.userName || "Unknown";
    const extras = coAuthors.map((c) => c.name).filter(Boolean);
    return [primary, ...extras].join(", ");
  };

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

  const allAuthors: string[] = (() => {
    const primary = submission.userName || "Unknown";
    const extras = coAuthors.map((c) => c.name).filter(Boolean);
    return [primary, ...extras];
  })();

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
      // No existing record — create new (first-time publish from accepted)
      const authorNames: string[] = [submission.userName || "Unknown"];
      if (submission.coAuthors) {
        try {
          const cas = JSON.parse(submission.coAuthors);
          if (Array.isArray(cas)) cas.forEach((ca: { name?: string }) => { if (ca.name) authorNames.push(ca.name); });
        } catch {}
      }
      const slug = makeSlug(submission.title);
      const pubRes = await fetch("/api/local-admin/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          title: submission.title,
          slug,
          abstract: submission.abstract || "",
          category: submission.category,
          subject: "",
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
      finalSlug = pubData.slug || slug;
    }
    await updateStatus("published");
    setPublishedSlug(finalSlug);

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

    setPublishPopup({ slug: finalSlug, title: submission.title, live: isLive, checking: false });
  });

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
                        onClick={() => loadManuscriptUrl(a.id)}
                        disabled={msLoading[a.id]}
                      >
                        {msLoading[a.id] ? "Loading…" : "View Manuscript"}
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
              <ActionHint text="Open the original manuscript file submitted by the author." />
            </a>
          )}

          <button
            className="admin-btn admin-btn-outline"
            onClick={handleCertificatePreview}
            disabled={!!certLoading}
          >
            <IconFileText /> {certLoading ? "Generating…" : "Download Certificate"}
            <ActionHint text={allAuthors.length > 1 ? "Choose an author to generate their individual publication certificate." : "Generate a publication certificate for the author."} />
          </button>

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

          {/* Accepted */}
          {submission.status === "accepted" && (
            <button className="admin-btn admin-btn-green" onClick={handlePublish} disabled={actionLoading === "publish"}>
              <IconUpload /> {actionLoading === "publish" ? "Publishing…" : "Publish"}
              <ActionHint text="Publish the article on the journal website. It will be publicly accessible." />
            </button>
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

      {/* Certificate author selection popup */}
      {showCertPopup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setShowCertPopup(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 10px 24px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                padding: "1.5rem 1.75rem 1.25rem",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 style={{ color: "#ffffff", fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                  Download Certificate
                </h2>
                <button
                  onClick={() => setShowCertPopup(false)}
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.25rem", lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8125rem", marginTop: "0.375rem" }}>
                Select an author to generate their individual certificate
              </p>
            </div>

            {/* Author list */}
            <div style={{ padding: "0.75rem 1rem" }}>
              {allAuthors.map((name, i) => (
                <button
                  key={i}
                  onClick={() => generateCertForAuthor(name)}
                  disabled={certLoading === name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    padding: "0.875rem 1rem",
                    marginBottom: i < allAuthors.length - 1 ? "0.25rem" : "0",
                    background: certLoading === name ? "#f0f9ff" : "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    cursor: certLoading === name ? "wait" : "pointer",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (certLoading !== name) (e.currentTarget.style.background = "#f8fafc"); (e.currentTarget.style.borderColor = "#93c5fd"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = certLoading === name ? "#f0f9ff" : "#ffffff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  {/* Author avatar circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][i % 5]}, ${["#1d4ed8", "#6d28d9", "#0891b2", "#059669", "#d97706"][i % 5]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#111827", fontSize: "0.9375rem", fontWeight: 600, margin: 0 }}>{name}</p>
                    <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: "0.125rem 0 0" }}>
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
                  The page may take a moment to appear. Try the link above — if it doesn&apos;t load, check the Explore page or the article slug.
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
