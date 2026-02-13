"use client";

import { useEffect, useMemo, useState } from "react";


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
  handlingEditorId?: string | null;
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

type UserAccount = {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  orcid: string | null;
  role: string | null;
  status: string | null;
  createdAt: string | null;
  lastLogin: string | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type JournalSetting = {
  key: string;
  value: string | null;
  updatedAt: string | null;
};

type PublishedArticle = {
  id: string;
  title: string;
  slug: string;
  volume: string | null;
  issue: string | null;
  year: number | null;
  doi: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string | null;
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

const ROLE_OPTIONS = [
  "super_admin",
  "managing_editor",
  "section_editor",
  "editor",
  "reviewer",
  "author",
  "production",
];

const USER_STATUS_OPTIONS = ["active", "suspended", "invited"];

const PUBLISHING_STATUS_OPTIONS = ["draft", "scheduled", "published"];


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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loggedInAccountId, setLoggedInAccountId] = useState<string | null>(null);
  const [loggedInDisplayName, setLoggedInDisplayName] = useState<string | null>(null);
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
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [settings, setSettings] = useState<JournalSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<PublishedArticle[]>([]);
  const [publishingLoading, setPublishingLoading] = useState(false);
  const [publishingError, setPublishingError] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Admin accounts
  const [adminAccts, setAdminAccts] = useState<{ id: string; username: string; displayName: string | null; createdAt: string | null }[]>([]);
  const [adminAcctsLoading, setAdminAcctsLoading] = useState(false);
  const [adminAcctsError, setAdminAcctsError] = useState<string | null>(null);
  const [newAcctForm, setNewAcctForm] = useState({ username: "", password: "", displayName: "" });
  const [editAcctId, setEditAcctId] = useState<string | null>(null);
  const [editAcctForm, setEditAcctForm] = useState({ username: "", password: "", displayName: "" });

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
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    affiliation: "",
    orcid: "",
    role: "author",
    status: "active",
  });
  const [userEdits, setUserEdits] = useState<Record<string, { role: string; status: string; password: string }>>({});
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
    description: "",
  });
  const [templateEdits, setTemplateEdits] = useState<Record<string, { name: string; subject: string; bodyHtml: string; description: string }>>({});
  const [settingForm, setSettingForm] = useState({ key: "", value: "" });
  const [publishingForm, setPublishingForm] = useState({
    title: "",
    slug: "",
    volume: "",
    issue: "",
    year: "",
    doi: "",
    status: "draft",
    scheduledAt: "",
  });
  const [publishingEdits, setPublishingEdits] = useState<Record<string, { status: string; scheduledAt: string }>>({});
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, { decision: string; reviewerComments: string; editorComments: string; revisionDeadline: string }>>({});
  const [editorDrafts, setEditorDrafts] = useState<Record<string, string>>({});

  const saved = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("air_admin_authed") === "1";
  }, []);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const newSubmissions = submissions.filter((s) => s.status === "submitted").length;
    const awaitingDeskCheck = submissions.filter((s) => (s.pipelineStatus || s.status) === "desk_check").length;
    const reviewsDue = assignments.filter((a) => {
      if (!a.dueAt || a.status === "submitted") return false;
      const due = new Date(a.dueAt);
      const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3 && diffDays >= 0;
    }).length;
    const reviewsOverdue = assignments.filter((a) => {
      if (!a.dueAt || a.status === "submitted") return false;
      const due = new Date(a.dueAt);
      return due.getTime() < now.getTime();
    }).length;
    const readyForDecision = submissions.filter((s) => (s.pipelineStatus || s.status) === "reviews_completed").length;
    const acceptedPendingProduction = submissions.filter((s) => {
      const stage = s.pipelineStatus || s.status;
      return stage === "accepted" || stage === "in_production";
    }).length;

    return {
      newSubmissions,
      awaitingDeskCheck,
      reviewsDue,
      reviewsOverdue,
      readyForDecision,
      acceptedPendingProduction,
    };
  }, [submissions, assignments]);

  const editorOptions = useMemo(() => {
    return users.filter((u) =>
      ["super_admin", "managing_editor", "section_editor", "editor"].includes(u.role || "")
    );
  }, [users]);

  const reviewerMetrics = useMemo(() => {
    return reviewers.map((reviewer) => {
      const reviewerAssignments = assignments.filter((a) => a.reviewerId === reviewer.id);
      const assignmentIds = new Set(reviewerAssignments.map((a) => a.id));
      const reviewerReviews = reviews.filter((r) => assignmentIds.has(r.assignmentId));
      const submittedCount = reviewerAssignments.filter((a) => a.status === "submitted").length;
      const overdueCount = reviewerAssignments.filter((a) => {
        if (!a.dueAt || a.status === "submitted") return false;
        return new Date(a.dueAt).getTime() < Date.now();
      }).length;
      const avgScore =
        reviewerReviews.length > 0
          ? reviewerReviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviewerReviews.length
          : null;

      return {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        assignments: reviewerAssignments.length,
        submitted: submittedCount,
        overdue: overdueCount,
        avgScore: avgScore ? Number(avgScore.toFixed(2)) : null,
      };
    });
  }, [reviewers, assignments, reviews]);

  useEffect(() => {
    if (saved) {
      setAuthed(true);
      const storedId = window.localStorage.getItem("air_admin_id");
      if (storedId) setLoggedInAccountId(storedId);
    }
  }, [saved]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/local-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      window.localStorage.setItem("air_admin_authed", "1");
      if (data.accountId) {
        window.localStorage.setItem("air_admin_id", data.accountId);
        setLoggedInAccountId(data.accountId);
      }
      if (data.displayName) {
        setLoggedInDisplayName(data.displayName);
      }
      setAuthed(true);
      setUsername("");
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
    window.localStorage.removeItem("air_admin_id");
    setAuthed(false);
    setLoggedInAccountId(null);
    setLoggedInDisplayName(null);
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

  const fetchUsers = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await fetch("/api/local-admin/users");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setUserError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load users.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setUserLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setTemplateLoading(true);
    setTemplateError(null);
    try {
      const res = await fetch("/api/local-admin/templates");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setTemplateError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load templates.");
      }
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to load templates.");
    } finally {
      setTemplateLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const res = await fetch("/api/local-admin/settings");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setSettingsError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load settings.");
      }
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAdminAccounts = async () => {
    setAdminAcctsLoading(true);
    setAdminAcctsError(null);
    try {
      const res = await fetch("/api/local-admin/accounts");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load admin accounts.");
      }
      const data = await res.json();
      setAdminAccts(data);
    } catch (err) {
      setAdminAcctsError(err instanceof Error ? err.message : "Failed to load admin accounts.");
    } finally {
      setAdminAcctsLoading(false);
    }
  };

  const createAdminAccount = async () => {
    setAdminAcctsError(null);
    try {
      const res = await fetch("/api/local-admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAcctForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create account.");
      }
      setNewAcctForm({ username: "", password: "", displayName: "" });
      await fetchAdminAccounts();
    } catch (err) {
      setAdminAcctsError(err instanceof Error ? err.message : "Failed to create account.");
    }
  };

  const updateAdminAccount = async () => {
    if (!editAcctId) return;
    setAdminAcctsError(null);
    try {
      const payload: Record<string, string> = { id: editAcctId };
      if (editAcctForm.username) payload.username = editAcctForm.username;
      if (editAcctForm.password) payload.password = editAcctForm.password;
      if (editAcctForm.displayName !== undefined) payload.displayName = editAcctForm.displayName;

      const res = await fetch("/api/local-admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update account.");
      }
      setEditAcctId(null);
      setEditAcctForm({ username: "", password: "", displayName: "" });
      await fetchAdminAccounts();
    } catch (err) {
      setAdminAcctsError(err instanceof Error ? err.message : "Failed to update account.");
    }
  };

  const deleteAdminAccount = async (id: string) => {
    if (!confirm("Delete this admin account?")) return;
    setAdminAcctsError(null);
    try {
      const res = await fetch(`/api/local-admin/accounts?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account.");
      }
      await fetchAdminAccounts();
    } catch (err) {
      setAdminAcctsError(err instanceof Error ? err.message : "Failed to delete account.");
    }
  };

  const fetchPublishing = async () => {
    setPublishingLoading(true);
    setPublishingError(null);
    try {
      const res = await fetch("/api/local-admin/publishing");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setPublishingError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load publishing queue.");
      }
      const data = await res.json();
      setPublishing(data);
    } catch (err) {
      setPublishingError(err instanceof Error ? err.message : "Failed to load publishing queue.");
    } finally {
      setPublishingLoading(false);
    }
  };

  const fetchAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/local-admin/audit");
      if (res.status === 401) {
        window.localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        setAuditError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load audit log.");
      }
      const data = await res.json();
      setAuditEvents(data);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to load audit log.");
    } finally {
      setAuditLoading(false);
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

  const updateSubmission = async (id: string, status: string, handlingEditorId?: string | null) => {
    try {
      const res = await fetch(`/api/local-admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          handlingEditorId: typeof handlingEditorId === "string" ? handlingEditorId : undefined,
        }),
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
            handlingEditorId: typeof handlingEditorId === "string" ? handlingEditorId : s.handlingEditorId,
          };
        })
      );
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const updateStatus = async (id: string, status: string) => updateSubmission(id, status);

  const assignEditor = async (id: string, editorId: string) => {
    const submission = submissions.find((s) => s.id === id);
    const currentStatus = submission?.pipelineStatus || submission?.status || "submitted";
    await updateSubmission(id, currentStatus, editorId);
  };

  const createUser = async () => {
    setUserError(null);
    try {
      const res = await fetch("/api/local-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create user.");
      }
      setUserForm({ name: "", email: "", password: "", affiliation: "", orcid: "", role: "author", status: "active" });
      await fetchUsers();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to create user.");
    }
  };

  const updateUser = async (userId: string) => {
    const draft = userEdits[userId];
    if (!draft) return;
    setUserError(null);
    try {
      const res = await fetch(`/api/local-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: draft.role,
          status: draft.status,
          password: draft.password || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user.");
      }
      setUserEdits((prev) => ({ ...prev, [userId]: { ...prev[userId], password: "" } }));
      await fetchUsers();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to update user.");
    }
  };

  const createTemplate = async () => {
    setTemplateError(null);
    try {
      const res = await fetch("/api/local-admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create template.");
      }
      setTemplateForm({ name: "", subject: "", bodyHtml: "", description: "" });
      await fetchTemplates();
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to create template.");
    }
  };

  const updateTemplate = async (templateId: string) => {
    const draft = templateEdits[templateId];
    if (!draft) return;
    setTemplateError(null);
    try {
      const res = await fetch(`/api/local-admin/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update template.");
      }
      await fetchTemplates();
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to update template.");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm("Delete this template?")) return;
    setTemplateError(null);
    try {
      const res = await fetch(`/api/local-admin/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete template.");
      }
      await fetchTemplates();
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Failed to delete template.");
    }
  };

  const saveSetting = async () => {
    setSettingsError(null);
    try {
      const res = await fetch("/api/local-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update setting.");
      }
      setSettingForm({ key: "", value: "" });
      await fetchSettings();
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Failed to update setting.");
    }
  };

  const createPublishing = async () => {
    setPublishingError(null);
    try {
      const res = await fetch("/api/local-admin/publishing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...publishingForm,
          year: publishingForm.year ? Number(publishingForm.year) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create publishing entry.");
      }
      setPublishingForm({ title: "", slug: "", volume: "", issue: "", year: "", doi: "", status: "draft", scheduledAt: "" });
      await fetchPublishing();
    } catch (err) {
      setPublishingError(err instanceof Error ? err.message : "Failed to create publishing entry.");
    }
  };

  const updatePublishing = async (entryId: string) => {
    const draft = publishingEdits[entryId];
    if (!draft) return;
    setPublishingError(null);
    try {
      const res = await fetch(`/api/local-admin/publishing/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update publishing entry.");
      }
      await fetchPublishing();
    } catch (err) {
      setPublishingError(err instanceof Error ? err.message : "Failed to update publishing entry.");
    }
  };

  const sendDecision = async (submission: Submission) => {
    const draft = decisionDrafts[submission.id];
    if (!draft?.decision) {
      setQueueError("Select a decision before sending.");
      return;
    }
    try {
      const res = await fetch("/api/local-admin/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          decision: draft.decision,
          reviewerComments: draft.reviewerComments,
          editorComments: draft.editorComments,
          revisionDeadline: draft.revisionDeadline,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send decision.");
      }
      await fetchSubmissions();
      await fetchAudit();
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to send decision.");
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
      fetchUsers();
      fetchTemplates();
      fetchSettings();
      fetchPublishing();
      fetchAudit();
      fetchAdminAccounts();
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
              Username
              <input
                className="input"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
              />
            </label>
            <label className="label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
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
          <h3>Dashboard</h3>
          <p className="text-sm text-slate-600">High-level queue health + quick actions.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">New submissions</p>
              <strong style={{ fontSize: "1.5rem" }}>{dashboardStats.newSubmissions}</strong>
            </div>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">Awaiting desk check</p>
              <strong style={{ fontSize: "1.5rem" }}>{dashboardStats.awaitingDeskCheck}</strong>
            </div>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">Reviews due (3 days)</p>
              <strong style={{ fontSize: "1.5rem" }}>{dashboardStats.reviewsDue}</strong>
            </div>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">Reviews overdue</p>
              <strong style={{ fontSize: "1.5rem", color: dashboardStats.reviewsOverdue ? "#dc2626" : "inherit" }}>
                {dashboardStats.reviewsOverdue}
              </strong>
            </div>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">Ready for decision</p>
              <strong style={{ fontSize: "1.5rem" }}>{dashboardStats.readyForDecision}</strong>
            </div>
            <div className="card" style={{ padding: "1rem" }}>
              <p className="text-sm text-slate-600">Accepted pending production</p>
              <strong style={{ fontSize: "1.5rem" }}>{dashboardStats.acceptedPendingProduction}</strong>
            </div>
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
                    <th>Editor</th>
                    <th>File</th>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Assign reviewer</th>
                    <th>Decision</th>
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
                          <select
                            value={editorDrafts[s.id] ?? s.handlingEditorId ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditorDrafts((prev) => ({ ...prev, [s.id]: value }));
                            }}
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            <option value="">Unassigned</option>
                            {editorOptions.map((editor) => (
                              <option key={editor.id} value={editor.id}>
                                {editor.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => assignEditor(s.id, editorDrafts[s.id] ?? s.handlingEditorId ?? "")}
                            style={{ marginTop: "0.35rem", padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          >
                            Save
                          </button>
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
                        <td>
                          <details style={{ fontSize: "0.8rem" }}>
                            <summary style={{ cursor: "pointer" }}>Send decision</summary>
                            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
                              <select
                                value={decisionDrafts[s.id]?.decision || ""}
                                onChange={(e) =>
                                  setDecisionDrafts((prev) => ({
                                    ...prev,
                                    [s.id]: {
                                      decision: e.target.value,
                                      reviewerComments: prev[s.id]?.reviewerComments || "",
                                      editorComments: prev[s.id]?.editorComments || "",
                                      revisionDeadline: prev[s.id]?.revisionDeadline || "",
                                    },
                                  }))
                                }
                                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                              >
                                <option value="">Select decision</option>
                                <option value="accept">Accept</option>
                                <option value="minor_revision">Minor revision</option>
                                <option value="major_revision">Major revision</option>
                                <option value="reject">Reject</option>
                              </select>
                              <input
                                type="date"
                                value={decisionDrafts[s.id]?.revisionDeadline || ""}
                                onChange={(e) =>
                                  setDecisionDrafts((prev) => ({
                                    ...prev,
                                    [s.id]: {
                                      decision: prev[s.id]?.decision || "",
                                      reviewerComments: prev[s.id]?.reviewerComments || "",
                                      editorComments: prev[s.id]?.editorComments || "",
                                      revisionDeadline: e.target.value,
                                    },
                                  }))
                                }
                                style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                              />
                              <textarea
                                rows={2}
                                placeholder="Reviewer comments"
                                value={decisionDrafts[s.id]?.reviewerComments || ""}
                                onChange={(e) =>
                                  setDecisionDrafts((prev) => ({
                                    ...prev,
                                    [s.id]: {
                                      decision: prev[s.id]?.decision || "",
                                      reviewerComments: e.target.value,
                                      editorComments: prev[s.id]?.editorComments || "",
                                      revisionDeadline: prev[s.id]?.revisionDeadline || "",
                                    },
                                  }))
                                }
                                style={{ fontSize: "0.75rem", padding: "0.4rem" }}
                              />
                              <textarea
                                rows={2}
                                placeholder="Editor comments"
                                value={decisionDrafts[s.id]?.editorComments || ""}
                                onChange={(e) =>
                                  setDecisionDrafts((prev) => ({
                                    ...prev,
                                    [s.id]: {
                                      decision: prev[s.id]?.decision || "",
                                      reviewerComments: prev[s.id]?.reviewerComments || "",
                                      editorComments: e.target.value,
                                      revisionDeadline: prev[s.id]?.revisionDeadline || "",
                                    },
                                  }))
                                }
                                style={{ fontSize: "0.75rem", padding: "0.4rem" }}
                              />
                              <button
                                className="button-secondary"
                                type="button"
                                onClick={() => sendDecision(s)}
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                              >
                                Send decision email
                              </button>
                            </div>
                          </details>
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
              <h3>Reviewer metrics</h3>
              <p className="text-sm text-slate-600">Performance snapshot based on assignments and reviews.</p>
            </div>
          </div>

          {reviewerMetrics.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No reviewer activity yet.</p>
          ) : (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Assignments</th>
                    <th>Submitted</th>
                    <th>Overdue</th>
                    <th>Avg score</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewerMetrics.map((metric) => (
                    <tr key={metric.id}>
                      <td>
                        {metric.name}
                        <br />
                        <small>{metric.email}</small>
                      </td>
                      <td>{metric.assignments}</td>
                      <td>{metric.submitted}</td>
                      <td style={{ color: metric.overdue ? "#dc2626" : "inherit" }}>{metric.overdue}</td>
                      <td>{metric.avgScore ?? "-"}</td>
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Users & Accounts</h3>
              <p className="text-sm text-slate-600">Manage roles, access, and resets.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchUsers} disabled={userLoading}>
              {userLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {userError ? (
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
              {userError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Name
                <input
                  className="input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </label>
              <label className="label">
                Email
                <input
                  className="input"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Temporary password
                <input
                  className="input"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </label>
              <label className="label">
                Role
                <select
                  className="input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Affiliation
                <input
                  className="input"
                  value={userForm.affiliation}
                  onChange={(e) => setUserForm({ ...userForm, affiliation: e.target.value })}
                />
              </label>
              <label className="label">
                Status
                <select
                  className="input"
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                >
                  {USER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="label">
              ORCID
              <input
                className="input"
                value={userForm.orcid}
                onChange={(e) => setUserForm({ ...userForm, orcid: e.target.value })}
              />
            </label>
            <button className="button primary" type="button" onClick={createUser}>
              Create user
            </button>
          </div>

          {users.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last login</th>
                    <th>Reset password</th>
                    <th>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const draft = userEdits[u.id] || {
                      role: u.role || "author",
                      status: u.status || "active",
                      password: "",
                    };
                    return (
                      <tr key={u.id}>
                        <td>
                          {u.name}
                          <br />
                          <small>{u.email}</small>
                        </td>
                        <td>
                          <select
                            value={draft.role}
                            onChange={(e) =>
                              setUserEdits((prev) => ({
                                ...prev,
                                [u.id]: { ...draft, role: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              setUserEdits((prev) => ({
                                ...prev,
                                [u.id]: { ...draft, status: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            {USER_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "-"}
                        </td>
                        <td>
                          <input
                            type="password"
                            placeholder="New password"
                            value={draft.password}
                            onChange={(e) =>
                              setUserEdits((prev) => ({
                                ...prev,
                                [u.id]: { ...draft, password: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          />
                        </td>
                        <td>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => updateUser(u.id)}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No users yet.</p>
          )}
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Content & Publishing</h3>
              <p className="text-sm text-slate-600">Track published articles and schedule releases.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchPublishing} disabled={publishingLoading}>
              {publishingLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {publishingError ? (
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
              {publishingError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Title
                <input
                  className="input"
                  value={publishingForm.title}
                  onChange={(e) => setPublishingForm({ ...publishingForm, title: e.target.value })}
                />
              </label>
              <label className="label">
                Slug
                <input
                  className="input"
                  value={publishingForm.slug}
                  onChange={(e) => setPublishingForm({ ...publishingForm, slug: e.target.value })}
                />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
              <label className="label">
                Volume
                <input
                  className="input"
                  value={publishingForm.volume}
                  onChange={(e) => setPublishingForm({ ...publishingForm, volume: e.target.value })}
                />
              </label>
              <label className="label">
                Issue
                <input
                  className="input"
                  value={publishingForm.issue}
                  onChange={(e) => setPublishingForm({ ...publishingForm, issue: e.target.value })}
                />
              </label>
              <label className="label">
                Year
                <input
                  className="input"
                  value={publishingForm.year}
                  onChange={(e) => setPublishingForm({ ...publishingForm, year: e.target.value })}
                />
              </label>
              <label className="label">
                DOI
                <input
                  className="input"
                  value={publishingForm.doi}
                  onChange={(e) => setPublishingForm({ ...publishingForm, doi: e.target.value })}
                />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label className="label">
                Status
                <select
                  className="input"
                  value={publishingForm.status}
                  onChange={(e) => setPublishingForm({ ...publishingForm, status: e.target.value })}
                >
                  {PUBLISHING_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                Schedule publish date
                <input
                  type="date"
                  className="input"
                  value={publishingForm.scheduledAt}
                  onChange={(e) => setPublishingForm({ ...publishingForm, scheduledAt: e.target.value })}
                />
              </label>
            </div>
            <button className="button primary" type="button" onClick={createPublishing}>
              Add publishing entry
            </button>
          </div>

          {publishing.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Schedule</th>
                    <th>DOI</th>
                    <th>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {publishing.map((item) => {
                    const draft = publishingEdits[item.id] || {
                      status: item.status,
                      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 10) : "",
                    };
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.title}
                          <br />
                          <small>{item.slug}</small>
                        </td>
                        <td>
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              setPublishingEdits((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, status: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            {PUBLISHING_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            value={draft.scheduledAt}
                            onChange={(e) =>
                              setPublishingEdits((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, scheduledAt: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                          />
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>{item.doi || "-"}</td>
                        <td>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => updatePublishing(item.id)}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No publishing entries yet.</p>
          )}
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Templates & Emails</h3>
              <p className="text-sm text-slate-600">Decision letters and reusable notifications.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchTemplates} disabled={templateLoading}>
              {templateLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {templateError ? (
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
              {templateError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <label className="label">
              Template name
              <input
                className="input"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </label>
            <label className="label">
              Subject line
              <input
                className="input"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              />
            </label>
            <label className="label">
              Body (HTML or plain)
              <textarea
                className="input"
                rows={4}
                value={templateForm.bodyHtml}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
              />
            </label>
            <label className="label">
              Description
              <input
                className="input"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              />
            </label>
            <button className="button primary" type="button" onClick={createTemplate}>
              Create template
            </button>
          </div>

          {templates.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Body</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => {
                    const draft = templateEdits[tpl.id] || {
                      name: tpl.name,
                      subject: tpl.subject,
                      bodyHtml: tpl.bodyHtml,
                      description: tpl.description || "",
                    };
                    return (
                      <tr key={tpl.id}>
                        <td>
                          <input
                            value={draft.name}
                            onChange={(e) =>
                              setTemplateEdits((prev) => ({
                                ...prev,
                                [tpl.id]: { ...draft, name: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
                          />
                        </td>
                        <td>
                          <input
                            value={draft.subject}
                            onChange={(e) =>
                              setTemplateEdits((prev) => ({
                                ...prev,
                                [tpl.id]: { ...draft, subject: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.4rem" }}
                          />
                        </td>
                        <td>
                          <textarea
                            rows={3}
                            value={draft.bodyHtml}
                            onChange={(e) =>
                              setTemplateEdits((prev) => ({
                                ...prev,
                                [tpl.id]: { ...draft, bodyHtml: e.target.value },
                              }))
                            }
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem", minWidth: "220px" }}
                          />
                        </td>
                        <td>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => updateTemplate(tpl.id)}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Save
                          </button>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => deleteTemplate(tpl.id)}
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", marginLeft: "0.4rem" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No templates yet.</p>
          )}
        </div>

        {/* Admin Accounts */}
        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Admin Accounts</h3>
              <p className="text-sm text-slate-600">
                Manage admin panel login credentials.
                {loggedInDisplayName ? ` Logged in as: ${loggedInDisplayName}` : null}
              </p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchAdminAccounts} disabled={adminAcctsLoading}>
              {adminAcctsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {adminAcctsError ? (
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
              {adminAcctsError}
            </div>
          ) : null}

          {/* Existing accounts */}
          {adminAccts.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAccts.map((acct) => (
                    <tr key={acct.id}>
                      {editAcctId === acct.id ? (
                        <>
                          <td>
                            <input
                              className="input"
                              style={{ fontSize: "0.85rem", padding: "0.3rem 0.5rem" }}
                              value={editAcctForm.username}
                              onChange={(e) => setEditAcctForm({ ...editAcctForm, username: e.target.value })}
                              placeholder="Username"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              style={{ fontSize: "0.85rem", padding: "0.3rem 0.5rem" }}
                              value={editAcctForm.displayName}
                              onChange={(e) => setEditAcctForm({ ...editAcctForm, displayName: e.target.value })}
                              placeholder="Display name"
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              style={{ fontSize: "0.85rem", padding: "0.3rem 0.5rem" }}
                              type="password"
                              value={editAcctForm.password}
                              onChange={(e) => setEditAcctForm({ ...editAcctForm, password: e.target.value })}
                              placeholder="New password (leave empty to keep)"
                            />
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              className="button primary"
                              type="button"
                              onClick={updateAdminAccount}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Save
                            </button>
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => { setEditAcctId(null); setEditAcctForm({ username: "", password: "", displayName: "" }); }}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", marginLeft: "0.4rem" }}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{acct.username}</td>
                          <td>{acct.displayName || "-"}</td>
                          <td style={{ fontSize: "0.8rem" }}>
                            {acct.createdAt ? new Date(acct.createdAt).toLocaleDateString() : "-"}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => {
                                setEditAcctId(acct.id);
                                setEditAcctForm({ username: acct.username, password: "", displayName: acct.displayName || "" });
                              }}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Edit
                            </button>
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => deleteAdminAccount(acct.id)}
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", marginLeft: "0.4rem", color: "#dc2626" }}
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#6b7280" }}>
              No admin accounts yet. Use the form below to create one.
            </p>
          )}

          {/* Add new account form */}
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
            <h4 style={{ marginBottom: "0.75rem" }}>Add new admin</h4>
            <div style={{ display: "grid", gap: "0.5rem", maxWidth: "400px" }}>
              <input
                className="input"
                value={newAcctForm.username}
                onChange={(e) => setNewAcctForm({ ...newAcctForm, username: e.target.value })}
                placeholder="Username"
              />
              <input
                className="input"
                type="password"
                value={newAcctForm.password}
                onChange={(e) => setNewAcctForm({ ...newAcctForm, password: e.target.value })}
                placeholder="Password (min 6 characters)"
              />
              <input
                className="input"
                value={newAcctForm.displayName}
                onChange={(e) => setNewAcctForm({ ...newAcctForm, displayName: e.target.value })}
                placeholder="Display name (optional)"
              />
              <button
                className="button primary"
                type="button"
                onClick={createAdminAccount}
                disabled={!newAcctForm.username || !newAcctForm.password}
              >
                Create admin account
              </button>
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3>Settings & Audit</h3>
              <p className="text-sm text-slate-600">Journal configuration and activity log.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchSettings} disabled={settingsLoading}>
              {settingsLoading ? "Refreshing..." : "Refresh settings"}
            </button>
          </div>

          {settingsError ? (
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
              {settingsError}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <label className="label">
              Setting key
              <input
                className="input"
                value={settingForm.key}
                onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })}
                placeholder="sections, article_types, review_model"
              />
            </label>
            <label className="label">
              Value
              <textarea
                className="input"
                rows={3}
                value={settingForm.value}
                onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })}
                placeholder="JSON or plain text"
              />
            </label>
            <button className="button primary" type="button" onClick={saveSetting}>
              Save setting
            </button>
          </div>

          {settings.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Value</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.key}>
                      <td>{setting.key}</td>
                      <td style={{ fontSize: "0.8rem" }}>{setting.value || "-"}</td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {setting.updatedAt ? new Date(setting.updatedAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No settings saved yet.</p>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
            <div>
              <h4>Audit log</h4>
              <p className="text-sm text-slate-600">Every admin action recorded.</p>
            </div>
            <button className="button-secondary" type="button" onClick={fetchAudit} disabled={auditLoading}>
              {auditLoading ? "Refreshing..." : "Refresh audit"}
            </button>
          </div>

          {auditError ? (
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
              {auditError}
            </div>
          ) : null}

          {auditEvents.length > 0 ? (
            <div className="table-wrapper" style={{ marginTop: "1rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((event) => (
                    <tr key={event.id}>
                      <td style={{ fontSize: "0.8rem" }}>
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : "-"}
                      </td>
                      <td>{event.action}</td>
                      <td>{event.entityType}</td>
                      <td style={{ fontSize: "0.75rem" }}>{event.detail || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>No audit events yet.</p>
          )}
        </div>

      </section>
    </>
  );
}
