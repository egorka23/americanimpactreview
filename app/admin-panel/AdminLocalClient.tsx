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
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
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
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  useEffect(() => {
    if (authed) fetchSubmissions();
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
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const currentStatus = STATUS_OPTIONS.find((o) => o.value === s.status);
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
                            value={s.status}
                            onChange={(e) => updateStatus(s.id, e.target.value)}
                            style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
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
