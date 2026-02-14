"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import {
  generatePublicationCertificate,
  type PublicationCertificateData,
} from "@/lib/generate-publication-certificate";

type SubmissionItem = {
  id: string;
  title: string;
  category: string;
  subject: string | null;
  articleType: string | null;
  status: string;
  pipelineStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  manuscriptUrl: string | null;
  coAuthors: string | null;
  publishedSlug: string | null;
  publishedAt: string | null;
  publishedAuthors: string | null;
  publishedDoi: string | null;
  publishedVolume: string | null;
  publishedIssue: string | null;
  publishedYear: number | null;
};

/**
 * Derive the effective display status for the author.
 *
 * In the DB, submissions.status only has 5 base values:
 *   submitted | under_review | accepted | rejected | revision_requested
 *
 * "published" is NOT a base status — the admin sets pipelineStatus="published"
 * and creates a publishedArticles record. So we detect "published" by checking
 * pipelineStatus OR the presence of publishedSlug + publishedAt.
 */
function getEffectiveStatus(s: SubmissionItem): string {
  if (
    s.pipelineStatus === "published" ||
    (s.publishedSlug && s.publishedAt)
  ) {
    return "published";
  }
  // Pipeline sub-statuses that map to a base status for display
  if (s.pipelineStatus === "in_production" || s.pipelineStatus === "scheduled") {
    return "accepted"; // still in accepted phase, just further along
  }
  if (
    s.pipelineStatus === "desk_check" ||
    s.pipelineStatus === "editor_assigned" ||
    s.pipelineStatus === "reviewer_invited"
  ) {
    return "submitted"; // pre-review pipeline steps
  }
  if (
    s.pipelineStatus === "reviews_completed" ||
    s.pipelineStatus === "decision_pending"
  ) {
    return "under_review"; // still in review phase
  }
  if (s.pipelineStatus === "revised_submission_received") {
    return "under_review"; // resubmitted revision, back in review
  }
  return s.status;
}

// ─── Status → Stepper mapping ───────────────────────────────────────────────
const STEPS = ["Submitted", "Under Review", "Decision", "Accepted", "Published"] as const;

type StepState = "completed" | "current" | "pending" | "error";

function getStepStates(status: string): StepState[] {
  switch (status) {
    case "submitted":
      return ["completed", "pending", "pending", "pending", "pending"];
    case "under_review":
      return ["completed", "current", "pending", "pending", "pending"];
    case "revision_requested":
      return ["completed", "current", "pending", "pending", "pending"];
    case "accepted":
      return ["completed", "completed", "completed", "current", "pending"];
    case "published":
      return ["completed", "completed", "completed", "completed", "completed"];
    case "rejected":
      return ["completed", "completed", "error", "pending", "pending"];
    default:
      return ["current", "pending", "pending", "pending", "pending"];
  }
}

// ─── Status badge config ────────────────────────────────────────────────────
const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "author-badge--submitted" },
  under_review: { label: "In Review", className: "author-badge--review" },
  revision_requested: { label: "Revisions Requested", className: "author-badge--revision" },
  accepted: { label: "Accepted", className: "author-badge--accepted" },
  published: { label: "Published", className: "author-badge--published" },
  rejected: { label: "Rejected", className: "author-badge--rejected" },
  withdrawn: { label: "Withdrawn", className: "author-badge--withdrawn" },
};

