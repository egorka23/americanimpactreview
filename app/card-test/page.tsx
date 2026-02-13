"use client";
import Link from "next/link";
import { useEffect } from "react";

const ICONS: Record<string, string> = {
  "Computer Science": `<path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/><path d="M8 17h8m-4 0v3" stroke-linecap="round"/>`,
  "Health & Biotech": `<path d="M12 4v5m0 0v5m0-5h5m-5 0H7"/><circle cx="12" cy="12" r="9"/>`,
  "AI & Data": `<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4m-5.5 5.5L10 13m4 0l3.5 3.5"/>`,
  "Sports Science": `<path d="M12 3c-1.5 3-4 5-4 8a4 4 0 008 0c0-3-2.5-5-4-8z"/><path d="M9 21h6"/>`,
  "Sports Medicine": `<path d="M4.5 12H2m3.5-5.5L4 5m5.5-1.5L10 2m7.5 3L19 4m1.5 6.5L22 12m-3.5 5.5L20 19m-5.5 1.5L14 22m-7.5-3L5 20"/><circle cx="12" cy="12" r="4"/>`,
  "Engineering": `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`,
  "Energy & Climate": `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`,
  "Human Performance": `<circle cx="12" cy="5" r="3"/><path d="M12 8v4m-3 6l3-6 3 6m-6 0h6"/>`,
  "Social Sciences": `<circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2m0-6a3 3 0 013-3h1a3 3 0 013 3v4"/>`,
  "Business": `<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/><path d="M9 9h1m4 0h1m-6 4h1m4 0h1"/>`,
  "Marketing": `<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12l2 2 4-4"/>`,
  "Art & Design": `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.01 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z"/><circle cx="7.5" cy="11.5" r="1.5"/><circle cx="10.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/>`,
  "Beauty & Wellness": `<path d="M12 3c-2 3-7 5-7 10a7 7 0 0014 0c0-5-5-7-7-10z"/><path d="M12 17v-4m-2 2h4"/>`,
};

const CATS = [
  { name: "Computer Science", color: "#2563eb" },
  { name: "Health & Biotech", color: "#059669" },
  { name: "AI & Data", color: "#7c3aed" },
  { name: "Sports Science", color: "#dc2626" },
  { name: "Sports Medicine", color: "#e11d48" },
  { name: "Engineering", color: "#475569" },
  { name: "Energy & Climate", color: "#d97706" },
  { name: "Human Performance", color: "#0891b2" },
  { name: "Social Sciences", color: "#6366f1" },
  { name: "Business", color: "#ca8a04" },
  { name: "Marketing", color: "#ea580c" },
  { name: "Art & Design", color: "#be185d" },
  { name: "Beauty & Wellness", color: "#ec4899" },
];

function CatIcon({ name, color, size = 18 }: { name: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '<circle cx="12" cy="12" r="8"/>' }} />
  );
}

const LBL = (t: string) => (
  <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#94a3b8", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(10,22,40,0.08)" }}>
    {t}
  </h2>
);

