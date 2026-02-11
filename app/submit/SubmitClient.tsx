"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

const ARTICLE_TYPES = [
  "Original Research",
  "Review Article",
  "Short Communication",
  "Case Study",
];

const CATEGORIES = [
  "Computer Science",
  "Health & Biotech",
  "AI & Data",
  "Sports Science",
  "Sports Medicine",
  "Energy & Climate",
  "Human Performance",
  "Social Sciences",
  "Engineering",
];

interface CoAuthor {
  name: string;
  email: string;
  affiliation: string;
  orcid: string;
}

const emptyCoAuthor = (): CoAuthor => ({ name: "", email: "", affiliation: "", orcid: "" });

export default function SubmitClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    articleType: ARTICLE_TYPES[0],
    title: "",
    abstract: "",
    category: CATEGORIES[0],
    keywords: "",
    authorAffiliation: "",
    authorOrcid: "",
    coverLetter: "",
    conflictOfInterest: "",
    noConflict: true,
    policyAgreed: false,
    noEthics: true,
    ethicsApproval: "",
    noFunding: true,
    fundingStatement: "",
    dataAvailability: "",
    noAi: true,
    aiDisclosure: "",
  });
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <section>
        <p>Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <>
        <section className="page-hero">
          <div className="page-hero__inner">
            <div className="page-hero__kicker">Submit</div>
            <h1>Submit Now</h1>
            <p>
              Submit your manuscript to American Impact Review. Every submission is
              screened for formatting, originality, and ethical compliance before
              entering peer review.
            </p>
            <div className="page-meta">
              <span>Open Access</span>
              <span>Peer-Reviewed</span>
              <span>ISSN Pending</span>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1.25rem 0 1.5rem", flexWrap: "wrap" }}>
            <Link className="button" href={`/login?callbackUrl=${encodeURIComponent("/submit")}`}>
              Log in to submit
            </Link>
            <Link className="button" href={`/signup?callbackUrl=${encodeURIComponent("/submit")}`}>
              Create account
            </Link>
            <Link className="button-secondary" href="/for-authors">
              View author guidelines
            </Link>
          </div>

          <div className="card settings-card">
            <h3>Submission checklist</h3>
            <ul className="category-list">
              <li>Use the journal template and structured sections</li>
              <li>Include abstract, keywords, and references</li>
              <li>Provide author affiliations and ORCID (if available)</li>
              <li>Confirm originality and conflict of interest disclosure</li>
            </ul>
          </div>

          <div className="card settings-card">
            <h3>Publication timeline</h3>
            <ul className="category-list">
              <li>Initial screening: 3-5 business days</li>
              <li>Peer review: 2-4 weeks</li>
              <li>Decision: accept / revise / reject</li>
              <li>Issue placement after acceptance</li>
            </ul>
          </div>
        </section>
      </>
    );
  }

  if (success) {
    return (
      <section>
        <header className="major">
          <h2>Submission received</h2>
        </header>
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: "1.25rem 1.5rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
        }}>
          <p style={{ margin: 0 }}>
            Your manuscript has been submitted successfully.
            <br />Submission ID: <strong>{success}</strong>
          </p>
          <p style={{ margin: "0.75rem 0 0" }}>
            Our editorial team will review your submission within 3-5 business days.
          </p>
        </div>
        <ul className="actions">
          <li>
            <Link href="/explore" className="button">Explore articles</Link>
          </li>
          <li>
            <button className="button-secondary" onClick={() => { setSuccess(null); setForm({ articleType: ARTICLE_TYPES[0], title: "", abstract: "", category: CATEGORIES[0], keywords: "", authorAffiliation: "", authorOrcid: "", coverLetter: "", conflictOfInterest: "", noConflict: true, policyAgreed: false, noEthics: true, ethicsApproval: "", noFunding: true, fundingStatement: "", dataAvailability: "", noAi: true, aiDisclosure: "" }); setCoAuthors([]); setFile(null); }}>
              Submit another
            </button>
          </li>
        </ul>
      </section>
    );
  }

  const addCoAuthor = () => setCoAuthors([...coAuthors, emptyCoAuthor()]);
  const removeCoAuthor = (i: number) => setCoAuthors(coAuthors.filter((_, idx) => idx !== i));
  const updateCoAuthor = (i: number, field: keyof CoAuthor, value: string) => {
    const updated = [...coAuthors];
    updated[i] = { ...updated[i], [field]: value };
    setCoAuthors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.abstract.trim()) {
      setError("Title and abstract are required.");
      return;
    }

    if (!form.keywords.trim()) {
      setError("Keywords are required.");
      return;
    }

    if (!file) {
      setError("Manuscript file is required.");
      return;
    }

    if (!form.policyAgreed) {
      setError("You must agree to the publication policies before submitting.");
      return;
    }

    // Validate declarations: if user unchecked "none", they must provide details
    if (!form.noEthics && !form.ethicsApproval.trim()) {
      setError("Please provide ethics/IRB approval details, or check 'No human or animal subjects involved'.");
      return;
    }
    if (!form.noFunding && !form.fundingStatement.trim()) {
      setError("Please provide funding details, or check 'No external funding received'.");
      return;
    }
    if (!form.noAi && !form.aiDisclosure.trim()) {
      setError("Please describe AI tool usage, or check 'No AI tools were used'.");
      return;
    }
    if (!form.noConflict && !form.conflictOfInterest.trim()) {
      setError("Please describe competing interests, or check 'I declare that I have no competing interests'.");
      return;
    }

    // Validate co-author required fields
    for (let i = 0; i < coAuthors.length; i++) {
      if (!coAuthors[i].name.trim() || !coAuthors[i].email.trim()) {
        setError(`Co-author ${i + 1}: name and email are required.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("articleType", form.articleType);
      formData.append("title", form.title.trim());
      formData.append("abstract", form.abstract.trim());
      formData.append("category", form.category);
      formData.append("keywords", form.keywords.trim());

      if (form.authorAffiliation.trim()) {
        formData.append("authorAffiliation", form.authorAffiliation.trim());
      }
      if (form.authorOrcid.trim()) {
        formData.append("authorOrcid", form.authorOrcid.trim());
      }
      if (coAuthors.length > 0) {
        formData.append("coAuthors", JSON.stringify(coAuthors));
      }

      if (form.coverLetter.trim()) {
        formData.append("coverLetter", form.coverLetter.trim());
      }
      if (!form.noConflict && form.conflictOfInterest.trim()) {
        formData.append("conflictOfInterest", form.conflictOfInterest.trim());
      } else if (form.noConflict) {
        formData.append("conflictOfInterest", "");
      }

      // Declarations
      if (form.noEthics) {
        formData.append("ethicsApproval", "No human/animal subjects involved");
      } else if (form.ethicsApproval.trim()) {
        formData.append("ethicsApproval", form.ethicsApproval.trim());
      }

      if (form.noFunding) {
        formData.append("fundingStatement", "No external funding");
      } else if (form.fundingStatement.trim()) {
        formData.append("fundingStatement", form.fundingStatement.trim());
      }

      if (form.dataAvailability.trim()) {
        formData.append("dataAvailability", form.dataAvailability.trim());
      }

      if (form.noAi) {
        formData.append("aiDisclosure", "No AI tools used in writing");
      } else if (form.aiDisclosure.trim()) {
        formData.append("aiDisclosure", form.aiDisclosure.trim());
      }

      formData.append("policyAgreed", form.policyAgreed ? "1" : "0");
      formData.append("manuscript", file);

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed.");
        return;
      }

      const data = await res.json();
      setSuccess(data.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0a1628",
    borderBottom: "2px solid #e2e0dc",
    paddingBottom: "0.5rem",
    marginBottom: "1.25rem",
    marginTop: "2rem",
  };

  const checkboxRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Submit</div>
          <h1>Submit your manuscript</h1>
          <p>
            Fill in the details below and upload your manuscript (Word or LaTeX, up to 50 MB).
          </p>
        </div>
      </section>

      <section className="page-section">
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row gtr-uniform">

            {/* ── Section 1: Manuscript ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>1. Manuscript</div>
            </div>

            <div className="col-12">
              <label htmlFor="articleType">Article Type *</label>
              <select
                id="articleType"
                value={form.articleType}
                onChange={(e) => setForm({ ...form, articleType: e.target.value })}
              >
                {ARTICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                placeholder="Manuscript title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="abstract">Abstract *</label>
              <textarea
                id="abstract"
                rows={6}
                placeholder="Provide a structured abstract (200-300 words)"
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label htmlFor="keywords">Keywords * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(comma-separated, 5-8 keywords)</span></label>
              <input
                type="text"
                id="keywords"
                placeholder="e.g. machine learning, NLP, immigration"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                required
              />
            </div>

            {/* ── Section 2: Authors ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>2. Authors</div>
            </div>

            <div className="col-6">
              <label htmlFor="authorAffiliation">Your affiliation <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(institution)</span></label>
              <input
                type="text"
                id="authorAffiliation"
                placeholder="e.g. MIT, Stanford University"
                value={form.authorAffiliation}
                onChange={(e) => setForm({ ...form, authorAffiliation: e.target.value })}
              />
            </div>

            <div className="col-6">
              <label htmlFor="authorOrcid">Your ORCID iD <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
              <input
                type="text"
                id="authorOrcid"
                placeholder="e.g. 0000-0002-1825-0097"
                value={form.authorOrcid}
                onChange={(e) => setForm({ ...form, authorOrcid: e.target.value })}
              />
            </div>

            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Co-authors</label>
              {coAuthors.map((ca, i) => (
                <div key={i} style={{
                  background: "#f8f6f3",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "0.75rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Co-author {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeCoAuthor(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Name *</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={ca.name}
                        onChange={(e) => updateCoAuthor(i, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Email *</label>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={ca.email}
                        onChange={(e) => updateCoAuthor(i, "email", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>Affiliation</label>
                      <input
                        type="text"
                        placeholder="Institution"
                        value={ca.affiliation}
                        onChange={(e) => updateCoAuthor(i, "affiliation", e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem" }}>ORCID</label>
                      <input
                        type="text"
                        placeholder="0000-0000-0000-0000"
                        value={ca.orcid}
                        onChange={(e) => updateCoAuthor(i, "orcid", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addCoAuthor}
                className="button-secondary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}
              >
                + Add co-author
              </button>
            </div>

            {/* ── Section 3: Upload ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>3. Upload</div>
            </div>

            <div className="col-12">
              <label htmlFor="manuscript">Manuscript file * <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>Word (.docx) or LaTeX (.tex/.zip), max 50 MB</span></label>
              <input
                type="file"
                id="manuscript"
                accept=".docx,.doc,.tex,.zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* ── Section 4: Declarations ── */}
            <div className="col-12">
              <div style={sectionHeadingStyle}>4. Declarations</div>
            </div>

            {/* Ethics / IRB */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Ethics / IRB approval</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noEthics"
                  checked={form.noEthics}
                  onChange={(e) => setForm({ ...form, noEthics: e.target.checked, ethicsApproval: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noEthics" style={{ margin: 0, fontWeight: 400 }}>
                  No human or animal subjects involved
                </label>
              </div>
              {!form.noEthics && (
                <textarea
                  rows={2}
                  placeholder="Provide IRB/ethics committee name and approval number"
                  value={form.ethicsApproval}
                  onChange={(e) => setForm({ ...form, ethicsApproval: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Funding */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Funding</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noFunding"
                  checked={form.noFunding}
                  onChange={(e) => setForm({ ...form, noFunding: e.target.checked, fundingStatement: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noFunding" style={{ margin: 0, fontWeight: 400 }}>
                  No external funding received
                </label>
              </div>
              {!form.noFunding && (
                <textarea
                  rows={2}
                  placeholder="Funder name, grant number, and funder role"
                  value={form.fundingStatement}
                  onChange={(e) => setForm({ ...form, fundingStatement: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Data availability */}
            <div className="col-12">
              <label htmlFor="dataAvailability">Data availability <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(where is data/code accessible?)</span></label>
              <textarea
                id="dataAvailability"
                rows={2}
                placeholder="e.g. Data deposited in Zenodo (DOI: ...) or &quot;No new data generated&quot;"
                value={form.dataAvailability}
                onChange={(e) => setForm({ ...form, dataAvailability: e.target.value })}
              />
            </div>

            {/* AI disclosure */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>AI tools disclosure</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noAi"
                  checked={form.noAi}
                  onChange={(e) => setForm({ ...form, noAi: e.target.checked, aiDisclosure: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noAi" style={{ margin: 0, fontWeight: 400 }}>
                  No AI tools were used in writing this manuscript
                </label>
              </div>
              {!form.noAi && (
                <textarea
                  rows={2}
                  placeholder="Describe which AI tools were used and how (e.g. ChatGPT for grammar editing)"
                  value={form.aiDisclosure}
                  onChange={(e) => setForm({ ...form, aiDisclosure: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Conflict of interest */}
            <div className="col-12">
              <label style={{ marginBottom: "0.5rem", display: "block" }}>Conflict of interest</label>
              <div style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  id="noConflict"
                  checked={form.noConflict}
                  onChange={(e) => setForm({ ...form, noConflict: e.target.checked, conflictOfInterest: "" })}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="noConflict" style={{ margin: 0, fontWeight: 400 }}>
                  I declare that I have no competing interests
                </label>
              </div>
              {!form.noConflict && (
                <textarea
                  id="conflictOfInterest"
                  rows={3}
                  placeholder="If yes, describe your competing interests"
                  value={form.conflictOfInterest}
                  onChange={(e) => setForm({ ...form, conflictOfInterest: e.target.value })}
                  style={{ marginTop: "0.5rem" }}
                />
              )}
            </div>

            {/* Cover letter */}
            <div className="col-12">
              <label htmlFor="coverLetter">Cover letter <span style={{ fontWeight: 400, color: "#8a7e6e", fontSize: "0.85rem" }}>(optional)</span></label>
              <textarea
                id="coverLetter"
                rows={4}
                placeholder="Briefly describe why your manuscript is suitable for AIR"
                value={form.coverLetter}
                onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              />
            </div>

            {/* Policy agreement */}
            <div className="col-12">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="policyAgreed"
                  checked={form.policyAgreed}
                  onChange={(e) => setForm({ ...form, policyAgreed: e.target.checked })}
                  style={{ width: "auto", margin: 0, marginTop: "0.25rem" }}
                />
                <label htmlFor="policyAgreed" style={{ margin: 0, fontWeight: 400 }}>
                  I confirm this manuscript is original work, not published or under review elsewhere, and I agree to AIR&apos;s publication policies *
                </label>
              </div>
            </div>

            <div className="col-12">
              <ul className="actions">
                <li>
                  <button type="submit" className="button primary" disabled={submitting || !form.policyAgreed}>
                    {submitting ? "Submitting..." : "Submit manuscript"}
                  </button>
                </li>
                <li>
                  <Link href="/for-authors" className="button-secondary">
                    Author guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
