"use client";

import Link from "next/link";

export default function ForAuthorsClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Authors</h1>
          <p>
            Everything you need to prepare, submit, and publish your manuscript
            in American Impact Review.
          </p>
          <div className="page-meta">
            <span>Open Access</span>
            <span>Peer-Reviewed</span>
            <span>Fast Turnaround</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Timeline cards */}
        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">3-5d</div>
            <div className="lbl">Initial Screening</div>
          </div>
          <div className="page-vital-card">
            <div className="val">2-4wk</div>
            <div className="lbl">Peer Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">24h</div>
            <div className="lbl">Post-Acceptance</div>
          </div>
          <div className="page-vital-card">
            <div className="val">$200</div>
            <div className="lbl">APC (after acceptance)</div>
          </div>
        </div>

        {/* 1. Scope */}
        <div className="card settings-card">
          <h3>What we publish</h3>
          <p>
            American Impact Review accepts original research articles, applied
            studies, structured analytical reviews, and short communications
            across all disciplines. We are particularly interested in work with
            measurable real-world impact.
          </p>
          <p>
            All submissions undergo single-blind peer review by at least two
            independent reviewers. Editorial decisions are based on scientific
            rigor, originality, and clarity.
          </p>
        </div>

        {/* 2. Article types */}
        <div className="card settings-card">
          <h3>Article types</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Word limit</th>
                  <th>Abstract</th>
                  <th>Figures/Tables</th>
                  <th>References</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Original Research</strong></td>
                  <td>3,000-6,000</td>
                  <td>150-250 words</td>
                  <td>Up to 8</td>
                  <td>Up to 50</td>
                </tr>
                <tr>
                  <td><strong>Review Article</strong></td>
                  <td>4,000-8,000</td>
                  <td>200-300 words</td>
                  <td>Up to 10</td>
                  <td>Up to 100</td>
                </tr>
                <tr>
                  <td><strong>Short Communication</strong></td>
                  <td>1,500-2,500</td>
                  <td>100-150 words</td>
                  <td>Up to 4</td>
                  <td>Up to 20</td>
                </tr>
                <tr>
                  <td><strong>Case Study</strong></td>
                  <td>2,000-4,000</td>
                  <td>150-200 words</td>
                  <td>Up to 6</td>
                  <td>Up to 30</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-500" style={{ marginTop: "0.5rem" }}>
            Word limits exclude abstract, references, figures, and tables.
          </p>
        </div>

        {/* 3. Manuscript structure */}
        <div className="card settings-card">
          <h3>Manuscript structure</h3>
          <p>
            Original research articles should follow the{" "}
            <a href="https://en.wikipedia.org/wiki/IMRAD" target="_blank" rel="noopener noreferrer">
              IMRAD
            </a>{" "}
            format (Introduction, Methods, Results, and Discussion):
          </p>
          <ol className="category-list" style={{ listStyleType: "decimal" }}>
            <li>
              <strong>Title page:</strong> title (sentence case, max 20 words),
              all author names with affiliations, corresponding author email,
              ORCID iDs
            </li>
            <li>
              <strong>Abstract:</strong> structured or unstructured, with 5-8
              keywords below
            </li>
            <li>
              <strong>Introduction:</strong> context, research gap, and
              objectives
            </li>
            <li>
              <strong>Methods:</strong> study design, materials, data
              collection, statistical analysis (enough detail for replication)
            </li>
            <li>
              <strong>Results:</strong> findings presented with figures and
              tables
            </li>
            <li>
              <strong>Discussion:</strong> interpretation, comparison with
              existing literature, limitations
            </li>
            <li>
              <strong>Conclusions:</strong> summary of key findings and
              implications
            </li>
            <li>
              <strong>Acknowledgments:</strong> funding, technical support,
              contributors not meeting authorship criteria
            </li>
            <li>
              <strong>References:</strong> formatted per citation style below
            </li>
          </ol>
          <p>
            Review articles and case studies may adapt this structure as
            appropriate. Short communications may omit separate Results and
            Discussion sections.
          </p>
        </div>

        {/* 3b. Language */}
        <div className="card settings-card">
          <h3>Language and editing</h3>
          <p>
            All manuscripts must be submitted in English. Authors who are not
            native English speakers are strongly encouraged to have their
            manuscript professionally edited before submission. The journal does
            not provide copyediting services.
          </p>
          <p>
            Manuscripts with persistent grammatical or stylistic problems may be
            returned to authors for language revision before peer review.
          </p>
        </div>

        {/* 4. Formatting */}
        <div className="card settings-card">
          <h3>Formatting requirements</h3>
          <ul className="category-list">
            <li>
              <strong>File format:</strong> Microsoft Word (.docx) or LaTeX.
              PDFs are not accepted for initial submission.
            </li>
            <li>
              <strong>Font:</strong> Times New Roman 12pt or Arial 11pt
            </li>
            <li>
              <strong>Spacing:</strong> Double-spaced throughout, including
              references
            </li>
            <li>
              <strong>Margins:</strong> 1 inch (2.54 cm) on all sides
            </li>
            <li>
              <strong>Line numbers:</strong> Required for initial submission
              (continuous numbering)
            </li>
            <li>
              <strong>Page numbers:</strong> Bottom right, starting from title
              page
            </li>
            <li>
              <strong>Headings:</strong> No more than 3 levels of subheadings
            </li>
            <li>
              <strong>Abbreviations:</strong> Define at first use in both
              abstract and main text
            </li>
          </ul>
        </div>

        {/* 5. References */}
        <div className="card settings-card">
          <h3>References and citations</h3>
          <p>
            We accept APA 7th edition, IEEE, or Vancouver citation styles.
            Choose one style and apply it consistently throughout the manuscript.
          </p>
          <ul className="category-list">
            <li>
              Include DOIs for all references where available
            </li>
            <li>
              Use full journal names (do not abbreviate)
            </li>
            <li>
              List all authors up to 6; for 7+ use "et al." after the first 6
            </li>
            <li>
              Web references must include access date and full URL
            </li>
            <li>
              Preprints may be cited with server name, DOI, and "preprint"
              label
            </li>
            <li>
              Self-citations should not exceed 15% of total references
            </li>
          </ul>
        </div>

        {/* 6. Figures & tables */}
        <div className="card settings-card">
          <h3>Figures and tables</h3>
          <ul className="category-list">
            <li>
              <strong>Figures:</strong> Submit as separate files in TIFF, PNG, or
              EPS format, minimum 300 dpi
            </li>
            <li>
              <strong>Tables:</strong> Include in the manuscript file, editable
              (not as images)
            </li>
            <li>
              Number all figures and tables sequentially (Figure 1, Table 1)
            </li>
            <li>
              Each figure/table must have a descriptive title and legend
            </li>
            <li>
              Multi-panel figures: label panels (a), (b), (c) in 8pt bold
            </li>
            <li>
              Use colorblind-friendly palettes when possible
            </li>
            <li>
              No image manipulation beyond standard adjustments (brightness,
              contrast applied uniformly)
            </li>
          </ul>
        </div>

        {/* 6b. Supplementary materials */}
        <div className="card settings-card">
          <h3>Supplementary materials</h3>
          <p>
            Authors may submit supplementary files that support the main
            manuscript but are not essential to the core narrative. These are
            published alongside the article and linked from the main text.
          </p>
          <ul className="category-list">
            <li>
              <strong>Accepted formats:</strong> .docx, .xlsx, .csv, .pdf, .zip,
              .mp4, .r, .py. Maximum 50 MB per file.
            </li>
            <li>
              <strong>Naming:</strong> Number files sequentially (Supplementary
              Table S1, Supplementary Figure S1, Supplementary File S1).
            </li>
            <li>
              <strong>In-text citation:</strong> Reference each supplementary
              item at least once in the main text (e.g., "see Supplementary
              Table S1").
            </li>
            <li>
              <strong>Data and code:</strong> Large datasets and analysis scripts
              should be deposited in a public repository (Zenodo, figshare,
              GitHub, Dryad) and referenced in the Data Availability Statement.
            </li>
          </ul>
        </div>

        {/* 7. Ethics */}
        <div className="card settings-card">
          <h3>Ethics and research integrity</h3>
          <p>
            All submissions must comply with the{" "}
            <a href="https://publicationethics.org/" target="_blank" rel="noopener noreferrer">
              COPE guidelines
            </a>{" "}
            and the{" "}
            <a href="https://www.icmje.org/" target="_blank" rel="noopener noreferrer">
              ICMJE Recommendations
            </a>.
          </p>
          <ul className="category-list">
            <li>
              <strong>Human subjects:</strong> Studies involving human
              participants require ethics committee/IRB approval. Include
              approval number in Methods.
            </li>
            <li>
              <strong>Informed consent:</strong> Written informed consent
              required. For minors, obtain parental/guardian consent.
            </li>
            <li>
              <strong>Animal research:</strong> Must comply with institutional
              guidelines and report per ARRIVE guidelines.
            </li>
            <li>
              <strong>Clinical trials:</strong> Must be registered prospectively
              in a public registry (ClinicalTrials.gov, ISRCTN, etc.). Include
              registration number.
            </li>
            <li>
              <strong>Plagiarism:</strong> All manuscripts are screened. Overlap
              above 15% may result in desk rejection.
            </li>
            <li>
              <strong>AI-generated content:</strong> Use of AI writing tools must
              be disclosed in Acknowledgments. AI cannot be listed as author.
            </li>
          </ul>
        </div>

        {/* 8. Authorship */}
        <div className="card settings-card">
          <h3>Authorship</h3>
          <p>
            Authorship follows{" "}
            <a href="https://www.icmje.org/recommendations/browse/roles-and-responsibilities/defining-the-role-of-authors-and-contributors.html" target="_blank" rel="noopener noreferrer">
              ICMJE criteria
            </a>
            . Each author must have made substantial contributions to:
          </p>
          <ol className="category-list" style={{ listStyleType: "decimal" }}>
            <li>Conception/design of the work, or data acquisition/analysis</li>
            <li>Drafting or critically revising the manuscript</li>
            <li>Final approval of the version to be published</li>
            <li>Agreement to be accountable for all aspects of the work</li>
          </ol>
          <p>
            All authors must meet all four criteria. Contributors who do not
            qualify should be listed in Acknowledgments. Changes to authorship
            after submission require written consent from all authors.
          </p>
        </div>

        {/* 8b. Author contributions (CRediT) */}
        <div className="card settings-card">
          <h3>Author contributions</h3>
          <p>
            All manuscripts must include an Author Contributions section before
            the References. Use the{" "}
            <a href="https://credit.niso.org/" target="_blank" rel="noopener noreferrer">
              CRediT (Contributor Roles Taxonomy)
            </a>{" "}
            to describe each author&apos;s specific contribution. The 14 CRediT
            roles are:
          </p>
          <p className="text-sm" style={{ color: "#5c636b", lineHeight: 1.8 }}>
            Conceptualization, Methodology, Software, Validation, Formal
            Analysis, Investigation, Resources, Data Curation, Writing (Original
            Draft), Writing (Review &amp; Editing), Visualization, Supervision,
            Project Administration, Funding Acquisition.
          </p>
          <p>
            <strong>Example:</strong> "J.S.: Conceptualization, Methodology,
            Writing (Original Draft). M.L.: Formal Analysis, Visualization,
            Writing (Review &amp; Editing)."
          </p>
        </div>

        {/* 8c. Funding statement */}
        <div className="card settings-card">
          <h3>Funding statement</h3>
          <p>
            All manuscripts must include a Funding section before the References.
            List each funding source with the funder name, grant number, and the
            role of the funder in the study (design, data collection, analysis,
            decision to publish). If the funder had no role, state this
            explicitly.
          </p>
          <p>
            If the research received no external funding, include the statement:
            "This research received no external funding."
          </p>
        </div>

        {/* 9. Data availability */}
        <div className="card settings-card">
          <h3>Data availability</h3>
          <p>
            Authors must include a Data Availability Statement before the
            References section. Datasets should be deposited in a public
            repository (Dryad, figshare, Zenodo, or institutional repositories)
            when possible.
          </p>
          <p>
            If data cannot be shared due to privacy or confidentiality, state the
            reason and describe how data access may be requested.
          </p>
        </div>

        {/* 10. Conflicts of interest */}
        <div className="card settings-card">
          <h3>Conflicts of interest</h3>
          <p>
            All authors must disclose financial and non-financial conflicts of
            interest at submission. This includes funding, employment,
            consultancies, patents, and personal relationships that could
            influence the work. If no conflicts exist, include the statement:
            "The authors declare no conflicts of interest."
          </p>
        </div>

        {/* 11. Copyright & licensing */}
        <div className="card settings-card">
          <h3>Copyright and licensing</h3>
          <p>
            Articles are published under a{" "}
            <strong>Creative Commons CC BY 4.0</strong> license. Authors retain
            copyright. Readers may share, copy, and redistribute in any medium,
            provided proper attribution is given.
          </p>
          <p>
            Authors may self-archive the published version immediately (no
            embargo) on personal websites, institutional repositories, or
            preprint servers.
          </p>
        </div>

        {/* 12. APC */}
        <div className="card settings-card">
          <h3>Article processing charge (APC)</h3>
          <p>
            The APC is <strong>$200 per accepted article</strong>. The fee is
            charged only after peer review and acceptance. No charges apply to
            rejected manuscripts.
          </p>
          <ul className="category-list">
            <li>Covers editorial handling, peer review coordination, production, and hosting</li>
            <li>Payment is due within 14 days of acceptance notification</li>
            <li>Fee waivers and discounts available for authors from low-income countries or facing financial hardship</li>
            <li>Waivers do not affect editorial decisions</li>
          </ul>
          <p>
            See{" "}
            <Link href="/pricing">Pricing</Link> for details and voucher
            program.
          </p>
        </div>

        {/* 13. Submission process */}
        <div className="card settings-card">
          <h3>Submission process</h3>
          <ol className="category-list" style={{ listStyleType: "decimal" }}>
            <li>
              <strong>Prepare your manuscript</strong> following the formatting
              requirements above
            </li>
            <li>
              <strong>Write a cover letter</strong> explaining the significance
              of your work, why it fits this journal, and confirming the
              manuscript has not been published or submitted elsewhere
            </li>
            <li>
              <strong>Submit online</strong> through our{" "}
              <Link href="/submit">submission form</Link>. Upload manuscript
              file, cover letter, and supplementary materials (if any)
            </li>
            <li>
              <strong>Initial screening</strong> (3-5 business days): editors
              check scope, formatting, and basic quality
            </li>
            <li>
              <strong>Peer review</strong> (2-4 weeks): at least two
              independent reviewers evaluate the manuscript
            </li>
            <li>
              <strong>Decision:</strong> Accept, Minor Revisions, Major
              Revisions, or Reject
            </li>
            <li>
              <strong>Revision:</strong> authors have 14 days (minor) or 30
              days (major) to submit revisions with a point-by-point response
            </li>
            <li>
              <strong>Publication:</strong> within 24 hours of final acceptance.
              DOI assigned, PDF generated, article indexed.
            </li>
          </ol>
        </div>

        {/* 14. Reporting guidelines */}
        <div className="card settings-card">
          <h3>Reporting guidelines</h3>
          <p>
            Authors should follow the relevant reporting guidelines for their
            study type:
          </p>
          <ul className="category-list">
            <li><strong>Randomized trials:</strong> CONSORT</li>
            <li><strong>Observational studies:</strong> STROBE</li>
            <li><strong>Systematic reviews:</strong> PRISMA</li>
            <li><strong>Diagnostic accuracy:</strong> STARD</li>
            <li><strong>Case reports:</strong> CARE</li>
            <li><strong>Qualitative research:</strong> COREQ</li>
            <li><strong>Animal studies:</strong> ARRIVE</li>
          </ul>
          <p>
            See the{" "}
            <a href="https://www.equator-network.org/" target="_blank" rel="noopener noreferrer">
              EQUATOR Network
            </a>{" "}
            for a complete list.
          </p>
        </div>

        {/* 15. Post-publication */}
        <div className="card settings-card">
          <h3>After publication</h3>
          <ul className="category-list">
            <li>
              <strong>Corrections:</strong> Contact the editorial office to
              request an erratum or corrigendum
            </li>
            <li>
              <strong>Retractions:</strong> Issued for serious errors or
              misconduct, following COPE guidelines
            </li>
            <li>
              <strong>Appeals:</strong> Authors may appeal rejection decisions
              within 30 days with a written explanation addressing reviewer
              concerns
            </li>
            <li>
              <strong>Preprints:</strong> Authors may post preprints before or
              during review. Update the preprint record after publication.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <ul className="actions">
          <li>
            <Link className="button" href="/submit">
              Submit your manuscript
            </Link>
          </li>
          <li>
            <Link className="button-secondary" href="/publication-rules">
              Full publication rules
            </Link>
          </li>
        </ul>
      </section>

      {/* Floating submit button */}
      <Link href="/submit" className="fab-submit">
        Submit manuscript
      </Link>
    </>
  );
}
