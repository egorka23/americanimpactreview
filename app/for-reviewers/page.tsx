export default function ForReviewersPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Reviewers</h1>
          <p>Reviewer standards, ethical responsibilities, and evaluation criteria.</p>
          <div className="page-meta">
            <span>Confidentiality</span>
            <span>Integrity</span>
            <span>Quality</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <p>
          American Impact Review uses a structured peer review process to ensure
          academic rigor, clarity, and ethical integrity.
        </p>
        <p>
          Reviewers are selected based on subject-matter expertise and are expected
          to provide objective feedback that improves scientific quality and
          transparency.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">7–14d</div>
            <div className="lbl">Review Window</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Single</div>
            <div className="lbl">Blind Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Ethics</div>
            <div className="lbl">Required</div>
          </div>
        </div>

        <div className="card settings-card">
          <h3>Reviewer responsibilities</h3>
          <ul className="category-list">
            <li>Provide objective, constructive feedback</li>
            <li>Maintain confidentiality of submissions</li>
            <li>Declare conflicts of interest</li>
            <li>Return reviews within requested timelines</li>
            <li>Recommend acceptance, revision, or rejection</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Review criteria</h3>
          <ul className="category-list">
            <li>Novelty and significance</li>
            <li>Methodological rigor</li>
            <li>Clarity of presentation</li>
            <li>Ethical compliance</li>
          </ul>
        </div>

        <div className="card settings-card">
          <h3>Interested in reviewing?</h3>
          <p>
            To express interest in joining the reviewer pool, please contact the
            editorial team at <strong>editorial@americanimpactreview.com</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
