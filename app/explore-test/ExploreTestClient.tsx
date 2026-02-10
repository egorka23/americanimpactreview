"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Sports Science": "#dc2626",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
};

function cleanExcerpt(raw: string, maxLen: number = 220): string {
  const plain = raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}...` : plain;
}

type SerializedArticle = {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorUsername: string;
  authors?: string[];
  category: string;
  imageUrl: string;
  createdAt: string | null;
};

const VARIANTS = [
  "Editorial Cards",
  "Magazine Grid",
  "Academic List",
  "Minimal Tiles",
  "Nature Style",
] as const;

type Variant = (typeof VARIANTS)[number];

export default function ExploreTestClient({
  articles,
}: {
  articles: SerializedArticle[];
}) {
  const [variant, setVariant] = useState<Variant>("Editorial Cards");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))),
    [articles]
  );

  const filtered = useMemo(() => {
    let result = articles;
    const trimmed = search.trim().toLowerCase();
    if (trimmed.startsWith("@")) {
      const author = trimmed.slice(1);
      result = result.filter(
        (a) =>
          a.authorUsername.toLowerCase().includes(author) ||
          (a.authors || []).some((n) => n.toLowerCase().includes(author))
      );
    } else if (trimmed.startsWith("#")) {
      const cat = trimmed.slice(1);
      result = result.filter((a) => a.category.toLowerCase().includes(cat));
    } else if (trimmed) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(trimmed) ||
          a.authorUsername.toLowerCase().includes(trimmed) ||
          a.category.toLowerCase().includes(trimmed)
      );
    }
    if (category) {
      result = result.filter((a) => a.category === category);
    }
    return result;
  }, [articles, search, category]);

  return (
    <section>
      {/* ── Tab Bar ── */}
      <div className="ext-tabs">
        {VARIANTS.map((v) => (
          <button
            key={v}
            className={`ext-tab ${variant === v ? "ext-tab--active" : ""}`}
            onClick={() => setVariant(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="major" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "2rem" }}>Explore articles</h2>
      </header>

      {/* ── Index cards ── */}
      <section className="air-index">
        <div className="air-index__card">
          <div className="air-index__kicker">Continuous publishing</div>
          <h3>American Impact Review - Published Articles</h3>
          <div className="air-index__rows">
            <div><span>Model</span><strong>Rolling publication</strong></div>
            <div><span>Articles</span><strong>{articles.length} published</strong></div>
            <div><span>Disciplines</span><strong>{categories.length} fields</strong></div>
            <div><span>Access</span><strong>Open (CC BY 4.0)</strong></div>
          </div>
        </div>
        <div className="air-index__card">
          <div className="air-index__kicker">Indexing &amp; policy</div>
          <h3>Google Scholar-ready metadata</h3>
          <ul className="air-index__list">
            <li>ScholarlyArticle schema + citation meta tags for every article</li>
            <li>Articles published immediately after acceptance</li>
            <li>Ethics, funding, data availability &amp; competing interests</li>
            <li>Permanent repository archiving</li>
          </ul>
        </div>
      </section>

      {/* ── Search ── */}
      <div className="glass" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search by title, @author, or #category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "220px" }}
          />
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ minWidth: "220px" }}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Articles ── */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0" }}>
          No articles found. Try adjusting your search.
        </p>
      ) : (
        <div className={`ext-grid ext-grid--${variantClass(variant)}`}>
          {filtered.map((article) => {
            const excerpt = cleanExcerpt(article.content, 200);
            const dateStr = article.createdAt
              ? new Date(article.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "";
            const color = CATEGORY_COLORS[article.category] || "#64748b";

            switch (variant) {
              case "Editorial Cards":
                return (
                  <Link key={article.id} href={`/article/${article.slug}`} className="ext-editorial">
                    <div className="ext-editorial__top">
                      <span className="ext-editorial__cat" style={{ background: `${color}12`, color, borderColor: `${color}30` }}>
                        {article.category}
                      </span>
                      <span className="ext-editorial__date">{dateStr}</span>
                    </div>
                    <h3 className="ext-editorial__title">{article.title}</h3>
                    <p className="ext-editorial__authors">
                      {(article.authors?.length ? article.authors : [article.authorUsername]).join(", ")}
                    </p>
                    <p className="ext-editorial__excerpt">{excerpt}</p>
                    <span className="ext-editorial__read">Read article &rarr;</span>
                  </Link>
                );

              case "Magazine Grid":
                return (
                  <Link key={article.id} href={`/article/${article.slug}`} className="ext-magazine">
                    <div className="ext-magazine__accent" style={{ background: color }} />
                    <div className="ext-magazine__body">
                      <span className="ext-magazine__cat">{article.category}</span>
                      <h3 className="ext-magazine__title">{article.title}</h3>
                      <p className="ext-magazine__authors">
                        {(article.authors?.length ? article.authors : [article.authorUsername]).join(", ")}
                      </p>
                      <p className="ext-magazine__excerpt">{excerpt}</p>
                      <div className="ext-magazine__footer">
                        <span>{dateStr}</span>
                        <span className="ext-magazine__arrow">&rarr;</span>
                      </div>
                    </div>
                  </Link>
                );

              case "Academic List":
                return (
                  <article key={article.id} className="ext-academic">
                    <div className="ext-academic__left">
                      <span className="ext-academic__cat" style={{ color }}>{article.category}</span>
                      <span className="ext-academic__date">{dateStr}</span>
                    </div>
                    <div className="ext-academic__right">
                      <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                      <p className="ext-academic__authors">
                        {(article.authors?.length ? article.authors : [article.authorUsername]).join(", ")}
                      </p>
                      <p className="ext-academic__excerpt">{excerpt}</p>
                    </div>
                  </article>
                );

              case "Minimal Tiles":
                return (
                  <Link key={article.id} href={`/article/${article.slug}`} className="ext-tile">
                    <div className="ext-tile__bar" style={{ background: color }} />
                    <span className="ext-tile__cat">{article.category}</span>
                    <h3 className="ext-tile__title">{article.title}</h3>
                    <p className="ext-tile__authors">
                      {(article.authors?.length ? article.authors : [article.authorUsername]).join(", ")}
                    </p>
                    <div className="ext-tile__footer">
                      <span>{dateStr}</span>
                    </div>
                  </Link>
                );

              case "Nature Style":
                return (
                  <article key={article.id} className="ext-nature">
                    <div className="ext-nature__marker" style={{ background: color }} />
                    <div className="ext-nature__content">
                      <div className="ext-nature__meta">
                        <span className="ext-nature__cat">{article.category}</span>
                        <span className="ext-nature__sep">|</span>
                        <span className="ext-nature__date">{dateStr}</span>
                      </div>
                      <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                      <p className="ext-nature__authors">
                        {(article.authors?.length ? article.authors : [article.authorUsername]).join(", ")}
                      </p>
                      <p className="ext-nature__excerpt">{excerpt}</p>
                      <Link href={`/article/${article.slug}`} className="ext-nature__link">
                        Read full article
                      </Link>
                    </div>
                  </article>
                );
            }
          })}
        </div>
      )}
    </section>
  );
}

function variantClass(v: Variant): string {
  switch (v) {
    case "Editorial Cards": return "editorial";
    case "Magazine Grid": return "magazine";
    case "Academic List": return "academic";
    case "Minimal Tiles": return "tiles";
    case "Nature Style": return "nature";
  }
}
