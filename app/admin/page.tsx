"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

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
  { value: "under_review", label: "Under Review", color: "#2563eb" },
  { value: "accepted", label: "Accepted", color: "#16a34a" },
  { value: "rejected", label: "Rejected", color: "#dc2626" },
  { value: "revision_requested", label: "Revision Requested", color: "#d97706" },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions");
      if (res.status === 401 || res.status === 403) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data);
    } catch {
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    } catch {
      alert("Failed to update status.");
    }
  };

  if (authLoading) return <section><p>Loading...</p></section>;

  if (!user) {
    return (
      <section>
        <header className="major"><h2>Admin</h2></header>
        <p>Please <Link href="/login?callbackUrl=/admin">log in</Link> to access the admin panel.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <header className="major"><h2>Admin</h2></header>
        <p style={{ color: "#b91c1c" }}>{error}</p>
        <ul className="actions">
          <li><Link href="/" className="button">Home</Link></li>
        </ul>
      </section>
    );
  }

  return (
    <section>
      <header className="major">
        <h2>Submissions dashboard</h2>
      </header>

      {loading ? (
        <p>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>File</th>
                <th>Date</th>
                <th>Actions</th>
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
                      {s.keywords && (
                        <>
                          <br />
                          <small style={{ color: "#4b5563" }}>
                            <strong>Keywords:</strong> {s.keywords}
                          </small>
                        </>
                      )}
                      {s.conflictOfInterest !== null && s.conflictOfInterest !== "" && (
                        <>
                          <br />
                          <small style={{ color: "#b45309" }}>
                            <strong>COI:</strong> {s.conflictOfInterest}
                          </small>
                        </>
                      )}
                    </td>
                    <td>
                      {s.userName || "Unknown"}
                      <br />
                      <small>{s.userEmail}</small>
                    </td>
                    <td>{s.category}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#fff",
                        background: currentStatus?.color || "#6b7280",
                      }}>
                        {currentStatus?.label || s.status}
                      </span>
                    </td>
                    <td>
                      {s.manuscriptUrl ? (
                        <a href={s.manuscriptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem" }}>
                          {s.manuscriptName || "View Manuscript"}
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
    </section>
  );
}
