"use client";

import Link from "next/link";

export default function GettingStartedClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Getting Started</h1>
          <p>
            Everything you need to submit a manuscript to American Impact Review.
          </p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>Peer-Reviewed</span>
            <span>ISSN Pending</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="card settings-card">
          <h3>Before you submit</h3>
          <ul className="category-list">
            <li>Prepare an original manuscript with clear sections and citations.</li>
            <li>Include abstract, keywords, author affiliations, and ORCID (if available).</li>
            <li>Provide data availability, ethics statements, and disclosures.</li>
            <li>Confirm all authors approve the final submission.</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Submission flow</h3>
          <ol>
            <li>Create or sign in to your author account.</li>
            <li>Upload your manuscript and complete all metadata fields.</li>
            <li>Editorial screening for scope, formatting, and compliance.</li>
            <li>Peer review and decision notification.</li>
          </ol>
        </div>

        <div className="editor-layout">
          <div className="card settings-card">
            <h3>What we publish</h3>
            <p>Original research, structured reviews, and impact-focused case studies.</p>
            <ul className="category-list">
              <li>Quantitative or qualitative evidence with reproducible methods</li>
              <li>Clear contributions and measurable outcomes</li>
              <li>Proper citations and ethical compliance</li>
            </ul>
          </div>
          <div className="card settings-card">
            <h3>Submission readiness</h3>
            <p>Use the checklist to ensure your work is eligible for review.</p>
            <ul className="category-list">
              <li>Abstract and keywords</li>
              <li>References and data availability</li>
              <li>Funding and competing interests</li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
          <Link className="button" href="/submit">
            Submit Now
          </Link>
        </div>
      </section>
    </>
  );
}
