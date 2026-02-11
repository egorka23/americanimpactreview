"use client";

export default function PublicationRulesClient() {
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
          <h3>Manuscript requirements</h3>
          <ul className="category-list">
            <li>Original research: 4,000-8,000 words (excluding references and figures)</li>
            <li>Reviews: 5,000-10,000 words</li>
            <li>Format: Word (.docx) or PDF; figures as high-resolution PNG, TIFF, or SVG</li>
            <li>Structure: Title, Abstract (150-300 words), Keywords (5-8), Introduction, Methods, Results, Discussion, References</li>
            <li>References: APA, IEEE, or Vancouver style; minimum 15 for original research</li>
            <li>Author information: full names, affiliations, email, ORCID iD, author contributions (CRediT)</li>
            <li>Required statements: competing interests, funding sources, data availability, ethics approval (if applicable)</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>General rules</h3>
          <ul className="category-list">
            <li>Only original, unpublished work is accepted. Simultaneous submission to other journals is not permitted.</li>
            <li>All submissions are screened for plagiarism using iThenticate before peer review.</li>
            <li>All listed authors must have made substantive contributions and must approve the final submission.</li>
            <li>Conflicts of interest must be disclosed by all authors, reviewers, and editors.</li>
            <li>Datasets and methods must be described in sufficient detail for reproducibility.</li>
            <li>A data availability statement is required for all accepted articles.</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Peer review process</h3>
          <ul className="category-list">
            <li>Single-blind peer review: reviewers are anonymous, authors are identified</li>
            <li>Each manuscript is evaluated by at least two independent reviewers</li>
            <li>Review period: 7-14 days from assignment</li>
            <li>Decisions: accept, minor revision, major revision, or reject</li>
            <li>Final editorial decision made by the Editor-in-Chief</li>
            <li>Authors may appeal rejections by contacting the editorial office with justification</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Ethics & integrity</h3>
          <ul className="category-list">
            <li>Guided by COPE (Committee on Publication Ethics) Core Practices</li>
            <li>Human subjects research requires IRB/ethics committee approval</li>
            <li>Animal research requires institutional ethics approval</li>
            <li>Informed consent must be obtained and documented where applicable</li>
            <li>Corrections and retractions handled transparently per COPE guidelines</li>
            <li>Data availability statements required for all articles</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Article processing charges</h3>
          <ul className="category-list">
            <li>APC: $200 per accepted article</li>
            <li>No submission or review fees</li>
            <li>Fee waivers available upon request for authors from low-income countries</li>
            <li>Reviewing is voluntary and unpaid</li>
          </ul>
        </div>
      </section>
    </>
  );
}
