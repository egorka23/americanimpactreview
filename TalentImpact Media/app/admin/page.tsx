"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { listAllSubmissions, publishSubmission, updateSubmissionMetadata, updateSubmissionStatus } from "@/lib/firestore";
import { createSlug } from "@/lib/slug";
import type { Submission } from "@/lib/types";

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    listAllSubmissions()
      .then((items) => setSubmissions(items))
      .finally(() => setLoading(false));
  }, []);

  const updateLocalSubmission = (id: string, updates: Partial<Submission>) => {
    setSubmissions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  return (
    <AdminGate>
      <section>
        <header className="major">
          <h2>Admin dashboard</h2>
        </header>

        <div className="card settings-card" style={{ marginBottom: "2rem" }}>
          <h3>Pending submissions</h3>
          {loading ? (
            <p>Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <div className="posts">
              {submissions.map((submission) => (
                <article key={submission.id}>
                  <h3>{submission.title}</h3>
                  <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem" }}>
                    {submission.category || "Journal"} · {submission.status}
                  </p>
                  <p>
                    Author:{" "}
                    <Link href={`/profile/${submission.authorUsername}`}>
                      {submission.authorUsername}
                    </Link>
                  </p>
                  <div className="card settings-card" style={{ margin: "1rem 0" }}>
                    <h4>Publication metadata</h4>
                    <div className="settings-form">
                      <label className="label" htmlFor={`doi-${submission.id}`}>
                        DOI
                      </label>
                      <input
                        className="input"
                        id={`doi-${submission.id}`}
                        value={submission.doi || ""}
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, { doi: event.target.value })
                        }
                        placeholder="10.0000/tij.xxxx"
                      />
                      <label className="label" htmlFor={`received-${submission.id}`}>
                        Received date
                      </label>
                      <input
                        className="input"
                        id={`received-${submission.id}`}
                        type="date"
                        value={
                          submission.receivedAt
                            ? submission.receivedAt.toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, {
                            receivedAt: event.target.value
                              ? new Date(`${event.target.value}T00:00:00`)
                              : null
                          })
                        }
                      />
                      <label className="label" htmlFor={`accepted-${submission.id}`}>
                        Accepted date
                      </label>
                      <input
                        className="input"
                        id={`accepted-${submission.id}`}
                        type="date"
                        value={
                          submission.acceptedAt
                            ? submission.acceptedAt.toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, {
                            acceptedAt: event.target.value
                              ? new Date(`${event.target.value}T00:00:00`)
                              : null
                          })
                        }
                      />
                      <label className="label" htmlFor={`published-${submission.id}`}>
                        Published date
                      </label>
                      <input
                        className="input"
                        id={`published-${submission.id}`}
                        type="date"
                        value={
                          submission.publishedAt
                            ? submission.publishedAt.toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, {
                            publishedAt: event.target.value
                              ? new Date(`${event.target.value}T00:00:00`)
                              : null
                          })
                        }
                      />
                      <label className="label" htmlFor={`affiliations-${submission.id}`}>
                        Affiliations (comma separated)
                      </label>
                      <input
                        className="input"
                        id={`affiliations-${submission.id}`}
                        value={(submission.affiliations || []).join(", ")}
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, {
                            affiliations: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                          })
                        }
                        placeholder="University of X, Institute of Y"
                      />
                      <label className="label" htmlFor={`funding-${submission.id}`}>
                        Funding
                      </label>
                      <textarea
                        className="input"
                        id={`funding-${submission.id}`}
                        rows={2}
                        value={submission.funding || ""}
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, { funding: event.target.value })
                        }
                        placeholder="Grant numbers, institutional support"
                      />
                      <label className="label" htmlFor={`conflicts-${submission.id}`}>
                        Competing interests
                      </label>
                      <textarea
                        className="input"
                        id={`conflicts-${submission.id}`}
                        rows={2}
                        value={submission.competingInterests || ""}
                        onChange={(event) =>
                          updateLocalSubmission(submission.id, { competingInterests: event.target.value })
                        }
                        placeholder="Disclosures or 'None declared'"
                      />
                      <button
                        className="button"
                        type="button"
                        disabled={savingId === submission.id}
                        onClick={async () => {
                          setSavingId(submission.id);
                          await updateSubmissionMetadata(submission.id, {
                            doi: submission.doi || "",
                            receivedAt: submission.receivedAt ?? null,
                            acceptedAt: submission.acceptedAt ?? null,
                            publishedAt: submission.publishedAt ?? null,
                            affiliations: submission.affiliations ?? [],
                            funding: submission.funding ?? "",
                            competingInterests: submission.competingInterests ?? ""
                          });
                          setSavingId(null);
                        }}
                      >
                        {savingId === submission.id ? "Saving..." : "Save metadata"}
                      </button>
                    </div>
                  </div>
                  <ul className="actions">
                    {submission.status === "submitted" ? (
                      <>
                        <li>
                          <button
                            className="button-secondary"
                            onClick={async () => {
                              await updateSubmissionStatus(submission.id, "under_review");
                              updateLocalSubmission(submission.id, { status: "under_review" });
                            }}
                          >
                            Mark under review
                          </button>
                        </li>
                        <li>
                          <button
                            className="button"
                            onClick={async () => {
                              await updateSubmissionStatus(submission.id, "accepted");
                              updateLocalSubmission(submission.id, { status: "accepted" });
                            }}
                          >
                            Accept
                          </button>
                        </li>
                      </>
                    ) : null}
                    {submission.status === "accepted" ? (
                      <li>
                        <button
                          className="button"
                          onClick={async () => {
                            const slug = createSlug(submission.title);
                            await publishSubmission(submission, slug);
                            updateLocalSubmission(submission.id, { status: "published" });
                          }}
                        >
                          Publish to journal
                        </button>
                      </li>
                    ) : null}
                    {submission.status !== "rejected" && submission.status !== "published" ? (
                      <li>
                        <button
                          className="button-secondary"
                          onClick={async () => {
                            await updateSubmissionStatus(submission.id, "rejected");
                            updateLocalSubmission(submission.id, { status: "rejected" });
                          }}
                        >
                          Reject
                        </button>
                      </li>
                    ) : null}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="settings-grid">
          <div className="card settings-card">
            <h3 className="text-xl font-semibold">Submissions</h3>
            <p className="text-sm text-slate-600">
              Review incoming articles, assign issues, and change status.
            </p>
            <ul className="category-list">
              <li>Submitted</li>
              <li>Under review</li>
              <li>Accepted</li>
              <li>Published</li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3 className="text-xl font-semibold">Issues & archive</h3>
            <p className="text-sm text-slate-600">
              Create new journal issues, set deadlines, and publish archives.
            </p>
            <ul className="category-list">
              <li>Issue schedule</li>
              <li>Archive PDFs</li>
              <li>DOI/ISSN metadata</li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3 className="text-xl font-semibold">Authors</h3>
            <p className="text-sm text-slate-600">
              View author accounts, profiles, and draft activity.
            </p>
            <ul className="category-list">
              <li>User directory</li>
              <li>Draft overview</li>
              <li>Reviewer access</li>
            </ul>
          </div>
        </div>
      </section>
    </AdminGate>
  );
}
