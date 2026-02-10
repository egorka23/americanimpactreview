"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/* ── Mock taxonomy (categories → subcategories) ── */
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

function cleanExcerpt(raw: string, maxLen: number = 180): string {
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
  "Sidebar Facets",
  "Horizontal Pills",
  "Accordion Tree",
  "Dropdown Cascade",
  "Tag Cloud",
] as const;

type Variant = (typeof VARIANTS)[number];

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function authorLine(a: SerializedArticle) {
  return (a.authors?.length ? a.authors : [a.authorUsername]).join(", ");
}

export default function ExploreTestClient({ articles }: { articles: SerializedArticle[] }) {
  const [variant, setVariant] = useState<Variant>("Sidebar Facets");
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  const allCategories = Object.keys(TAXONOMY);

  const filtered = useMemo(() => {
    let result = articles;
    const trimmed = search.trim().toLowerCase();
    if (trimmed) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(trimmed) ||
          a.authorUsername.toLowerCase().includes(trimmed) ||
          a.category.toLowerCase().includes(trimmed)
      );
    }
    if (selectedCat) {
      result = result.filter((a) => a.category === selectedCat);
    }
    return result;
  }, [articles, search, selectedCat]);

  const clearFilters = () => {
    setSelectedCat("");
    setSelectedSub("");
    setSearch("");
  };

  const sharedProps = {
    articles: filtered,
    allArticles: articles,
    allCategories,
    search,
    setSearch,
    selectedCat,
    setSelectedCat,
    selectedSub,
    setSelectedSub,
    clearFilters,
  };

  return (
    <div className="efv">
      {/* ── Variant tabs ── */}
      <div className="efv-tabs">
        {VARIANTS.map((v) => (
          <button
            key={v}
            className={`efv-tabs__btn ${variant === v ? "efv-tabs__btn--on" : ""}`}
            onClick={() => { setVariant(v); clearFilters(); }}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="efv-label">
        Filter variant: <strong>{variant}</strong>
        {(selectedCat || selectedSub || search) && (
          <button className="efv-clear" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      {/* ── Variant bodies ── */}
      {variant === "Sidebar Facets" && <SidebarFacets {...sharedProps} />}
      {variant === "Horizontal Pills" && <HorizontalPills {...sharedProps} />}
      {variant === "Accordion Tree" && <AccordionTree {...sharedProps} />}
      {variant === "Dropdown Cascade" && <DropdownCascade {...sharedProps} />}
      {variant === "Tag Cloud" && <TagCloudFilter {...sharedProps} />}
    </div>
  );
}

type FilterProps = {
  articles: SerializedArticle[];
  allArticles: SerializedArticle[];
  allCategories: string[];
  search: string;
  setSearch: (s: string) => void;
  selectedCat: string;
  setSelectedCat: (c: string) => void;
  selectedSub: string;
  setSelectedSub: (s: string) => void;
  clearFilters: () => void;
};

/* ── Article card (shared across all variants) ── */
function ArticleCard({ a }: { a: SerializedArticle }) {
  const color = CATEGORY_COLORS[a.category] || "#64748b";
  return (
    <Link href={`/article/${a.slug}`} className="efv-card">
      <div className="efv-card__top">
        <span className="efv-card__cat" style={{ background: `${color}14`, color, borderColor: `${color}30` }}>
          {a.category}
        </span>
        <span className="efv-card__date">{formatDate(a.createdAt)}</span>
      </div>
      <h3 className="efv-card__title">{a.title}</h3>
      <p className="efv-card__authors">{authorLine(a)}</p>
      <p className="efv-card__excerpt">{cleanExcerpt(a.content)}</p>
      <span className="efv-card__read">Read article &rarr;</span>
    </Link>
  );
}

function NoResults() {
  return (
    <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0" }}>
      No articles match your filters.
    </p>
  );
}

/* ═══════════════════════════════════════════════════
   1. SIDEBAR FACETS — PubMed / Elsevier style
   Left sidebar with checkable categories + expandable subcats
   ═══════════════════════════════════════════════════ */
function SidebarFacets({ articles, allArticles, allCategories, search, setSearch, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: FilterProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (cat: string) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allArticles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }, [allArticles]);

  return (
    <div className="efv-sidebar-layout">
      <aside className="efv-sidebar">
        <div className="efv-sidebar__search">
          <input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <h4 className="efv-sidebar__heading">Disciplines</h4>
        <ul className="efv-sidebar__list">
          <li>
            <button
              className={`efv-sidebar__item ${!selectedCat ? "efv-sidebar__item--on" : ""}`}
              onClick={() => { setSelectedCat(""); setSelectedSub(""); }}
            >
              All disciplines
              <span className="efv-sidebar__count">{allArticles.length}</span>
            </button>
          </li>
          {allCategories.map((cat) => {
            const color = CATEGORY_COLORS[cat] || "#64748b";
            const isOpen = expanded[cat];
            const subs = TAXONOMY[cat] || [];
            return (
              <li key={cat}>
                <button
                  className={`efv-sidebar__item ${selectedCat === cat ? "efv-sidebar__item--on" : ""}`}
                  onClick={() => { setSelectedCat(selectedCat === cat ? "" : cat); setSelectedSub(""); }}
                >
                  <span className="efv-sidebar__dot" style={{ background: color }} />
                  {cat}
                  <span className="efv-sidebar__count">{catCounts[cat] || 0}</span>
                </button>
                {subs.length > 0 && selectedCat === cat && (
                  <>
                    <button className="efv-sidebar__toggle" onClick={() => toggleExpand(cat)}>
                      {isOpen ? "Hide" : "Show"} subcategories
                    </button>
                    {isOpen && (
                      <ul className="efv-sidebar__subs">
                        {subs.map((sub) => (
                          <li key={sub}>
                            <button
                              className={`efv-sidebar__sub ${selectedSub === sub ? "efv-sidebar__sub--on" : ""}`}
                              onClick={() => setSelectedSub(selectedSub === sub ? "" : sub)}
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
      <main className="efv-main">
        <div className="efv-results-header">
          <span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
        </div>
        {articles.length === 0 ? <NoResults /> : (
          <div className="efv-grid">
            {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2. HORIZONTAL PILLS — Nature / Science Direct style
   Category pills on top, subcategory pills appear below
   ═══════════════════════════════════════════════════ */
function HorizontalPills({ articles, allCategories, search, setSearch, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: FilterProps) {
  const subs = selectedCat ? (TAXONOMY[selectedCat] || []) : [];

  return (
    <div className="efv-hpills">
      <div className="efv-hpills__search">
        <input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="efv-hpills__row">
        <button
          className={`efv-pill ${!selectedCat ? "efv-pill--on" : ""}`}
          onClick={() => { setSelectedCat(""); setSelectedSub(""); }}
        >
          All
        </button>
        {allCategories.map((cat) => {
          const color = CATEGORY_COLORS[cat] || "#64748b";
          return (
            <button
              key={cat}
              className={`efv-pill ${selectedCat === cat ? "efv-pill--on" : ""}`}
              style={selectedCat === cat ? { background: color, borderColor: color, color: "#fff" } : {}}
              onClick={() => { setSelectedCat(selectedCat === cat ? "" : cat); setSelectedSub(""); }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {subs.length > 0 && (
        <div className="efv-hpills__subrow">
          <span className="efv-hpills__sublabel">Subcategories:</span>
          {subs.map((sub) => (
            <button
              key={sub}
              className={`efv-subpill ${selectedSub === sub ? "efv-subpill--on" : ""}`}
              onClick={() => setSelectedSub(selectedSub === sub ? "" : sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <div className="efv-results-header">
        <span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
      </div>
      {articles.length === 0 ? <NoResults /> : (
        <div className="efv-grid">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   3. ACCORDION TREE — Expandable tree with checkmarks
   Each category expands to show subcategories
   ═══════════════════════════════════════════════════ */
function AccordionTree({ articles, allArticles, allCategories, search, setSearch, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: FilterProps) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allArticles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }, [allArticles]);

  return (
    <div className="efv-accordion-layout">
      <div className="efv-accordion-top">
        <input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="efv-accordion-search"
        />
      </div>

      <div className="efv-accordion-tree">
        {allCategories.map((cat) => {
          const color = CATEGORY_COLORS[cat] || "#64748b";
          const subs = TAXONOMY[cat] || [];
          const isOpen = openCats[cat];
          const isActive = selectedCat === cat;

          return (
            <div key={cat} className={`efv-acc ${isActive ? "efv-acc--active" : ""}`}>
              <button className="efv-acc__head" onClick={() => { toggleCat(cat); setSelectedCat(isActive ? "" : cat); setSelectedSub(""); }}>
                <span className="efv-acc__dot" style={{ background: color }} />
                <span className="efv-acc__label">{cat}</span>
                <span className="efv-acc__count">{catCounts[cat] || 0}</span>
                <span className={`efv-acc__chevron ${isOpen ? "efv-acc__chevron--open" : ""}`}>&#9662;</span>
              </button>
              {isOpen && subs.length > 0 && (
                <div className="efv-acc__body">
                  {subs.map((sub) => (
                    <button
                      key={sub}
                      className={`efv-acc__sub ${selectedSub === sub ? "efv-acc__sub--on" : ""}`}
                      onClick={() => { setSelectedCat(cat); setSelectedSub(selectedSub === sub ? "" : sub); }}
                    >
                      <span className="efv-acc__check">{selectedSub === sub ? "\u2713" : ""}</span>
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="efv-results-header" style={{ marginTop: "1.5rem" }}>
        <span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
      </div>
      {articles.length === 0 ? <NoResults /> : (
        <div className="efv-grid">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   4. DROPDOWN CASCADE — Two linked dropdowns
   Category → Subcategory, compact, like Elsevier
   ═══════════════════════════════════════════════════ */
function DropdownCascade({ articles, allCategories, search, setSearch, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: FilterProps) {
  const subs = selectedCat ? (TAXONOMY[selectedCat] || []) : [];

  return (
    <div className="efv-cascade">
      <div className="efv-cascade__bar">
        <input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="efv-cascade__input"
        />
        <select
          className="efv-cascade__select"
          value={selectedCat}
          onChange={(e) => { setSelectedCat(e.target.value); setSelectedSub(""); }}
        >
          <option value="">All categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className="efv-cascade__select"
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          disabled={!selectedCat}
        >
          <option value="">All subcategories</option>
          {subs.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {(selectedCat || selectedSub) && (
        <div className="efv-cascade__breadcrumb">
          <span>Filtering:</span>
          {selectedCat && <span className="efv-cascade__crumb">{selectedCat}</span>}
          {selectedSub && <><span className="efv-cascade__arrow">&rarr;</span><span className="efv-cascade__crumb">{selectedSub}</span></>}
        </div>
      )}

      <div className="efv-results-header">
        <span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
      </div>
      {articles.length === 0 ? <NoResults /> : (
        <div className="efv-grid">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   5. TAG CLOUD — Visual weighted tag cloud for categories
   Click to filter, size = article count
   ═══════════════════════════════════════════════════ */
function TagCloudFilter({ articles, allArticles, allCategories, search, setSearch, selectedCat, setSelectedCat, selectedSub, setSelectedSub }: FilterProps) {
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allArticles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }, [allArticles]);

  const subs = selectedCat ? (TAXONOMY[selectedCat] || []) : [];

  return (
    <div className="efv-tagcloud">
      <div className="efv-tagcloud__search">
        <input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="efv-tagcloud__cloud">
        {allCategories.map((cat) => {
          const color = CATEGORY_COLORS[cat] || "#64748b";
          const count = catCounts[cat] || 0;
          const scale = 0.85 + Math.min(count, 10) * 0.08;
          return (
            <button
              key={cat}
              className={`efv-tag ${selectedCat === cat ? "efv-tag--on" : ""}`}
              style={{
                fontSize: `${scale}rem`,
                ...(selectedCat === cat ? { background: color, borderColor: color, color: "#fff" } : { borderColor: `${color}40`, color }),
              }}
              onClick={() => { setSelectedCat(selectedCat === cat ? "" : cat); setSelectedSub(""); }}
            >
              {cat}
              <span className="efv-tag__count">{count}</span>
            </button>
          );
        })}
      </div>

      {subs.length > 0 && (
        <div className="efv-tagcloud__subs">
          {subs.map((sub) => (
            <button
              key={sub}
              className={`efv-subtag ${selectedSub === sub ? "efv-subtag--on" : ""}`}
              onClick={() => setSelectedSub(selectedSub === sub ? "" : sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <div className="efv-results-header">
        <span>{articles.length} article{articles.length !== 1 ? "s" : ""}</span>
      </div>
      {articles.length === 0 ? <NoResults /> : (
        <div className="efv-grid">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
