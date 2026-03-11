"use client";

import { useEffect } from "react";
import Link from "next/link";

const EyeIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Sports Science": "#dc2626",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
};

const SUBJECT_ICONS: Record<string, string> = {
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

type ArticleCard = {
  slug: string;
  title: string;
  authors: string[];
  category: string;
  abstract: string;
  viewCount: number;
  downloadCount: number;
  doi: string | null;
  publishedAt: string | null;
  coverUrl?: string;
};

function cleanAbstract(raw: string, max = 140) {
  const t = raw.replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1");
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, "") + "..." : t;
}

function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ═══════════════════════════════════════════════════════════
   Most Read — covers-only, no text duplication.
   The covers already have title, author, category on them.
   Just show beautiful covers with rank + views overlay.
   ═══════════════════════════════════════════════════════════ */
function MostReadCovers({ items }: { items: ArticleCard[] }) {
  if (!items.length) return null;
  return (
    <div className="mr">
      <div className="mr__header">
        <span className="mr__dot" />
        <span className="mr__title">Most Read</span>
      </div>
      <div className="mr__row">
        {items.slice(0, 3).map((a, i) => (
          <Link
            key={a.slug}
            href={`/article/${a.slug}`}
            className="mr__card"
            style={{ "--mr-delay": `${i * 0.12}s` } as React.CSSProperties}
          >
            <div className="mr__cover">
              <img
                src={`/article-covers/covers/${a.slug}-cover.png`}
                alt={a.title}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
            <div className="mr__meta">
              <div className="mr__stats">
                <span className="mr__stat"><EyeIcon size={10} /> {fmtViews(a.viewCount)}</span>
                <span className="mr__stat"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> {fmtViews(a.downloadCount)}</span>
              </div>
              {a.doi && <span className="mr__doi"><span className="mr__doi-badge">DOI</span>{a.doi}</span>}
            </div>
            <div className="mr__hover-info">
              <h4 className="mr__article-title">{a.title}</h4>
              <span className="mr__authors">{a.authors.join(", ")}</span>
              {a.doi && <span className="mr__doi-tooltip">{a.doi}</span>}
            </div>
            <p className="mr__article-title-mobile">{a.title}</p>
            {a.doi && <span className="mr__doi-mobile">{a.doi}</span>}
            <span className="mr__read-link">Read →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomeClient({ articles, mostRead, totalArticles, authorCountries }: { articles: ArticleCard[]; mostRead?: ArticleCard[]; totalArticles?: number; authorCountries?: number }) {

  useEffect(() => {
    document.body.classList.add("air-theme");
    const nav = document.getElementById("air-nav");
    const onScroll = () => {
      nav?.classList.toggle("air-nav--scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.body.classList.remove("air-theme");
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="air-hero">
        <div className="air-hero__inner">
          <div className="air-hero__content">
            <div className="air-hero__badge">
              <span className="dot" />
              Now Accepting Submissions
            </div>
            <h1>
              Advancing
              <br />
              Multidisciplinary <span className="accent">Research</span>
            </h1>
            <p>
              A peer-reviewed, open-access journal published by a 501(c)(3)
              nonprofit. We accept original research, reviews, and perspectives
              across all disciplines - with rigorous editorial standards and
              continuous publication.
            </p>
            <div className="air-hero__actions">
              <Link href="/submit" className="air-btn air-btn--primary">
                Submit a Manuscript
              </Link>
              <Link href="/explore" className="air-btn air-btn--outline">
                Browse Articles
              </Link>
            </div>
          </div>
          <div className="air-hero__visual air-hero__visual--articles">
            {mostRead && mostRead.length > 0 && (
              <MostReadCovers items={mostRead} />
            )}
          </div>
        </div>
      </section>

      <div className="air-diagonal" />

      {/* ── Latest Articles ── */}
      <section className="air-latest" id="latest-articles">
        <div className="air-latest__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Latest Articles</div>
            <div className="air-section-title">
              Recently published research
            </div>
            <p className="air-latest__subtitle">
              Articles are published on a rolling basis as soon as they complete
              peer review. No issue deadlines, no delays.
            </p>
          </div>
          <div className="air-latest__grid">
            {articles.map((article) => {
              const color = CATEGORY_COLORS[article.category] || "#64748b";
              const rawAbstract = article.abstract.replace(/\*\*/g, "").replace(/\*([^*]+)\*/g, "$1");
              const abstractText = rawAbstract.length > 200
                ? rawAbstract.slice(0, 200).replace(/\s+\S*$/, "") + "..."
                : rawAbstract;
              return (
                <Link
                  key={article.slug}
                  href={`/article/${article.slug}`}
                  className="ct4-card"
                >
                  <div className="ct4-header">
                    <span
                      className="ct4-cat"
                      style={{
                        background: `${color}15`,
                        color,
                        borderColor: `${color}30`,
                      }}
                    >
                      {article.category}
                    </span>
                    <span className="view-count" data-tip={`${article.viewCount} article views`}><EyeIcon size={13} /> {article.viewCount}</span>
                  </div>
                  <h3 className="ct4-title">{article.title}</h3>
                  <p className="ct4-authors">{article.authors.join(", ")}</p>
                  <p className="ct4-abstract">{abstractText}</p>
                  <div className="ct4-footer">
                    <div className="ct4-dates">
                      {article.publishedAt && (
                        <span>
                          Published{" "}
                          {new Date(article.publishedAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                    <span className="ct4-read">Read &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="air-latest__footer">
            <Link href="/explore" className="air-btn air-btn--accent">
              View all articles &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Journal Metrics ── */}
      <section className="air-metrics">
        <div className="air-metrics__inner">
          <div className="air-section-header">
            <div className="air-section-kicker" style={{ color: "#c4a87c" }}>
              Journal Metrics
            </div>
            <div
              className="air-section-title"
              style={{ color: "#ffffff" }}
            >
              Transparent publishing standards
            </div>
          </div>
          <div className="air-metrics__grid">
            {[
              { val: "100%", label: "Open Access", tip: "All articles are free to read, download, and share. No paywalls, no subscriptions." },
              { val: "7-14 Days", label: "Peer Review", tip: "All manuscripts undergo single-blind peer review with editorial decisions within 7-14 days." },
              { val: "DOI", label: "Assigned", tip: "Every article receives a unique Digital Object Identifier (DOI) via Crossref (prefix: 10.66308)." },
              { val: "501(c)(3)", label: "Nonprofit Publisher", tip: "Published by Global Talent Foundation, a registered U.S. nonprofit organization." },
              { val: "Peer-Reviewed", label: "Every Article", tip: "All manuscripts undergo independent single-blind peer review before publication." },
              { val: "Continuous", label: "Rolling Publication", tip: "No issue deadlines. Articles are published immediately after acceptance." },
            ].map((metric) => (
              <div key={metric.label} className="air-metric-card air-metric-card--tip" data-tip={metric.tip}>
                <div className="air-metric-card__val">{metric.val}</div>
                <div className="air-metric-card__label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="air-features" id="features">
        <div className="air-features__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Why Submit</div>
            <div className="air-section-title">
              Rigorous review, open access, lasting impact
            </div>
          </div>
          <div className="air-features__grid">
            {[
              {
                title: "Peer-Reviewed Publication",
                desc: "Independent editorial review with clear standards and transparent decisions.",
                badge: "Peer-Reviewed",
                icon: "\u2713",
              },
              {
                title: "Comprehensive Author Profiles",
                desc: "Detailed author information including affiliations, credentials, and research interests.",
                badge: "Author Information",
                icon: "\u2605",
              },
              {
                title: "Open Access",
                desc: "Free to read, free to share, no paywalls for professional visibility.",
                badge: "Open Access",
                icon: "\u26D7",
              },
              {
                title: "Article PDFs & Citation Data",
                desc: "Downloadable PDFs, structured citation metadata, and permanent identifiers.",
                badge: "PDF & Citation",
                icon: "\u21E9",
              },
              {
                title: "Multidisciplinary Scope",
                desc: "All fields of study welcome. Research, review, and perspectives.",
                badge: "12+ Fields",
                icon: "\u2B21",
              },
              {
                title: "Continuous Publishing",
                desc: "No issue deadlines. Articles published immediately after peer review and acceptance.",
                badge: "Rolling Publication",
                icon: "\u21BB",
              },
            ].map((feature) => (
              <div className="air-feature-card" key={feature.title}>
                <div className="icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <span className="badge">{feature.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subject Areas ── */}
      <section className="air-subjects">
        <div className="air-subjects__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Subject Areas</div>
            <div className="air-section-title">
              We publish across disciplines
            </div>
          </div>
          <div className="air-subjects__groups">
            {[
              {
                group: "Technology & Engineering",
                items: [
                  { name: "Computer Science", color: "#2563eb" },
                  { name: "AI & Data", color: "#7c3aed" },
                  { name: "Engineering", color: "#1e40af" },
                  { name: "Energy & Climate", color: "#d97706" },
                ],
              },
              {
                group: "Health & Sports",
                items: [
                  { name: "Health & Biotech", color: "#059669" },
                  { name: "Sports Science", color: "#dc2626" },
                  { name: "Sports Medicine", color: "#e11d48" },
                  { name: "Human Performance", color: "#0891b2" },
                ],
              },
              {
                group: "Business & Society",
                items: [
                  { name: "Business", color: "#ca8a04" },
                  { name: "Marketing", color: "#ea580c" },
                  { name: "Social Sciences", color: "#6366f1" },
                ],
              },
              {
                group: "Arts & Lifestyle",
                items: [
                  { name: "Art & Design", color: "#be185d" },
                  { name: "Beauty & Wellness", color: "#ec4899" },
                ],
              },
            ].map((section) => (
              <div key={section.group} className="air-subject-group">
                <h3 className="air-subject-group-title">{section.group}</h3>
                <div className="air-subjects__grid">
                  {section.items.map((cat, i) => (
                    <Link
                      key={cat.name}
                      href="/explore"
                      className="air-subject-2f"
                      style={{ "--cat-bg": `${cat.color}0a` } as React.CSSProperties}
                    >
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        dangerouslySetInnerHTML={{ __html: SUBJECT_ICONS[cat.name] || '<circle cx="12" cy="12" r="8"/>' }} />
                      <span className="air-subject-2f-name">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="air-how" id="how">
        <div className="air-how__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Submission Process</div>
            <div className="air-section-title">From manuscript to publication</div>
          </div>
          <div className="air-steps">
            {[
              {
                num: "01",
                title: "Submit",
                desc: "Upload your manuscript through the online submission system.",
              },
              {
                num: "02",
                title: "Manuscript Review",
                desc: "Formatting check, references, and compliance review.",
              },
              {
                num: "03",
                title: "Peer Review",
                desc: "Single-blind review with editorial decision in 7-14 days.",
              },
              {
                num: "04",
                title: "Publication",
                desc: "Accepted articles are published online with permanent archival. DOI assigned at publication via Crossref.",
              },
            ].map((step) => (
              <div key={step.num} className="air-step">
                <div className="air-step__num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="air-how__note">
            Editorial decisions are based on rigorous peer review. The journal
            reserves the right to reject submissions that do not meet quality
            standards. Desk rejections are issued for manuscripts outside scope
            or with insufficient methodology.
          </p>
          <div className="air-how__cta">
            <Link href="/submit" className="air-btn air-btn--primary">
              Begin Submission &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Indexed & Recognized ── */}
      <section className="air-indexed">
        <div className="air-indexed__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Indexing &amp; Recognition</div>
            <div className="air-section-title" style={{ color: "#fff" }}>
              Recognized by leading academic databases and organizations
            </div>
          </div>
          <div className="air-indexed__grid">
            {[
              {
                name: "501(c)(3)",
                url: "/about-journal",
                desc: "Nonprofit Publisher",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4a87c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>
                    <path d="M9 9h1m4 0h1m-6 4h1m4 0h1"/>
                  </svg>
                ),
              },
              {
                name: "Peer-Reviewed",
                url: "/policies",
                desc: "Every Article",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                ),
              },
              {
                name: "Google Scholar",
                url: "https://scholar.google.com",
                desc: "Indexed",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#4285F4"/>
                    <path d="M1 9.5 12 0l11 9.5" stroke="#4285F4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                name: "Crossref",
                url: "https://www.crossref.org",
                desc: "Member",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="8" cy="12" r="6" stroke="#F36F21" strokeWidth="2.2" fill="none"/>
                    <circle cx="16" cy="12" r="6" stroke="#F36F21" strokeWidth="2.2" fill="none"/>
                  </svg>
                ),
              },
              {
                name: "Open Access",
                url: "https://www.budapestopenaccessinitiative.org",
                desc: "CC BY 4.0",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#F68212" strokeWidth="2" fill="none"/>
                    <path d="M12 6v1a5 5 0 0 0-5 5" stroke="#F68212" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    <circle cx="12" cy="14" r="3" stroke="#F68212" strokeWidth="2" fill="none"/>
                  </svg>
                ),
              },
              {
                name: "ORCID",
                url: "https://orcid.org",
                desc: "Integrated",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 256 256">
                    <circle cx="128" cy="128" r="128" fill="#A6CE39"/>
                    <path d="M86.3 186.2H70.9V79.1h15.4v107.1zM78.6 47.2c-5.7 0-10.3 4.6-10.3 10.3s4.6 10.3 10.3 10.3 10.3-4.6 10.3-10.3-4.6-10.3-10.3-10.3z" fill="#fff"/>
                    <path d="M108.9 79.1h41.6c39.6 0 57.1 30.3 57.1 53.6 0 27.3-21.3 53.6-56.5 53.6h-42.2V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z" fill="#fff"/>
                  </svg>
                ),
              },
              {
                name: "OpenAlex",
                url: "https://openalex.org",
                desc: "Indexed",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#CD4631" fillOpacity="0.15" stroke="#CD4631" strokeWidth="1.5"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#CD4631" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                name: "Semantic Scholar",
                url: "https://www.semanticscholar.org",
                desc: "Indexed",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#1857B6" strokeWidth="1.8" fill="none"/>
                    <path d="M8 12h8M12 8v8" stroke="#1857B6" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
              },
            ].map((badge) => (
              <a
                key={badge.name}
                href={badge.url}
                target={badge.url.startsWith("/") ? undefined : "_blank"}
                rel={badge.url.startsWith("/") ? undefined : "noopener noreferrer"}
                className="air-indexed__badge"
              >
                <div className="air-indexed__icon">{badge.icon}</div>
                <div className="air-indexed__name">{badge.name}</div>
                <div className="air-indexed__desc">{badge.desc}</div>
              </a>
            ))}
          </div>
          <div className="air-indexed__stats">
            <div className="air-indexed__stat">
              <span className="air-indexed__stat-val">{totalArticles ?? articles.length}</span>
              <span className="air-indexed__stat-label">Peer-Reviewed Articles Published</span>
            </div>
            <div className="air-indexed__stat-divider" />
            <div className="air-indexed__stat">
              <span className="air-indexed__stat-val">{authorCountries ?? 9}+</span>
              <span className="air-indexed__stat-label">Countries Represented by Authors</span>
            </div>
            <div className="air-indexed__stat-divider" />
            <Link href="/editorial-board" className="air-indexed__stat air-indexed__stat--link">
              <span className="air-indexed__stat-val">Editorial Board</span>
              <span className="air-indexed__stat-label">8 PhD &amp; 5 MD researchers from 6 countries &rarr;</span>
            </Link>
            <div className="air-indexed__stat-divider" />
            <Link href="/indexing" className="air-indexed__stat air-indexed__stat--link">
              <span className="air-indexed__stat-val">All Indexing</span>
              <span className="air-indexed__stat-label">View full details &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Journal Updates ── */}
      <section className="air-updates">
        <div className="air-updates__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Journal Updates</div>
            <div className="air-section-title">What&apos;s happening</div>
          </div>
          <div className="air-updates__list">
            <div className="air-update">
              <span className="air-update__date">Mar 5, 2026</span>
              <span className="air-update__text">American Impact Review is now an active <a href="https://www.crossref.org/" target="_blank" rel="noopener noreferrer" className="air-update__link">Crossref</a> member. DOI prefix <strong>10.66308</strong> assigned. All published articles receive permanent DOIs.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Mar 2, 2026</span>
              <span className="air-update__text"><a href="/editorial-board/dmitry-pokhvashchev" className="air-update__link">Dmitry Pokhvashchev</a>, MD, PhD joins the Editorial Board. Emergency medicine physician and orthopedic trauma researcher at UVA Health.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Mar 1, 2026</span>
              <span className="air-update__text"><a href="/editorial-board/marina-v-shapina" className="air-update__link">Marina V. Shapina</a>, MD, PhD joins the Editorial Board. Clinical research scientist with 38+ publications in IBD, including The Lancet Gastroenterology &amp; Hepatology.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 21, 2026</span>
              <span className="air-update__text"><a href="/editorial-board/kateryna-kostrikova-phd" className="air-update__link">Kateryna Kostrikova</a>, PhD joins the Editorial Board. Olympic education and sport biomechanics researcher from Kherson State University.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 15, 2026</span>
              <span className="air-update__text"><a href="https://www.linkedin.com/in/alexey-karelin/" target="_blank" rel="noopener noreferrer" className="air-update__link">Alexey Karelin</a>, PhD joins the Editorial Board.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 10, 2026</span>
              <span className="air-update__text">ISSN application submitted to the Library of Congress.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 10, 2026</span>
              <span className="air-update__text">DOI registration approved by Crossref. Prefix 10.66308 assigned.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 8, 2026</span>
              <span className="air-update__text"><a href="https://www.linkedin.com/in/islam-salikhanov/" target="_blank" rel="noopener noreferrer" className="air-update__link">Islam Salikhanov</a>, MD, PhD joins the Editorial Board.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 1, 2026</span>
              <span className="air-update__text">Now accepting submissions across all disciplines.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Resources ── */}
      <section className="air-resources" id="resources">
        <div className="air-resources__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Resources</div>
            <div className="air-section-title">Everything you need</div>
          </div>
          <div className="air-resources__grid">
            {[
              {
                title: "About the Journal",
                desc: "Mission, governance, and editorial board.",
                href: "/about-journal",
              },
              {
                title: "For Authors",
                desc: "Submission guide, templates, and timelines.",
                href: "/for-authors",
              },
              {
                title: "For Reviewers",
                desc: "Review standards, scoring criteria, and how to join as a peer reviewer.",
                href: "/for-reviewers",
                highlight: true,
              },
              {
                title: "Publication Rules",
                desc: "Policies, ethics, and citation rules.",
                href: "/publication-rules",
              },
              {
                title: "Archive",
                desc: "All published articles, PDFs, and records.",
                href: "/archive",
              },
              {
                title: "Submit a Manuscript",
                desc: "Begin the submission and peer review process.",
                href: "/submit",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`air-resource-link${"highlight" in item && item.highlight ? " air-resource-link--highlight" : ""}`}
              >
                <div className="info">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <span className="arrow">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="air-cta">
        <h2>Submit Your Research</h2>
        <p>
          We welcome original research, systematic reviews, and perspectives
          from all disciplines. All submissions undergo independent peer review
          by qualified experts in the relevant field.
        </p>
        <Link href="/submit" className="air-btn air-btn--primary">
          Submit a Manuscript
        </Link>
      </section>
    </>
  );
}
