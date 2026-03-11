"use client";

import { useEffect } from "react";
import Link from "next/link";
import TriangleNav from "@/components/TriangleNav";

export default function ForResearchersClient() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.gtag?.("event", "view_for_researchers", {
        value: 10,
        currency: "USD",
      });
    }
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About the Journal</div>
          <h1>For Researchers</h1>
          <p>
            American Impact Review is a peer-reviewed, open-access journal
            published by Global Talent Foundation, a 501(c)(3) nonprofit
            organization registered in the United States.
          </p>
          <div className="page-meta">
            <span>Peer-Reviewed</span>
            <span>Open Access</span>
            <span>CC BY 4.0</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Key facts */}
        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">Continuous</div>
            <div className="lbl">Publication Model</div>
          </div>
          <div className="page-vital-card">
            <div className="val">CC BY 4.0</div>
            <div className="lbl">License</div>
          </div>
          <div className="page-vital-card">
            <div className="val">DOI</div>
            <div className="lbl">Via Crossref</div>
          </div>
        </div>

        {/* Mission */}
        <div className="card settings-card">
          <h3>Mission and scope</h3>
          <p>
            American Impact Review publishes original research, applied studies,
            structured analytical reviews, and short communications across all
            academic disciplines. The journal prioritizes work that demonstrates
            measurable real-world impact and contributes to the advancement of
            knowledge.
          </p>
          <p>
            The journal operates on a continuous publication model — articles are
            published individually as they complete the review and production
            process, rather than being held for scheduled issues. This allows
            research findings to become available to the scholarly community
            without delay.
          </p>
        </div>

        {/* Review process */}
        <div className="card settings-card">
          <h3>Peer review process</h3>
          <p>
            All submitted manuscripts undergo single-blind peer review. Each
            submission is evaluated by at least two independent reviewers
            selected for their expertise in the relevant field. Editorial
            decisions are based on:
          </p>
          <ul className="category-list">
            <li>Scientific rigor and methodological soundness</li>
            <li>Originality and significance of the contribution</li>
            <li>Clarity and quality of presentation</li>
            <li>Appropriateness and completeness of references</li>
            <li>Ethical compliance</li>
          </ul>
          <p>
            The editorial board follows the guidelines established by the{" "}
            <a
              href="https://publicationethics.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Committee on Publication Ethics (COPE)
            </a>{" "}
            and the{" "}
            <a
              href="https://www.icmje.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              International Committee of Medical Journal Editors (ICMJE)
            </a>
            .
          </p>
        </div>

        {/* Disciplines */}
        <div className="card settings-card">
          <h3>Disciplines</h3>
          <p>
            The journal accepts submissions across a broad range of fields,
            including but not limited to:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            {[
              "Computer Science",
              "Artificial Intelligence",
              "Health Sciences",
              "Public Health",
              "Engineering",
              "Environmental Science",
              "Energy & Sustainability",
              "Economics",
              "Education",
              "Social Sciences",
              "Business & Management",
              "Law & Policy",
            ].map((d) => (
              <div
                key={d}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: "#334155",
                  borderLeft: "3px solid #1e3a5f",
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Open access */}
        <div className="card settings-card">
          <h3>Open access policy</h3>
          <p>
            All articles published in American Impact Review are immediately
            available in full text under a{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </a>{" "}
            license. There are no subscription fees, registration walls, or
            embargo periods.
          </p>
          <p>
            Authors retain copyright to their work. Readers may share, copy,
            adapt, and redistribute the material in any medium or format,
            provided proper attribution is given to the original work.
          </p>
        </div>

        {/* Indexing */}
        <div className="card settings-card">
          <h3>Indexing and archiving</h3>
          <p>
            Published articles receive a Digital Object Identifier (DOI) via
            Crossref, ensuring permanent discoverability and citation tracking.
            The journal is working toward indexing in major academic databases.
          </p>
          <p>
            For current indexing status, see{" "}
            <Link href="/indexing">Indexing &amp; Recognition</Link>.
          </p>
        </div>

        {/* Publication ethics */}
        <div className="card settings-card">
          <h3>Publication ethics</h3>
          <p>
            American Impact Review is committed to maintaining the highest
            standards of publication ethics. The journal adheres to the
            principles outlined by COPE and requires:
          </p>
          <ul className="category-list">
            <li>
              All research involving human subjects must have institutional
              ethics committee or IRB approval
            </li>
            <li>
              Authors must disclose all potential conflicts of interest
            </li>
            <li>
              All manuscripts are screened for plagiarism prior to review
            </li>
            <li>
              Use of AI-assisted writing tools must be disclosed in the
              Acknowledgments section
            </li>
            <li>
              Authorship must follow ICMJE criteria — all listed authors must
              have made substantial intellectual contributions
            </li>
            <li>
              Data fabrication, falsification, and image manipulation are
              grounds for immediate rejection or retraction
            </li>
          </ul>
        </div>

        {/* Publisher */}
        <div className="card settings-card">
          <h3>Publisher</h3>
          <p>
            American Impact Review is published by{" "}
            <strong>Global Talent Foundation</strong>, a 501(c)(3) nonprofit
            organization registered in the United States. The Foundation&apos;s
            mission is to support education, research, and the dissemination of
            scholarly knowledge.
          </p>
        </div>

        {/* Contact */}
        <div className="card settings-card">
          <h3>Contact the editorial office</h3>
          <p>
            For questions about submission, review status, or editorial matters:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:editorial@americanimpactreview.com">
              editorial@americanimpactreview.com
            </a>
          </p>
        </div>

        <p className="text-sm" style={{ color: "#64748b", marginTop: "2rem" }}>
          For detailed submission guidelines and formatting requirements, see{" "}
          <Link href="/for-authors">For Authors</Link>. For publication fees,
          see <Link href="/policies#faq">Policies &amp; FAQ</Link>.
        </p>

        {/* CTA */}
        <ul className="actions">
          <li>
            <Link className="button" href="/submit">
              Submit your manuscript
            </Link>
          </li>
          <li>
            <Link className="button-secondary" href="/for-authors">
              Author guidelines
            </Link>
          </li>
        </ul>
      </section>

      <TriangleNav current="authors" />

      <Link href="/submit" className="fab-submit">
        Submit manuscript
      </Link>
    </>
  );
}
