"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
          <div className="air-index__kicker">Issue details</div>
          <h3>American Impact Review — Issue 01</h3>
          <div className="air-index__rows">
            <div>
              <span>Volume</span>
              <strong>Vol. 1, No. 1</strong>
            </div>
            <div>
              <span>Season</span>
              <strong>Spring 2026</strong>
            </div>
            <div>
              <span>Pages</span>
              <strong>108</strong>
            </div>
            <div>
              <span>Fields</span>
              <strong>6 disciplines</strong>
            </div>
          </div>
        </div>
        <div className="air-index__card">
          <div className="air-index__kicker">Indexing & policy</div>
          <h3>Google Scholar-ready metadata</h3>
          <ul className="air-index__list">
            <li>ScholarlyArticle schema + DOI for every article</li>
            <li>Open access licensing (CC BY 4.0)</li>
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
            const excerpt =
              article.content.length > 220
                ? `${article.content.slice(0, 220)}...`
                : article.content;
            const dateStr = article.createdAt
              ? new Date(article.createdAt).toLocaleDateString()
              : "";
            return (
              <article key={article.id}>
                {article.imageUrl ? (
                  <Link href={`/article/${article.slug}`} className="image">
                    <img src={article.imageUrl} alt={article.title} />
                  </Link>
                ) : null}
                <h3>{article.title}</h3>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {article.category || "Article"} · {dateStr}
                </p>
                <p>{excerpt}</p>
                <p style={{ fontSize: "0.9rem" }}>
                  By {(article.authors && article.authors[0]) || article.authorUsername}
                </p>
                <ul className="actions">
                  <li>
                    <Link href={`/article/${article.slug}`} className="button">
                      Read article
                    </Link>
                  </li>
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
