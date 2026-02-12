"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import SubmissionsTable, { type Submission } from "./components/SubmissionsTable";
import DetailPanel from "./components/DetailPanel";

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

export default function AdminDashboard() {
  // Auth state
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeView, setActiveView] = useState<string>("submissions");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Check saved auth on mount
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("air_admin_authed") === "1") {
      setAuthed(true);
    }
  }, []);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, assignRes, revRes] = await Promise.all([
        fetch("/api/local-admin/submissions"),
        fetch("/api/local-admin/assignments"),
        fetch("/api/local-admin/reviews"),
      ]);

      if (subsRes.status === 401) {
        localStorage.removeItem("air_admin_authed");
        setAuthed(false);
        return;
      }

      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (assignRes.ok) setAssignments(await assignRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } catch {
      // Silently fail — data will be empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when authed
  useEffect(() => {
    if (authed) fetchAll();
  }, [authed, fetchAll]);

  // Refresh and keep selection in sync
  const handleRefresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  // Keep selected submission in sync after refresh
  const currentSelected = useMemo(() => {
    if (!selectedSubmission) return null;
    return submissions.find((s) => s.id === selectedSubmission.id) || null;
  }, [submissions, selectedSubmission]);

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/local-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Login failed");
      }
      localStorage.setItem("air_admin_authed", "1");
      setAuthed(true);
      setPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/local-admin/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("air_admin_authed");
    setAuthed(false);
    setSelectedSubmission(null);
  };

  // Handle nav
  const handleNavigate = (view: string) => {
    if (view === "reviewers") {
      // Open external link for now
      window.open("https://docs.google.com/spreadsheets", "_blank");
      return;
    }
    if (view === "settings") {
      alert("Settings coming soon");
      return;
    }
    setActiveView(view);
    setSelectedSubmission(null);
  };

  // Login screen
  if (!authed) {
    return (
      <div data-admin-panel className="min-h-screen bg-[#0a1628] flex items-center justify-center relative z-10">
        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">AIR Admin</h1>
          <p className="text-sm text-gray-400 mb-6">Editorial Dashboard</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            autoFocus
          />

          {loginError && <p className="text-sm text-red-600 mb-3">{loginError}</p>}

          <button
            type="submit"
            disabled={loginLoading}
            className="admin-btn"
            style={{ background: "#0a1628", color: "#ffffff", borderRadius: "0.5rem" }}
          >
            {loginLoading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // Main layout
  return (
    <div data-admin-panel className="flex h-screen overflow-hidden relative z-10" style={{ background: "#ffffff", color: "#111827" }}>
      <Sidebar active={activeView} onNavigate={handleNavigate} onLogout={handleLogout} />

      {activeView === "dashboard" ? (
        <div className="flex-1 overflow-y-auto">
          <DashboardView submissions={submissions} />
        </div>
      ) : (
        <>
          {/* Center: table */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Submissions
                {loading && <span className="ml-2 text-sm text-gray-400 font-normal">Loading…</span>}
              </h2>
              <button
                onClick={handleRefresh}
                className="admin-refresh-btn"
                title="Refresh"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SubmissionsTable
                submissions={submissions}
                selectedId={currentSelected?.id || null}
                onSelect={setSelectedSubmission}
              />
            </div>
          </div>

          {/* Right: details */}
          {currentSelected ? (
            <DetailPanel
              submission={currentSelected}
              assignments={assignments}
              reviews={reviews}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="w-[380px] border-l border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
              <p className="text-sm text-gray-400">Select a submission to view details</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
