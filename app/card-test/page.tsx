import { getAllArticles } from "@/lib/articles";

const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Sports Science": "#dc2626",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
};

export default function CardTestPage() {
  const articles = getAllArticles()
    .sort((a, b) => {
      const da = a.publishedAt?.getTime() ?? 0;
      const db = b.publishedAt?.getTime() ?? 0;
      return db - da;
    })
    .slice(0, 3);

  const data = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    authors: a.authors ?? [],
    affiliations: a.affiliations ?? [],
    category: a.category,
    abstract: a.abstract || "",
    keywords: a.keywords ?? [],
    publishedAt: a.publishedAt,
    receivedAt: a.receivedAt,
    acceptedAt: a.acceptedAt,
    id: a.id,
  }));

  function fmtDate(d: Date | null | undefined) {
    if (!d) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function abstractExcerpt(text: string, max: number) {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
  }

  const catColor = (cat: string) => CATEGORY_COLORS[cat] || "#64748b";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "2rem", marginBottom: "0.5rem", color: "#1B2A4A" }}>
        Article Card Variants
      </h1>
      <p style={{ color: "#64748b", marginBottom: "3rem", fontSize: "0.95rem" }}>
        5 design options for the homepage &ldquo;Latest Articles&rdquo; section
      </p>

      {/* ═══════ VARIANT 1: Minimal Academic ═══════ */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 className="card-test-variant-label">Variant 1 - Minimal Academic (PLOS / Nature style)</h2>
        <div className="ct-grid-3">
          {data.map((a) => (
            <a key={`v1-${a.slug}`} href={`/article/${a.slug}`} className="ct1-card">
              <div className="ct1-top">
                <span className="ct1-cat" style={{ color: catColor(a.category) }}>{a.category}</span>
                <span className="ct1-date">{fmtDate(a.publishedAt)}</span>
              </div>
              <h3 className="ct1-title">{a.title}</h3>
              <p className="ct1-authors">{a.authors.join(", ")}</p>
              <p className="ct1-abstract">{abstractExcerpt(a.abstract, 180)}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ VARIANT 2: Accent Border ═══════ */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 className="card-test-variant-label">Variant 2 - Accent Border (color-coded by field)</h2>
        <div className="ct-grid-3">
          {data.map((a) => (
            <a key={`v2-${a.slug}`} href={`/article/${a.slug}`} className="ct2-card" style={{ borderLeftColor: catColor(a.category) }}>
              <div className="ct2-meta">
                <span className="ct2-cat" style={{ background: catColor(a.category) }}>{a.category}</span>
                <span className="ct2-date">{fmtDate(a.publishedAt)}</span>
              </div>
              <h3 className="ct2-title">{a.title}</h3>
              <p className="ct2-authors">{a.authors.join(", ")}</p>
              <p className="ct2-abstract">{abstractExcerpt(a.abstract, 160)}</p>
              <div className="ct2-footer">
                <span className="ct2-id">{a.id}</span>
                <span className="ct2-read">Read article &rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ VARIANT 3: Journal TOC Style ═══════ */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 className="card-test-variant-label">Variant 3 - Journal TOC (table-of-contents style)</h2>
        <div className="ct3-list">
          {data.map((a, i) => (
            <a key={`v3-${a.slug}`} href={`/article/${a.slug}`} className="ct3-row">
              <div className="ct3-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="ct3-content">
                <div className="ct3-meta-line">
                  <span className="ct3-cat" style={{ color: catColor(a.category) }}>{a.category}</span>
                  <span className="ct3-sep">&bull;</span>
                  <span className="ct3-date">{fmtDate(a.publishedAt)}</span>
                  <span className="ct3-sep">&bull;</span>
                  <span className="ct3-id">{a.id}</span>
                </div>
                <h3 className="ct3-title">{a.title}</h3>
                <p className="ct3-authors">{a.authors.join(", ")}</p>
                <p className="ct3-abstract">{abstractExcerpt(a.abstract, 200)}</p>
                <div className="ct3-keywords">
                  {a.keywords.slice(0, 4).map((k) => (
                    <span key={k} className="ct3-kw">{k}</span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ VARIANT 4: Hero Card with Shadow ═══════ */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 className="card-test-variant-label">Variant 4 - Hero Cards (elevated, matches article page style)</h2>
        <div className="ct-grid-3">
          {data.map((a) => (
            <a key={`v4-${a.slug}`} href={`/article/${a.slug}`} className="ct4-card">
              <div className="ct4-header">
                <span className="ct4-cat" style={{ background: `${catColor(a.category)}15`, color: catColor(a.category), borderColor: `${catColor(a.category)}30` }}>
                  {a.category}
                </span>
              </div>
              <h3 className="ct4-title">{a.title}</h3>
              <p className="ct4-authors">{a.authors.join(", ")}</p>
              <p className="ct4-abstract">{abstractExcerpt(a.abstract, 200)}</p>
              <div className="ct4-footer">
                <div className="ct4-dates">
                  <span>Published {fmtDate(a.publishedAt)}</span>
                </div>
                <span className="ct4-read">Read &rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══════ VARIANT 5: Compact Horizontal ═══════ */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 className="card-test-variant-label">Variant 5 - Compact Horizontal (single-column journal index)</h2>
        <div className="ct5-list">
          {data.map((a) => (
            <a key={`v5-${a.slug}`} href={`/article/${a.slug}`} className="ct5-row">
              <div className="ct5-left">
                <span className="ct5-cat-dot" style={{ background: catColor(a.category) }} />
                <span className="ct5-cat">{a.category}</span>
              </div>
              <div className="ct5-center">
                <h3 className="ct5-title">{a.title}</h3>
                <p className="ct5-authors">{a.authors.join(", ")}</p>
                <p className="ct5-abstract">{abstractExcerpt(a.abstract, 150)}</p>
              </div>
              <div className="ct5-right">
                <span className="ct5-date">{fmtDate(a.publishedAt)}</span>
                <span className="ct5-id">{a.id}</span>
                <span className="ct5-arrow">&rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
