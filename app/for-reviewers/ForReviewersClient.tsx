"use client";

import { useMemo, useState } from "react";

export default function ForReviewersClient() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [keywordsValue, setKeywordsValue] = useState("");
  const [keywordSuggestion, setKeywordSuggestion] = useState<string | null>(null);

  const keywordMap = useMemo(() => {
    return new Map<string, string>([
      ["ai", "Artificial Intelligence (AI)"],
      ["artificial intelligence", "Artificial Intelligence (AI)"],
      ["ml", "Machine Learning"],
      ["machine learning", "Machine Learning"],
      ["nlp", "Natural Language Processing (NLP)"],
      ["natural language processing", "Natural Language Processing (NLP)"],
      ["hci", "Human-Computer Interaction (HCI)"],
      ["human computer interaction", "Human-Computer Interaction (HCI)"],
      ["microgrid", "Microgrids"],
      ["microgrids", "Microgrids"],
      ["renewables", "Renewable Energy"],
      ["renewable energy", "Renewable Energy"],
      ["energy", "Energy & Climate"],
      ["climate", "Energy & Climate"],
      ["ai & data", "AI & Data"],
      ["data science", "AI & Data"],
      ["health", "Health & Biotech"],
      ["biotech", "Health & Biotech"],
      ["robotics", "Robotics & Automation"],
      ["automation", "Robotics & Automation"],
      ["human performance", "Human Performance"],
      ["sleep", "Human Performance"],
      ["immunotherapy", "Immunotherapy"],
      ["bioinformatics", "Bioinformatics"],
    ]);
  }, []);

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s&-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const updateKeywordSuggestion = (value: string) => {
    const parts = value.split(",");
    const last = parts[parts.length - 1]?.trim() || "";
    const normalized = normalize(last);
    const suggestion = keywordMap.get(normalized) || null;
    setKeywordSuggestion(suggestion);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const res = await fetch("/api/reviewer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(err.error || "Submission failed. Please try again.");
        return;
      }

      setStatus("sent");
      setMessage("Application sent. We'll review it and follow up by email.");
      form.reset();
      setKeywordsValue("");
      setKeywordSuggestion(null);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const applyKeywordSuggestion = () => {
    if (!keywordSuggestion) return;
    const parts = keywordsValue.split(",");
    const head = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
    const next = [...head, keywordSuggestion].join(", ");
    setKeywordsValue(next);
    setKeywordSuggestion(null);
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">About</div>
          <h1>For Reviewers</h1>
          <p>
            Guidelines, evaluation criteria, and application form for peer
            reviewers at American Impact Review.
          </p>
          <div className="page-meta">
            <span>Single-Blind</span>
            <span>7-14 Day Turnaround</span>
            <span>COPE Compliant</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        {/* Timeline cards */}
        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">48h</div>
            <div className="lbl">Accept/Decline Invite</div>
          </div>
          <div className="page-vital-card">
            <div className="val">7-14d</div>
            <div className="lbl">Complete Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">Single</div>
            <div className="lbl">Blind Review</div>
          </div>
          <div className="page-vital-card">
            <div className="val">2+</div>
            <div className="lbl">Reviewers per Paper</div>
          </div>
        </div>

        {/* 1. Peer review process */}
        <div className="card settings-card">
          <h3>Peer review process</h3>
          <p>
            American Impact Review uses <strong>single-blind peer review</strong>.
            Reviewer identities are kept confidential; author identities are
            visible to reviewers.
          </p>
          <ol className="category-list" style={{ listStyleType: "decimal" }}>
            <li>
              <strong>Invitation:</strong> Editors select reviewers based on
              expertise match. You receive an email with the manuscript title and
              abstract.
            </li>
            <li>
              <strong>Accept or decline</strong> within 48 hours. If you cannot
              review, suggest an alternative reviewer if possible.
            </li>
            <li>
              <strong>Review:</strong> Read the manuscript, assess it against the
              evaluation criteria below, and submit your report through the
              review form.
            </li>
            <li>
              <strong>Decision:</strong> The editor considers all reviewer
              reports and makes the final editorial decision. Reviewers may be
              asked to re-review revised manuscripts.
            </li>
          </ol>
        </div>

        {/* 2. When to decline */}
        <div className="card settings-card">
          <h3>When to decline a review</h3>
          <ul className="category-list">
            <li>The manuscript is outside your area of expertise</li>
            <li>You have a conflict of interest (see below)</li>
            <li>You cannot complete the review within the requested timeframe</li>
            <li>You have recently reviewed the same manuscript for another journal</li>
          </ul>
          <p>
            If you decline, please suggest alternative reviewers when possible.
            Declining does not affect your standing as a reviewer.
          </p>
        </div>

        {/* 3. Evaluation criteria */}
        <div className="card settings-card">
          <h3>Evaluation criteria</h3>
          <p>Assess the manuscript on the following dimensions:</p>

          <h4 className="section-title" style={{ marginTop: "1rem" }}>Scientific rigor</h4>
          <ul className="category-list">
            <li>Is the research question clearly stated?</li>
            <li>Is the study design appropriate for the question?</li>
            <li>Are methods described in sufficient detail for replication?</li>
            <li>Is the statistical analysis appropriate and correctly applied?</li>
            <li>Are sample sizes adequate?</li>
          </ul>

          <h4 className="section-title" style={{ marginTop: "1rem" }}>Originality and significance</h4>
          <ul className="category-list">
            <li>Does the work make a new contribution to the field?</li>
            <li>Is the work placed in context of existing literature?</li>
            <li>Are the findings relevant and potentially impactful?</li>
          </ul>

          <h4 className="section-title" style={{ marginTop: "1rem" }}>Results and interpretation</h4>
          <ul className="category-list">
            <li>Are the conclusions supported by the data?</li>
            <li>Are limitations discussed honestly?</li>
            <li>Are figures and tables clear and necessary?</li>
          </ul>

          <h4 className="section-title" style={{ marginTop: "1rem" }}>Presentation</h4>
          <ul className="category-list">
            <li>Is the writing clear and well-organized?</li>
            <li>Is the abstract accurate and complete?</li>
            <li>Are references appropriate and up to date?</li>
          </ul>

          <h4 className="section-title" style={{ marginTop: "1rem" }}>Ethics compliance</h4>
          <ul className="category-list">
            <li>Are ethics approvals reported (IRB, animal ethics)?</li>
            <li>Is informed consent documented?</li>
            <li>Are conflicts of interest disclosed?</li>
            <li>Is a data availability statement included?</li>
          </ul>
        </div>

        {/* 4. Scoring */}
        <div className="card settings-card">
          <h3>Scoring scale</h3>
          <p>
            Rate the manuscript on each criterion using this scale:
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Meaning</th>
                  <th>Guidance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>5</strong></td>
                  <td>Excellent</td>
                  <td>Meets all standards, no concerns</td>
                </tr>
                <tr>
                  <td><strong>4</strong></td>
                  <td>Good</td>
                  <td>Minor issues that do not affect conclusions</td>
                </tr>
                <tr>
                  <td><strong>3</strong></td>
                  <td>Acceptable</td>
                  <td>Some issues requiring revision</td>
                </tr>
                <tr>
                  <td><strong>2</strong></td>
                  <td>Below standard</td>
                  <td>Significant issues in methods, analysis, or interpretation</td>
                </tr>
                <tr>
                  <td><strong>1</strong></td>
                  <td>Unacceptable</td>
                  <td>Fundamental flaws, out of scope, or misconduct suspected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Recommendation categories */}
        <div className="card settings-card">
          <h3>Recommendation categories</h3>
          <ul className="category-list">
            <li>
              <strong>Accept:</strong> Manuscript is ready for publication with
              no or only minor editorial corrections.
            </li>
            <li>
              <strong>Minor revisions:</strong> Small clarifications, language
              improvements, or additional references needed. No new experiments
              or analyses required.
            </li>
            <li>
              <strong>Major revisions:</strong> Significant changes needed to
              methods, analysis, or interpretation. May require additional
              data or experiments. Will be re-reviewed.
            </li>
            <li>
              <strong>Reject:</strong> Fundamental flaws in design or execution,
              insufficient originality, or outside journal scope.
            </li>
          </ul>
        </div>

        {/* 6. Review structure */}
        <div className="card settings-card">
          <h3>How to structure your review</h3>
          <p>A good review report includes:</p>
          <ol className="category-list" style={{ listStyleType: "decimal" }}>
            <li>
              <strong>Summary</strong> (2-3 sentences): what the paper does and
              its main findings
            </li>
            <li>
              <strong>Major concerns:</strong> issues that must be addressed
              before publication (methods, analysis, interpretation)
            </li>
            <li>
              <strong>Minor concerns:</strong> smaller suggestions
              (clarifications, typos, missing references)
            </li>
            <li>
              <strong>Specific comments:</strong> line-by-line or
              section-by-section feedback
            </li>
            <li>
              <strong>Confidential comments to editor:</strong> issues not
              appropriate for the authors (suspected misconduct, conflicts)
            </li>
          </ol>
          <p>
            Be constructive and specific. Explain why something is a problem and
            suggest how it can be fixed. Avoid vague statements like "the methods
            are weak" without explanation.
          </p>
        </div>

        {/* 7. Confidentiality */}
        <div className="card settings-card">
          <h3>Confidentiality</h3>
          <ul className="category-list">
            <li>
              Manuscripts under review are confidential documents. Do not share
              them with anyone without editor permission.
            </li>
            <li>
              Do not use information from the manuscript for personal advantage
              before publication.
            </li>
            <li>
              Do not contact authors directly about the manuscript.
            </li>
            <li>
              Destroy or delete all manuscript files after completing your
              review.
            </li>
          </ul>
        </div>

        {/* 8. Conflicts of interest */}
        <div className="card settings-card">
          <h3>Conflicts of interest</h3>
          <p>
            Decline the review or disclose the conflict to the editor if any of
            the following apply:
          </p>
          <ul className="category-list">
            <li>You are a co-author, collaborator, or former advisor/student of any author</li>
            <li>You work at the same institution as any author</li>
            <li>You have a financial interest in the outcome</li>
            <li>You have a personal relationship with any author</li>
            <li>You are a direct competitor working on the same research question</li>
          </ul>
        </div>

        {/* 9. AI tools */}
        <div className="card settings-card">
          <h3>Use of AI tools</h3>
          <p>
            Reviewers must not upload manuscripts or any part of the submission
            to AI tools (ChatGPT, Claude, Gemini, etc.). This is a violation of
            manuscript confidentiality and may constitute a breach of the
            reviewer agreement.
          </p>
          <ul className="category-list">
            <li>
              <strong>Not allowed:</strong> Uploading the manuscript, copying
              text from the manuscript, or pasting figures into any AI system
            </li>
            <li>
              <strong>Allowed:</strong> Using AI to check grammar or polish your
              own review text (not the manuscript)
            </li>
            <li>
              <strong>Disclosure:</strong> Any use of AI in preparing the review
              must be disclosed to the editor
            </li>
          </ul>
        </div>

        {/* 9b. Reporting guidelines */}
        <div className="card settings-card">
          <h3>Reporting guidelines</h3>
          <p>
            Check whether the manuscript follows the appropriate reporting
            standard for its study type. Indicate in your review if a required
            checklist is missing or incomplete.
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
            for a complete list of reporting guidelines.
          </p>
        </div>

        {/* 9c. Data availability */}
        <div className="card settings-card">
          <h3>Data availability</h3>
          <p>
            As part of your review, check whether the manuscript includes a Data
            Availability Statement and whether the underlying data are accessible
            or appropriately justified as restricted. Specifically:
          </p>
          <ul className="category-list">
            <li>Is a Data Availability Statement present?</li>
            <li>Are datasets deposited in a public repository (Zenodo, figshare, Dryad, GitHub)?</li>
            <li>If data are restricted, is the reason clearly stated?</li>
            <li>Are analysis scripts or code shared when relevant?</li>
            <li>Do the data presented match the claims in the manuscript?</li>
          </ul>
        </div>

        {/* 10. Reviewer recognition */}
        <div className="card settings-card">
          <h3>Reviewer recognition</h3>
          <ul className="category-list">
            <li>
              <strong>Certificate:</strong> Reviewers receive a certificate of
              peer review upon completion
            </li>
            <li>
              <strong>Annual acknowledgment:</strong> Reviewer names are listed
              in the annual Reviewer Acknowledgment published in the journal
            </li>
            <li>
              <strong>APC discount:</strong> Active reviewers (3+ reviews per
              year) receive a 50% discount on APC for their own submissions
            </li>
            <li>
              <strong>ORCID:</strong> Reviews can be added to your ORCID record
            </li>
          </ul>
        </div>

        {/* 11. Reviewer code of conduct */}
        <div className="card settings-card">
          <h3>Reviewer code of conduct</h3>
          <p>
            We follow the{" "}
            <a
              href="https://publicationethics.org/resources/guidelines-new/cope-ethical-guidelines-peer-reviewers"
              target="_blank"
              rel="noopener noreferrer"
            >
              COPE Ethical Guidelines for Peer Reviewers
            </a>
            . Reviewers are expected to:
          </p>
          <ul className="category-list">
            <li>Provide honest, objective, and constructive feedback</li>
            <li>Complete reviews within the agreed timeframe</li>
            <li>Declare all conflicts of interest</li>
            <li>Maintain confidentiality</li>
            <li>Not discriminate based on author nationality, gender, institution, or religion</li>
            <li>Report suspected misconduct to the editor</li>
          </ul>
        </div>

        {/* 12. Contact */}
        <div className="card settings-card">
          <h3>Questions?</h3>
          <p>
            For questions about the review process, technical issues, or
            confidential concerns, contact the Editor-in-Chief at{" "}
            <a href="mailto:editor@americanimpactreview.com">
              editor@americanimpactreview.com
            </a>{" "}
            or use the <a href="/contact">contact form</a>.
          </p>
        </div>

        {/* Divider before form */}
        <div id="reviewer-form" className="eb-divider" style={{ margin: "2.5rem 0 2rem" }}>
          <span>Apply to Review</span>
        </div>

        {/* Reviewer application form */}
        {status === "sent" ? (
          <div className="card settings-card">
            <h3>Application received</h3>
            <p>
              Thank you for applying to review for American Impact Review. We've received
              your application and will follow up by email within 3-5 business days.
            </p>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                margin: "1rem 0",
              }}
            >
              If you don't see a confirmation email, please check your spam folder.
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setStatus("idle");
                setMessage(null);
              }}
            >
              Submit another application
            </button>
          </div>
        ) : (
          <form
            className="card settings-card"
            style={{ display: "grid", gap: "1.25rem" }}
            onSubmit={handleSubmit}
          >
            <div>
              <h3>Reviewer application</h3>
              <p className="text-sm text-slate-600">
                Fields marked with * are required. We review applications within
                3-5 business days.
              </p>
            </div>

            {status === "error" && message ? (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                {message}
              </div>
            ) : null}

            <section style={{ display: "grid", gap: "0.75rem" }}>
              <h4 className="section-title">Basic information</h4>
              <label className="label">
                Full name *
                <input className="input" name="fullName" placeholder="Full legal name" required />
              </label>
              <label className="label">
                Email (institutional preferred) *
                <input className="input" type="email" name="email" placeholder="name@university.edu" required />
              </label>
              <label className="label">
                Affiliation / position *
                <input className="input" name="affiliation" placeholder="Institution, title" required />
              </label>
              <label className="label">
                Field of expertise *
                <input className="input" name="discipline" placeholder="Primary discipline" required />
              </label>
              <label className="label">
                Expertise keywords *
                <input
                  className="input"
                  name="keywords"
                  placeholder="e.g., microgrids, immunotherapy, bias mitigation"
                  required
                  list="reviewer-keywords"
                  value={keywordsValue}
                  onChange={(event) => {
                    setKeywordsValue(event.target.value);
                    updateKeywordSuggestion(event.target.value);
                  }}
                />
              </label>
              <datalist id="reviewer-keywords">
                <option value="Artificial Intelligence (AI)" />
                <option value="Machine Learning" />
                <option value="Natural Language Processing (NLP)" />
                <option value="Human-Computer Interaction (HCI)" />
                <option value="Energy & Climate" />
                <option value="Renewable Energy" />
                <option value="Microgrids" />
                <option value="Health & Biotech" />
                <option value="Immunotherapy" />
                <option value="Bioinformatics" />
                <option value="Robotics & Automation" />
                <option value="Human Performance" />
              </datalist>
              {keywordSuggestion ? (
                <div className="text-sm text-slate-600" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span>Suggested term:</span>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={applyKeywordSuggestion}
                    style={{ padding: "0.35rem 0.75rem" }}
                  >
                    Use &ldquo;{keywordSuggestion}&rdquo;
                  </button>
                </div>
              ) : null}
            </section>

            <section style={{ display: "grid", gap: "0.75rem" }}>
              <h4 className="section-title">Profile & experience (optional)</h4>
              <label className="label">
                Highest degree
                <input className="input" name="degree" placeholder="PhD, MD, MS, etc." />
              </label>
              <label className="label">
                ORCID iD or profile link
                <input className="input" name="orcid" placeholder="0000-0000-0000-0000 or https://..." />
              </label>
              <label className="label">
                Publications / Scholar link
                <input className="input" name="publications" placeholder="https://scholar.google.com/..." />
              </label>
              <label className="label">
                Review history (optional)
                <textarea className="input" name="reviewHistory" rows={3} placeholder="Journals reviewed for, approximate number of reviews completed" />
              </label>
            </section>

            <section style={{ display: "grid", gap: "0.75rem" }}>
              <h4 className="section-title">Preferences & ethics</h4>
              <label className="label">
                Manuscript types you want to review
                <input className="input" name="manuscriptTypes" placeholder="Original research, reviews, case studies, etc." />
              </label>
              <label className="label">
                Conflicts of interest (if any)
                <textarea className="input" name="conflicts" rows={3} placeholder="List any institutions, collaborators, or topics that may constitute a conflict" />
              </label>
              <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" name="ethics" required />
                I agree to follow the COPE Ethical Guidelines for Peer Reviewers
                and maintain manuscript confidentiality.
              </label>
            </section>

            {/* Honeypot - hidden from humans, bots will fill it */}
            <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
              <label htmlFor="rev-website">Website</label>
              <input id="rev-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <section style={{ display: "grid", gap: "0.75rem" }}>
              <h4 className="section-title">Submit</h4>
              <p className="text-sm text-slate-600">
                Your application will be reviewed by the editorial team. We
                contact all applicants regardless of outcome.
              </p>
              <div>
                <button className="button primary" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Submitting..." : "Submit application"}
                </button>
              </div>
            </section>
          </form>
        )}
      </section>

      {/* Floating apply button */}
      <a href="#reviewer-form" className="fab-submit">
        Apply to review
      </a>
    </>
  );
}
