"use client";

export default function PoliciesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Policies</div>
          <h1>Ethics &amp; Policies</h1>
          <p>
            American Impact Review is committed to the highest standards of
            publication ethics and editorial integrity. This page outlines our
            core policies governing the editorial process.
          </p>
          <div className="page-meta">
            <span>COPE Guidelines</span>
            <span>Open Access</span>
            <span>CC BY 4.0</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Publication Ethics */}
        <div className="write-section">
          <header className="major">
            <h2>Publication Ethics</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review is committed to upholding the highest
              standards of publication ethics. Our editorial policies and
              practices are guided by the principles and best-practice guidelines
              established by the{" "}
              <strong>Committee on Publication Ethics (COPE)</strong>.
            </p>
            <p>
              All parties involved in the publishing process &mdash; authors,
              editors, reviewers, and the publisher &mdash; are expected to
              adhere to ethical standards that ensure the integrity, transparency,
              and trustworthiness of published research.
            </p>
            <ul className="category-list">
              <li>
                Plagiarism, data fabrication, and falsification are strictly
                prohibited
              </li>
              <li>
                Authorship must reflect genuine intellectual contributions
              </li>
              <li>
                Ethical approval and informed consent must be documented and
                disclosed where applicable
              </li>
              <li>
                Editors, reviewers, and authors must disclose all relevant
                conflicts of interest
              </li>
            </ul>
          </div>
        </div>

        {/* Peer Review Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Peer Review Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              All manuscripts undergo <strong>single-blind peer review</strong>{" "}
              by at least two independent reviewers with expertise in the subject
              area. Reviewers are selected by the editorial team based on their
              domain knowledge and publication record.
            </p>
            <ul className="category-list">
              <li>
                Single-blind review: reviewer identities are not disclosed to
                authors
              </li>
              <li>
                Minimum of two independent reviewers per manuscript
              </li>
              <li>
                Reviewers assess originality, methodology, clarity, and
                significance
              </li>
              <li>
                The Editor-in-Chief makes the final editorial decision based on
                reviewer recommendations
              </li>
              <li>
                Typical review turnaround: 7-14 business days
              </li>
            </ul>
          </div>
        </div>

        {/* Plagiarism Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Plagiarism Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              All submitted manuscripts are checked for originality. Submissions
              found to contain plagiarized content &mdash; including text,
              figures, or data taken from other sources without proper
              attribution &mdash; will be rejected or retracted.
            </p>
            <ul className="category-list">
              <li>
                Manuscripts are screened using plagiarism-detection tools prior
                to review
              </li>
              <li>
                Self-plagiarism and redundant publication are also subject to
                scrutiny
              </li>
              <li>
                Authors must properly cite and attribute all sources
              </li>
              <li>
                Cases of confirmed plagiarism may result in retraction and
                notification to the author&apos;s institution
              </li>
            </ul>
          </div>
        </div>

        {/* Conflict of Interest / Recusal Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Conflict of Interest &amp; Recusal Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              When the Editor-in-Chief has a professional or personal
              relationship with an author, the manuscript is assigned to an
              Associate Editor or Editorial Board member who independently
              manages the review process to ensure editorial independence.
            </p>
            <ul className="category-list">
              <li>
                All authors must disclose financial, personal, or professional
                relationships that could influence their work
              </li>
              <li>
                Reviewers must recuse themselves from evaluating manuscripts
                where a conflict exists
              </li>
              <li>
                Editors do not participate in decisions on manuscripts for which
                they have a conflict
              </li>
              <li>
                Disclosure statements are published alongside accepted articles
                when relevant
              </li>
            </ul>
          </div>
        </div>

        {/* Open Access Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Open Access Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review is a fully <strong>open access</strong>{" "}
              journal. All published articles are freely available to readers
              worldwide immediately upon publication, with no subscription or
              paywall barriers.
            </p>
            <ul className="category-list">
              <li>
                All articles are published under the{" "}
                <strong>Creative Commons Attribution 4.0 International
                License (CC BY 4.0)</strong>
              </li>
              <li>
                Readers may read, download, share, and adapt published work for
                any purpose, provided the original authors and source are
                credited
              </li>
              <li>
                Open access supports maximum visibility, impact, and
                dissemination of research
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Licensing */}
        <div className="write-section">
          <header className="major">
            <h2>Copyright &amp; Licensing</h2>
          </header>
          <div className="card settings-card">
            <p>
              Authors <strong>retain copyright</strong> of their published work.
              By submitting to American Impact Review, authors grant the journal
              the right to publish the article under an open access license.
            </p>
            <ul className="category-list">
              <li>
                All articles are licensed under{" "}
                <strong>CC BY 4.0</strong>
              </li>
              <li>
                Authors retain the right to reuse, distribute, and reproduce
                their own work
              </li>
              <li>
                Third parties may share, adapt, and build upon published work
                with proper attribution
              </li>
              <li>
                The journal does not claim exclusive ownership of published
                content
              </li>
            </ul>
          </div>
        </div>

        {/* Complaints & Appeals */}
        <div className="write-section">
          <header className="major">
            <h2>Complaints &amp; Appeals</h2>
          </header>
          <div className="card settings-card">
            <p>
              Authors and readers who wish to raise a concern about an editorial
              decision, a published article, or the conduct of the review process
              may contact the editorial office.
            </p>
            <ul className="category-list">
              <li>
                Appeals of editorial decisions should be submitted in writing to{" "}
                <strong>editor@americanimpactreview.com</strong> with a clear
                rationale
              </li>
              <li>
                The Editor-in-Chief will review appeals and may consult
                additional reviewers or editorial board members
              </li>
              <li>
                Complaints about reviewer conduct, ethical concerns, or
                post-publication issues are investigated promptly
              </li>
              <li>
                All complaints are handled confidentially and in accordance with
                COPE guidelines
              </li>
            </ul>
          </div>
        </div>

        {/* Corrections & Retractions */}
        <div className="write-section">
          <header className="major">
            <h2>Corrections &amp; Retractions</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review is committed to maintaining the accuracy and
              integrity of the published record. When errors or integrity issues
              are identified after publication, the journal will take appropriate
              corrective action.
            </p>
            <ul className="category-list">
              <li>
                <strong>Erratum / Corrigendum:</strong> issued for errors that
                affect the interpretation or accuracy of the work but do not
                invalidate the overall findings
              </li>
              <li>
                <strong>Retraction:</strong> issued when the findings are
                unreliable due to misconduct, fundamental error, or ethical
                violations
              </li>
              <li>
                <strong>Expression of Concern:</strong> published when an
                investigation is underway but not yet resolved
              </li>
              <li>
                All corrections and retractions are linked to the original
                article and clearly labeled
              </li>
            </ul>
          </div>
        </div>

        {/* Data Sharing Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Data Sharing Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              Authors are encouraged to make underlying research data available
              where possible to promote transparency and reproducibility.
            </p>
            <ul className="category-list">
              <li>
                Authors should deposit data in recognized public repositories
                when applicable
              </li>
              <li>
                A data availability statement must be included in all submitted
                manuscripts
              </li>
              <li>
                Exceptions are allowed for privacy, legal, ethical, or
                proprietary constraints, provided these are clearly stated
              </li>
              <li>
                Code and supplementary materials should be shared when they
                support the findings
              </li>
            </ul>
          </div>
        </div>

        {/* Archival Policy */}
        <div className="write-section">
          <header className="major">
            <h2>Archival Policy</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review is committed to the long-term preservation
              and accessibility of all published content.
            </p>
            <ul className="category-list">
              <li>
                Digital preservation through{" "}
                <strong>LOCKSS</strong> (Lots of Copies Keep Stuff Safe) is
                planned
              </li>
              <li>
                Archival through the <strong>Internet Archive</strong> ensures
                publicly accessible copies of all published articles
              </li>
              <li>
                All published articles remain freely accessible on the journal
                website indefinitely
              </li>
              <li>
                DOI registration (planned) will provide persistent identifiers
                for all articles
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
