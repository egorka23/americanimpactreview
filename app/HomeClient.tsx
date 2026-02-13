"use client";

import { useEffect } from "react";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Sports Science": "#dc2626",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
};

type ArticleCard = {
  slug: string;
  title: string;
  authors: string[];
  category: string;
  abstract: string;
  publishedAt: string | null;
};

export default function HomeClient({ articles }: { articles: ArticleCard[] }) {
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
              Publish Your
              <br />
              Professional <span className="accent">Impact</span>
            </h1>
            <p>
              American Impact Review is a peer-reviewed, open-access,
              multidisciplinary journal with continuous publishing - articles are
              published immediately after acceptance, with no waiting for issue
              deadlines. Permanent archive placement for every article.
            </p>
            <div className="air-hero__actions">
              <Link href="/submit" className="air-btn air-btn--primary">
                Publish an Article
              </Link>
              <Link href="/explore" className="air-btn air-btn--outline">
                Explore Articles
              </Link>
            </div>
          </div>
          <div className="air-hero__visual">
            <div className="air-rings">
              <div className="ring" />
              <div className="ring" />
              <div className="ring" />
              <div className="ring" />
              <div className="center" />
              <div className="air-ring-stat">
                <div className="val">OA</div>
                <div className="lbl">Open Access</div>
              </div>
              <div className="air-ring-stat">
                <div className="val">PDF</div>
                <div className="lbl">Every Article</div>
              </div>
              <div className="air-ring-stat">
                <div className="val">24h</div>
                <div className="lbl">Post-Acceptance</div>
              </div>
            </div>
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
              const abstractText = article.abstract.length > 200
                ? article.abstract.slice(0, 200).replace(/\s+\S*$/, "") + "..."
                : article.abstract;
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
              { val: "24h", label: "Post-Acceptance", tip: "Articles go live within 24 hours of editorial acceptance." },
              { val: "$200", label: "Publication Fee", tip: "One-time fee charged only after acceptance. No submission fee. Waivers available." },
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
            <div className="air-section-kicker">Why Publish</div>
            <div className="air-section-title">
              Built for credibility, designed for impact
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
                title: "Evidence-Backed Profiles",
                desc: "Long-form features aligned to professional evidence standards.",
                badge: "Impact & Recognition",
                icon: "\u2605",
              },
              {
                title: "Open Access",
                desc: "Free to read, free to share, no paywalls for professional visibility.",
                badge: "Open Access",
                icon: "\u26D7",
              },
              {
                title: "Downloadable Evidence Packs",
                desc: "PDF bundles, citations, and structured author profiles.",
                badge: "PDF & Shareable",
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
          <div className="air-subjects__grid">
            {[
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
            ].map((cat) => (
              <Link
                key={cat.name}
                href="/explore"
                className="air-subject-chip"
                style={{
                  borderColor: `${cat.color}30`,
                  background: `${cat.color}08`,
                }}
              >
                <span className="air-subject-dot" style={{ background: cat.color }} />
                <span className="air-subject-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="air-how" id="how">
        <div className="air-how__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Process</div>
            <div className="air-section-title">How publishing works</div>
          </div>
          <div className="air-steps">
            {[
              {
                num: "01",
                title: "Upload",
                desc: "Upload your manuscript using the publish flow.",
              },
              {
                num: "02",
                title: "Credibility Checklist",
                desc: "Confirm evidence, references, and author credentials.",
              },
              {
                num: "03",
                title: "Editorial Review",
                desc: "Single-blind review with 7-14 day feedback.",
              },
              {
                num: "04",
                title: "Publish Immediately",
                desc: "Article goes live within 24 hours of acceptance.",
              },
            ].map((step) => (
              <div key={step.num} className="air-step">
                <div className="air-step__num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="air-how__cta">
            <Link href="/submit" className="air-btn air-btn--primary">
              Start Your Submission &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Credentials ── */}
      <section className="air-credentials">
        <div className="air-credentials__inner">
          {[
            { val: "ISSN", label: "Applied" },
            { val: "DOI", label: "Applied" },
            { val: "OA", label: "Open Access" },
            { val: "501(c)(3)", label: "Nonprofit Publisher" },
          ].map((item, index) => (
            <div key={item.val} className="air-cred-item">
              <div className="val">{item.val}</div>
              <div className="lbl">{item.label}</div>
              {index < 3 ? <div className="air-cred-divider" /> : null}
            </div>
          ))}
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
              <span className="air-update__date">Feb 2026</span>
              <span className="air-update__text">ISSN application submitted to the Library of Congress.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 2026</span>
              <span className="air-update__text">DOI registration application submitted to Crossref.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 2026</span>
              <span className="air-update__text"><a href="https://www.linkedin.com/in/alexey-karelin/" target="_blank" rel="noopener noreferrer" className="air-update__link">Alexey Karelin</a>, PhD (IEEE) joins the Editorial Board.</span>
            </div>
            <div className="air-update">
              <span className="air-update__date">Feb 2026</span>
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
                title: "Submit Article",
                desc: "Start a new submission in minutes.",
                href: "/write",
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
        <h2>Ready to publish?</h2>
        <p>
          Join a growing community of professionals making their work count.
        </p>
        <Link href="/submit" className="air-btn air-btn--primary">
          Submit Your Article
        </Link>
      </section>
    </>
  );
}
