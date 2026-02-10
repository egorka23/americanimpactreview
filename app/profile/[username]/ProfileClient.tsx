"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";

type SubmissionItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string | null;
};

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
    return <section><p>Loading...</p></section>;
  }

  return (
    <section>
      <header className="major">
        <h2>Author profile</h2>
      </header>

      {user && isOwnProfile ? (
        <>
          <div className="card settings-card" style={{ marginBottom: "2rem" }}>
            <h3>{user.name || "Author"}</h3>
            <p style={{ color: "#6b7280", margin: 0 }}>{user.email}</p>
          </div>

          <h3>Your submissions</h3>
          {loadingSubs ? (
            <p>Loading...</p>
          ) : submissions.length === 0 ? (
            <p>
              No submissions yet.{" "}
              <Link href="/submit">Submit your first manuscript</Link>.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>{s.category}</td>
                      <td>
                        <span style={{
                          textTransform: "capitalize",
                          fontSize: "0.85rem",
                        }}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p>Author profiles are not yet public. <Link href="/explore">Explore articles</Link> instead.</p>
      )}
    </section>
  );
}