export default function CardTestPage() {
  useEffect(() => {
    document.body.classList.add("air-theme");
    return () => { document.body.classList.remove("air-theme"); };
  }, []);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem 6rem", background: "#faf8f5", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: "2rem", color: "#1a3a5c", marginBottom: "0.5rem" }}>
        Subject Areas — Text Grid Variations
      </h1>
      <p style={{ color: "#64748b", marginBottom: "4rem" }}>All based on Variant 2. Pick the best one.</p>

      {/* ═══ 2A: Original — dot + text + arrow ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2A — Original (dot + arrow)")}
        <div className="sa-grid">
          {CATS.map((c) => (
            <Link key={`a-${c.name}`} href="/explore" className="sa-2a">
              <span className="sa-dot" style={{ background: c.color }} />
              <span className="sa-name">{c.name}</span>
              <span className="sa-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2B: SVG icon instead of dot ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2B — SVG icon instead of dot")}
        <div className="sa-grid">
          {CATS.map((c) => (
            <Link key={`b-${c.name}`} href="/explore" className="sa-2b">
              <CatIcon name={c.name} color={c.color} size={18} />
              <span className="sa-name">{c.name}</span>
              <span className="sa-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2C: Icon + color hover fill ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2C — Icon + color background on hover")}
        <div className="sa-grid">
          {CATS.map((c) => (
            <Link key={`c-${c.name}`} href="/explore" className="sa-2c" data-color={c.color}
              style={{ "--cat-color": c.color, "--cat-bg": `${c.color}08` } as React.CSSProperties}>
              <span className="sa-2c-icon"><CatIcon name={c.name} color={c.color} size={18} /></span>
              <span className="sa-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2D: Icon + subtle card bg ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2D — Icon in tinted circle + card feel")}
        <div className="sa-grid">
          {CATS.map((c) => (
            <Link key={`d-${c.name}`} href="/explore" className="sa-2d">
              <span className="sa-2d-badge" style={{ background: `${c.color}12` }}>
                <CatIcon name={c.name} color={c.color} size={16} />
              </span>
              <span className="sa-name">{c.name}</span>
              <span className="sa-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2E: Minimal — just icon + text, no dividers ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2E — Ultra minimal (icon + text, no lines)")}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 28px" }}>
          {CATS.map((c) => (
            <Link key={`e-${c.name}`} href="/explore" className="sa-2e">
              <CatIcon name={c.name} color={c.color} size={16} />
              <span className="sa-name-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2F: My pick — matches homepage style ═══ */}
      <section style={{ marginBottom: "5rem" }}>
        {LBL("2F — Homepage native (two-column, gold accents, serif counter)")}
        <div className="sa-2f-grid">
          {CATS.map((c, i) => (
            <Link key={`f-${c.name}`} href="/explore" className="sa-2f">
              <span className="sa-2f-num">{String(i + 1).padStart(2, "0")}</span>
              <CatIcon name={c.name} color={c.color} size={20} />
              <span className="sa-2f-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 2G: Dark inset (like metrics section) ═══ */}
      <section style={{ marginBottom: "5rem", background: "#0a1628", borderRadius: "16px", padding: "2.5rem 2rem" }}>
        {LBL("2G — Dark inset (matches Journal Metrics section)")}
        <div className="sa-2g-grid">
          {CATS.map((c) => (
            <Link key={`g-${c.name}`} href="/explore" className="sa-2g">
              <span className="sa-2g-icon"><CatIcon name={c.name} color={c.color} size={18} /></span>
              <span className="sa-2g-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .sa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 4px 24px;
        }

        /* ── 2A ── */
        .sa-2a {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 0; text-decoration: none;
          border-bottom: 1px solid rgba(10,22,40,0.06);
          transition: border-color 0.2s;
        }
        .sa-2a:hover { border-bottom-color: rgba(10,22,40,0.18); }
        .sa-2a:hover .sa-arrow { color: #1a3a5c; transform: translateX(2px); }
        .sa-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sa-name { font-family: 'Montserrat', sans-serif; font-size: 0.9rem; font-weight: 500; color: #334155; }
        .sa-arrow { margin-left: auto; font-size: 0.8rem; color: #c4cdd8; transition: all 0.2s; }

        /* ── 2B ── */
        .sa-2b {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 0; text-decoration: none;
          border-bottom: 1px solid rgba(10,22,40,0.06);
          transition: border-color 0.2s;
        }
        .sa-2b:hover { border-bottom-color: rgba(10,22,40,0.18); }
        .sa-2b:hover .sa-arrow { color: #1a3a5c; transform: translateX(2px); }
        .sa-2b svg { flex-shrink: 0; }

        /* ── 2C ── */
        .sa-2c {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; text-decoration: none;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .sa-2c:hover { background: var(--cat-bg); }
        .sa-2c-icon { flex-shrink: 0; display: flex; }

        /* ── 2D ── */
        .sa-2d {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0; text-decoration: none;
          border-bottom: 1px solid rgba(10,22,40,0.05);
          transition: border-color 0.2s;
        }
        .sa-2d:hover { border-bottom-color: rgba(10,22,40,0.15); }
        .sa-2d:hover .sa-arrow { color: #1a3a5c; transform: translateX(2px); }
        .sa-2d-badge {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── 2E ── */
        .sa-2e {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 0; text-decoration: none;
          transition: opacity 0.2s;
        }
        .sa-2e:hover { opacity: 0.7; }
        .sa-name-sm { font-family: 'Montserrat', sans-serif; font-size: 0.85rem; font-weight: 500; color: #475569; }

        /* ── 2F ── */
        .sa-2f-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
        }
        .sa-2f {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 8px; text-decoration: none;
          border-bottom: 1px solid rgba(10,22,40,0.06);
          transition: background 0.2s;
        }
        .sa-2f:hover { background: rgba(196,168,124,0.06); }
        .sa-2f-num {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 0.8rem; font-weight: 600;
          color: #c4a87c; min-width: 22px;
        }
        .sa-2f-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.92rem; font-weight: 600; color: #1a3a5c;
        }
        .sa-2f svg { flex-shrink: 0; }

        /* ── 2G ── */
        .sa-2g-grid {
          display: flex; flex-wrap: wrap; gap: 8px;
          justify-content: center;
        }
        .sa-2g {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; text-decoration: none;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          transition: all 0.2s;
        }
        .sa-2g:hover {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.04);
        }
        .sa-2g-icon { display: flex; flex-shrink: 0; }
        .sa-2g-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82rem; font-weight: 500;
          color: rgba(255,255,255,0.7);
        }
        .sa-2g:hover .sa-2g-name { color: rgba(255,255,255,0.95); }

        @media (max-width: 600px) {
          .sa-2f-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
