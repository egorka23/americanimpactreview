"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import StatusBadge from "../../components/StatusBadge";
import { CATEGORIES, TAXONOMY } from "@/lib/taxonomy";

const ARTICLE_TYPES = [
  "Original Research",
  "Research Article",
  "Review Article",
  "Theoretical Article",
  "Policy Analysis",
  "Case Study",
  "Short Communication",
  "Commentary / Opinion",
  "Meta-Analysis",
];

type CoAuthor = { name: string; email: string; affiliation: string; orcid?: string };

type SubmissionData = {
  id: string;
  title: string;
  abstract: string;
  category: string;
  subject: string | null;
  articleType: string | null;
  keywords: string | null;
  manuscriptUrl: string | null;
  manuscriptName: string | null;
  coAuthors: string | null;
  authorAffiliation: string | null;
  authorOrcid: string | null;
  coverLetter: string | null;
  conflictOfInterest: string | null;
  fundingStatement: string | null;
  ethicsApproval: string | null;
  dataAvailability: string | null;
  aiDisclosure: string | null;
  status: string;
  pipelineStatus: string | null;
  createdAt: string | null;
  userName: string | null;
  userEmail: string | null;
};

function parseCoAuthors(raw: string | null): CoAuthor[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map((a: Record<string, string>) => ({
      name: a.name || "",
      email: a.email || "",
      affiliation: a.affiliation || "",
      orcid: a.orcid || "",
    }));
  } catch { /* ignore */ }
  return [];
}

function serializeCoAuthors(list: CoAuthor[]): string | null {
  const filtered = list.filter(a => a.name.trim() || a.email.trim());
  if (!filtered.length) return null;
  return JSON.stringify(filtered.map(a => {
    const obj: Record<string, string> = { name: a.name.trim(), email: a.email.trim(), affiliation: a.affiliation.trim() };
    if (a.orcid?.trim()) obj.orcid = a.orcid.trim();
    return obj;
  }));
}

// Inline styles to avoid conflicts with global CSS
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    position: "relative" as const,
    zIndex: 10,
    fontFamily: "var(--font-inter), -apple-system, sans-serif",
    color: "#111827",
  },
  topBar: {
    position: "sticky" as const,
    top: 0,
    zIndex: 20,
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#2563eb",
    fontSize: "0.875rem",
    fontWeight: 500,
    background: "none",
    border: "none",
    boxShadow: "none",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  saveBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    boxShadow: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  saveBtnDisabled: {
    background: "#93c5fd",
    color: "#fff",
    border: "none",
    boxShadow: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "not-allowed",
  },
  content: {
    maxWidth: "56rem",
    margin: "0 auto",
    padding: "32px 24px",
  },
  section: {
    paddingBottom: "24px",
    marginBottom: "24px",
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box" as const,
    boxShadow: "none",
    background: "#fff",
    color: "#111827",
  },
  textarea: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
    boxShadow: "none",
    background: "#fff",
    color: "#111827",
  },
  select: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box" as const,
    boxShadow: "none",
    background: "#fff",
    color: "#111827",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  coAuthorCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
  },
  coAuthorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  removeBtn: {
    background: "none",
    border: "none",
    boxShadow: "none",
    color: "#ef4444",
    fontSize: "0.8rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  addBtn: {
    background: "none",
    border: "1px dashed #d1d5db",
    boxShadow: "none",
    color: "#2563eb",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: "8px",
    width: "100%",
    textAlign: "center" as const,
  },
  error: {
    marginBottom: "24px",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#b91c1c",
  },
  cancelBtn: {
    background: "none",
    border: "none",
    boxShadow: "none",
    color: "#2563eb",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 16px",
  },
};

