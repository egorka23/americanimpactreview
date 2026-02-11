"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

const TAXONOMY: Record<string, string[]> = {
  "Computer Science": ["Systems & Infrastructure", "Cybersecurity", "Software Engineering", "Networking"],
  "Health & Biotech": ["Genomics", "Immunology", "Public Health", "Biomedical Devices"],
  "AI & Data": ["Machine Learning", "NLP", "Computer Vision", "Data Ethics"],
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
  "Sports Science": "#dc2626",
  "Sports Medicine": "#e11d48",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
  "Social Sciences": "#6366f1",
  "Engineering": "#475569",
};

function CatIcon({ cat, color, size = 18 }: { cat: string; color: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (cat) {
    case "Computer Science":
      return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    case "Health & Biotech":
      return <svg {...p}><path d="M12 2a4 4 0 0 0-4 4c0 2.5 4 6 4 6s4-3.5 4-6a4 4 0 0 0-4-4z"/><path d="M12 18v4"/><path d="M8 22h8"/><circle cx="12" cy="6" r="1" fill={color} stroke="none"/></svg>;
    case "AI & Data":
      return <svg {...p}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h-1.5"/><path d="M12 2a2 2 0 0 0-2 2c0 .74.4 1.39 1 1.73V7h-1a7 7 0 0 0-7 7h1.5"/><circle cx="12" cy="17" r="5"/><circle cx="12" cy="17" r="1.5" fill={color} stroke="none"/></svg>;
    case "Sports Science":
      return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/><path d="M2 12h20"/></svg>;
    case "Energy & Climate":
      return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>;
    case "Human Performance":
      return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "Social Sciences":
      return <svg {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case "Engineering":
      return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

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

const VARIANTS = [
  "Notion", "Linear", "Vercel", "Apple", "Stripe",
  "Spotify", "Figma", "Magazine", "Timeline", "Command",
] as const;
type Variant = (typeof VARIANTS)[number];

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function getAuthors(a: Article) {
  return (a.authors?.length ? a.authors : [a.authorUsername]).join(", ");
}

export default function ExploreTestClient({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
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

  const sp: SP = { articles: filtered, allArticles: articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub, clear };

  return (
    <div className="sb">
      <V8 {...sp} />
    </div>
  );
}

type SP = {
  articles: Article[]; allArticles: Article[]; allCats: string[];
  counts: Record<string, number>;
  search: string; setSearch: (s: string) => void;
  cat: string; setCat: (c: string) => void;
  sub: string; setSub: (s: string) => void;
  clear: () => void;
};

function Empty({ dark }: { dark?: boolean }) {
  return <p style={{ textAlign: "center", color: dark ? "rgba(255,255,255,0.3)" : "#94a3b8", padding: "3rem 0", fontFamily: "Inter, sans-serif" }}>No articles match.</p>;
}

/* ═══════════════════════════════════════════════════════════════
   V1 — NOTION (Warm & Cozy)
   Sidebar + content, warm gray bg, staggered pill subcategories
   ═══════════════════════════════════════════════════════════════ */
function V1(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v1-layout">
      <aside className="v1-side">
        <input className="v1-search" placeholder="Search articles..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v1-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v1-group">
                <button className={`v1-cat ${isActive ? "v1-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <span className={`v1-cat-icon ${isActive ? "v1-cat-icon--active" : ""}`}>
                    <CatIcon cat={c} color={color} size={18} />
                  </span>
                  <span className="v1-cat-name">{c}</span>
                  <span className="v1-cat-count">{p.counts[c] || 0}</span>
                  {subs.length > 0 && (
                    <span className={`v1-chev ${isExpanded ? "v1-chev--open" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }}>
                      &#9662;
                    </span>
                  )}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v1-subs">
                    {subs.map((s, i) => (
                      <button key={s} className={`v1-pill ${p.sub === s ? "v1-pill--on" : ""}`}
                        style={{
                          "--btn-bg": p.sub === s ? color : `${color}10`,
                          "--btn-clr": p.sub === s ? "#fff" : color,
                          "--btn-bdc": p.sub === s ? color : `${color}25`,
                          animationDelay: `${i * 60}ms`,
                        } as React.CSSProperties}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v1-main">
        <div className="v1-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty /> : (
          <div className="v1-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v1-card" style={{ borderLeftColor: c }}>
                  <span className="v1-badge" style={{ background: `${c}12`, color: c }}>{a.category}</span>
                  <h3 className="v1-card-title">{a.title}</h3>
                  <p className="v1-card-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
                  <p className="v1-card-excerpt">{cleanExcerpt(a.content)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V2 — LINEAR (Dark Neon)
   Dark bg, neon glow dots, pulsing borders, animated gradient cards
   ═══════════════════════════════════════════════════════════════ */
function V2(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v2-layout">
      <aside className="v2-side">
        <input className="v2-search" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v2-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v2-group">
                <button className={`v2-cat ${isActive ? "v2-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <CatIcon cat={c} color={isActive ? color : "rgba(255,255,255,0.4)"} size={16} />
                  <span className="v2-cat-name">{c}</span>
                  <span className="v2-cat-count">{p.counts[c] || 0}</span>
                  {subs.length > 0 && (
                    <span className={`v2-chev ${isExpanded ? "v2-chev--open" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }}>
                      &#9662;
                    </span>
                  )}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v2-subs" style={{ "--neon": color } as React.CSSProperties}>
                    {subs.map((s) => (
                      <button key={s} className={`v2-sub ${p.sub === s ? "v2-sub--on" : ""}`}
                        style={p.sub === s ? { "--btn-clr": color } as React.CSSProperties : {}}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        <span className="v2-dot" style={{ background: color, boxShadow: `0 0 6px ${color}, 0 0 12px ${color}50` }} />
                        <span className="v2-sub-text">{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v2-main">
        <div className="v2-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty dark /> : (
          <div className="v2-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v2-card">
                  <div className="v2-card-inner">
                    <span className="v2-card-badge" style={{ color: c, borderColor: `${c}40` }}>{a.category}</span>
                    <h3 className="v2-card-title">{a.title}</h3>
                    <p className="v2-card-meta">{getAuthors(a)}</p>
                    <p className="v2-card-excerpt">{cleanExcerpt(a.content)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V3 — VERCEL (Monospace Terminal)
   File-tree ASCII connectors, monospace, terminal badges
   ═══════════════════════════════════════════════════════════════ */
function V3(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hoveredSub, setHoveredSub] = useState("");
  return (
    <div className="xlayout v3-layout">
      <aside className="v3-side">
        <input className="v3-search" placeholder="$ search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v3-nav">
          {p.allCats.map((c) => {
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v3-group">
                <button className={`v3-cat ${isActive ? "v3-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <span className="v3-folder">{isExpanded ? "▼" : "▶"}</span>
                  <span className="v3-cat-name">{c}</span>
                  <span className="v3-cat-count">[{p.counts[c] || 0}]</span>
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v3-subs">
                    {subs.map((s, i) => {
                      const isLast = i === subs.length - 1;
                      const isHov = hoveredSub === `${c}-${s}`;
                      return (
                        <button key={s}
                          className={`v3-sub ${p.sub === s ? "v3-sub--on" : ""}`}
                          onMouseEnter={() => setHoveredSub(`${c}-${s}`)}
                          onMouseLeave={() => setHoveredSub("")}
                          onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                          <span className="v3-connector">{isLast ? "└──" : "├──"}</span>
                          <span className="v3-sub-prefix">{isHov || p.sub === s ? "> " : "  "}</span>
                          <span className="v3-sub-name">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v3-main">
        <div className="v3-count">results: {p.articles.length}</div>
        {p.articles.length === 0 ? <Empty /> : (
          <div className="v3-results">
            {p.articles.map((a) => (
              <Link key={a.id} href={`/article/${a.slug}`} className="v3-row">
                <div className="v3-row-top">
                  <span className="v3-row-title">{a.title}</span>
                  <span className="v3-row-date">{fmtDate(a.createdAt)}</span>
                </div>
                <div className="v3-row-bottom">
                  <span className="v3-row-author">{getAuthors(a)}</span>
                  <span className="v3-row-cat">{a.category}</span>
                </div>
                <p className="v3-row-excerpt">{cleanExcerpt(a.content, 120)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V4 — APPLE (Glass Morphism)
   Frosted glass panels, iOS-style selection rings, depth shadows
   ═══════════════════════════════════════════════════════════════ */
function V4(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v4-layout">
      <aside className="v4-side">
        <input className="v4-search" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v4-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v4-group">
                <button className={`v4-cat ${isActive ? "v4-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <CatIcon cat={c} color={isActive ? "#007aff" : "#86868b"} size={16} />
                  <span className="v4-cat-name">{c}</span>
                  <span className="v4-cat-count">{p.counts[c] || 0}</span>
                  {subs.length > 0 && (
                    <span className={`v4-chev ${isExpanded ? "v4-chev--open" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }}>
                      &#9662;
                    </span>
                  )}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v4-subs">
                    {subs.map((s) => (
                      <button key={s}
                        className={`v4-pill ${p.sub === s ? "v4-pill--on" : ""}`}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v4-main">
        <div className="v4-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty /> : (
          <div className="v4-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v4-card">
                  <span className="v4-badge" style={{ background: `${c}12`, color: c }}>{a.category}</span>
                  <h3 className="v4-card-title">{a.title}</h3>
                  <p className="v4-card-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
                  <p className="v4-card-excerpt">{cleanExcerpt(a.content)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V5 — STRIPE (Gradient Docs)
   Rainbow gradient bar, animated indicator dots, gradient subs
   ═══════════════════════════════════════════════════════════════ */
function V5(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v5-layout">
      <aside className="v5-side">
        <div className="v5-rainbow" />
        <input className="v5-search" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v5-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v5-group">
                <button className={`v5-cat ${isActive ? "v5-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <CatIcon cat={c} color={isActive ? "#6366f1" : "#64748b"} size={16} />
                  <span className="v5-cat-name">{c}</span>
                  <span className="v5-cat-count">{p.counts[c] || 0}</span>
                  {subs.length > 0 && (
                    <span className={`v5-chev ${isExpanded ? "v5-chev--open" : ""}`}
                      onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }}>
                      &#9662;
                    </span>
                  )}
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v5-subs">
                    {subs.map((s) => (
                      <button key={s}
                        className={`v5-sub ${p.sub === s ? "v5-sub--on" : ""}`}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        <span className={`v5-indicator ${p.sub === s ? "v5-indicator--on" : ""}`} />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v5-main">
        <div className="v5-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty /> : (
          <div className="v5-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v5-card">
                  <div className="v5-card-border" />
                  <div className="v5-card-content">
                    <span className="v5-badge" style={{ color: c }}>{a.category}</span>
                    <h3 className="v5-card-title">{a.title}</h3>
                    <p className="v5-card-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
                    <p className="v5-card-excerpt">{cleanExcerpt(a.content)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V6 — SPOTIFY (Dark Music Player)
   Horizontal scrollable chips, green accents, dark rounded panels
   ═══════════════════════════════════════════════════════════════ */
function V6(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v6-layout">
      <aside className="v6-side">
        <input className="v6-search" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v6-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isExpanded = expanded[c] || p.cat === c;
            const isActive = p.cat === c && !p.sub;
            return (
              <div key={c} className="v6-group">
                <button className={`v6-cat ${isActive ? "v6-cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <CatIcon cat={c} color={isActive ? "#1db954" : "#b3b3b3"} size={16} />
                  <span className="v6-cat-name">{c}</span>
                  <span className="v6-cat-count">{p.counts[c] || 0}</span>
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v6-chips">
                    {subs.map((s) => (
                      <button key={s}
                        className={`v6-chip ${p.sub === s ? "v6-chip--on" : ""}`}
                        style={{ "--btn-bg": p.sub === s ? "#1db954" : `${color}25`, "--btn-clr": p.sub === s ? "#000" : "#b3b3b3" } as React.CSSProperties}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v6-main">
        <div className="v6-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty dark /> : (
          <div className="v6-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v6-card">
                  <div className="v6-card-gradient" style={{ background: `linear-gradient(135deg, ${c}30 0%, transparent 60%)` }} />
                  <div className="v6-card-content">
                    <span className="v6-badge" style={{ color: c }}>{a.category}</span>
                    <h3 className="v6-card-title">{a.title}</h3>
                    <p className="v6-card-meta">{getAuthors(a)}</p>
                    <p className="v6-card-excerpt">{cleanExcerpt(a.content)}</p>
                    <span className="v6-read-cta">Read &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V7 — FIGMA (Colorful Playful)
   Colored pills with spring animation, tilt on hover, dot indicators
   ═══════════════════════════════════════════════════════════════ */
function V7(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout v7-layout">
      <aside className="v7-side">
        <input className="v7-search" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v7-nav">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isActive = p.cat === c;
            const isExpanded = expanded[c] || isActive;
            return (
              <div key={c} style={{ "--cat-color": color } as React.CSSProperties}>
                <button className={`v7-pill ${isActive && !p.sub ? "v7-pill--on" : ""}`}
                  style={{ "--btn-bg": isActive ? color : `${color}12`, "--btn-clr": isActive ? "#fff" : color } as React.CSSProperties}
                  onClick={() => {
                    if (isActive && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <span className="v7-pill-dot" style={{ background: isActive ? "rgba(255,255,255,0.6)" : color }} />
                  {c}
                  <span className="v7-pill-n" style={{ background: isActive ? "rgba(255,255,255,0.25)" : `${color}20` }}>
                    {p.counts[c] || 0}
                  </span>
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="v7-subs">
                    {subs.map((s, i) => (
                      <button key={s}
                        className={`v7-sub ${p.sub === s ? "v7-sub--on" : ""}`}
                        style={{
                          "--btn-bg": `${color}08`,
                          "--btn-clr": p.sub === s ? color : undefined,
                          "--btn-bdc": p.sub === s ? color : "transparent",
                          animationDelay: `${i * 50}ms`,
                        } as React.CSSProperties}
                        onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="v7-main">
        <div className="v7-count">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        {p.articles.length === 0 ? <Empty /> : (
          <div className="v7-results">
            {p.articles.map((a) => {
              const c = CATEGORY_COLORS[a.category] || "#64748b";
              return (
                <Link key={a.id} href={`/article/${a.slug}`} className="v7-card" style={{ borderColor: `${c}30` }}>
                  <span className="v7-badge" style={{ background: `${c}12`, color: c }}>{a.category}</span>
                  <h3 className="v7-card-title">{a.title}</h3>
                  <p className="v7-card-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
                  <p className="v7-card-excerpt">{cleanExcerpt(a.content)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V8 — MAGAZINE (Editorial Spread)
   No sidebar — 5 unique nav styles: McKinsey, Nature, HBR, Lancet, Faceted
   ═══════════════════════════════════════════════════════════════ */
function V8(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* ── Lancet: left sidebar accordion + applied filter chips on top ── */
  const LancetSidebar = (
    <aside className="m8-lan-side">
      <div className="m8-lan-search-wrap">
        <svg className="m8-lan-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="v8-search m8-lan-search" placeholder="Search articles..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        {p.search && (
          <button className="m8-lan-search-clear" onClick={() => p.setSearch("")} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      <div className="m8-lan-title">Filter by Discipline</div>
      {p.allCats.map((c) => {
        const color = CATEGORY_COLORS[c] || "#64748b";
        const subs = TAXONOMY[c] || [];
        const isExp = expanded[c] || p.cat === c;
        const isActive = p.cat === c && !p.sub;
        return (
          <div key={c} className="m8-lan-group">
            <button className={`m8-lan-cat ${isActive ? "m8-lan-cat--on" : ""}`}
              style={{ "--cat-clr": color } as React.CSSProperties}
              onClick={() => {
                if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
              }}>
              <span className="m8-lan-cat-name">{c}</span>
              <span className="m8-lan-cat-n">{p.counts[c] || 0}</span>
              <span className={`m8-lan-chev ${isExp ? "m8-lan-chev--open" : ""}`}>&#9662;</span>
            </button>
            {isExp && subs.length > 0 && (
              <div className="m8-lan-subs">
                {subs.map((s) => (
                  <button key={s} className={`m8-lan-sub ${p.sub === s ? "m8-lan-sub--on" : ""}`}
                    onClick={() => { p.setCat(c); p.setSub(p.sub === s ? "" : s); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
  const LancetApplied = (p.cat || p.sub) ? (
    <div className="m8-lan-applied">
      <span className="m8-lan-applied-label">Active filters:</span>
      {p.cat && <span className="m8-lan-tag" onClick={() => { p.setCat(""); p.setSub(""); }}>{p.cat} &times;</span>}
      {p.sub && <span className="m8-lan-tag m8-lan-tag--sub" onClick={() => p.setSub("")}>{p.sub} &times;</span>}
      <button className="m8-lan-clear" onClick={() => { p.clear(); }}>Clear all</button>
    </div>
  ) : null;

  const articleGrid = p.articles.length === 0 ? <Empty /> : (
    <div className="v8-magazine">
      {p.articles.slice(0, 1).map((a) => {
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
        {p.articles.slice(1).map((a) => {
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
    <div className="v8-layout">
      <div className="m8-lancet xlayout">
        {LancetSidebar}
        <div className="m8-lan-main">
          {LancetApplied}
          {articleGrid}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V9 — TIMELINE (Chronological)
   Center timeline, cards branch left/right, floating filter pills
   ═══════════════════════════════════════════════════════════════ */
function V9(p: SP) {
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  const toggleCat = (c: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) { next.delete(c); if (p.cat === c) p.setCat(""); }
      else { next.add(c); p.setCat(c); p.setSub(""); }
      return next;
    });
  };

  const displayArticles = useMemo(() => {
    if (activeCats.size === 0) return p.allArticles;
    return p.allArticles.filter((a) => activeCats.has(a.category));
  }, [p.allArticles, activeCats]);

  const searchFiltered = useMemo(() => {
    const q = p.search.trim().toLowerCase();
    if (!q) return displayArticles;
    return displayArticles.filter((a) => a.title.toLowerCase().includes(q) || a.authorUsername.toLowerCase().includes(q));
  }, [displayArticles, p.search]);

  return (
    <div className="v9-layout">
      <div className="v9-filters">
        <input className="v9-search" placeholder="Search timeline..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="v9-pills">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const isOn = activeCats.has(c);
            return (
              <button key={c}
                className={`v9-pill ${isOn ? "v9-pill--on" : ""}`}
                style={isOn ? { "--btn-bg": color, "--btn-clr": "#fff", "--btn-bxs": `0 0 12px ${color}50` } as React.CSSProperties : {}}
                onClick={() => toggleCat(c)}>
                {c}
                <span className="v9-pill-count">{p.counts[c] || 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {searchFiltered.length === 0 ? <Empty /> : (
        <div className="v9-timeline">
          <div className="v9-line" />
          {searchFiltered.map((a, i) => {
            const c = CATEGORY_COLORS[a.category] || "#64748b";
            const isLeft = i % 2 === 0;
            return (
              <div key={a.id} className={`v9-node ${isLeft ? "v9-node--left" : "v9-node--right"}`}
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="v9-dot" style={{ background: c, boxShadow: `0 0 8px ${c}60` }} />
                <Link href={`/article/${a.slug}`} className="v9-card" style={{ borderColor: `${c}30` }}>
                  <span className="v9-badge" style={{ color: c }}>{a.category}</span>
                  <h3 className="v9-card-title">{a.title}</h3>
                  <p className="v9-card-meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
                  <p className="v9-card-excerpt">{cleanExcerpt(a.content, 120)}</p>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V10 — COMMAND PALETTE (Power User)
   Search-first, faceted filters, compact rows, keyboard nav
   ═══════════════════════════════════════════════════════════════ */
function V10(p: SP) {
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [focusIdx, setFocusIdx] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const toggleCat = (c: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
    setFocusIdx(-1);
  };

  const displayArticles = useMemo(() => {
    let r = p.allArticles;
    const q = p.search.trim().toLowerCase();
    if (q) r = r.filter((a) => a.title.toLowerCase().includes(q) || a.authorUsername.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
    if (activeCats.size > 0) r = r.filter((a) => activeCats.has(a.category));
    return r;
  }, [p.allArticles, p.search, activeCats]);

  const catCounts = useMemo(() => {
    const base = p.allArticles;
    const q = p.search.trim().toLowerCase();
    const searched = q ? base.filter((a) => a.title.toLowerCase().includes(q) || a.authorUsername.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)) : base;
    const c: Record<string, number> = {};
    searched.forEach((a) => { c[a.category] = (c[a.category] || 0) + 1; });
    return c;
  }, [p.allArticles, p.search]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, displayArticles.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && focusIdx >= 0 && displayArticles[focusIdx]) {
      window.location.href = `/article/${displayArticles[focusIdx].slug}`;
    }
  };

  useEffect(() => {
    if (focusIdx >= 0 && listRef.current) {
      const row = listRef.current.children[focusIdx] as HTMLElement;
      if (row) row.scrollIntoView({ block: "nearest" });
    }
  }, [focusIdx]);

  return (
    <div className="v10-layout" onKeyDown={handleKey}>
      <div className="v10-searchbox">
        <span className="v10-cmd">⌘K</span>
        <input className="v10-search" placeholder="Search articles, authors, categories..." value={p.search}
          onChange={(e) => { p.setSearch(e.target.value); setFocusIdx(-1); }}
          autoFocus />
        <span className="v10-result-count">{displayArticles.length} result{displayArticles.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="v10-facets">
        {p.allCats.map((c) => {
          const color = CATEGORY_COLORS[c] || "#64748b";
          const isOn = activeCats.has(c);
          const count = catCounts[c] || 0;
          return (
            <button key={c}
              className={`v10-facet ${isOn ? "v10-facet--on" : ""}`}
              style={isOn ? { "--btn-bg": `${color}10`, "--btn-clr": color, "--btn-bdc": color } as React.CSSProperties : {}}
              onClick={() => toggleCat(c)}>
              {c}
              <span className="v10-facet-n">{count}</span>
            </button>
          );
        })}
      </div>

      {displayArticles.length === 0 ? <Empty /> : (
        <div className="v10-list" ref={listRef}>
          {displayArticles.map((a, i) => {
            const c = CATEGORY_COLORS[a.category] || "#64748b";
            return (
              <Link key={a.id} href={`/article/${a.slug}`}
                className={`v10-row ${focusIdx === i ? "v10-row--focus" : ""}`}
                onMouseEnter={() => setFocusIdx(i)}>
                <div className="v10-row-top">
                  <span className="v10-row-cat" style={{ color: c }}>{a.category}</span>
                  <span className="v10-row-title">{a.title}</span>
                  <span className="v10-row-author">{getAuthors(a)}</span>
                  <span className="v10-row-date">{fmtDate(a.createdAt)}</span>
                </div>
                <p className="v10-row-excerpt">{cleanExcerpt(a.content, 140)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
