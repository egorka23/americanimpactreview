"use client";

import { reviewers, type Reviewer } from "./data";

function OrcidIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <g fill="#fff">
        <circle cx="80.5" cy="68" r="11.5" />
        <rect x="73" y="90" width="15" height="97" rx="1" />
        <path d="M109 90h35c36 0 54 25 54 48.5S180 187 144 187h-35V90zm15 82h20c24 0 39-16 39-33.5S168 105 144 105h-20v67z" />
      </g>
    </svg>
  );
}

function ReviewerRow({ reviewer }: { reviewer: Reviewer }) {
  return (
    <div className="rv-row">
      <div className="rv-row__main">
        <h3 className="rv-row__name">
          {reviewer.name}
          {reviewer.degrees && (
            <span className="rv-row__degrees">, {reviewer.degrees}</span>
          )}
        </h3>
        <div className="rv-row__aff">{reviewer.affiliation}</div>
      </div>
      <div className="rv-row__bottom">
        <div className="rv-row__expertise">
          {reviewer.expertise.map((e) => (
            <span key={e} className="rv-row__tag">{e}</span>
          ))}
        </div>
        {reviewer.orcid && (
          <a
            href={reviewer.orcid}
            target="_blank"
            rel="noopener noreferrer"
            className="rv-row__orcid"
          >
            <OrcidIcon />
            <span>ORCID</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ReviewersClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Peer Reviewers</h1>
          <p>
            Experts who evaluate manuscripts for American Impact Review.
          </p>
          <div className="page-meta">
            <span>Invitation Only</span>
            <span>Peer-Reviewed</span>
            <span>COPE Principles</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="rv-intro">
          <h2>About Our Reviewers</h2>
          <p>
            American Impact Review relies on a select pool of peer reviewers who
            serve by invitation of the Editorial Board. Reviewer appointments are
            extended on the basis of demonstrated expertise, a record of
            scholarly or professional achievement, and the ability to provide
            rigorous, objective evaluation of research manuscripts. We do not
            accept unsolicited applications for reviewer positions.
          </p>
          <p>
            Each reviewer is formally appointed by the Editor-in-Chief following
            a recommendation from at least one member of the{" "}
            <a href="/editorial-board">Editorial Board</a>. Upon appointment,
            the reviewer receives an official invitation letter specifying the
            scope of their reviewing responsibilities, the field or fields in
            which they are qualified to evaluate submissions, and the journal's
            expectations regarding review quality, confidentiality, and
            turnaround time.
          </p>
          <p>
            Reviewers evaluate manuscripts individually by completing structured
            assessment forms that address originality, methodological rigor,
            clarity, and contribution to the field. Each completed review
            constitutes an independent, expert judgment of the submitted work.
            All reviewers adhere to our{" "}
            <a href="/policies">Publication Ethics guidelines</a> and the
            principles of the{" "}
            <a
              href="https://publicationethics.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Committee on Publication Ethics (COPE)
            </a>
            .
          </p>
        </div>

        <div className="rv-criteria">
          <h2>Reviewer Selection Criteria</h2>
          <p className="rv-criteria__lead">
            The Editorial Board evaluates prospective reviewers against the
            following requirements before extending a formal invitation:
          </p>
          <ul>
            <li>
              A minimum of three peer-reviewed publications, or equivalent
              professional accomplishment such as patents, industry leadership,
              or recognized expertise in the relevant field
            </li>
            <li>
              Active engagement in research, scholarship, or professional
              practice at the time of appointment
            </li>
            <li>
              Demonstrated subject-matter expertise in one or more disciplines
              within the journal&apos;s multidisciplinary scope
            </li>
            <li>
              No conflicts of interest with the manuscripts assigned for review
            </li>
            <li>
              Commitment to providing timely, constructive, and confidential peer
              review in accordance with COPE guidelines
            </li>
          </ul>
        </div>

        <div className="rv-process">
          <h2>Review Process</h2>
          <p>
            Manuscripts submitted to American Impact Review undergo single-blind
            peer review. The Editor-in-Chief assigns each submission to one or
            more reviewers whose expertise matches the manuscript&apos;s subject
            area. Reviewers independently assess the work using a structured
            evaluation form and provide a written recommendation
            (accept, revise, or reject) along with detailed feedback to the
            authors. The Editor-in-Chief makes the final editorial decision
            based on the reviewers&apos; assessments.
          </p>
        </div>

        {reviewers.length > 0 ? (
          <>
            <div className="eb-divider">
              <span>Our Reviewers</span>
            </div>
            <div className="rv-list">
              {reviewers.map((r) => (
                <ReviewerRow key={r.name} reviewer={r} />
              ))}
            </div>
          </>
        ) : (
          <div className="rv-coming-soon">
            <p>
              Reviewer profiles will appear here as our peer review pool grows.
              If you are interested in reviewing for American Impact Review,
              please visit our{" "}
              <a href="/for-reviewers">For Reviewers</a> page.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
