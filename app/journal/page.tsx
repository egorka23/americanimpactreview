"use client";

import Link from "next/link";

export default function JournalPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>What We Publish</h1>
          <p>Multidisciplinary research, professional analysis, and documented impact.</p>
          <div className="page-meta">
            <span>Peer-Reviewed</span>
            <span>Open Access</span>
            <span>Continuous Publishing</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          American Impact Review is a peer-reviewed, multidisciplinary publication
          focused on applied research, professional analysis, and documented
          impact. We publish original articles, structured reviews, and case
          studies that demonstrate measurable contributions in science,
          engineering, medicine, business, and the arts.
        </p>
        <p>
          The journal follows a continuous publishing model: submission →
          editorial screening → peer review → acceptance → immediate publication.
          Articles are published individually as soon as they are accepted, with
          no waiting for issue deadlines. Each article receives a permanent
          archive placement.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">24h</div>
            <div className="lbl">Post-Acceptance</div>
          </div>
          <div className="page-vital-card">
            <div className="val">ISSN</div>
            <div className="lbl">Pending</div>
          </div>
          <div className="page-vital-card">
            <div className="val">DOI</div>
            <div className="lbl">Planned</div>
          </div>
        </div>

        <div className="posts">
          <article>
            <h3>Original research</h3>
            <p>Data-driven studies, experiments, or field reports with rigorous methods.</p>
            <ul className="actions">
              <li>
                <Link className="button" href="/publication-rules">
                  Submission guidelines
                </Link>
              </li>
            </ul>
          </article>
          <article>
            <h3>Analytical reviews</h3>
            <p>Structured syntheses of evidence, methods, and field progress.</p>
            <ul className="actions">
              <li>
                <Link className="button" href="/about-journal">
                  Getting started
                </Link>
              </li>
            </ul>
          </article>
          <article>
            <h3>Case studies</h3>
            <p>Documented impact with measurable outcomes and independent validation.</p>
            <ul className="actions">
              <li>
                <Link className="button" href="/submit">
                  Submit now
                </Link>
              </li>
            </ul>
          </article>
        </div>

        <div className="glass" style={{ padding: "1.5rem", marginTop: "2rem" }}>
          <h3>Journal details</h3>
          <ul className="category-list">
            <li>ISSN: pending (application submitted)</li>
            <li>DOI: planned (Crossref registration in progress)</li>
            <li>Indexing: Google Scholar (pending site indexation)</li>
            <li>Publication model: Continuous (rolling) publication</li>
            <li>Open access: Immediate online access</li>
          </ul>
        </div>

        <div className="card settings-card" style={{ marginTop: "1.5rem" }}>
          <h3>How to publish</h3>
          <ol>
            <li>Prepare your manuscript using the journal template.</li>
            <li>Submit through your author account.</li>
            <li>Complete editorial screening and peer review.</li>
            <li>Receive acceptance and publication certificate.</li>
          </ol>
        </div>
      </section>
    </>
  );
}