// ─── Progress Stepper Component ─────────────────────────────────────────────
function ProgressStepper({ status, pipelineStatus }: { status: string; pipelineStatus?: string | null }) {
  const revisionNote = status === "revision_requested" || pipelineStatus === "revised_submission_received";
  const states = getStepStates(status);

  return (
    <div className="progress-stepper">
      {STEPS.map((label, i) => {
        const state = states[i];
        return (
          <div key={label} className="stepper-step-wrap">
            {i > 0 && (
              <div
                className={`stepper-line ${
                  state === "completed" || (state === "current" && i > 0 && states[i - 1] === "completed")
                    ? "stepper-line--done"
                    : state === "error"
                    ? "stepper-line--error"
                    : ""
                }`}
              />
            )}
            <div className={`stepper-node stepper-node--${state}`}>
              {state === "completed" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : state === "error" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : null}
            </div>
            <span className={`stepper-label stepper-label--${state}`}>
              {label}
              {i === 1 && revisionNote && (
                <span className="stepper-sublabel">Revisions Requested</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Certificate download handler ───────────────────────────────────────────
async function downloadCertificate(submission: SubmissionItem, authorName: string) {
  const data: PublicationCertificateData = {
    title: submission.title,
    authors: submission.publishedAuthors || authorName,
    receivedDate: submission.createdAt
      ? new Date(submission.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A",
    publishedDate: submission.publishedAt
      ? new Date(submission.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A",
    doi: submission.publishedDoi || "Pending",
    issn: "2789-1929",
  };

  const pdfBytes = await generatePublicationCertificate(data);
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AIR-Certificate-${submission.publishedSlug || submission.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Submission Card Component ──────────────────────────────────────────────
function SubmissionCard({
  submission,
  authorName,
}: {
  submission: SubmissionItem;
  authorName: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const effectiveStatus = getEffectiveStatus(submission);
  const badge = BADGE_CONFIG[effectiveStatus] || {
    label: effectiveStatus,
    className: "author-badge--default",
  };
  const isPublished = effectiveStatus === "published" && submission.publishedSlug;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(submission, authorName);
    } catch (e) {
      console.error("Certificate generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <div className="author-card">
      <div className="author-card__header">
        <span className="author-card__type">{submission.articleType || "Manuscript"}</span>
        <span className={`author-badge ${badge.className}`}>{badge.label}</span>
      </div>

      <h3 className="author-card__title">{submission.title}</h3>

      <div className="author-card__meta">
        {submission.category}
        {submission.subject && <> &middot; {submission.subject}</>}
      </div>

      <ProgressStepper status={effectiveStatus} pipelineStatus={submission.pipelineStatus} />

      <div className="author-card__dates">
        {submission.createdAt && (
          <span>Submitted: {formatDate(submission.createdAt)}</span>
        )}
        {isPublished && submission.publishedAt ? (
          <span>Published: {formatDate(submission.publishedAt)}</span>
        ) : (
          submission.updatedAt && (
            <span>Last updated: {formatDate(submission.updatedAt)}</span>
          )
        )}
      </div>

      <div className="author-card__actions">
        {submission.manuscriptUrl && (
          <a
            href={submission.manuscriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="author-btn author-btn--secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            View Manuscript
          </a>
        )}
        {isPublished && (
          <>
            <Link
              href={`/article/${submission.publishedSlug}`}
              className="author-btn author-btn--primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Article
            </Link>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="author-btn author-btn--gold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? "Generating..." : "Download Certificate"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ProfileClient({ username }: { username: string }) {
  const { user, loading } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const isOwnProfile = user?.id === username || user?.email?.split("@")[0] === username;

  useEffect(() => {
    if (!user || !isOwnProfile) return;
    setLoadingSubs(true);
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingSubs(false));
  }, [user, isOwnProfile]);

  if (loading) {
    return (
      <section className="author-dashboard">
        <p style={{ textAlign: "center", padding: "3rem 0", color: "#6b7280" }}>Loading...</p>
      </section>
    );
  }

  return (
    <section className="author-dashboard">
      <header className="author-dashboard__header">
        <h2>My Submissions</h2>
        {user && (
          <p className="author-dashboard__subtitle">
            {user.name || "Author"} &middot; {user.email}
          </p>
        )}
      </header>

      {user && isOwnProfile ? (
        <>
          {loadingSubs ? (
            <div className="author-dashboard__loading">
              <div className="author-spinner" />
              <span>Loading your submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="author-dashboard__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c4a87c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p>No submissions yet.</p>
              <Link href="/submit" className="author-btn author-btn--primary">
                Submit Your First Manuscript
              </Link>
            </div>
          ) : (
            <div className="author-cards">
              {submissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  authorName={user.name || "Author"}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="author-dashboard__empty">
          <p>
            Author profiles are not yet public.{" "}
            <Link href="/explore">Explore articles</Link> instead.
          </p>
        </div>
      )}
    </section>
  );
}
