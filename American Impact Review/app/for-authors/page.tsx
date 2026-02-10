"use client";

import Link from "next/link";

export default function ForAuthorsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Authors</h1>
          <p>Submission standards, formatting guidance, and review timelines.</p>
          <div className="page-meta">
            <span>Templates</span>
            <span>Ethics</span>
            <span>Peer Review</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          Authors are invited to submit original research, applied studies, and
          structured analytical reviews. Manuscripts should follow the journal
          template and ethical standards.
        </p>
        <p>
          Submissions should clearly state the author’s contribution, methodology,
          and evidence of impact. We recommend a structured format consistent with
          international journal practices to maximize credibility and indexing.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">3–5d</div>
            <div className="lbl">Screening</div>
          </div>
          <div className="page-vital-card">
            <div className="val">7–14d</div>
            <div className="lbl">Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Next</div>
            <div className="lbl">Issue Window</div>
          </div>
        </div>

        <div className="card settings-card">
          <h3>Submission requirements</h3>
          <ul className="category-list">
            <li>Structured abstract, introduction, methods, results, references</li>
            <li>Originality statement and conflict of interest disclosure</li>
            <li>Tables and figures labeled clearly</li>
            <li>References in APA/IEEE/Chicago format</li>
            <li>Author affiliations and ORCID (if available)</li>
            <li>Keywords section (5–8 terms)</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Review timeline</h3>
          <ul className="category-list">
            <li>Initial screening: 3–5 business days</li>
            <li>Peer review: 7–14 days</li>
            <li>Publication window: next available issue</li>
            <li>Certificate issued after acceptance</li>
          </ul>
        </div>

        <ul className="actions">
          <li>
            <Link className="button" href="/submit">
              Submit article
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
