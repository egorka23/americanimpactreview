"use client";

import { useState } from "react";

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card settings-card">
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <h3 style={{ margin: 0, fontSize: "1rem" }}>{question}</h3>
        <span style={{ fontSize: "1.25rem", color: "#64748b", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>&#9662;</span>
      </div>
      <div style={{ maxHeight: open ? "600px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ paddingTop: "1rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PoliciesClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Publication Ethics</div>
          <h1>Publication Ethics &amp; Policies</h1>
          <p>
            American Impact Review is committed to the highest standards of
            publication ethics, editorial integrity, and research transparency.
            Our policies are guided by the principles established by the{" "}
            <a
              href="https://publicationethics.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Committee on Publication Ethics (COPE)
            </a>{" "}
            and aligned with international best practices for scholarly
            publishing.
          </p>
          <div className="page-meta">
            <span>COPE Guidelines</span>
            <span>Open Access</span>
            <span>CC BY 4.0</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Preamble */}
        <div className="write-section">
          <header className="major">
            <h2>Preamble</h2>
          </header>
          <div className="card settings-card">
            <p>
              American Impact Review (AIR) is an open-access, peer-reviewed,
              multidisciplinary academic journal published by{" "}
              <strong>Global Talent Foundation</strong>, a 501(c)(3) nonprofit
              organization. This Publication Ethics Statement establishes the
              ethical standards and responsibilities governing all parties
              involved in the publication process: editors, peer reviewers,
              authors, and the publisher.
            </p>
            <p>
              These policies are informed by and aligned with the guidelines of
              the{" "}
              <a
                href="https://publicationethics.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Committee on Publication Ethics (COPE)
              </a>
              , the{" "}
              <a
                href="https://www.icmje.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                International Committee of Medical Journal Editors (ICMJE)
              </a>{" "}
              recommendations, and the principles upheld by leading scholarly
              publishers including Nature, PLOS, and Elsevier. We are committed
              to upholding the integrity of the scholarly record and fostering a
              culture of ethical responsibility throughout the research
              communication process.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 1. Duties of Editors */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>1. Duties of Editors</h2>
          </header>

          <div className="card settings-card">
            <h3>1.1 Publication Decisions</h3>
            <p>
              The Editor-in-Chief bears ultimate responsibility for deciding
              which manuscripts submitted to the journal are published.
              Publication decisions are based solely on the manuscript&apos;s
              scholarly merit, including its originality, significance, clarity,
              methodological rigor, and relevance to the journal&apos;s scope.
              Editors must not allow personal, commercial, political, or
              institutional considerations to influence publication decisions.
            </p>
            <p>
              Decisions to accept or reject a manuscript are guided by peer
              reviewer recommendations, editorial board input, and the
              journal&apos;s editorial policies. The Editor-in-Chief may consult
              with Associate Editors or members of the Editorial Board in
              reaching a decision.
            </p>
          </div>

          <div className="card settings-card">
            <h3>1.2 Fair and Impartial Review</h3>
            <p>
              Editors evaluate manuscripts based on their intellectual and
              scientific content without regard to the race, ethnicity, gender,
              sexual orientation, religious belief, citizenship, disability, age,
              or political affiliation of the authors. Manuscripts are assessed
              on their merits, and all authors receive fair and equitable
              treatment throughout the editorial process.
            </p>
          </div>

          <div className="card settings-card">
            <h3>1.3 Confidentiality</h3>
            <p>
              Editors and editorial staff must treat all submitted manuscripts
              and associated correspondence as confidential documents. No
              information about a submitted manuscript may be disclosed to
              anyone other than the corresponding author, designated reviewers,
              potential reviewers, editorial advisers, and the publisher, as
              appropriate. Unpublished material disclosed in a submitted
              manuscript must not be used in an editor&apos;s own research
              without the express written consent of the author.
            </p>
          </div>

          <div className="card settings-card">
            <h3>1.4 Conflicts of Interest and Recusal</h3>
            <p>
              Editors must recuse themselves from handling manuscripts in which
              they have a conflict of interest, whether financial, personal,
              professional, or institutional. When the Editor-in-Chief is an
              author on a submission or has a close relationship with an author,
              the manuscript is assigned to an Associate Editor or an
              independent Editorial Board member who manages the entire review
              process without involvement from the conflicted editor.
            </p>
            <p>
              Editors must have systems in place for managing conflicts of
              interest among themselves, their editorial staff, authors,
              reviewers, and editorial board members, consistent with COPE
              guidelines.
            </p>
          </div>

          <div className="card settings-card">
            <h3>1.5 Handling Allegations of Misconduct</h3>
            <p>
              Editors have a duty to act if they suspect or receive allegations
              of research or publication misconduct, whether or not the
              manuscript in question has been published. Editors must not simply
              reject manuscripts that raise concerns about possible misconduct;
              they are ethically obligated to investigate and pursue the matter.
              Editors will follow COPE flowcharts and guidelines in responding
              to suspected misconduct, which may include contacting the
              author&apos;s institution, issuing corrections or retractions, and
              imposing sanctions where appropriate.
            </p>
          </div>

          <div className="card settings-card">
            <h3>1.6 Editorial Independence</h3>
            <p>
              The editorial decision-making process is independent of the
              publisher, Global Talent Foundation. The publisher does not
              interfere with editorial decisions regarding the selection,
              scheduling, or content of published articles. The Editor-in-Chief
              has full authority over the intellectual content of the journal.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. Duties of Reviewers */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>2. Duties of Reviewers</h2>
          </header>

          <div className="card settings-card">
            <h3>2.1 Contribution to Editorial Decisions</h3>
            <p>
              Peer review assists editors in making publication decisions and,
              through editorial communication, helps authors improve their
              manuscripts. Peer review is a fundamental component of scholarly
              communication and an essential obligation of the academic
              community. Any reviewer who feels unqualified to review the
              research reported in a manuscript, or who cannot complete the
              review within the requested timeframe, should notify the editor
              promptly and decline the invitation.
            </p>
          </div>

          <div className="card settings-card">
            <h3>2.2 Confidentiality</h3>
            <p>
              Manuscripts received for review are confidential documents and
              must be treated as such. Reviewers must not share the manuscript
              or discuss its content with anyone outside of the review process
              unless authorized by the editor. This applies both during and
              after the review process. Privileged information or ideas obtained
              through peer review must not be used for the reviewer&apos;s
              personal advantage.
            </p>
          </div>

          <div className="card settings-card">
            <h3>2.3 Objectivity and Constructiveness</h3>
            <p>
              Reviews must be conducted objectively. Personal criticism of the
              author is inappropriate. Reviewers should express their views
              clearly with supporting arguments and constructive feedback.
              Comments should be formulated to help authors improve their work,
              regardless of whether the reviewer recommends acceptance or
              rejection. Reviewers should identify relevant published work that
              the authors have not cited and alert the editor to any substantial
              similarity or overlap between the manuscript under review and any
              other published work of which they have personal knowledge.
            </p>
          </div>

          <div className="card settings-card">
            <h3>2.4 Acknowledgment of Sources</h3>
            <p>
              Reviewers should identify relevant published work that has not
              been cited by the authors. Any statement that an observation,
              derivation, or argument has been previously reported should be
              accompanied by the relevant citation. Reviewers should alert the
              editor to any substantial similarity between the manuscript under
              consideration and any other published paper or manuscript under
              review of which they are aware.
            </p>
          </div>

          <div className="card settings-card">
            <h3>2.5 Disclosure and Conflicts of Interest</h3>
            <p>
              Reviewers must disclose to the editor any potential conflict of
              interest that could bias their review, including competitive,
              collaborative, familial, financial, or other relationships with
              the authors or institutions connected to the manuscript. Reviewers
              who believe they cannot provide a fair and unbiased review must
              decline the assignment. Reviewers should not review manuscripts
              authored by individuals with whom they have a recent publication,
              grant collaboration, institutional affiliation, or personal
              relationship.
            </p>
          </div>

          <div className="card settings-card">
            <h3>2.6 Timeliness</h3>
            <p>
              Reviewers are expected to complete their reviews within the
              timeframe specified by the editor. If a reviewer cannot meet the
              deadline, they should contact the editorial office as early as
              possible so that alternative arrangements can be made. Prompt
              reviews are essential to maintaining fair and efficient
              publication timelines for authors.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. Duties of Authors */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>3. Duties of Authors</h2>
          </header>

          <div className="card settings-card">
            <h3>3.1 Reporting Standards and Originality</h3>
            <p>
              Authors of original research articles must present an accurate
              account of the work performed, the data collected, and an
              objective discussion of the significance of their findings.
              Underlying data should be represented accurately in the
              manuscript. Manuscripts must contain sufficient detail and
              references to permit others to evaluate and replicate the work.
              Fraudulent, fabricated, or knowingly inaccurate statements
              constitute unethical behavior and are unacceptable.
            </p>
            <p>
              Submitted manuscripts must be original works that have not been
              previously published in any form (including preprint servers, with
              the exception of recognized preprint repositories such as SSRN,
              arXiv, or OSF Preprints, which must be disclosed at submission).
              Work that has been published previously, even in a different
              language or in abbreviated form (such as in conference
              proceedings), should be identified and referenced.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.2 Plagiarism</h3>
            <p>
              Plagiarism in all its forms constitutes a serious breach of
              publication ethics and is unacceptable. This includes, but is not
              limited to: presenting another person&apos;s work, ideas, data,
              text, or images as one&apos;s own without proper acknowledgment;
              copying or paraphrasing substantial portions of another&apos;s
              work without attribution; and claiming results from research
              conducted by others. Self-plagiarism (also known as text
              recycling), in which an author reuses substantial portions of
              their own previously published work without appropriate citation
              and disclosure, is also prohibited.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.3 Multiple, Redundant, or Concurrent Submission</h3>
            <p>
              Authors must not submit the same manuscript to more than one
              journal simultaneously. Submitting the same manuscript to multiple
              journals concurrently constitutes unethical publishing behavior
              and is unacceptable. Authors must also not publish redundant
              manuscripts or manuscripts describing essentially the same
              research in more than one journal. An author should not, in
              general, submit a previously published paper for consideration in
              another journal.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.4 Authorship</h3>
            <p>
              Authorship should be limited to those individuals who have made a
              substantial contribution to the conception, design, execution, or
              interpretation of the reported study. All individuals who have
              made substantial contributions should be listed as co-authors.
              The corresponding author must ensure that all appropriate
              co-authors are included on the manuscript and that all co-authors
              have seen and approved the final version of the manuscript and
              agreed to its submission for publication.
            </p>
            <p>
              In accordance with ICMJE recommendations, authorship credit
              should be based on: (1) substantial contributions to the
              conception or design of the work, or the acquisition, analysis, or
              interpretation of data; (2) drafting the work or revising it
              critically for important intellectual content; (3) final approval
              of the version to be published; and (4) agreement to be
              accountable for all aspects of the work. All four criteria must
              be met.
            </p>
            <p>
              Contributors who do not meet all four criteria for authorship
              should be acknowledged in an Acknowledgments section. Ghost
              authorship (where a person who meets authorship criteria is not
              listed) and gift authorship (where a person who does not meet
              authorship criteria is listed) are forms of misconduct.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.5 Use of Artificial Intelligence</h3>
            <p>
              Authors who use artificial intelligence (AI) tools, including
              large language models, in the preparation of their manuscript must
              disclose this use transparently. AI tools may not be listed as
              authors, as they cannot fulfill the accountability requirements of
              authorship. Authors must disclose the specific AI tools used and
              the nature of their contribution (e.g., language editing, data
              analysis, literature search) in the Methods section or in a
              dedicated disclosure statement. Authors bear full responsibility
              for the accuracy and integrity of all content in their
              manuscript, including any content generated or assisted by AI.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.6 Data Access and Retention</h3>
            <p>
              Authors may be asked to provide the raw data in connection with a
              manuscript for editorial review and should be prepared to make
              data publicly available if practicable. Authors should retain such
              data for a reasonable period after publication to allow for
              verification of results. In all cases, authors must include a
              Data Availability Statement in their manuscript.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.7 Disclosure of Financial Support</h3>
            <p>
              All sources of financial support for the research must be
              disclosed. Authors must identify all funding sources, specify
              which authors were supported by each source, and describe the
              role of the funder in the study design, data collection, analysis,
              manuscript preparation, and decision to submit for publication.
              If the funder had no role, this should be stated explicitly.
            </p>
          </div>

          <div className="card settings-card">
            <h3>3.8 Fundamental Errors in Published Work</h3>
            <p>
              When an author discovers a significant error or inaccuracy in
              their own published work, it is the author&apos;s obligation to
              promptly notify the journal Editor-in-Chief and cooperate with the
              editor to publish an erratum, corrigendum, or, if necessary, to
              retract the paper. If the editor learns from a third party that a
              published work contains a significant error, the author is
              obligated to cooperate with the editor in the investigation and,
              where warranted, retract or correct the paper promptly.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. Publication & Access */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>4. Publication &amp; Access</h2>
          </header>

          <div className="card settings-card">
            <h3>4.1 Open Access Policy</h3>
            <p>
              American Impact Review is a fully{" "}
              <strong>Gold Open Access</strong> journal. All published articles
              are freely and immediately available to readers worldwide upon
              publication, with no subscription fees, paywalls, or registration
              barriers. We believe that unrestricted access to research is
              essential for the advancement of knowledge and the public good.
            </p>
            <ul className="category-list">
              <li>
                All articles are published under the{" "}
                <strong>
                  Creative Commons Attribution 4.0 International License (CC BY
                  4.0)
                </strong>
              </li>
              <li>
                Anyone may read, download, copy, distribute, print, search, or
                link to the full text of articles, crawl them for indexing, pass
                them as data to software, or use them for any other lawful
                purpose, without financial, legal, or technical barriers other
                than those inseparable from gaining access to the internet
                itself
              </li>
              <li>
                The only constraint on reproduction and distribution is that
                authors must be given proper attribution as the original
                creators of the work
              </li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3>4.2 Article Processing Charges</h3>
            <p>
              American Impact Review charges an article processing charge (APC)
              upon acceptance. The APC helps sustain the journal&apos;s
              operations, including editorial management, peer review
              coordination, digital preservation, and platform maintenance.
              There are no submission fees. Fee waivers are available.
            </p>
            <p>
              For full details on fees, payment methods, and waiver eligibility,
              see the <a href="#faq">FAQ section</a> below.
            </p>
          </div>

          <div className="card settings-card">
            <h3>4.3 Copyright and Licensing</h3>
            <p>
              Authors <strong>retain copyright</strong> of their published work.
              By submitting a manuscript to American Impact Review, authors
              grant the journal a non-exclusive license to publish the article
              under the CC BY 4.0 license. Authors retain the right to reuse,
              distribute, and reproduce their own work in any medium, provided
              the original publication in American Impact Review is properly
              cited.
            </p>
            <ul className="category-list">
              <li>
                The journal does not claim exclusive ownership of published
                content
              </li>
              <li>
                Third parties may share, adapt, and build upon published work
                for any purpose, including commercially, with proper attribution
              </li>
              <li>
                Authors may deposit accepted manuscripts in institutional or
                subject repositories
              </li>
              <li>
                The CC BY 4.0 license is irrevocable once applied to a published
                article
              </li>
            </ul>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 5. Peer Review Policy */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>5. Peer Review Policy</h2>
          </header>

          <div className="card settings-card">
            <p>
              All manuscripts submitted to American Impact Review undergo
              rigorous <strong>single-blind peer review</strong> by a minimum of
              two independent reviewers with expertise in the relevant subject
              area. In single-blind review, the identities of the reviewers are
              not disclosed to the authors, while the identities of the authors
              are known to the reviewers.
            </p>
            <ul className="category-list">
              <li>
                Reviewers are selected by the Editor-in-Chief or assigned
                Associate Editor based on domain expertise, publication record,
                and absence of conflicts of interest
              </li>
              <li>
                Reviewers evaluate manuscripts for originality, methodological
                soundness, clarity of presentation, significance of
                contribution, and adherence to ethical standards
              </li>
              <li>
                The Editor-in-Chief makes the final editorial decision (accept,
                revise, or reject) based on reviewer recommendations, but is not
                bound by them
              </li>
              <li>
                Authors receive detailed, constructive feedback and are given
                the opportunity to revise and resubmit
              </li>
              <li>
                Typical review turnaround: 7-14 business days
              </li>
            </ul>
            <p>
              American Impact Review does not tolerate manipulation of the peer
              review process, including but not limited to: suggesting
              fabricated reviewers, interfering with the review via third-party
              services, or providing fraudulent contact information for
              suggested reviewers. Such actions constitute serious misconduct
              and will result in immediate rejection and possible sanctions.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 6. Plagiarism Policy */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>6. Plagiarism Policy</h2>
          </header>

          <div className="card settings-card">
            <h3>6.1 Detection</h3>
            <p>
              All submitted manuscripts are screened for originality using
              plagiarism-detection software prior to peer review. This screening
              compares submissions against a comprehensive database of published
              academic content, web content, and other manuscripts. While a
              similarity report alone does not constitute evidence of
              plagiarism, high similarity scores are investigated by the
              editorial team to determine whether proper attribution has been
              provided.
            </p>
          </div>

          <div className="card settings-card">
            <h3>6.2 Response to Detected Plagiarism</h3>
            <p>
              In accordance with COPE guidelines, the journal&apos;s response
              to plagiarism depends on the extent and nature of the plagiarized
              content:
            </p>
            <ul className="category-list">
              <li>
                <strong>Minor overlap</strong> (e.g., overlapping phrases in the
                methods or introduction with proper paraphrasing issues): the
                author may be asked to revise and properly attribute the content
              </li>
              <li>
                <strong>Substantial plagiarism</strong> (e.g., significant
                portions of text, data, or figures copied without attribution):
                the manuscript will be rejected immediately
              </li>
              <li>
                <strong>Plagiarism detected after publication:</strong> the
                article will be retracted, and a retraction notice will be
                published and linked to the original article
              </li>
              <li>
                In cases of confirmed plagiarism, the author&apos;s institution
                may be notified, and the author may be prohibited from
                submitting to the journal for a specified period
              </li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3>6.3 Self-Plagiarism and Text Recycling</h3>
            <p>
              Authors must not reuse substantial portions of their own
              previously published work without proper citation and disclosure.
              While limited reuse of standardized methodological descriptions
              may be acceptable, authors must clearly indicate which portions of
              their submission have appeared in prior publications. Excessive
              text recycling without disclosure is treated as a form of
              misconduct.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 7. Conflict of Interest */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>7. Conflict of Interest Policy</h2>
          </header>

          <div className="card settings-card">
            <p>
              A conflict of interest exists when an individual&apos;s judgment
              regarding a primary interest (such as the validity of research or
              the integrity of editorial decisions) may be influenced by a
              secondary interest (such as financial gain, personal
              relationships, academic competition, or ideological beliefs). All
              participants in the publication process are required to disclose
              any relationships or activities that could be perceived as
              potential conflicts of interest.
            </p>

            <h3>7.1 Authors</h3>
            <p>
              Authors must disclose all financial and non-financial competing
              interests that could be perceived as influencing the research or
              its interpretation. This includes, but is not limited to:
              employment, consultancies, stock ownership, honoraria, paid expert
              testimony, patent applications or registrations, grants, and
              personal relationships. A Conflict of Interest statement must be
              included in all submitted manuscripts. If no conflicts exist,
              authors must state: &quot;The authors declare no competing
              interests.&quot;
            </p>

            <h3>7.2 Reviewers</h3>
            <p>
              Reviewers must disclose any conflicts of interest to the editor
              and decline to review if a conflict could compromise their
              objectivity. Conflicts include: recent co-authorship or
              collaboration with any of the authors, a competitive relationship,
              a financial interest in the outcome, or an institutional
              affiliation with the authors. Reviewers who are uncertain about
              whether a conflict exists should err on the side of disclosure.
            </p>

            <h3>7.3 Editors</h3>
            <p>
              Editors must recuse themselves from handling any manuscript in
              which they have a personal, financial, or professional conflict of
              interest. Such manuscripts are assigned to an independent editor
              or Editorial Board member. Editors must not use information
              obtained through the editorial process for personal or
              competitive advantage.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 8. Corrections & Retractions */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>8. Corrections, Retractions &amp; Expressions of Concern</h2>
          </header>

          <div className="card settings-card">
            <p>
              American Impact Review is committed to maintaining the accuracy
              and integrity of the published record. The purpose of corrections
              and retractions is to correct the scholarly record and inform
              readers, not to punish authors. Post-publication actions are
              guided by{" "}
              <a
                href="https://publicationethics.org/guidance/guideline/retraction-guidelines"
                target="_blank"
                rel="noopener noreferrer"
              >
                COPE Retraction Guidelines
              </a>
              .
            </p>

            <h3>8.1 Erratum / Corrigendum</h3>
            <p>
              If errors are identified after publication that affect the
              accuracy or completeness of the article but do not substantially
              invalidate its findings or conclusions, the journal will publish a
              correction notice (erratum if the error originated with the
              journal; corrigendum if the error originated with the author). The
              correction is published as a separate, citable notice that is
              permanently linked to the original article.
            </p>

            <h3>8.2 Retraction</h3>
            <p>
              Retraction is reserved for articles in which the findings are
              unreliable to a degree that the conclusions cannot be trusted,
              whether as a result of honest error or research misconduct
              (including fabrication, falsification, or plagiarism). Retraction
              may also be warranted in cases of redundant publication, failure
              to disclose major conflicts of interest, ethical violations, or
              compromised peer review. Retraction notices clearly state the
              reason for retraction and are bidirectionally linked to the
              original article.
            </p>

            <h3>8.3 Expression of Concern</h3>
            <p>
              An Expression of Concern is published when the editors have
              well-founded concerns about the integrity of a published article
              but the investigation has not yet concluded or is inconclusive.
              This notice alerts readers to potential issues while an
              investigation is in progress. An Expression of Concern may later
              be resolved by a correction, a retraction, or a statement that no
              action is warranted.
            </p>

            <h3>8.4 Process</h3>
            <ul className="category-list">
              <li>
                All corrections, retractions, and expressions of concern are
                clearly labeled and permanently linked to the original article
              </li>
              <li>
                Retracted articles are not removed from the journal but are
                watermarked as retracted
              </li>
              <li>
                Authors are given an opportunity to respond before retraction,
                except in cases of clear misconduct requiring immediate action
              </li>
              <li>
                The journal follows COPE flowcharts for investigating
                allegations and determining appropriate post-publication actions
              </li>
            </ul>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 9. Research Involving Human and Animal Subjects */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>
              9. Research Involving Human and Animal Subjects
            </h2>
          </header>

          <div className="card settings-card">
            <h3>9.1 Human Subjects Research</h3>
            <p>
              All research involving human participants must have been conducted
              in accordance with the ethical standards of the responsible
              institutional and/or national research committee and with the{" "}
              <a
                href="https://www.wma.net/policies-post/wma-declaration-of-helsinki/"
                target="_blank"
                rel="noopener noreferrer"
              >
                World Medical Association Declaration of Helsinki
              </a>{" "}
              (as revised) and its later amendments or comparable ethical
              standards. Authors must include a statement in their manuscript
              that:
            </p>
            <ul className="category-list">
              <li>
                The study protocol was approved by the relevant Institutional
                Review Board (IRB) or Ethics Committee, including the name of
                the approving body and the approval reference number
              </li>
              <li>
                Informed consent was obtained from all individual participants
                (or their legal guardians) included in the study, with a
                description of how consent was documented
              </li>
              <li>
                If the study was exempt from IRB approval, the reason for
                exemption must be stated
              </li>
              <li>
                For studies involving vulnerable populations or participants at
                risk of coercion, additional safeguards and their
                implementation must be described
              </li>
            </ul>
            <p>
              Identifying information (names, initials, hospital numbers,
              photographs) must not be included in manuscripts unless the
              information is essential for scientific purposes and the patient
              or legal guardian has given written informed consent for
              publication.
            </p>

            <h3>9.2 Animal Subjects Research</h3>
            <p>
              Research involving animal subjects must comply with institutional,
              national, and international guidelines for the care and use of
              laboratory animals. Authors must state in their manuscript that:
            </p>
            <ul className="category-list">
              <li>
                The study was approved by the Institutional Animal Care and Use
                Committee (IACUC) or equivalent ethics committee
              </li>
              <li>
                The research complied with applicable national or international
                guidelines (e.g., ARRIVE guidelines, NIH Guide for the Care and
                Use of Laboratory Animals, or EU Directive 2010/63/EU)
              </li>
              <li>
                All efforts were made to minimize animal suffering and to reduce
                the number of animals used
              </li>
            </ul>

            <h3>9.3 Research Not Involving Human or Animal Subjects</h3>
            <p>
              For studies that do not involve human or animal subjects (e.g.,
              computational research, theoretical studies, textual analysis),
              authors should include a statement confirming that no ethical
              approval was required and explaining why.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 10. Data Sharing Policy */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>10. Data Sharing &amp; Availability</h2>
          </header>

          <div className="card settings-card">
            <p>
              American Impact Review supports and encourages the sharing of
              research data to promote transparency, reproducibility, and the
              advancement of knowledge. Our data policy is informed by COPE
              recommendations and the practices of leading open access
              publishers.
            </p>

            <h3>10.1 Data Availability Statement</h3>
            <p>
              All manuscripts must include a <strong>Data Availability
              Statement</strong> describing whether and how the data supporting
              the findings of the study can be accessed. This statement should
              include hyperlinks to publicly archived datasets where applicable,
              or an explanation of any restrictions on data access.
            </p>

            <h3>10.2 Data Sharing Expectations</h3>
            <ul className="category-list">
              <li>
                Authors are strongly encouraged to deposit research data in
                recognized, discipline-appropriate public repositories (e.g.,
                Dryad, Figshare, Zenodo, Harvard Dataverse, ICPSR, or
                domain-specific repositories)
              </li>
              <li>
                When data cannot be publicly shared due to ethical, legal,
                privacy, or proprietary constraints, authors must clearly
                explain the restrictions and, where possible, describe how
                qualified researchers may request access
              </li>
              <li>
                Supplementary materials, analysis code, and software used to
                generate the findings should be shared when they support the
                reproducibility of the work
              </li>
              <li>
                Authors should retain research data for a minimum of five years
                following publication to allow for verification
              </li>
            </ul>

            <h3>10.3 Exceptions</h3>
            <p>
              The journal recognizes that not all data can or should be shared
              publicly. Legitimate reasons for restricting access include:
              participant confidentiality, legal restrictions, proprietary data,
              indigenous data sovereignty, and security concerns. In all cases,
              the reasons for restriction must be clearly stated in the Data
              Availability Statement.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 11. Complaints & Appeals */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>11. Complaints &amp; Appeals</h2>
          </header>

          <div className="card settings-card">
            <h3>11.1 Appeals of Editorial Decisions</h3>
            <p>
              Authors who believe that their manuscript was rejected in error or
              that the editorial decision was based on a misunderstanding or
              factual error may submit a written appeal to the Editor-in-Chief
              at{" "}
              <strong>
                <a href="mailto:editor@americanimpactreview.com">
                  editor@americanimpactreview.com
                </a>
              </strong>
              . Appeals should include a detailed, point-by-point response to
              the reviewer comments and a clear rationale explaining why the
              decision should be reconsidered.
            </p>
            <ul className="category-list">
              <li>
                The Editor-in-Chief will review the appeal and may seek
                additional opinions from the original reviewers, new reviewers,
                or Editorial Board members
              </li>
              <li>
                A decision on the appeal will be communicated within 14 business
                days
              </li>
              <li>
                The decision on an appeal is final unless new substantive
                evidence is presented
              </li>
            </ul>

            <h3>11.2 Complaints</h3>
            <p>
              Authors, reviewers, readers, and other stakeholders may raise
              complaints about any aspect of the journal&apos;s operations,
              including but not limited to: reviewer conduct, editorial
              decisions, ethical concerns, publication delays, or
              post-publication issues. Complaints should be submitted in writing
              to the Editor-in-Chief.
            </p>
            <ul className="category-list">
              <li>
                All complaints are acknowledged within five business days
              </li>
              <li>
                Complaints are investigated promptly, confidentially, and in
                accordance with COPE guidelines
              </li>
              <li>
                The complainant will receive a written response outlining the
                findings and any actions taken
              </li>
              <li>
                If the complainant is not satisfied with the response, they may
                escalate the matter to the publisher (Global Talent Foundation)
                or to COPE directly
              </li>
            </ul>

            <h3>11.3 Allegations of Misconduct</h3>
            <p>
              Anyone may report suspected research or publication misconduct to
              the Editor-in-Chief. Reports may be made anonymously. The journal
              will investigate all credible allegations following COPE
              flowcharts and guidelines, regardless of whether the manuscript or
              article in question was published by the journal. Informants are
              protected from retaliation.
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 12. Publisher Responsibilities */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>12. Publisher Responsibilities</h2>
          </header>

          <div className="card settings-card">
            <p>
              Global Talent Foundation, as the publisher of American Impact
              Review, commits to the following responsibilities:
            </p>
            <ul className="category-list">
              <li>
                Supporting the editorial independence of the Editor-in-Chief
                and not interfering with editorial decisions
              </li>
              <li>
                Ensuring the long-term digital preservation and accessibility
                of all published content through archival services (Internet
                Archive and planned LOCKSS participation)
              </li>
              <li>
                Maintaining the journal&apos;s website and publishing
                infrastructure to ensure uninterrupted access to published
                articles
              </li>
              <li>
                Cooperating with the editorial team in the investigation of
                ethical concerns and the publication of corrections, retractions,
                or expressions of concern when warranted
              </li>
              <li>
                Assigning persistent identifiers (DOIs) to all published
                articles upon completion of Crossref registration
              </li>
              <li>
                Clearly communicating all fees, policies, and editorial
                processes to authors, reviewers, and readers
              </li>
              <li>
                Operating as a 501(c)(3) nonprofit organization with a
                commitment to advancing knowledge and the public good
              </li>
            </ul>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 13. Archival Policy */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>13. Archival &amp; Digital Preservation</h2>
          </header>

          <div className="card settings-card">
            <p>
              American Impact Review is committed to the long-term preservation
              and perpetual accessibility of all published content. Digital
              preservation ensures that scholarship remains available to future
              researchers regardless of changes to the journal&apos;s
              operations or technology.
            </p>
            <ul className="category-list">
              <li>
                Digital preservation through{" "}
                <strong>LOCKSS</strong> (Lots of Copies Keep Stuff Safe) is
                planned to ensure distributed, redundant archival
              </li>
              <li>
                Articles are archived through the{" "}
                <strong>Internet Archive</strong> to maintain publicly accessible
                copies of all published work
              </li>
              <li>
                All published articles remain freely accessible on the journal
                website indefinitely
              </li>
              <li>
                Persistent identifiers (DOIs) will be assigned to all articles
                upon completion of Crossref registration, ensuring permanent
                discoverability
              </li>
            </ul>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 14. Contact & Effective Date */}
        {/* ================================================================ */}
        <div className="write-section">
          <header className="major">
            <h2>14. Contact &amp; Effective Date</h2>
          </header>

          <div className="card settings-card">
            <p>
              This Publication Ethics Statement is effective as of{" "}
              <strong>February 2026</strong> and will be reviewed and updated
              periodically to reflect evolving best practices in scholarly
              publishing ethics.
            </p>
            <p>
              Questions, concerns, or reports related to publication ethics
              should be directed to:
            </p>
            <ul className="category-list">
              <li>
                <strong>Editor-in-Chief:</strong>{" "}
                <a href="mailto:editor@americanimpactreview.com">
                  editor@americanimpactreview.com
                </a>
              </li>
              <li>
                <strong>Publisher:</strong> Global Talent Foundation, a 501(c)(3)
                nonprofit organization
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="https://americanimpactreview.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  americanimpactreview.com
                </a>
              </li>
            </ul>
            <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.75 }}>
              This statement draws on guidelines published by the{" "}
              <a
                href="https://publicationethics.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Committee on Publication Ethics (COPE)
              </a>
              , the{" "}
              <a
                href="https://www.icmje.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                International Committee of Medical Journal Editors (ICMJE)
              </a>
              , and the policies of Nature, PLOS, MDPI, and Elsevier.
            </p>
          </div>
        </div>
        {/* ================================================================ */}
        {/* FAQ */}
        {/* ================================================================ */}
        <div className="write-section" id="faq">
          <header className="major">
            <h2>Frequently Asked Questions</h2>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <FaqItem question="Is there a submission fee?">
              <p>
                No. There is no fee to submit a manuscript for consideration.
                Charges apply only after a manuscript has been accepted
                following peer review.
              </p>
            </FaqItem>

            <FaqItem question="What are the publication fees?">
              <p>
                The article processing charge (APC) is <strong>$500 USD</strong>{" "}
                per accepted article. This fee covers editorial handling, peer
                review coordination, production, digital hosting, and
                long-term archival.
              </p>
              <p>
                American Impact Review is published by Global Talent Foundation,
                a 501(c)(3) nonprofit organization. All fees support editorial
                operations, not profit.
              </p>
              <p>
                Fee waivers are available for authors from low-income countries
                (as defined by the World Bank) or those experiencing financial
                hardship. Waiver requests are evaluated by the editorial office
                and <strong>do not affect editorial decisions</strong>.
              </p>
            </FaqItem>

            <FaqItem question="What payment methods are accepted?">
              <p>
                We accept credit and debit cards (Visa, Mastercard, American
                Express) and bank transfers. Payment links are sent to authors
                via email after acceptance. All transactions are processed
                through Stripe.
              </p>
            </FaqItem>

            <FaqItem question="Are fee waivers available?">
              <p>
                Yes. Full or partial waivers may be granted to authors from
                low-income countries (as classified by the World Bank) or those
                who can demonstrate financial hardship. To request a waiver,
                use our{" "}
                <a href="/contact">contact form</a>{" "}
                at the time of submission or upon acceptance, briefly stating
                the reason for your request. Waiver decisions are made
                independently of editorial decisions and do not influence
                peer review outcomes.
              </p>
            </FaqItem>

            <FaqItem question="Who publishes American Impact Review?">
              <p>
                American Impact Review is published by{" "}
                <strong>Global Talent Foundation</strong>, a 501(c)(3) nonprofit
                organization incorporated in the United States (EIN:
                33-2266959). The foundation is committed to advancing knowledge
                and the public good through transparent, accessible scholarly
                publishing.
              </p>
            </FaqItem>

            <FaqItem question="What license do published articles use?">
              <p>
                All articles are published under the{" "}
                <strong>Creative Commons Attribution 4.0 International License
                (CC BY 4.0)</strong>. Authors retain copyright. Anyone may read,
                share, and build upon published work with proper attribution.
              </p>
            </FaqItem>

            <FaqItem question="Can I self-archive my article?">
              <p>
                Yes. Authors may self-archive the published version of their
                article immediately upon publication. There is no embargo
                period. Articles may be deposited in institutional repositories,
                personal websites, or preprint servers.
              </p>
            </FaqItem>

            <FaqItem question="How long does the review process take?">
              <p>
                Initial editorial screening takes 3-5 business days. Peer review
                typically takes 7-14 business days. Authors receive a decision
                (accept, minor revisions, major revisions, or reject) along
                with detailed reviewer feedback.
              </p>
            </FaqItem>

            <FaqItem question="Can I appeal a rejection?">
              <p>
                Yes. Authors may submit a written appeal to the Editor-in-Chief
                within 30 days of the decision, including a point-by-point
                response to reviewer comments. Appeals are reviewed by the
                Editor-in-Chief, who may seek additional opinions.
              </p>
            </FaqItem>

            <FaqItem question="How do I contact the editorial office?">
              <p>
                For any questions, contact the Editor-in-Chief at{" "}
                <a href="mailto:editor@americanimpactreview.com">
                  editor@americanimpactreview.com
                </a>.
              </p>
            </FaqItem>
          </div>
        </div>
      </section>
    </>
  );
}
