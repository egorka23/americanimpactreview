"use client";

import Link from "next/link";

export default function ArchivePage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Archive</div>
          <h1>Journal Archive</h1>
          <p>Browse published issues, tables of contents, and downloadable PDFs.</p>
          <div className="page-meta">
            <span>Issue Archive</span>
            <span>Open Access</span>
            <span>PDF Records</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">2</div>
            <div className="lbl">Issues Listed</div>
          </div>
          <div className="page-vital-card">
            <div className="val">2026</div>
            <div className="lbl">Current Year</div>
          </div>
          <div className="page-vital-card">
            <div className="val">PDF</div>
            <div className="lbl">Downloads</div>
          </div>
        </div>

        <div className="posts">
          {[
            {
              title: "2026 · Volume 1 · Issue 1",
              deadline: "Submission deadline: March 15, 2026",
              release: "Publication date: March 30, 2026"
            },
            {
              title: "2026 · Volume 1 · Issue 2",
              deadline: "Submission deadline: April 15, 2026",
              release: "Publication date: April 30, 2026"
            }
          ].map((issue) => (
            <article key={issue.title}>
              <h3>{issue.title}</h3>
              <p>{issue.deadline}</p>
              <p>{issue.release}</p>
              <p>Issue PDF and full table of contents.</p>
              <ul className="actions">
                <li>
                  <Link className="button" href="/journal">
                    View issue
                  </Link>
                </li>
              </ul>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
