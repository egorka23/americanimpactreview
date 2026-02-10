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
  "Spotify", "Figma", "Raindrop", "Monochrome", "Arc",
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
  const [variant, setVariant] = useState<Variant>("Notion");
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

  const Comp = { Notion: V1, Linear: V2, Vercel: V3, Apple: V4, Stripe: V5, Spotify: V6, Figma: V7, Raindrop: V8, Monochrome: V9, Arc: V10 }[variant];

  return (
    <div className="sb">
      <div className="sb-tabs">
        {VARIANTS.map((v) => (
          <button key={v} className={`sb-tabs__btn ${variant === v ? "sb-tabs__btn--on" : ""}`}
            onClick={() => { setVariant(v); clear(); }}>{v}</button>
        ))}
      </div>
      <Comp {...sp} />
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

/* ─── Shared card per variant ─── */
function CardNotion({ a }: { a: Article }) {
  const c = CATEGORY_COLORS[a.category] || "#64748b";
  return (
    <Link href={`/article/${a.slug}`} className="xcard xcard--notion">
      <span className="xcard__badge" style={{ background: `${c}12`, color: c }}>{a.category}</span>
      <h3 className="xcard__title">{a.title}</h3>
      <p className="xcard__meta">{getAuthors(a)} {fmtDate(a.createdAt) && <>&middot; {fmtDate(a.createdAt)}</>}</p>
      <p className="xcard__excerpt">{cleanExcerpt(a.content)}</p>
    </Link>
  );
}

function CardDark({ a, accent }: { a: Article; accent?: string }) {
  const c = accent || CATEGORY_COLORS[a.category] || "#64748b";
  return (
    <Link href={`/article/${a.slug}`} className="xcard xcard--dark">
      <span className="xcard__badge xcard__badge--dark" style={{ color: c, borderColor: `${c}40` }}>{a.category}</span>
      <h3 className="xcard__title xcard__title--dark">{a.title}</h3>
      <p className="xcard__meta xcard__meta--dark">{getAuthors(a)}</p>
      <p className="xcard__excerpt xcard__excerpt--dark">{cleanExcerpt(a.content)}</p>
    </Link>
  );
}

function CardMinimal({ a }: { a: Article }) {
  return (
    <Link href={`/article/${a.slug}`} className="xcard xcard--minimal">
      <div className="xcard__minimal-top">
        <span className="xcard__minimal-cat">{a.category}</span>
        <span className="xcard__minimal-date">{fmtDate(a.createdAt)}</span>
      </div>
      <h3 className="xcard__title">{a.title}</h3>
      <p className="xcard__meta">{getAuthors(a)}</p>
    </Link>
  );
}

function Empty() {
  return <p style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0", fontFamily: "Inter, sans-serif" }}>No articles match.</p>;
}

function Results({ articles, card }: { articles: Article[]; card: "notion" | "dark" | "minimal" }) {
  if (articles.length === 0) return <Empty />;
  return (
    <div className="xresults">
      {articles.map((a) => {
        if (card === "dark") return <CardDark key={a.id} a={a} />;
        if (card === "minimal") return <CardMinimal key={a.id} a={a} />;
        return <CardNotion key={a.id} a={a} />;
      })}
    </div>
  );
}

/* ── Reusable sidebar with expandable subs ── */
function SidebarList({ allCats, counts, cat, setCat, sub, setSub, variant }: {
  allCats: string[]; counts: Record<string, number>;
  cat: string; setCat: (c: string) => void;
  sub: string; setSub: (s: string) => void;
  variant: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className={`xnav xnav--${variant}`}>
      {allCats.map((c) => {
        const color = CATEGORY_COLORS[c] || "#64748b";
        const subs = TAXONOMY[c] || [];
        const isExpanded = expanded[c] || cat === c;
        const isActive = cat === c && !sub;
        return (
          <div key={c} className="xnav__group">
            <button className={`xnav__cat ${isActive ? "xnav__cat--on" : ""}`}
              onClick={() => {
                if (cat === c && !sub) { setCat(""); setExpanded((p) => ({ ...p, [c]: !p[c] })); }
                else { setCat(c); setSub(""); setExpanded((p) => ({ ...p, [c]: true })); }
              }}>
              <span className="xnav__dot" style={{ background: color }} />
              <span className="xnav__name">{c}</span>
              <span className="xnav__count">{counts[c] || 0}</span>
              {subs.length > 0 && (
                <span className={`xnav__chev ${isExpanded ? "xnav__chev--open" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setExpanded((p) => ({ ...p, [c]: !p[c] })); }}>
                  &#9662;
                </span>
              )}
            </button>
            {isExpanded && subs.length > 0 && (
              <div className="xnav__subs">
                {subs.map((s) => (
                  <button key={s} className={`xnav__sub ${sub === s ? "xnav__sub--on" : ""}`}
                    style={sub === s ? { color } : {}}
                    onClick={() => { setCat(c); setSub(sub === s ? "" : s); }}>
                    <span className="xnav__sub-bar" style={{ background: sub === s ? color : "transparent" }} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V1 — NOTION
   Warm gray background, soft shadows, rounded, spacious
   ═══════════════════════════════════════════════════════════════ */
function V1(p: SP) {
  return (
    <div className="xlayout xlayout--notion">
      <aside className="xside xside--notion">
        <input className="xsearch xsearch--notion" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="notion" />
      </aside>
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V2 — LINEAR
   Dark UI, neon accents, frosted glass, tight spacing
   ═══════════════════════════════════════════════════════════════ */
function V2(p: SP) {
  return (
    <div className="xlayout xlayout--linear">
      <aside className="xside xside--linear">
        <input className="xsearch xsearch--linear" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="linear" />
      </aside>
      <main className="xmain">
        <div className="xcount xcount--linear">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="dark" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V3 — VERCEL
   Black & white, sharp geometry, monospace accents
   ═══════════════════════════════════════════════════════════════ */
function V3(p: SP) {
  return (
    <div className="xlayout xlayout--vercel">
      <aside className="xside xside--vercel">
        <input className="xsearch xsearch--vercel" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="vercel" />
      </aside>
      <main className="xmain">
        <div className="xcount xcount--vercel">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="minimal" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V4 — APPLE
   Light glass morphism, SF-like feel, rounded, airy
   ═══════════════════════════════════════════════════════════════ */
function V4(p: SP) {
  return (
    <div className="xlayout xlayout--apple">
      <aside className="xside xside--apple">
        <input className="xsearch xsearch--apple" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="apple" />
      </aside>
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V5 — STRIPE
   Gradient accent bar, docs-style, indigo vibes
   ═══════════════════════════════════════════════════════════════ */
function V5(p: SP) {
  return (
    <div className="xlayout xlayout--stripe">
      <aside className="xside xside--stripe">
        <div className="xside__stripe-bar" />
        <input className="xsearch xsearch--stripe" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="stripe" />
      </aside>
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V6 — SPOTIFY
   Dark bg, colored category cards, green accents, rounded
   ═══════════════════════════════════════════════════════════════ */
function V6(p: SP) {
  return (
    <div className="xlayout xlayout--spotify">
      <aside className="xside xside--spotify">
        <input className="xsearch xsearch--spotify" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="spotify" />
      </aside>
      <main className="xmain">
        <div className="xcount xcount--spotify">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="dark" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V7 — FIGMA
   Bright, colorful pills, compact sidebar, playful
   ═══════════════════════════════════════════════════════════════ */
function V7(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout xlayout--figma">
      <aside className="xside xside--figma">
        <input className="xsearch xsearch--figma" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="xfigma__cats">
          {p.allCats.map((c) => {
            const color = CATEGORY_COLORS[c] || "#64748b";
            const subs = TAXONOMY[c] || [];
            const isActive = p.cat === c;
            const isExpanded = expanded[c] || isActive;
            return (
              <div key={c}>
                <button className={`xfigma__pill ${isActive && !p.sub ? "xfigma__pill--on" : ""}`}
                  style={isActive ? { background: color, color: "#fff" } : { background: `${color}12`, color }}
                  onClick={() => {
                    if (isActive && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  {c}
                  <span className="xfigma__pill-n" style={isActive ? { background: "rgba(255,255,255,0.25)" } : { background: `${color}20` }}>
                    {p.counts[c] || 0}
                  </span>
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="xfigma__subs">
                    {subs.map((s) => (
                      <button key={s} className={`xfigma__sub ${p.sub === s ? "xfigma__sub--on" : ""}`}
                        style={p.sub === s ? { color, fontWeight: 600 } : {}}
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
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V8 — RAINDROP
   Pastel palette, soft icons, warm, cozy
   ═══════════════════════════════════════════════════════════════ */
function V8(p: SP) {
  return (
    <div className="xlayout xlayout--raindrop">
      <aside className="xside xside--raindrop">
        <input className="xsearch xsearch--raindrop" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="raindrop" />
      </aside>
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V9 — MONOCHROME
   Pure typography, serif, newspaper feel, no color
   ═══════════════════════════════════════════════════════════════ */
function V9(p: SP) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div className="xlayout xlayout--mono">
      <aside className="xside xside--mono">
        <input className="xsearch xsearch--mono" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <div className="xmono__nav">
          {p.allCats.map((c) => {
            const subs = TAXONOMY[c] || [];
            const isActive = p.cat === c && !p.sub;
            const isExpanded = expanded[c] || p.cat === c;
            return (
              <div key={c}>
                <button className={`xmono__cat ${isActive ? "xmono__cat--on" : ""}`}
                  onClick={() => {
                    if (p.cat === c && !p.sub) { p.setCat(""); setExpanded((prev) => ({ ...prev, [c]: !prev[c] })); }
                    else { p.setCat(c); p.setSub(""); setExpanded((prev) => ({ ...prev, [c]: true })); }
                  }}>
                  <span className="xmono__cat-name">{c}</span>
                  <span className="xmono__cat-n">{p.counts[c] || 0}</span>
                </button>
                {isExpanded && subs.length > 0 && (
                  <div className="xmono__subs">
                    {subs.map((s) => (
                      <button key={s} className={`xmono__sub ${p.sub === s ? "xmono__sub--on" : ""}`}
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
      <main className="xmain">
        <div className="xcount xcount--mono">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="minimal" />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   V10 — ARC BROWSER
   Vibrant gradient sidebar, rounded, colorful but clean
   ═══════════════════════════════════════════════════════════════ */
function V10(p: SP) {
  return (
    <div className="xlayout xlayout--arc">
      <aside className="xside xside--arc">
        <input className="xsearch xsearch--arc" placeholder="Search..." value={p.search} onChange={(e) => p.setSearch(e.target.value)} />
        <SidebarList {...p} variant="arc" />
      </aside>
      <main className="xmain">
        <div className="xcount">{p.articles.length} article{p.articles.length !== 1 ? "s" : ""}</div>
        <Results articles={p.articles} card="notion" />
      </main>
    </div>
  );
}
