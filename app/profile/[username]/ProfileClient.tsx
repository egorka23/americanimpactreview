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
              ) : state === "current" ? (
                <span className="stepper-node__dot" />
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

// ─── Article Share Button ────────────────────────────────────────────────────
function ArticleShareButton({ title, slug }: { title: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `https://americanimpactreview.com/article/${slug}`;
  const shareTitle = `${title} | American Impact Review`;

  async function handleClick() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch { /* cancelled */ }
    }
    setOpen((v) => !v);
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    });
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".article-share-wrap")) setOpen(false);
    }
    document.addEventListener("click", onClickOutside, true);
    return () => document.removeEventListener("click", onClickOutside, true);
  }, [open]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareTitle);

  const socials = [
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
    { name: "X", href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { name: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> },
  ];

  return (
    <div className="article-share-wrap">
      <button onClick={handleClick} className="bt bt-d bt-d--share" aria-label="Share article">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>
      {open && (
        <div className="article-share-popup">
          <div className="article-share-popup__title">Share article</div>
          <div className="article-share-popup__socials">
            {socials.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="article-share-popup__item" onClick={() => setOpen(false)}>
                {s.icon}
                <span>{s.name}</span>
              </a>
            ))}
          </div>
          <button className="article-share-popup__copy" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy URL
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
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

      {submission.coAuthors && (
        <div className="author-card__coauthors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{submission.coAuthors}</span>
        </div>
      )}

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

      <div style={{ textAlign: "center" }}>
      <div className="author-card__actions author-card__actions--dark">
        {submission.manuscriptUrl && (
          <a
            href={submission.manuscriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bt bt-d bt-d--secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            View Manuscript
          </a>
        )}
        {isPublished && (
          <Link
            href={`/article/${submission.publishedSlug}`}
            className="bt bt-d bt-d--secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Article
          </Link>
        )}
        {isPublished && submission.publishedSlug && (
          <ArticleShareButton title={submission.title} slug={submission.publishedSlug} />
        )}
        {isPublished && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bt bt-d bt-d--gold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            {downloading ? "Generating..." : "Download Certificate"}
          </button>
        )}
      </div>
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

      {/* TEMP: always show cards for preview */}
      {true ? (
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
                  authorName={user?.name || "Egor Akimov"}
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
