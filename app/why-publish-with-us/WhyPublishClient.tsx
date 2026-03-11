"use client";

import { useEffect } from "react";
import Link from "next/link";
import TriangleNav from "@/components/TriangleNav";

export default function WhyPublishClient() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.gtag?.("event", "view_why_publish", {
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
          <h1>Why Publish With Us</h1>
          <p>
            Publication standards, editorial commitments, and institutional
            information for prospective authors.
          </p>
          <div className="page-meta">
            <span>501(c)(3) Nonprofit</span>
            <span>United States</span>
            <span>Crossref Member</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Institutional foundation */}
        <div className="card settings-card">
          <h3>Nonprofit publisher</h3>
          <p>
            American Impact Review is published by Global Talent Foundation, a
            501(c)(3) tax-exempt nonprofit organization registered in the United
            States. The journal&apos;s editorial and operational decisions are
            guided by the Foundation&apos;s educational mission, not by
            commercial considerations.
          </p>
          <p>
            The nonprofit status of the publisher is verifiable through the{" "}
            <a
              href="https://www.irs.gov/charities-non-profits/tax-exempt-organization-search"
              target="_blank"
              rel="noopener noreferrer"
            >
              IRS Tax Exempt Organization Search
            </a>
            .
          </p>
        </div>

        {/* Peer review */}
        <div className="card settings-card">
          <h3>Independent peer review</h3>
          <p>
            Every submitted manuscript undergoes single-blind peer review by a
            minimum of two independent reviewers with expertise in the relevant
            field. Reviewers are selected by the editorial board based on their
            academic qualifications, publication record, and absence of conflicts
            of interest with the submitting authors.
          </p>
          <p>
            Editorial decisions — accept, revise, or reject — are made solely on
            the basis of scientific merit, methodological rigor, and
            contribution to existing knowledge. The review process follows{" "}
            <a
              href="https://publicationethics.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              COPE guidelines
            </a>
            .
          </p>
        </div>

        {/* Open access */}
        <div className="card settings-card">
          <h3>Open access</h3>
          <p>
            All published articles are freely available under a Creative Commons
            CC BY 4.0 license. There are no subscription barriers, registration
            requirements, or embargo periods. Authors retain full copyright to
            their work.
          </p>
          <p>
            Open access ensures that published research is accessible to
            scholars, practitioners, and the public worldwide, maximizing the
            reach and potential impact of each publication.
          </p>
        </div>

        {/* DOI and discoverability */}
        <div className="card settings-card">
          <h3>DOI and scholarly infrastructure</h3>
          <p>
            Each published article receives a Digital Object Identifier (DOI)
            registered through Crossref. DOIs provide permanent, resolvable
            links to published work and are recognized across all major citation
            databases and reference management systems.
          </p>
          <p>
            Published articles include structured metadata (title, authors,
            abstract, keywords, references) deposited with Crossref, enabling
            discoverability through Google Scholar, academic databases, and
            institutional library systems.
          </p>
        </div>

        {/* Continuous publication */}
        <div className="card settings-card">
          <h3>Continuous publication model</h3>
          <p>
            American Impact Review operates on a continuous (rolling) publication
            model. Articles are published individually upon completion of peer
            review and production, rather than being held for scheduled issue
            dates. This model reduces the time between acceptance and
            publication.
          </p>
        </div>

        {/* Multidisciplinary scope */}
        <div className="card settings-card">
          <h3>Multidisciplinary scope</h3>
          <p>
            The journal accepts original research across all academic
            disciplines, with particular interest in work demonstrating
            real-world applicability. This includes, but is not limited to:
            computer science, artificial intelligence, health sciences,
            engineering, environmental science, economics, education, social
            sciences, business, and public policy.
          </p>
          <p>
            Interdisciplinary research that bridges multiple fields is welcomed
            and evaluated by reviewers with appropriate cross-disciplinary
            expertise.
          </p>
        </div>

        {/* Ethics and standards */}
        <div className="card settings-card">
          <h3>Ethics and editorial standards</h3>
          <p>
            The journal maintains editorial standards in accordance with the
            guidelines of:
          </p>
          <ul className="category-list">
            <li>
              <a
                href="https://publicationethics.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Committee on Publication Ethics (COPE)
              </a>
            </li>
            <li>
              <a
                href="https://www.icmje.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                International Committee of Medical Journal Editors (ICMJE)
              </a>
            </li>
            <li>
              <a
                href="https://www.equator-network.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                EQUATOR Network reporting guidelines
              </a>
            </li>
          </ul>
          <p>
            All submissions are screened for plagiarism. Research involving human
            subjects or animals must have appropriate institutional ethics
            approval. Authors are required to disclose all conflicts of interest
            and funding sources.
          </p>
        </div>

        {/* Archiving */}
        <div className="card settings-card">
          <h3>Preservation and archiving</h3>
          <p>
            Published articles are permanently hosted on the journal&apos;s
            website and are assigned DOIs through Crossref for long-term
            reference stability. The journal is committed to ensuring persistent
            access to all published scholarly content.
          </p>
        </div>

        <p className="text-sm" style={{ color: "#64748b", marginTop: "2rem" }}>
          For submission guidelines, see{" "}
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
