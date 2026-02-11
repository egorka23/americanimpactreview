"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const TAXONOMY: Record<string, string[]> = {
  "Computer Science": ["Systems & Infrastructure", "Cybersecurity", "Software Engineering", "Networking"],
  "Health & Biotech": ["Genomics", "Immunology", "Public Health", "Biomedical Devices"],
  "AI & Data": ["Machine Learning", "NLP", "Computer Vision", "Data Ethics"],
  "Marketing": ["Digital Marketing", "MarTech", "Consumer Behavior", "Advertising"],
  "Business": ["Management", "Strategy", "Entrepreneurship", "Finance"],
  "Sports Science": ["Biomechanics", "Physiology", "Nutrition", "Performance Analysis"],
  "Sports Medicine": ["Diagnostics", "Rehabilitation", "Injury Prevention", "Exercise Physiology"],
  "Energy & Climate": ["Solar & Wind", "Grid Systems", "Climate Policy", "Sustainability"],
  "Human Performance": ["Cognitive Science", "Ergonomics", "Training Methods", "Wearable Tech"],
  "Social Sciences": ["Education", "Economics", "Policy Analysis", "Urban Studies"],
  "Engineering": ["Robotics", "Materials Science", "Aerospace", "Civil Engineering"],
};

const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Marketing": "#ea580c",
  "Business": "#ca8a04",
  "Sports Science": "#dc2626",
  "Sports Medicine": "#e11d48",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
  "Social Sciences": "#6366f1",
  "Engineering": "#475569",
};

function cleanExcerpt(raw: string, maxLen = 180): string {
  return raw
    .replace(/^#{1,6}\s+/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1").replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1").replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1").replace(/^---+$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ").replace(/\n/g, " ").replace(/\s{2,}/g, " ")
    .trim().slice(0, maxLen) + (raw.length > maxLen ? "..." : "");
}

type Article = {
  id: string; title: string; content: string; slug: string;
  authorUsername: string; authors?: string[]; category: string;
  imageUrl: string; createdAt: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function getAuthors(a: Article) {
  return (a.authors?.length ? a.authors : [a.authorUsername]).join(", ");
}

export default function ExploreClient({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const allCats = Object.keys(TAXONOMY);

  const filtered = useMemo(() => {
    let r = articles;
    const q = search.trim().toLowerCase();
    if (q) r = r.filter((a) => a.title.toLowerCase().includes(q) || a.authorUsername.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    if (cat) r = r.filter((a) => a.category === cat);
    return r;
  }, [articles, search, cat]);

  const clear = () => { setCat(""); setSub(""); setSearch(""); };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    articles.forEach((a) => { c[a.category] = (c[a.category] || 0) + 1; });
    return c;
  }, [articles]);

  const appliedFilters = (cat || sub) ? (
    <div className="m8-lan-applied">
      <span className="m8-lan-applied-label">Active filters:</span>
      {cat && <span className="m8-lan-tag" onClick={() => { setCat(""); setSub(""); }}>{cat} &times;</span>}
      {sub && <span className="m8-lan-tag m8-lan-tag--sub" onClick={() => setSub("")}>{sub} &times;</span>}
      <button className="m8-lan-clear" onClick={clear}>Clear all</button>
    </div>
  ) : null;

  const articleGrid = filtered.length === 0 ? (
    <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0", fontFamily: "Inter, sans-serif" }}>No articles match.</p>
  ) : (
    <div className="v8-magazine">
      {filtered.slice(0, 1).map((a) => {
        const c = CATEGORY_COLORS[a.category] || "#64748b";
        return (
          <Link key={a.id} href={`/article/${a.slug}`} className="v8-hero">
            <div className="v8-hero-overlay" style={{ background: `linear-gradient(135deg, ${c}cc, ${c}40)` }}>
              <span className="v8-hero-cat">{a.category}</span>
              <h2 className="v8-hero-title">{a.title}</h2>
              <p className="v8-hero-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
              <p className="v8-hero-excerpt">{cleanExcerpt(a.content, 250)}</p>
            </div>
          </Link>
        );
      })}
      <div className="v8-grid">
        {filtered.slice(1).map((a) => {
          const c = CATEGORY_COLORS[a.category] || "#64748b";
          return (
            <Link key={a.id} href={`/article/${a.slug}`} className="v8-card">
              <span className="v8-badge" style={{ color: c }}>{a.category}</span>
              <h3 className="v8-card-title">{a.title}</h3>
              <p className="v8-card-meta">{getAuthors(a)} &middot; {fmtDate(a.createdAt)}</p>
              <p className="v8-card-excerpt">{cleanExcerpt(a.content, 100)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="sb">
      <div className="v8-layout">
        <div className="m8-lancet xlayout">
          <aside className="m8-lan-side">
            <div className="m8-lan-search-wrap">
              <svg className="m8-lan-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="v8-search m8-lan-search" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button className="m8-lan-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            <div className="m8-lan-title">Filter by Discipline</div>
            {allCats.map((c) => {
              const color = CATEGORY_COLORS[c] || "#64748b";
              const subs = TAXONOMY[c] || [];
              const isExp = expanded[c] || cat === c;
              const isActive = cat === c && !sub;
              return (
                <div key={c} className="m8-lan-group">
                  <button className={`m8-lan-cat ${isActive ? "m8-lan-cat--on" : ""}`}
                    style={{ "--cat-clr": color } as React.CSSProperties}
                    onClick={() => {
                      if (cat === c && !sub) { setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                      else { setCat(c); setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                    }}>
                    <span className="m8-lan-cat-name">{c}</span>
                    <span className="m8-lan-cat-n">{counts[c] || 0}</span>
                    <span className={`m8-lan-chev ${isExp ? "m8-lan-chev--open" : ""}`}>&#9662;</span>
                  </button>
                  {isExp && subs.length > 0 && (
                    <div className="m8-lan-subs">
                      {subs.map((s) => (
                        <button key={s} className={`m8-lan-sub ${sub === s ? "m8-lan-sub--on" : ""}`}
                          onClick={() => { setCat(c); setSub(sub === s ? "" : s); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>
          <div className="m8-lan-main">
            {appliedFilters}
            {articleGrid}
          </div>
        </div>
      </div>
    </div>
  );
}
