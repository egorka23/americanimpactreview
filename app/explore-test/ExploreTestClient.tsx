"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const TAXONOMY: Record<string, string[]> = {
  "Computer Science": ["Systems & Infrastructure", "Cybersecurity", "Software Engineering", "Networking"],
  "Health & Biotech": ["Genomics", "Immunology", "Public Health", "Biomedical Devices"],
  "AI & Data": ["Machine Learning", "NLP", "Computer Vision", "Data Ethics"],
  "Sports Science": ["Sports Medicine", "Biomechanics", "Physiology", "Nutrition"],
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
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
  "Social Sciences": "#6366f1",
  "Engineering": "#475569",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Computer Science": "\u{1F4BB}",
  "Health & Biotech": "\u{1F9EC}",
  "AI & Data": "\u{1F916}",
  "Sports Science": "\u{1F3CB}",
  "Energy & Climate": "\u{26A1}",
  "Human Performance": "\u{1F9E0}",
  "Social Sciences": "\u{1F4DA}",
  "Engineering": "\u{2699}",
};

function cleanExcerpt(raw: string, maxLen: number = 180): string {
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
  "PubMed Classic",
  "Glass Sidebar",
  "Dark Navigator",
  "Color Blocks",
  "Minimal Tree",
] as const;
type Variant = (typeof VARIANTS)[number];

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function authors(a: Article) {
  return (a.authors?.length ? a.authors : [a.authorUsername]).join(", ");
}

