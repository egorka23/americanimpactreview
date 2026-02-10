"use client";

export default function PublicationRulesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Policies</div>
          <h1>Submission Guidelines</h1>
          <p>Formatting, ethics, and editorial requirements for all submissions.</p>
          <div className="page-meta">
            <span>Ethics</span>
            <span>COPE-Aligned</span>
            <span>Transparency</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          The journal follows international best practices for academic integrity
          and transparent publishing.
        </p>
        <p>
          Manuscripts are evaluated for originality, ethical compliance, and
          alignment with the journal’s scope. Submissions that do not meet
          requirements are returned for revision before review.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">Original</div>
            <div className="lbl">Required</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Disclosure</div>
            <div className="lbl">Mandatory</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Integrity</div>
            <div className="lbl">Enforced</div>
          </div>
        </div>

        <div className="card settings-card">
          <h3>General rules</h3>
          <ul className="category-list">
            <li>Only original, unpublished work is accepted.</li>
            <li>Plagiarism screening is mandatory.</li>
            <li>All authors must approve the final submission.</li>
            <li>Conflicts of interest must be disclosed.</li>
            <li>Datasets and methods must be described clearly.</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Ethics & integrity</h3>
          <ul className="category-list">
            <li>Compliance with COPE guidelines</li>
            <li>Corrections and retractions handled transparently</li>
            <li>Data availability statements encouraged</li>
            <li>Human/animal research requires ethics approval</li>
          </ul>
        </div>
      </section>
    </>
  );
}
