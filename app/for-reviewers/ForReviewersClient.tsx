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
      setMessage("Application sent. We’ll review it and follow up by email.");
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
          Complete the reviewer application below. Responses help editors match
          submissions to your expertise and review preferences.
        </p>

        <div className="page-vitals">
          <div className="page-vital-card">
            <div className="val">7-14d</div>
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

        {status === "sent" ? (
          <div className="card settings-card">
            <h3>Application received</h3>
            <p>
              Thank you for applying to review for American Impact Review. We’ve received
              your application and will follow up by email within 3–5 business days.
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
              If you don’t see a confirmation email, please check your spam folder.
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
                Fields marked with * are required.
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
                  Use “{keywordSuggestion}”
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
              <textarea className="input" name="reviewHistory" rows={3} placeholder="Journals reviewed for or # of reviews" />
            </label>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Preferences & ethics</h4>
            <label className="label">
              Manuscript types you want to review
              <input className="input" name="manuscriptTypes" placeholder="Original research, reviews, etc." />
            </label>
            <label className="label">
              Conflicts of interest (if any)
              <textarea className="input" name="conflicts" rows={3} placeholder="Describe any potential conflicts" />
            </label>
            <label className="label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" name="ethics" required />
              I agree to follow ethical review standards and confidentiality.
            </label>
          </section>

          <section style={{ display: "grid", gap: "0.75rem" }}>
            <h4 className="section-title">Submit</h4>
            <p className="text-sm text-slate-600">
              Your application will be emailed to the editorial team for review.
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
    </>
  );
}
