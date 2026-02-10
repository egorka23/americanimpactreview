"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listRecentArticles, searchArticles } from "@/lib/firestore";
import type { Article } from "@/lib/types";

function ExploreContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    listRecentArticles()
      .then((items) => {
        const titles = new Set<string>();
        const authors = new Set<string>();
        const categories = new Set<string>();
        items.forEach((article) => {
          if (article.title) titles.add(article.title);
          if (article.authorUsername) authors.add(`@${article.authorUsername}`);
          if (article.category) categories.add(`#${article.category}`);
        });
        setSuggestions([...titles, ...authors, ...categories].slice(0, 24));
      })
      .catch(() => setSuggestions([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = search.trim();
      const isAuthor = trimmed.startsWith("@");
      const categoryQuery =
        trimmed.startsWith("#")
          ? trimmed.slice(1)
          : trimmed.toLowerCase().startsWith("category:")
          ? trimmed.slice(9)
          : "";
      const authorQuery = isAuthor ? trimmed.slice(1) : "";
      const effectiveCategory = categoryQuery || category;
      setLoading(true);
      searchArticles({
        queryText: isAuthor || categoryQuery ? "" : trimmed,
        authorUsername: authorQuery,
        category: effectiveCategory
      }).then((data) => {
        setArticles(data);
        setLoading(false);
      }).catch(() => {
        setArticles([]);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, category]);

  const shuffled = useMemo(() => {
    const copy = [...articles];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [articles]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading articles...</p>;
  }

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
            list="explore-search-suggestions"
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1, minWidth: "220px" }}
          />
          <datalist id="explore-search-suggestions">
            {suggestions.map((item) => (
              <option value={item} key={item} />
            ))}
          </datalist>
          <select
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{ minWidth: "220px" }}
          >
            <option value="">All categories</option>
            {Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading articles...</p>
      ) : articles.length === 0 ? (
        <div className="posts">
          <article>
            <h3>No articles yet</h3>
            <p>Be the first to publish and share your expertise.</p>
            <ul className="actions">
              <li>
                <Link href="/write" className="button">
                  Write an article
                </Link>
              </li>
            </ul>
          </article>
        </div>
      ) : (
        <div className="posts">
          {shuffled.map((article) => {
            const excerpt =
              article.content.length > 220
                ? `${article.content.slice(0, 220)}...`
                : article.content;
            return (
            <article key={article.id}>
              {article.imageUrl ? (
                <Link href={`/article/${article.slug}`} className="image">
                  <img src={article.imageUrl} alt={article.title} />
                </Link>
              ) : null}
              <h3>{article.title}</h3>
              <p style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {article.category || "Article"} · {article.createdAt ? article.createdAt.toLocaleDateString() : ""}
              </p>
              <p>{excerpt}</p>
              <p style={{ fontSize: "0.9rem" }}>
                By{" "}
                <Link href={`/profile/${article.authorUsername}`}>
                  {article.authorUsername}
                </Link>
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

export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Loading articles...</p>}>
      <ExploreContent />
    </Suspense>
  );
}