export default function SubmissionEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [original, setOriginal] = useState<SubmissionData | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [articleType, setArticleType] = useState("");
  const [keywordsList, setKeywordsList] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [coAuthorsList, setCoAuthorsList] = useState<CoAuthor[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorAffiliation, setAuthorAffiliation] = useState("");
  const [authorOrcid, setAuthorOrcid] = useState("");

  // Load submission
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/local-admin/submissions/${id}`);
        if (res.status === 401) {
          router.replace("/manage");
          return;
        }
        if (!res.ok) throw new Error("Failed to load submission");
        const data: SubmissionData = await res.json();
        setOriginal(data);
        setTitle(data.title || "");
        setAbstract(data.abstract || "");
        setCategory(data.category || "");
        setSubject(data.subject || "");
        setArticleType(data.articleType || "");
        // keywords may be JSON array or comma-separated string
        if (data.keywords) {
          try {
            const arr = JSON.parse(data.keywords);
            setKeywordsList(Array.isArray(arr) ? arr : data.keywords.split(",").map((s: string) => s.trim()).filter(Boolean));
          } catch {
            setKeywordsList(data.keywords.split(",").map((s: string) => s.trim()).filter(Boolean));
          }
        }
        // manuscriptUrl/Name loaded but not editable on this page
        setCoAuthorsList(parseCoAuthors(data.coAuthors));
        setAuthorName(data.userName || "");
        setAuthorEmail(data.userEmail || "");
        setAuthorAffiliation(data.authorAffiliation || "");
        setAuthorOrcid(data.authorOrcid || "");
        // declarations not shown on edit page
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const subjects = TAXONOMY[category] || [];

  const updateCoAuthor = (idx: number, field: keyof CoAuthor, value: string) => {
    setCoAuthorsList(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addCoAuthor = () => {
    setCoAuthorsList(prev => [...prev, { name: "", email: "", affiliation: "", orcid: "" }]);
  };

  const removeCoAuthor = (idx: number) => {
    setCoAuthorsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim()) return setError("Title is required");
    if (!abstract.trim()) return setError("Abstract is required");
    if (!category.trim()) return setError("Category is required");
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/local-admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editFields: {
            title: title.trim(),
            abstract: abstract.trim(),
            category: category.trim(),
            subject: subject.trim() || null,
            articleType: articleType.trim() || null,
            keywords: keywordsList.length ? keywordsList.join(", ") : null,
            coAuthors: serializeCoAuthors(coAuthorsList),
            authorName: authorName.trim() || null,
            authorAffiliation: authorAffiliation.trim() || null,
            authorOrcid: authorOrcid.trim() || null,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      router.push("/manage");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div data-admin-panel style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading submission...</p>
      </div>
    );
  }

  if (!original) {
    return (
      <div data-admin-panel style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error || "Submission not found"}</p>
      </div>
    );
  }

  return (
    <div data-admin-panel style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button
          onClick={() => router.push("/manage")}
          style={styles.backBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saving ? styles.saveBtnDisabled : styles.saveBtn}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#1d4ed8"; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#2563eb"; }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={styles.content}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <StatusBadge status={original.pipelineStatus || original.status} visibility={(original as any).publishedVisibility === "private" ? "private" : undefined} />
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              {original.createdAt
                ? new Date(original.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : ""}
            </span>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
            Editing: {original.title}
          </h1>
          {original.userName && (
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              by {original.userName} {original.userEmail ? `(${original.userEmail})` : ""}
            </p>
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Section 1: Manuscript Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Manuscript Details</h2>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Title *</label>
            <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Abstract *</label>
            <textarea style={styles.textarea} rows={6} value={abstract} onChange={(e) => setAbstract(e.target.value)} />
          </div>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Article Type</label>
              <select style={styles.select} value={articleType} onChange={(e) => setArticleType(e.target.value)}>
                <option value="">— Select —</option>
                {ARTICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Keywords</label>
              <div style={{ ...styles.input, display: "flex", flexWrap: "wrap", gap: "6px", padding: "6px 8px", minHeight: "38px", alignItems: "center" }}>
                {keywordsList.map((kw, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", color: "#1e40af", borderRadius: "6px", padding: "2px 8px", fontSize: "0.8rem", fontWeight: 500 }}>
                    {kw}
                    <button
                      style={{ background: "none", border: "none", boxShadow: "none", color: "#93a3b8", cursor: "pointer", padding: "0 2px", fontSize: "1rem", lineHeight: 1 }}
                      onClick={() => setKeywordsList(prev => prev.filter((_, idx) => idx !== i))}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#93a3b8"; }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  style={{ border: "none", outline: "none", fontSize: "0.8rem", flex: 1, minWidth: "120px", padding: "2px 0", background: "transparent", boxShadow: "none" }}
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && keywordInput.trim()) {
                      e.preventDefault();
                      const kw = keywordInput.trim().replace(/,+$/, "");
                      if (kw && !keywordsList.includes(kw)) setKeywordsList(prev => [...prev, kw]);
                      setKeywordInput("");
                    }
                    if (e.key === "Backspace" && !keywordInput && keywordsList.length) {
                      setKeywordsList(prev => prev.slice(0, -1));
                    }
                  }}
                  placeholder={keywordsList.length ? "" : "Type and press Enter"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Classification</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Category *</label>
              <select
                style={styles.select}
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubject(""); }}
              >
                <option value="">— Select —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Subject</label>
              <select style={styles.select} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!subjects.length && !subject}>
                <option value="">— Select —</option>
                {subject && !subjects.includes(subject) && (
                  <option key={subject} value={subject}>{subject}</option>
                )}
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Authors */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Lead Author</h2>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input style={{ ...styles.input, background: "#f3f4f6", color: "#6b7280" }} value={authorEmail} readOnly />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Affiliation</label>
            <input style={styles.input} value={authorAffiliation} onChange={(e) => setAuthorAffiliation(e.target.value)} />
          </div>

          <h2 style={{ ...styles.sectionTitle, marginTop: "24px" }}>Co-Authors</h2>
          {coAuthorsList.map((author, idx) => (
            <div key={idx} style={styles.coAuthorCard}>
              <div style={styles.coAuthorHeader}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280" }}>Co-Author {idx + 1}</span>
                <button
                  style={styles.removeBtn}
                  onClick={() => removeCoAuthor(idx)}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  Remove
                </button>
              </div>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Name</label>
                  <input style={styles.input} value={author.name} onChange={(e) => updateCoAuthor(idx, "name", e.target.value)} />
                </div>
                <div>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} value={author.email} onChange={(e) => updateCoAuthor(idx, "email", e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: "8px" }}>
                <label style={styles.label}>Affiliation</label>
                <input style={styles.input} value={author.affiliation} onChange={(e) => updateCoAuthor(idx, "affiliation", e.target.value)} />
              </div>
            </div>
          ))}
          <button
            style={styles.addBtn}
            onClick={addCoAuthor}
            onMouseEnter={e => { e.currentTarget.style.background = "#f0f7ff"; e.currentTarget.style.borderColor = "#2563eb"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "#d1d5db"; }}
          >
            + Add Co-Author
          </button>
        </div>

        {/* Documents & Declarations removed — not needed for editorial editing */}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
          <button
            style={styles.cancelBtn}
            onClick={() => router.push("/manage")}
            onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={saving ? styles.saveBtnDisabled : styles.saveBtn}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#2563eb"; }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
