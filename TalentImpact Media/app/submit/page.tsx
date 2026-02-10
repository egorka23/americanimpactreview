"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";

function SubmitContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted");

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Submit</div>
          <h1>Submit Now</h1>
          <p>
            Submit your manuscript to American Impact Review. Every submission is
            screened for formatting, originality, and ethical compliance before
            entering peer review.
          </p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>Peer‑Reviewed</span>
            <span>ISSN Pending</span>
          </div>
        </div>
      </section>

      <section className="page-section">

      <div style={{ display: "flex", justifyContent: "center", margin: "1.25rem 0 1.5rem" }}>
        {user ? (
          <Link className="button" href="/write/new">
            Go to uploads
          </Link>
        ) : (
          <Link className="button" href="/signup">
            Create account to submit
          </Link>
        )}
      </div>

      {submitted ? (
        <div className="card settings-card">
          <h3>Submission received</h3>
          <p>
            Thank you. Your manuscript is now marked as <strong>Submitted</strong>.
            The editorial team will review it and notify you of the next steps.
          </p>
          <p className="text-sm text-slate-600">Submission ID: {submitted}</p>
        </div>
      ) : null}

      <div className="card settings-card">
        <h3>Submission checklist</h3>
        <ul className="category-list">
          <li>Use the journal template and structured sections</li>
          <li>Include abstract, keywords, and references</li>
          <li>Provide author affiliations and ORCID (if available)</li>
          <li>Confirm originality and conflict of interest disclosure</li>
        </ul>
      </div>

      <div className="card settings-card">
        <h3>Publication timeline</h3>
        <ul className="category-list">
          <li>Initial screening: 3–5 business days</li>
          <li>Peer review: 7–14 days</li>
          <li>Decision: accept / revise / reject</li>
          <li>Issue placement after acceptance</li>
        </ul>
      </div>
      </section>
    </>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SubmitContent />
    </Suspense>
  );
}