export default function ExploreTestClient({ articles }: { articles: Article[] }) {
  const [variant, setVariant] = useState<Variant>("PubMed Classic");
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

  const sp = { articles: filtered, allArticles: articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub, clear };

  return (
    <div className="sb">
      <div className="sb-tabs">
        {VARIANTS.map((v) => (
          <button key={v} className={`sb-tabs__btn ${variant === v ? "sb-tabs__btn--on" : ""}`}
            onClick={() => { setVariant(v); clear(); }}>{v}</button>
        ))}
      </div>
      {variant === "PubMed Classic" && <V1 {...sp} />}
      {variant === "Glass Sidebar" && <V2 {...sp} />}
      {variant === "Dark Navigator" && <V3 {...sp} />}
      {variant === "Color Blocks" && <V4 {...sp} />}
      {variant === "Minimal Tree" && <V5 {...sp} />}
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

function Card({ a }: { a: Article }) {
  const c = CATEGORY_COLORS[a.category] || "#64748b";
  return (
    <Link href={`/article/${a.slug}`} className="sb-card">
      <div className="sb-card__top">
        <span className="sb-card__cat" style={{ background: `${c}14`, color: c, borderColor: `${c}30` }}>{a.category}</span>
        <span className="sb-card__date">{fmtDate(a.createdAt)}</span>
      </div>
      <h3 className="sb-card__title">{a.title}</h3>
      <p className="sb-card__authors">{authors(a)}</p>
      <p className="sb-card__excerpt">{cleanExcerpt(a.content)}</p>
      <span className="sb-card__read">Read article &rarr;</span>
    </Link>
  );
}

function Empty() {
  return <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0" }}>No articles match.</p>;
}

function Results({ articles }: { articles: Article[] }) {
  return articles.length === 0 ? <Empty /> : (
    <div className="sb-results">
      {articles.map((a) => <Card key={a.id} a={a} />)}
    </div>
  );
}

/* ═══ 1. PubMed Classic — clean white sidebar, subtle borders, counts ═══ */
function V1({ articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub }: SP) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="sb-layout">
      <aside className="sb-v1">
        <input className="sb-v1__search" placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sb-v1__section">
          <div className="sb-v1__heading">Disciplines</div>
          <button className={`sb-v1__item ${!cat ? "sb-v1__item--on" : ""}`} onClick={() => { setCat(""); setSub(""); }}>
            All <span className="sb-v1__count">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
          </button>
          {allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            return (
              <div key={c}>
                <button className={`sb-v1__item ${cat === c ? "sb-v1__item--on" : ""}`}
                  onClick={() => { setCat(cat === c ? "" : c); setSub(""); if (cat !== c) setOpen((p) => ({ ...p, [c]: true })); }}>
                  <span className="sb-v1__dot" style={{ background: color }} />
                  {c}
                  <span className="sb-v1__count">{counts[c] || 0}</span>
                  {subs.length > 0 && <span className={`sb-v1__chevron ${open[c] ? "sb-v1__chevron--open" : ""}`} onClick={(e) => { e.stopPropagation(); setOpen((p) => ({ ...p, [c]: !p[c] })); }}>&#9662;</span>}
                </button>
                {open[c] && subs.length > 0 && (
                  <div className="sb-v1__subs">
                    {subs.map((s) => (
                      <button key={s} className={`sb-v1__sub ${sub === s ? "sb-v1__sub--on" : ""}`}
                        onClick={() => { setCat(c); setSub(sub === s ? "" : s); }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="sb-main">
        <div className="sb-count">{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
        <Results articles={articles} />
      </main>
    </div>
  );
}

/* ═══ 2. Glass Sidebar — frosted glass, rounded, floating feel ═══ */
function V2({ articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub }: SP) {
  return (
    <div className="sb-layout">
      <aside className="sb-v2">
        <div className="sb-v2__logo">Browse</div>
        <input className="sb-v2__search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sb-v2__cats">
          <button className={`sb-v2__cat ${!cat ? "sb-v2__cat--on" : ""}`} onClick={() => { setCat(""); setSub(""); }}>
            <span className="sb-v2__cat-icon">&#9776;</span> All disciplines
          </button>
          {allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const active = cat === c;
            return (
              <div key={c}>
                <button className={`sb-v2__cat ${active ? "sb-v2__cat--on" : ""}`}
                  onClick={() => { setCat(active ? "" : c); setSub(""); }}>
                  <span className="sb-v2__cat-dot" style={{ background: color }} />
                  {c}
                  <span className="sb-v2__cat-count">{counts[c] || 0}</span>
                </button>
                {active && subs.length > 0 && (
                  <div className="sb-v2__subs">
                    {subs.map((s) => (
                      <button key={s} className={`sb-v2__sub ${sub === s ? "sb-v2__sub--on" : ""}`}
                        onClick={() => setSub(sub === s ? "" : s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="sb-main">
        <div className="sb-count">{articles.length} result{articles.length !== 1 ? "s" : ""}</div>
        <Results articles={articles} />
      </main>
    </div>
  );
}

/* ═══ 3. Dark Navigator — dark sidebar, light content, gold accents ═══ */
function V3({ articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub }: SP) {
  return (
    <div className="sb-layout">
      <aside className="sb-v3">
        <div className="sb-v3__brand">Research</div>
        <input className="sb-v3__search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sb-v3__nav">
          <button className={`sb-v3__item ${!cat ? "sb-v3__item--on" : ""}`} onClick={() => { setCat(""); setSub(""); }}>
            All fields
          </button>
          {allCats.map((c) => {
            const active = cat === c;
            const subs = TAXONOMY[c] || [];
            return (
              <div key={c}>
                <button className={`sb-v3__item ${active ? "sb-v3__item--on" : ""}`}
                  onClick={() => { setCat(active ? "" : c); setSub(""); }}>
                  <span className="sb-v3__icon">{CATEGORY_ICONS[c]}</span>
                  {c}
                  <span className="sb-v3__badge">{counts[c] || 0}</span>
                </button>
                {active && subs.length > 0 && (
                  <div className="sb-v3__subs">
                    {subs.map((s) => (
                      <button key={s} className={`sb-v3__sub ${sub === s ? "sb-v3__sub--on" : ""}`}
                        onClick={() => setSub(sub === s ? "" : s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="sb-main">
        <div className="sb-count">{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
        <Results articles={articles} />
      </main>
    </div>
  );
}

/* ═══ 4. Color Blocks — each category is a colored card in sidebar ═══ */
function V4({ articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub }: SP) {
  return (
    <div className="sb-layout">
      <aside className="sb-v4">
        <input className="sb-v4__search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sb-v4__grid">
          {allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const active = cat === c;
            const subs = TAXONOMY[c] || [];
            return (
              <div key={c} className={`sb-v4__block ${active ? "sb-v4__block--on" : ""}`}
                style={{ borderColor: active ? color : "transparent", "--block-color": color } as React.CSSProperties}>
                <button className="sb-v4__block-btn" onClick={() => { setCat(active ? "" : c); setSub(""); }}>
                  <span className="sb-v4__block-icon">{CATEGORY_ICONS[c]}</span>
                  <span className="sb-v4__block-name">{c}</span>
                  <span className="sb-v4__block-count" style={{ background: `${color}20`, color }}>{counts[c] || 0}</span>
                </button>
                {active && subs.length > 0 && (
                  <div className="sb-v4__block-subs">
                    {subs.map((s) => (
                      <button key={s} className={`sb-v4__sub ${sub === s ? "sb-v4__sub--on" : ""}`}
                        style={sub === s ? { background: color, color: "#fff" } : {}}
                        onClick={() => setSub(sub === s ? "" : s)}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="sb-main">
        <div className="sb-count">{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
        <Results articles={articles} />
      </main>
    </div>
  );
}

/* ═══ 5. Minimal Tree — ultra-clean, indented tree, no boxes ═══ */
function V5({ articles, allCats, counts, search, setSearch, cat, setCat, sub, setSub }: SP) {
  return (
    <div className="sb-layout">
      <aside className="sb-v5">
        <input className="sb-v5__search" placeholder="Find articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sb-v5__label">Categories</div>
        <nav className="sb-v5__tree">
          <button className={`sb-v5__branch ${!cat ? "sb-v5__branch--on" : ""}`} onClick={() => { setCat(""); setSub(""); }}>
            All disciplines
          </button>
          {allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const active = cat === c;
            const subs = TAXONOMY[c] || [];
            return (
              <div key={c}>
                <button className={`sb-v5__branch ${active ? "sb-v5__branch--on" : ""}`}
                  onClick={() => { setCat(active ? "" : c); setSub(""); }}>
                  <span className="sb-v5__line" style={{ background: color }} />
                  {c}
                  <span className="sb-v5__num">{counts[c] || 0}</span>
                </button>
                {active && subs.length > 0 && (
                  <div className="sb-v5__leaves">
                    {subs.map((s) => (
                      <button key={s} className={`sb-v5__leaf ${sub === s ? "sb-v5__leaf--on" : ""}`}
                        onClick={() => setSub(sub === s ? "" : s)}>
                        <span className="sb-v5__leaf-dot" style={{ background: sub === s ? color : "#cbd5e1" }} />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="sb-main">
        <div className="sb-count">{articles.length} article{articles.length !== 1 ? "s" : ""}</div>
        <Results articles={articles} />
      </main>
    </div>
  );
}
