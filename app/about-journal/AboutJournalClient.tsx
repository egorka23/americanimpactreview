export default function AboutJournalClient() {
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
        <div className="write-section">
          <header className="major">
            <h2>Aims & Scope</h2>
          </header>
          <p>
            American Impact Review is a peer-reviewed, open-access, multidisciplinary
            journal published by Global Talent Foundation Inc., a 501(c)(3) nonprofit
            organization. The journal publishes original research articles, systematic
            reviews, and applied studies across a broad range of disciplines including:
          </p>
          <ul className="category-list">
            <li>Computer Science & Software Engineering</li>
            <li>Health Sciences & Biotechnology</li>
            <li>Artificial Intelligence & Data Science</li>
            <li>Sports Science & Human Performance</li>
            <li>Energy & Climate Technology</li>
            <li>Engineering & Robotics</li>
            <li>Social Sciences & Public Policy</li>
          </ul>
          <p>
            We welcome interdisciplinary work that integrates evidence, methods, or
            perspectives from multiple fields. All accepted articles are published
            immediately under a CC BY 4.0 open-access license.
          </p>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>Article Processing Charges</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review charges an article processing charge (APC)
              upon acceptance. The APC covers editorial handling, peer review
              coordination, production, hosting, and permanent archival. There
              are no submission fees or page charges.
            </p>
            <p>
              As a 501(c)(3) nonprofit publication with no shareholders or
              profit motive, we keep our APC below the industry average. Fee
              waivers are available for qualifying authors.
            </p>
            <p>
              For fee details and waiver eligibility, see our{" "}
              <a href="/policies#faq">Policies &amp; FAQ</a>.
            </p>
          </div>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>Open Access & Licensing</h2>
          </header>
          <div className="card settings-card">
            <p>
              All articles are published under the <strong>Creative Commons Attribution 4.0
              International License (CC BY 4.0)</strong>. This means anyone may read, download,
              copy, distribute, print, search, or link to the full text of articles, as long
              as proper attribution is given to the original authors.
            </p>
            <ul className="category-list">
              <li>License: CC BY 4.0</li>
              <li>Copyright: retained by the authors</li>
              <li>No embargoes or access restrictions</li>
              <li>Immediate open access upon publication</li>
            </ul>
          </div>
        </div>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">3-5d</div>
            <div className="lbl">Screening</div>
          </div>
          <div className="page-vital-card">
            <div className="val">7-14d</div>
            <div className="lbl">Peer Review</div>
          </div>
        </div>

        <div className="write-section">
          <header className="major">
            <h2>Peer Review Process</h2>
          </header>
          <div className="card settings-card">
            <p>
              Every manuscript undergoes a structured, multi-stage evaluation before
              publication. The journal employs <strong>single-blind peer review</strong>:
              reviewers remain anonymous to authors, while authors are identified to
              reviewers. This is the same model used by Nature, Science, and the majority
              of established academic journals.
            </p>
            <h3>Editorial Screening (3-5 business days)</h3>
            <p>
              Each submission is first evaluated by the editorial office for scope,
              completeness, formatting compliance, and ethical requirements. All manuscripts
              are screened for plagiarism using iThenticate at this stage. Submissions with
              an overlap score above 15% are returned to the author or desk-rejected.
            </p>
            <h3>Independent Peer Review (7-14 days)</h3>
            <p>
              Manuscripts that pass screening are assigned to <strong>at least two
              independent reviewers</strong> with subject-matter expertise. Reviewers
              evaluate each manuscript against five criteria:
            </p>
            <ul className="category-list">
              <li><strong>Scientific rigor:</strong> clarity of research question, appropriateness of study design, reproducibility, and statistical soundness</li>
              <li><strong>Originality and significance:</strong> novelty of contribution, positioning within existing literature, and potential impact</li>
              <li><strong>Results and interpretation:</strong> whether conclusions are supported by data, limitations are honestly discussed, and figures and tables are clear</li>
              <li><strong>Presentation quality:</strong> clarity of writing, completeness of abstract, and appropriateness of references</li>
              <li><strong>Ethical compliance:</strong> ethics approvals, informed consent, conflict-of-interest disclosures, and data availability</li>
            </ul>
            <p>
              Reviewers score each criterion on a 1-5 scale and provide a recommendation:
              Accept, Minor Revisions, Major Revisions, or Reject. Each review includes
              a written report with major concerns, minor concerns, and specific
              line-by-line comments.
            </p>
            <h3>Editorial Decision</h3>
            <p>
              The <strong>Editor-in-Chief</strong> makes the final decision based on
              reviewer reports. Authors may appeal a rejection within 30 days by
              providing a detailed response addressing all reviewer concerns.
              For full reviewer evaluation criteria and report structure,
              see <a href="/for-reviewers">Reviewer Guidelines</a>.
            </p>
          </div>
        </div>

        <div className="faq-grid">
          <details className="faq-card" open>
            <summary>Journal identifiers</summary>
            <ul className="category-list">
              <li>ISSN: pending (application submitted)</li>
              <li>DOI: pending (Crossref registration submitted)</li>
              <li>Publisher: Global Talent Foundation Inc.</li>
            </ul>
          </details>

          <details className="faq-card">
            <summary>Indexing & visibility</summary>
            <ul className="category-list">
              <li>Google Scholar (citation meta tags implemented)</li>
              <li>Crossref (DOI registration submitted)</li>
              <li>DOAJ (application upon eligibility)</li>
              <li>All articles freely accessible immediately upon publication</li>
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
                American Impact Review is guided by the <strong>Committee on Publication
                Ethics (COPE)</strong> Core Practices and adheres to COPE guidelines for
                editors, reviewers, and authors. All submissions are screened for plagiarism
                using iThenticate prior to peer review. We do not tolerate plagiarism,
                duplicate submission, data fabrication, or inappropriate authorship. Reports
                of misconduct are investigated by the editorial office and may result in
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
                <li>All authors must submit a conflict-of-interest disclosure statement upon submission</li>
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
              unit with its own article ID and permanent URL.
            </p>
            <ul className="category-list">
              <li>Volume = year of publication (Volume 1 = 2026, Volume 2 = 2027...)</li>
              <li>No issues - articles accumulate continuously within each volume</li>
              <li>Article IDs: e2026001, e2026002, e2026003...</li>
            </ul>
          </div>
        </div>

      </section>
    </>
  );
}
