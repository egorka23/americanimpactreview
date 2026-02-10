"use client";

export default function AboutJournalPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>About the Journal</h1>
          <p>
            A multidisciplinary, peer-reviewed publication with a broad scope and
            structured editorial standards.
          </p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>Peer-Reviewed</span>
            <span>ISSN Pending</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          American Impact Review is a professional scientific journal publishing
          original research, applied studies, and analytical reviews across
          technology, medicine, engineering, and social sciences.
        </p>
        <p>
          American Impact Review is a multidisciplinary, peer-reviewed publication
          with a broad scope. We welcome submissions across diverse fields and
          encourage work that integrates evidence, methods, or perspectives from
          multiple disciplines. This is a general journal and is not limited to a
          single topic area.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">24h</div>
            <div className="lbl">Post-Acceptance</div>
          </div>
          <div className="page-vital-card">
            <div className="val">3-5d</div>
            <div className="lbl">Screening</div>
          </div>
          <div className="page-vital-card">
            <div className="val">7-14d</div>
            <div className="lbl">Review</div>
          </div>
        </div>

        <div className="faq-grid">
          <details className="faq-card" open>
            <summary>Journal identifiers</summary>
            <ul className="category-list">
              <li>ISSN (print): 0000-0000 (placeholder)</li>
              <li>ISSN (online): 0000-0001 (placeholder)</li>
              <li>DOI prefix: 10.0000/tij (placeholder)</li>
              <li>Publisher: Global Talent Foundation Inc.</li>
            </ul>
          </details>

          <details className="faq-card">
            <summary>Indexing & visibility</summary>
            <ul className="category-list">
              <li>Google Scholar: application planned</li>
              <li>Crossref DOI registration: planned</li>
              <li>Open access: immediate</li>
            </ul>
          </details>
        </div>


        <div className="write-section">
          <header className="major">
            <h2>Policies & Ethics</h2>
          </header>
          <div className="faq-grid">
            <details className="faq-card" open>
              <summary>Publication ethics & malpractice</summary>
              <p>
                American Impact Review follows standard publication-ethics practices for
                authors, reviewers, and editors. We do not tolerate plagiarism, duplicate
                submission, data fabrication, or inappropriate authorship. Reports of
                misconduct are investigated by the editorial office and may result in
                correction, retraction, or editorial notice.
              </p>
              <ul className="category-list">
                <li>Plagiarism and duplicate publication are prohibited</li>
                <li>Authorship must reflect substantive contributions</li>
                <li>Ethical approval and consent must be disclosed where applicable</li>
              </ul>
            </details>

            <details className="faq-card">
              <summary>Conflicts of interest & disclosure</summary>
              <p>
                Authors, reviewers, and editors must disclose relationships or activities
                that could bias their work. Editorial decisions are made by individuals
                without conflicts, and disclosures are published when relevant.
              </p>
              <ul className="category-list">
                <li>All authors must submit a disclosure statement (placeholder)</li>
                <li>Reviewers recuse themselves if conflicts exist</li>
                <li>Editors do not handle manuscripts where conflicts apply</li>
              </ul>
            </details>

            <details className="faq-card">
              <summary>Corrections, retractions & expressions of concern</summary>
              <p>
                Corrections are issued when errors affect interpretation or accuracy.
                Retractions are issued for serious integrity issues. Expressions of
                concern may be published when investigations are ongoing.
              </p>
              <ul className="category-list">
                <li>Erratum / Corrigendum for significant errors</li>
                <li>Retraction for invalid or unethical work</li>
                <li>Expression of concern for unresolved investigations</li>
              </ul>
            </details>

            <details className="faq-card">
              <summary>Data availability & transparency</summary>
              <p>
                Authors are encouraged to provide datasets, code, and supporting
                materials when possible. If sharing is not possible, a data-availability
                statement must explain the reason.
              </p>
              <ul className="category-list">
                <li>Repositories are recommended where applicable</li>
                <li>Exceptions allowed for privacy, legal, or ethical limits</li>
              </ul>
            </details>

            <details className="faq-card">
              <summary>Editorial independence</summary>
              <p>
                Editorial decisions are made independently by the Editor-in-Chief and
                editorial board, without influence from sponsors, advertisers, or
                external parties.
              </p>
            </details>
          </div>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>Publishing Model</h2>
          </header>
          <div className="card settings-card">
            <h3>Continuous (Rolling) Publication</h3>
            <p>
              Articles are published immediately after acceptance - one at a time,
              with no waiting for issue deadlines. Each article is a standalone
              unit with its own DOI, article ID, and permanent URL.
            </p>
            <ul className="category-list">
              <li>Volume = year of publication (Volume 1 = 2026, Volume 2 = 2027...)</li>
              <li>No issues - articles accumulate continuously within each volume</li>
              <li>Article IDs: e2026001, e2026002, e2026003...</li>
              <li>Publication within 24 hours of final acceptance</li>
            </ul>
          </div>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>ISSN & DOI Status</h2>
          </header>
          <div className="card settings-card">
            <p>
              ISSN and DOI registration are planned. Online ISSN registration is
              typically confirmed after the first articles are published; identifiers
              will be displayed once assigned (placeholders shown above).
            </p>
            <ul className="category-list">
              <li>ISSN application status: pending (placeholder)</li>
              <li>DOI registration: planned (placeholder)</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
