"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/** Strip any residual markdown syntax for clean card excerpts. */
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

export default function ExploreClient({ articles }: { articles: SerializedArticle[] }) {
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
      result = result.filter((a) =>
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
      <header className="major">
        <h2>Explore articles</h2>
      </header>
      <section className="air-index">
        <div className="air-index__card">
          <div className="air-index__kicker">Continuous publishing</div>
          <h3>American Impact Review - Published Articles</h3>
          <div className="air-index__rows">
            <div>
              <span>Model</span>
              <strong>Rolling publication</strong>
            </div>
            <div>
              <span>Articles</span>
              <strong>{articles.length} published</strong>
            </div>
            <div>
              <span>Disciplines</span>
              <strong>{categories.length} fields</strong>
            </div>
            <div>
              <span>Access</span>
              <strong>Open (CC BY 4.0)</strong>
            </div>
          </div>
        </div>
        <div className="air-index__card">
          <div className="air-index__kicker">Indexing & policy</div>
          <h3>Google Scholar-ready metadata</h3>
          <ul className="air-index__list">
            <li>ScholarlyArticle schema + citation meta tags for every article</li>
            <li>Articles published immediately after acceptance</li>
            <li>Ethics, funding, data availability & competing interests</li>
            <li>Permanent repository archiving</li>
          </ul>
        </div>
      </section>
      <div className="glass" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search by title, @author, or #category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1, minWidth: "220px" }}
          />
          <select
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{ minWidth: "220px" }}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="posts">
          <article>
            <h3>No articles found</h3>
            <p>Try adjusting your search or category filter.</p>
          </article>
        </div>
      ) : (
        <div className="posts">
          {filtered.map((article) => {
            const excerpt = cleanExcerpt(article.content, 220);
            const dateStr = article.createdAt
              ? new Date(article.createdAt).toLocaleDateString()
              : "";
            return (
              <article key={article.id} className="air-article-card">
                <div className="air-article-card__category">
                  {article.category || "Article"}
                </div>
                <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                <p className="air-article-card__authors">
                  {(article.authors && article.authors.length > 0)
                    ? article.authors.join(", ")
                    : article.authorUsername}
                </p>
                <p className="air-article-card__excerpt">{excerpt}</p>
                <div className="air-article-card__footer">
                  <span className="air-article-card__date">{dateStr}</span>
                  <Link href={`/article/${article.slug}`} className="air-article-card__link">
                    Read article
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
