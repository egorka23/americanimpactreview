"use client";

import { useState } from "react";

/* ─────────── sample data ─────────── */
const article = {
  category: "Sports Medicine",
  articleType: "Research Article",
  title:
    "Longitudinal Physiological Monitoring and Evidence-Based Training Periodization in Junior Cross-Country Skiers",
  publishedAt: "2/10/2026",
  receivedAt: "1/20/2026",
  acceptedAt: "2/5/2026",
  doi: "Pending",
  authors: ["Alex Ver"],
  affiliations: ["College of Sport Sciences, Qatar University, Doha, Qatar"],
  keywords: [
    "cross-country skiing",
    "physiological monitoring",
    "anaerobic threshold",
    "training periodization",
    "youth athletes",
    "stroke volume",
    "heart rate variability",
    "longitudinal case study",
  ],
};

/* ─────────────────────────────────── */
/*  VARIANT A — "Nature Briefings"    */
/*  Horizontal ribbon, single-line    */
/* ─────────────────────────────────── */
function VariantA() {
  return (
    <header className="va-hero">
      <div className="va-top">
        <span className="va-cat">{article.category}</span>
        <span className="va-type">{article.articleType}</span>
        <span className="va-divider" />
        <span className="va-date">Published {article.publishedAt}</span>
        <span className="va-doi">DOI: {article.doi}</span>
      </div>
      <h1 className="va-title">{article.title}</h1>
      <div className="va-bottom">
        <div className="va-authors">
          {article.authors.map((a) => (
            <span key={a} className="va-author">{a}</span>
          ))}
          <span className="va-affil">{article.affiliations[0]}</span>
        </div>
        <div className="va-meta-row">
          <div className="va-dates">
            <span>Received {article.receivedAt}</span>
            <span>Accepted {article.acceptedAt}</span>
          </div>
          <div className="va-keywords">
            {article.keywords.map((k) => (
              <span key={k} className="va-kw">{k}</span>
            ))}
          </div>
        </div>
        <div className="va-actions">
          <button className="va-btn">Share</button>
          <button className="va-btn va-btn--pdf">Download PDF</button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────── */
/*  VARIANT B — "The Lancet"          */
/*  Left accent bar, tight stacking   */
/* ─────────────────────────────────── */
function VariantB() {
  return (
    <header className="vb-hero">
      <div className="vb-accent" />
      <div className="vb-content">
        <div className="vb-badges">
          <span className="vb-cat">{article.category}</span>
          <span className="vb-type">{article.articleType}</span>
        </div>
        <h1 className="vb-title">{article.title}</h1>
        <p className="vb-author-line">
          {article.authors.join(", ")}
          <span className="vb-affil"> — {article.affiliations[0]}</span>
        </p>
        <div className="vb-meta-strip">
          <span>Published {article.publishedAt}</span>
          <span className="vb-dot" />
          <span>Received {article.receivedAt}</span>
          <span className="vb-dot" />
          <span>Accepted {article.acceptedAt}</span>
          <span className="vb-dot" />
          <span>DOI: {article.doi}</span>
        </div>
        <div className="vb-keywords">
          {article.keywords.map((k) => (
            <span key={k} className="vb-kw">{k}</span>
          ))}
        </div>
        <div className="vb-actions">
          <button className="vb-btn">Share</button>
          <button className="vb-btn vb-btn--pdf">Download PDF</button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────── */
/*  VARIANT C — "NEJM Card"           */
/*  Compact card, top-aligned chips   */
/* ─────────────────────────────────── */
function VariantC() {
  return (
    <header className="vc-hero">
      <div className="vc-top-bar">
        <div className="vc-badges">
          <span className="vc-cat">{article.category}</span>
          <span className="vc-type">{article.articleType}</span>
        </div>
        <div className="vc-actions">
          <button className="vc-btn">Share</button>
          <button className="vc-btn vc-btn--pdf">PDF</button>
        </div>
      </div>
      <h1 className="vc-title">{article.title}</h1>
      <p className="vc-author-line">
        {article.authors.join(", ")}
        <span className="vc-affil"> · {article.affiliations[0]}</span>
      </p>
      <div className="vc-grid">
        <div className="vc-cell">
          <span className="vc-label">Published</span>
          <span>{article.publishedAt}</span>
        </div>
        <div className="vc-cell">
          <span className="vc-label">Received</span>
          <span>{article.receivedAt}</span>
        </div>
        <div className="vc-cell">
          <span className="vc-label">Accepted</span>
          <span>{article.acceptedAt}</span>
        </div>
        <div className="vc-cell">
          <span className="vc-label">DOI</span>
          <span>{article.doi}</span>
        </div>
      </div>
      <div className="vc-keywords">
        {article.keywords.map((k) => (
          <span key={k} className="vc-kw">{k}</span>
        ))}
      </div>
    </header>
  );
}

/* ─────────────────────────────────── */
/*  VARIANT D — "Science Minimal"     */
/*  Ultra clean, no box, typographic  */
/* ─────────────────────────────────── */
function VariantD() {
  return (
    <header className="vd-hero">
      <span className="vd-overline">{article.category} · {article.articleType}</span>
      <h1 className="vd-title">{article.title}</h1>
      <div className="vd-byline">
        <span className="vd-authors">{article.authors.join(", ")}</span>
        <span className="vd-affil">{article.affiliations[0]}</span>
      </div>
      <div className="vd-rule" />
      <div className="vd-meta-row">
        <span>Published {article.publishedAt}</span>
        <span>Received {article.receivedAt}</span>
        <span>Accepted {article.acceptedAt}</span>
        <span>DOI: {article.doi}</span>
      </div>
      <div className="vd-keywords">
        {article.keywords.map((k) => (
          <span key={k} className="vd-kw">{k}</span>
        ))}
      </div>
      <div className="vd-actions">
        <button className="vd-btn">Share</button>
        <button className="vd-btn vd-btn--pdf">Download PDF</button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────── */
/*  VARIANT E — "Cell Press"          */
/*  Two-column split, bold header     */
/* ─────────────────────────────────── */
function VariantE() {
  return (
    <header className="ve-hero">
      <div className="ve-left">
        <div className="ve-badges">
          <span className="ve-cat">{article.category}</span>
          <span className="ve-type">{article.articleType}</span>
        </div>
        <h1 className="ve-title">{article.title}</h1>
        <p className="ve-author-line">{article.authors.join(", ")}</p>
        <p className="ve-affil">{article.affiliations[0]}</p>
      </div>
      <div className="ve-right">
        <div className="ve-meta-block">
          <div className="ve-cell"><span className="ve-label">Published</span><span>{article.publishedAt}</span></div>
          <div className="ve-cell"><span className="ve-label">Received</span><span>{article.receivedAt}</span></div>
          <div className="ve-cell"><span className="ve-label">Accepted</span><span>{article.acceptedAt}</span></div>
          <div className="ve-cell"><span className="ve-label">DOI</span><span>{article.doi}</span></div>
        </div>
        <div className="ve-keywords">
          {article.keywords.map((k) => (
            <span key={k} className="ve-kw">{k}</span>
          ))}
        </div>
        <div className="ve-actions">
          <button className="ve-btn">Share</button>
          <button className="ve-btn ve-btn--pdf">Download PDF</button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────── */
/*  PAGE                               */
/* ─────────────────────────────────── */
const variants = [
  { id: "A", name: "Nature Briefings", desc: "Горизонтальная лента, всё в одну линию сверху, плотная компоновка", component: VariantA },
  { id: "B", name: "The Lancet", desc: "Цветная полоса-акцент слева, вертикальный стек, элегантный минимализм", component: VariantB },
  { id: "C", name: "NEJM Card", desc: "Компактная карточка с верхней панелью, кнопки справа вверху", component: VariantC },
  { id: "D", name: "Science Minimal", desc: "Ультра-чистый, без рамки, только типографика и линия-разделитель", component: VariantD },
  { id: "E", name: "Cell Press", desc: "Двухколоночный split: заголовок слева, мета-данные справа", component: VariantE },
];

export default function DesignComparePage() {
  const [active, setActive] = useState("A");
  const V = variants.find((v) => v.id === active)!;
  const Component = V.component;

  return (
    <div className="dc-page">
      <style>{globalStyles}</style>
      <div className="dc-nav">
        <h2 className="dc-heading">Article Hero — Design Variants</h2>
        <p className="dc-sub">5 вариантов компактного hero-блока для научного журнала</p>
        <div className="dc-tabs">
          {variants.map((v) => (
            <button
              key={v.id}
              className={`dc-tab ${active === v.id ? "dc-tab--active" : ""}`}
              onClick={() => setActive(v.id)}
            >
              <strong>{v.id}</strong> {v.name}
            </button>
          ))}
        </div>
        <p className="dc-desc">{V.desc}</p>
      </div>
      <div className="dc-preview">
        <Component />
      </div>
    </div>
  );
}

/* ─────────────────────────────────── */
/*           ALL STYLES                */
/* ─────────────────────────────────── */
const globalStyles = `
/* ─── Page shell ─── */
.dc-page {
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  color: #0f172a;
}
.dc-heading { font-size: 1.4rem; margin: 0 0 0.25rem; }
.dc-sub { color: #64748b; font-size: 0.85rem; margin: 0 0 1rem; }
.dc-tabs {
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;
}
.dc-tab {
  padding: 0.4rem 0.85rem; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 0.8rem; cursor: pointer; transition: all .15s;
}
.dc-tab:hover { background: #f8fafc; }
.dc-tab--active { background: #1B2A4A; color: #fff; border-color: #1B2A4A; }
.dc-desc { font-size: 0.82rem; color: #64748b; margin: 0 0 1.5rem; font-style: italic; }
.dc-preview { min-height: 200px; }

/* ═══════════════════════════════════ */
/* VARIANT A — Nature Briefings       */
/* ═══════════════════════════════════ */
.va-hero {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(10,22,40,.08), 0 1px 3px rgba(10,22,40,.04);
  padding: 1.5rem 2rem;
}
.va-top {
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
  margin-bottom: 0.75rem; font-size: 0.78rem; color: #64748b;
}
.va-cat {
  background: #1B2A4A; color: #fff; padding: 0.2rem 0.6rem; border-radius: 4px;
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
}
.va-type {
  background: #0ea5e9; color: #fff; padding: 0.2rem 0.6rem; border-radius: 4px;
  font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
}
.va-divider { width: 1px; height: 16px; background: #cbd5e1; }
.va-date { font-weight: 600; color: #334155; }
.va-doi { color: #94a3b8; }
.va-title {
  font-size: 1.85rem; line-height: 1.2; font-weight: 800; margin: 0 0 1rem;
  letter-spacing: -0.02em;
}
.va-bottom { display: flex; flex-direction: column; gap: 0.75rem; }
.va-authors { font-size: 0.9rem; }
.va-author { font-weight: 700; color: #0f172a; }
.va-affil { color: #64748b; font-size: 0.82rem; margin-left: 0.4rem; }
.va-meta-row { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
.va-dates { display: flex; gap: 1rem; font-size: 0.75rem; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
.va-keywords { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.va-kw {
  padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem;
  background: #f1f5f9; color: #475569; font-weight: 500;
}
.va-actions { display: flex; gap: 0.4rem; }
.va-btn {
  padding: 0.35rem 0.7rem; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #f8fafc; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: #334155;
}
.va-btn--pdf { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

/* ═══════════════════════════════════ */
/* VARIANT B — The Lancet             */
/* ═══════════════════════════════════ */
.vb-hero {
  display: flex; background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(10,22,40,.08), 0 1px 3px rgba(10,22,40,.04);
  overflow: hidden;
}
.vb-accent { width: 5px; background: linear-gradient(180deg, #0ea5e9, #6366f1); flex-shrink: 0; }
.vb-content { padding: 1.25rem 1.75rem; flex: 1; }
.vb-badges { display: flex; gap: 0.35rem; margin-bottom: 0.6rem; }
.vb-cat {
  padding: 0.18rem 0.55rem; border-radius: 3px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  background: #1B2A4A; color: #fff;
}
.vb-type {
  padding: 0.18rem 0.55rem; border-radius: 3px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  background: #eff6ff; color: #1d4ed8;
}
.vb-title {
  font-size: 1.65rem; line-height: 1.2; font-weight: 800; margin: 0 0 0.5rem;
  letter-spacing: -0.015em; color: #0f172a;
}
.vb-author-line { font-size: 0.88rem; margin: 0 0 0.6rem; font-weight: 600; color: #0f172a; }
.vb-affil { font-weight: 400; color: #64748b; }
.vb-meta-strip {
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.6rem;
}
.vb-dot { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
.vb-keywords { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.75rem; }
.vb-kw {
  padding: 0.12rem 0.45rem; border-radius: 3px; font-size: 0.68rem;
  background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; font-weight: 500;
}
.vb-actions { display: flex; gap: 0.4rem; }
.vb-btn {
  padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #f8fafc; font-size: 0.72rem; font-weight: 600; cursor: pointer; color: #334155;
}
.vb-btn--pdf { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

/* ═══════════════════════════════════ */
/* VARIANT C — NEJM Card              */
/* ═══════════════════════════════════ */
.vc-hero {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(10,22,40,.08), 0 1px 3px rgba(10,22,40,.04);
  padding: 1.25rem 1.75rem;
}
.vc-top-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.75rem;
}
.vc-badges { display: flex; gap: 0.35rem; }
.vc-cat {
  padding: 0.18rem 0.5rem; border-radius: 999px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  background: #1B2A4A; color: #fff;
}
.vc-type {
  padding: 0.18rem 0.5rem; border-radius: 999px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  background: #dbeafe; color: #1e40af;
}
.vc-actions { display: flex; gap: 0.35rem; }
.vc-btn {
  padding: 0.28rem 0.55rem; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #f8fafc; font-size: 0.7rem; font-weight: 600; cursor: pointer; color: #334155;
}
.vc-btn--pdf { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
.vc-title {
  font-size: 1.7rem; line-height: 1.18; font-weight: 800; margin: 0 0 0.5rem;
  letter-spacing: -0.015em;
}
.vc-author-line { font-size: 0.85rem; margin: 0 0 0.75rem; font-weight: 600; }
.vc-affil { font-weight: 400; color: #64748b; }
.vc-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0.75rem;
}
.vc-cell {
  padding: 0.5rem 0.75rem; border-right: 1px solid #e2e8f0;
  font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.15rem;
}
.vc-cell:last-child { border-right: none; }
.vc-cell:first-child { padding-left: 0; }
.vc-label {
  font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.12em;
  color: #94a3b8; font-weight: 700;
}
.vc-keywords { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.vc-kw {
  padding: 0.12rem 0.45rem; border-radius: 999px; font-size: 0.68rem;
  background: #f1f5f9; color: #475569; font-weight: 500;
}

/* ═══════════════════════════════════ */
/* VARIANT D — Science Minimal        */
/* ═══════════════════════════════════ */
.vd-hero {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(10,22,40,.08), 0 1px 3px rgba(10,22,40,.04);
  padding: 2rem 2rem 1.5rem;
}
.vd-overline {
  display: block; font-size: 0.7rem; text-transform: uppercase;
  letter-spacing: 0.12em; color: #6366f1; font-weight: 700;
  margin-bottom: 0.5rem;
}
.vd-title {
  font-size: 2rem; line-height: 1.18; font-weight: 800; margin: 0 0 0.75rem;
  letter-spacing: -0.02em; color: #0f172a;
}
.vd-byline { margin-bottom: 0.75rem; }
.vd-authors { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
.vd-affil { display: block; font-size: 0.82rem; color: #64748b; margin-top: 0.15rem; }
.vd-rule { height: 1px; background: #e2e8f0; margin-bottom: 0.75rem; }
.vd-meta-row {
  display: flex; gap: 1.5rem; flex-wrap: wrap;
  font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.75rem;
}
.vd-keywords { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.75rem; }
.vd-kw {
  padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.68rem;
  border: 1px solid #e2e8f0; color: #475569; font-weight: 500; background: transparent;
}
.vd-actions { display: flex; gap: 0.4rem; }
.vd-btn {
  padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 0.72rem; font-weight: 600; cursor: pointer; color: #334155;
}
.vd-btn--pdf { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

/* ═══════════════════════════════════ */
/* VARIANT E — Cell Press             */
/* ═══════════════════════════════════ */
.ve-hero {
  display: grid; grid-template-columns: 1.5fr 1fr;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(10,22,40,.08), 0 1px 3px rgba(10,22,40,.04);
  overflow: hidden;
}
.ve-left {
  padding: 1.5rem 1.75rem; border-right: 1px solid #f1f5f9;
}
.ve-badges { display: flex; gap: 0.35rem; margin-bottom: 0.6rem; }
.ve-cat {
  padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  background: #1B2A4A; color: #fff;
}
.ve-type {
  padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.62rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  background: #ecfdf5; color: #059669;
}
.ve-title {
  font-size: 1.6rem; line-height: 1.2; font-weight: 800; margin: 0 0 0.6rem;
  letter-spacing: -0.015em; color: #0f172a;
}
.ve-author-line { font-size: 0.88rem; font-weight: 700; color: #0f172a; margin: 0 0 0.15rem; }
.ve-affil { font-size: 0.8rem; color: #64748b; margin: 0; }
.ve-right {
  padding: 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;
  background: #fafbfc;
}
.ve-meta-block {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
}
.ve-cell { display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.82rem; }
.ve-label {
  font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.12em;
  color: #94a3b8; font-weight: 700;
}
.ve-keywords { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.ve-kw {
  padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.65rem;
  background: #fff; color: #475569; border: 1px solid #e2e8f0; font-weight: 500;
}
.ve-actions { display: flex; gap: 0.4rem; margin-top: auto; }
.ve-btn {
  padding: 0.3rem 0.65rem; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 0.72rem; font-weight: 600; cursor: pointer; color: #334155;
}
.ve-btn--pdf { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

/* ═══════════════════════════════════ */
/* Responsive                          */
/* ═══════════════════════════════════ */
@media (max-width: 640px) {
  .ve-hero { grid-template-columns: 1fr; }
  .ve-left { border-right: none; border-bottom: 1px solid #f1f5f9; }
  .vc-grid { grid-template-columns: 1fr 1fr; }
  .va-title, .vb-title, .vc-title, .vd-title, .ve-title { font-size: 1.3rem; }
}
`;
