"use client";

import { useEffect, useMemo, useState } from "react";

type ModuleItem = {
  title: string;
  description: string;
  bullets: string[];
};

type Submission = {
  id: string;
  title: string;
  abstract: string;
  category: string;
  manuscriptUrl: string | null;
  manuscriptName: string | null;
  keywords: string | null;
  coverLetter: string | null;
  conflictOfInterest: string | null;
  policyAgreed: number | null;
  status: string;
  pipelineStatus?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
};

type Reviewer = {
  id: string;
  name: string;
  email: string;
  affiliation: string | null;
  expertise: string | null;
  status: string | null;
  createdAt: string | null;
};

type Assignment = {
  id: string;
  submissionId: string;
  reviewerId: string;
  status: string;
  invitedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  notes: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  submissionTitle: string | null;
};

type Review = {
  id: string;
  assignmentId: string;
  recommendation: string | null;
  score: number | null;
  commentsToAuthor: string | null;
  commentsToEditor: string | null;
  needsWork: number | null;
  editorFeedback: string | null;
  submittedAt: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  submissionTitle: string | null;
  submissionId: string | null;
};

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted", color: "#6b7280" },
  { value: "desk_check", label: "Desk Check", color: "#8b5cf6" },
  { value: "editor_assigned", label: "Editor Assigned", color: "#0ea5e9" },
  { value: "reviewer_invited", label: "Reviewer Invited", color: "#38bdf8" },
  { value: "under_review", label: "Under Review", color: "#2563eb" },
  { value: "reviews_completed", label: "Reviews Completed", color: "#6366f1" },
  { value: "decision_pending", label: "Decision Pending", color: "#f59e0b" },
  { value: "revision_requested", label: "Revisions Requested", color: "#d97706" },
  { value: "revised_submission_received", label: "Revised Submission", color: "#a855f7" },
  { value: "accepted", label: "Accepted", color: "#16a34a" },
  { value: "in_production", label: "In Production", color: "#14b8a6" },
  { value: "scheduled", label: "Scheduled", color: "#22c55e" },
  { value: "published", label: "Published", color: "#15803d" },
  { value: "rejected", label: "Rejected", color: "#dc2626" },
  { value: "withdrawn", label: "Withdrawn", color: "#7c2d12" },
];

const ASSIGNMENT_STATUS_OPTIONS = [
  "invited",
  "accepted",
  "declined",
  "in_progress",
  "submitted",
  "overdue",
];

const MODULES: ModuleItem[] = [
  {
    title: "Dashboard",
    description: "High-level queue health + quick actions.",
    bullets: [
      "New submissions",
      "Awaiting desk check",
      "Reviews due/overdue",
      "Ready for decision",
      "Accepted pending production",
    ],
  },
  {
    title: "Manuscripts",
    description: "Full submission lifecycle management.",
    bullets: [
      "Assign editor + reviewers",
      "Status changes + decisions",
      "Version history + files",
      "Decision letters + deadlines",
    ],
  },
  {
    title: "Review Management",
    description: "Track invitations and reviewer performance.",
    bullets: [
      "Reviewer invitations + acceptance",
      "Overdue review alerts",
      "Reviewer metrics + history",
    ],
  },
  {
    title: "Users & Accounts",
    description: "Roles, profiles, and access control.",
    bullets: [
      "Manage roles + permissions",
      "Author + reviewer profiles",
      "Reset password / deactivate",
    ],
  },
  {
    title: "Content & Publishing",
    description: "Published articles and issue management.",
    bullets: [
      "Metadata, DOI, citations",
      "Schedule publish / corrections",
      "Issue table of contents",
    ],
  },
  {
    title: "Templates & Emails",
    description: "Decision letters + notifications.",
    bullets: [
      "Reviewer invites + reminders",
      "Decision templates",
      "Merge tags ({author}, {deadline})",
    ],
  },
  {
    title: "Settings & Audit",
    description: "Journal configuration + activity log.",
    bullets: [
      "Sections, article types, rubrics",
      "Review model settings",
      "Audit log (who did what, when)",
    ],
  },
];

const PIPELINE = [
  "Submitted",
  "Desk Check",
  "Editor Assigned",
  "Reviewer Invited",
  "Under Review",
  "Reviews Completed",
  "Decision Pending",
  "Revisions Requested",
  "Revised Submission Received",
  "Accepted",
  "In Production",
  "Scheduled",
  "Published",
  "Rejected",
  "Withdrawn",
];

export default function AdminLocalClient() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [reviewerError, setReviewerError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [reviewerForm, setReviewerForm] = useState({
    name: "",
    email: "",
    affiliation: "",
    expertise: "",
  });

  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { reviewerId: string; dueAt: string }>>({});
  const [assignmentEdits, setAssignmentEdits] = useState<Record<string, { status: string; dueAt: string }>>({});
  const [reviewDraft, setReviewDraft] = useState({
    assignmentId: "",
    recommendation: "",
    score: "",
    commentsToAuthor: "",
    commentsToEditor: "",
  });

  const saved = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("air_admin_authed") === "1";
  }, []);

  useEffect(() => {
    if (saved) setAuthed(true);
  }, [saved]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/local-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      window.localStorage.setItem("air_admin_authed", "1");
      setAuthed(true);
      setPassword("");
      await fetchSubmissions();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/local-admin/logout", { method: "POST" }).catch(() => undefined);
    window.localStorage.removeItem("air_admin_authed");
    setAuthed(false);
    setError(null);
  };

  const fetchSubmissions = async () => {
    setQueueLoading(true);
    setQueueError(null);
    try {
      const res = await fetch("/api/local-admin/submissions");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setQueueError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load submissions.");
      }
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to load submissions.");
    } finally {
      setQueueLoading(false);
    }
  };

  const fetchReviewers = async () => {
    setReviewerLoading(true);
    setReviewerError(null);
    try {
      const res = await fetch("/api/local-admin/reviewers");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setReviewerError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load reviewers.");
      }
      const data = await res.json();
      setReviewers(data);
    } catch (err) {
      setReviewerError(err instanceof Error ? err.message : "Failed to load reviewers.");
    } finally {
      setReviewerLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentLoading(true);
    setAssignmentError(null);
    try {
      const res = await fetch("/api/local-admin/assignments");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setAssignmentError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load assignments.");
      }
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to load assignments.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/local-admin/reviews");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setReviewError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load reviews.");
      }
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to load reviews.");
    } finally {
      setReviewLoading(false);
    }
  };

  const createReviewer = async () => {
    setReviewerError(null);
    try {
      const res = await fetch("/api/local-admin/reviewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewerForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add reviewer.");
      }
      setReviewerForm({ name: "", email: "", affiliation: "", expertise: "" });
      await fetchReviewers();
    } catch (err) {
      setReviewerError(err instanceof Error ? err.message : "Failed to add reviewer.");
    }
  };

  const assignReviewer = async (submissionId: string) => {
    const draft = assignmentDrafts[submissionId];
    if (!draft?.reviewerId) {
      setAssignmentError("Select a reviewer before assigning.");
      return;
    }
    try {
      const res = await fetch("/api/local-admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          reviewerId: draft.reviewerId,
          dueAt: draft.dueAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign reviewer.");
      }
      setAssignmentDrafts((prev) => ({ ...prev, [submissionId]: { reviewerId: "", dueAt: "" } }));
      await fetchAssignments();
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to assign reviewer.");
    }
  };

  const submitReview = async () => {
    setReviewError(null);
    if (!reviewDraft.assignmentId) {
      setReviewError("Select an assignment.");
      return;
    }
    try {
      const res = await fetch("/api/local-admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: reviewDraft.assignmentId,
          recommendation: reviewDraft.recommendation,
          score: reviewDraft.score ? Number(reviewDraft.score) : null,
          commentsToAuthor: reviewDraft.commentsToAuthor,
          commentsToEditor: reviewDraft.commentsToEditor,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review.");
      }
      setReviewDraft({ assignmentId: "", recommendation: "", score: "", commentsToAuthor: "", commentsToEditor: "" });
      await fetchReviews();
      await fetchAssignments();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
    }
  };

  const requestReviewChanges = async (review: Review) => {
    const defaultMessage = [
      "Thanks for the review. Please expand on the points below so we can share with the author.",
      "",
      `Recommendation: ${review.recommendation || "-"}`,
      `Score: ${review.score ?? "-"}`,
      "",
      "Comments to author:",
      review.commentsToAuthor || "-",
      "",
      "Comments to editor:",
      review.commentsToEditor || "-",
    ].join("\n");
    const feedback = window.prompt("Add feedback for the reviewer:", defaultMessage);
    if (!feedback) return;
    try {
      const res = await fetch(`/api/local-admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needsWork: true, editorFeedback: feedback }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send feedback.");
      }
      await fetchReviews();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to send feedback.");
    }
  };

  const clearReviewFlag = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/local-admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needsWork: false, editorFeedback: "" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update review.");
      }
      await fetchReviews();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to update review.");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/local-admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update.");
      }
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const baseStatuses = ["submitted", "under_review", "accepted", "rejected", "revision_requested"];
          return {
            ...s,
            pipelineStatus: status,
            status: baseStatuses.includes(status) ? status : s.status,
          };
        })
      );
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const updateAssignment = async (assignment: Assignment) => {
    const draft = assignmentEdits[assignment.id];
    const status = draft?.status || assignment.status;
    const dueAt = draft?.dueAt || (assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 10) : "");
    try {
      const res = await fetch(`/api/local-admin/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, dueAt: dueAt || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update assignment.");
      }
      await fetchAssignments();
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to update assignment.");
    }
  };

  useEffect(() => {
    if (authed) {
      fetchSubmissions();
      fetchReviewers();
      fetchAssignments();
      fetchReviews();
    }
  }, [authed]);

  if (!authed) {
    return (
      <section className="page-section">
        <div className="card settings-card" style={{ maxWidth: "520px" }}>
          <h3>Local admin login</h3>
          <p className="text-sm text-slate-600">
            This panel is restricted to local development. Enter your local admin password.
          </p>
          {error ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              {error}
            </div>
          ) : null}
          <form onSubmit={handleLogin} style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <label className="label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter local admin password"
                required
              />
            </label>
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Enter admin panel"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Admin</div>
          <h1>Journal admin panel (local)</h1>
          <p>Blueprint layout for editorial operations and manuscript workflow.</p>
          <div className="page-meta">
            <span>Local only</span>
            <span>RBAC ready</span>
            <span>Audit-first</span>
          </div>
        </div>
      </section>

      <section className="page-section" style={{ display: "grid", gap: "1.5rem" }}>
        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Pipeline status map</h3>
              <p className="text-sm text-slate-600">
                Standard manuscript lifecycle stages for a peer-reviewed journal.
              </p>
            </div>
            <button className="button-secondary" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
            {PIPELINE.map((stage) => (
              <span
                key={stage}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8rem",
                  background: "#f8fafc",
                  color: "#0f172a",
                }}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Submissions queue</h3>
              <p className="text-sm text-slate-600">
                Live data pulled from the local admin API.
              </p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchSubmissions} disabled={queueLoading}>
              {queueLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {queueError ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              {queueError}
            </div>
          ) : null}

          {queueLoading ? (
            <p style={{ marginTop: "1rem" }}>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No submissions yet.</p>
          ) : (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Assign reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const displayStatus = s.pipelineStatus || s.status;
                    const currentStatus = STATUS_OPTIONS.find((o) => o.value === displayStatus);
                    return (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.title}</strong>
                          <br />
                          <small style={{ color: "#6b7280" }}>
                            {s.abstract.length > 100 ? s.abstract.slice(0, 100) + "..." : s.abstract}
                          </small>
                          {s.keywords ? (
                            <>
                              <br />
                              <small style={{ color: "#4b5563" }}>
                                <strong>Keywords:</strong> {s.keywords}
                              </small>
                            </>
                          ) : null}
                        </td>
                        <td>
                          {s.userName || "Unknown"}
                          <br />
                          <small>{s.userEmail}</small>
                        </td>
                        <td>{s.category}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#fff",
                              background: currentStatus?.color || "#6b7280",
                            }}
                          >
                            {currentStatus?.label || s.status}
                          </span>
                        </td>
                        <td>
                          {s.manuscriptUrl ? (
                            <a href={s.manuscriptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem" }}>
                              {s.manuscriptName || "Download"}
                            </a>
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No file</span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td>
                          <select
                            value={displayStatus}
                            onChange={(e) => updateStatus(s.id, e.target.value)}
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: "grid", gap: "0.35rem" }}>
                            <select
                              value={assignmentDrafts[s.id]?.reviewerId || ""}
                              onChange={(e) =>
                                setAssignmentDrafts((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    reviewerId: e.target.value,
                                    dueAt: prev[s.id]?.dueAt || "",
                                  },
                                }))
                              }
                              style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                            >
                              <option value="">Select reviewer</option>
                              {reviewers.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={assignmentDrafts[s.id]?.dueAt || ""}
                              onChange={(e) =>
                                setAssignmentDrafts((prev) => ({
                                  ...prev,
                                  [s.id]: {
                                    reviewerId: prev[s.id]?.reviewerId || "",
                                    dueAt: e.target.value,
                                  },
                                }))
                              }
                              style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                            />
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => assignReviewer(s.id)}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Assign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Reviewer directory</h3>
              <p className="text-sm text-slate-600">Add reviewers and manage expertise tags.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchReviewers} disabled={reviewerLoading}>
              {reviewerLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {reviewerError ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              {reviewerError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Name
                <input
                  className="input"
                  value={reviewerForm.name}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                  placeholder="Reviewer name"
                />
              </label>
              <label className="label">
                Email
                <input
                  className="input"
                  type="email"
                  value={reviewerForm.email}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, email: e.target.value })}
                  placeholder="email@university.edu"
                />
              </label>
            </div>
            <label className="label">
              Affiliation
              <input
                className="input"
                value={reviewerForm.affiliation}
                onChange={(e) => setReviewerForm({ ...reviewerForm, affiliation: e.target.value })}
                placeholder="Institution, title"
              />
            </label>
            <label className="label">
              Expertise keywords
              <input
                className="input"
                value={reviewerForm.expertise}
                onChange={(e) => setReviewerForm({ ...reviewerForm, expertise: e.target.value })}
                placeholder="e.g., microgrids, immunotherapy"
              />
            </label>
            <div>
              <button className="button primary" type="button" onClick={createReviewer}>
                Add reviewer
              </button>
            </div>
          </div>

          {reviewers.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Affiliation</th>
                    <th>Expertise</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewers.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.affiliation || "-"}</td>
                      <td>{r.expertise || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No reviewers yet.</p>
          )}
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Review assignments</h3>
              <p className="text-sm text-slate-600">Track invitations and due dates.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchAssignments} disabled={assignmentLoading}>
              {assignmentLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {assignmentError ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              {assignmentError}
            </div>
          ) : null}

          {assignmentLoading ? (
            <p style={{ marginTop: "1rem" }}>Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No assignments yet.</p>
          ) : (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Submission</th>
                    <th>Reviewer</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Invited</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.submissionTitle || a.submissionId}</td>
                      <td>
                        {a.reviewerName || "Unknown"}
                        <br />
                        <small>{a.reviewerEmail}</small>
                      </td>
                      <td>
                        <select
                          value={assignmentEdits[a.id]?.status ?? a.status}
                          onChange={(e) =>
                            setAssignmentEdits((prev) => ({
                              ...prev,
                              [a.id]: {
                                status: e.target.value,
                                dueAt: prev[a.id]?.dueAt ?? (a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 10) : ""),
                              },
                            }))
                          }
                          style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                        >
                          {ASSIGNMENT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          value={assignmentEdits[a.id]?.dueAt ?? (a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 10) : "")}
                          onChange={(e) =>
                            setAssignmentEdits((prev) => ({
                              ...prev,
                              [a.id]: {
                                status: prev[a.id]?.status ?? a.status,
                                dueAt: e.target.value,
                              },
                            }))
                          }
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                        />
                      </td>
                      <td>{a.invitedAt ? new Date(a.invitedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => updateAssignment(a)}
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Reviews</h3>
              <p className="text-sm text-slate-600">Enter reviews and request changes if needed.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchReviews} disabled={reviewLoading}>
              {reviewLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {reviewError ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              {reviewError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <label className="label">
              Assignment
              <select
                className="input"
                value={reviewDraft.assignmentId}
                onChange={(e) => setReviewDraft({ ...reviewDraft, assignmentId: e.target.value })}
              >
                <option value="">Select assignment</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.submissionTitle || a.submissionId} — {a.reviewerName || "Reviewer"}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Recommendation
                <input
                  className="input"
                  value={reviewDraft.recommendation}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, recommendation: e.target.value })}
                  placeholder="Accept, minor, major, reject"
                />
              </label>
              <label className="label">
                Score (1-5)
                <input
                  className="input"
                  value={reviewDraft.score}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, score: e.target.value })}
                  placeholder="Score"
                />
              </label>
            </div>
            <label className="label">
              Comments to author
              <textarea
                className="input"
                rows={3}
                value={reviewDraft.commentsToAuthor}
                onChange={(e) => setReviewDraft({ ...reviewDraft, commentsToAuthor: e.target.value })}
              />
            </label>
            <label className="label">
              Comments to editor
              <textarea
                className="input"
                rows={3}
                value={reviewDraft.commentsToEditor}
                onChange={(e) => setReviewDraft({ ...reviewDraft, commentsToEditor: e.target.value })}
              />
            </label>
            <button className="button primary" type="button" onClick={submitReview}>
              Save review
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Submission</th>
                    <th>Reviewer</th>
                    <th>Recommendation</th>
                    <th>Score</th>
                    <th>Needs work</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td>{r.submissionTitle || r.submissionId}</td>
                      <td>
                        {r.reviewerName || "Unknown"}
                        <br />
                        <small>{r.reviewerEmail}</small>
                      </td>
                      <td>{r.recommendation || "-"}</td>
                      <td>{r.score ?? "-"}</td>
                      <td>{r.needsWork ? "Yes" : "No"}</td>
                      <td>
                        <details style={{ fontSize: "0.8rem" }}>
                          <summary style={{ cursor: "pointer" }}>View</summary>
                          <div style={{ marginTop: "0.5rem", color: "#0f172a" }}>
                            <strong>Comments to author</strong>
                            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
                              {r.commentsToAuthor || "-"}
                            </div>
                          </div>
                          <div style={{ marginTop: "0.5rem", color: "#0f172a" }}>
                            <strong>Comments to editor</strong>
                            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
                              {r.commentsToEditor || "-"}
                            </div>
                          </div>
                          {r.editorFeedback ? (
                            <div style={{ marginTop: "0.5rem", color: "#0f172a" }}>
                              <strong>Editor feedback sent</strong>
                              <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
                                {r.editorFeedback}
                              </div>
                            </div>
                          ) : null}
                        </details>
                      </td>
                      <td>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => requestReviewChanges(r)}
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          Request changes
                        </button>
                        {r.needsWork ? (
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => clearReviewFlag(r.id)}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", marginLeft: "0.4rem" }}
                          >
                            Mark OK
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No reviews yet.</p>
          )}
        </div>

        <div className="card settings-card">
          <h3>Core admin modules</h3>
          <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
            {MODULES.map((module) => (
              <div
                key={module.title}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h4 style={{ marginBottom: "0.25rem" }}>{module.title}</h4>
                    <p className="text-sm text-slate-600">{module.description}</p>
                  </div>
                  <span className="badge">MVP</span>
                </div>
                <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
                  {module.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="card settings-card">
          <h3>Implementation notes</h3>
          <ul className="category-list">
            <li>Local-only admin login (no production exposure)</li>
            <li>Planned RBAC roles: super admin, managing editor, section editor, reviewer</li>
            <li>Audit log for every decision, status change, or file upload</li>
            <li>Automated reminders for reviewer deadlines</li>
          </ul>
        </div>
      </section>
    </>
  );
}
