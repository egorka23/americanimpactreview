"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { user } = useAuth();

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
              American Impact Review is a peer‑reviewed, open‑access, multidisciplinary journal.
              Structured publishing with ISSN, DOI, and permanent archive placement.
            </p>
            <div className="air-hero__actions">
              <Link href={user ? "/write" : "/signup"} className="air-btn air-btn--primary">
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
                <div className="val">ISSN</div>
                <div className="lbl">Registered</div>
              </div>
              <div className="air-ring-stat">
                <div className="val">DOI</div>
                <div className="lbl">Every Article</div>
              </div>
              <div className="air-ring-stat">
                <div className="val">3–5d</div>
                <div className="lbl">Screening</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="air-diagonal" />

      <section className="air-current" id="current-issue">
        <div className="air-current__inner">
          <div className="air-cover-wrap">
            <div className="air-cover">
              <div className="air-cover__photo">
                <img src="/editorial/images/pic10.jpg" alt="Journal cover" />
              </div>
              <div className="air-cover__overlay" />
              <div className="air-cover__spine" />
              <div className="air-cover__content">
                  <div className="air-cover__top">
                  <span className="air-issn">ISSN (pending)</span>
                  <span className="air-vol">Vol. 1 No. 1</span>
                </div>
                <div className="air-cover__body">
                  <div className="air-cover__logo">
                    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.4" />
                      <circle cx="24" cy="24" r="15" fill="none" stroke="#b5432a" strokeWidth="1" />
                      <circle cx="24" cy="24" r="8" fill="none" stroke="#c4a87c" strokeWidth="0.7" />
                      <circle cx="24" cy="24" r="2.5" fill="#b5432a" />
                    </svg>
                    <div className="air-cover__logo-text">American Impact<br />Review</div>
                  </div>
                  <div className="air-label">Issue 01 / Spring 2026</div>
                  <div className="air-cover__title">Professional<br />Impact<br />Edition</div>
                  <p className="air-cover__subtitle">
                    Original research and analytical reviews across multidisciplinary fields.
                  </p>
                  <div className="air-cover__meta">
                    <div className="air-cover__meta-row">
                      <span>DOI Prefix</span>
                      <strong>10.0000/air</strong>
                    </div>
                    <div className="air-cover__meta-row">
                      <span>Editor-in-Chief</span>
                      <strong>Editorial Board</strong>
                    </div>
                    <div className="air-cover__meta-row">
                      <span>Review Time</span>
                      <strong>21–35 days</strong>
                    </div>
                    <div className="air-cover__meta-row">
                      <span>Indexing</span>
                      <strong>Google Scholar-ready</strong>
                    </div>
                  </div>
                  <div className="air-cover__accent" />
                  <div className="air-cover__articles">
                    {[
                      "Applied Machine Learning in Clinical Diagnostics",
                      "Zero-Trust Architecture in Enterprise Networks",
                      "Scalable Hydrogen Storage for Grid-Level Applications"
                    ].map((title, index) => (
                      <div className="air-cover__item" key={title}>
                        <span className="air-cover__num">{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <div className="air-cover__item-title">{title}</div>
                          <div className="air-cover__item-author">[Author Placeholder]</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="air-cover__bottom">
                  <div>
                    <div className="air-publisher">American Impact Review</div>
                    <div className="air-url">americanimpactreview.com</div>
                  </div>
                  <div className="air-badges">
                    <span className="air-badge air-badge--oa">Open Access</span>
                    <span className="air-badge air-badge--pr">Peer Reviewed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="air-current__info">
            <div className="air-section-kicker">Current Issue</div>
            <div className="air-section-title">Issue 01: Professional Impact Edition</div>
            <div className="air-meta-tags">
              {["Vol. 1, No. 1", "Spring 2026", "6 Articles", "108 Pages", "Open Access"].map((tag) => (
                <span key={tag} className="air-meta-tag">{tag}</span>
              ))}
            </div>
            <p className="air-desc">
              Inaugural issue featuring peer‑reviewed articles across technology, health, energy,
              and professional impact research.
            </p>
            <div className="air-issue-details">
              <div className="air-issue-row">
                <span>DOI Registry</span>
                <strong>Assigned per article</strong>
              </div>
              <div className="air-issue-row">
                <span>License</span>
                <strong>CC BY 4.0</strong>
              </div>
              <div className="air-issue-row">
                <span>Archiving</span>
                <strong>Permanent repository</strong>
              </div>
              <div className="air-issue-row">
                <span>Eligibility</span>
                <strong>Google Scholar compliant</strong>
              </div>
            </div>
            <div className="air-toc">
              {[
                {
                  title: "Applied Machine Learning in Clinical Diagnostics",
                  summary: "Transformer-based models for early detection of pulmonary conditions.",
                  author: "Dr. Sarah Chen — Stanford University",
                  pages: "pp. 1–18"
                },
                {
                  title: "Zero-Trust Architecture in Enterprise Networks",
                  summary: "Implementation frameworks across Fortune 500 companies.",
                  author: "Miguel Rodriguez — MIT Lincoln Laboratory",
                  pages: "pp. 19–34"
                },
                {
                  title: "Scalable Hydrogen Storage for Grid-Level Applications",
                  summary: "Metal-organic framework approaches to hydrogen storage.",
                  author: "Kenji Nakamura — University of Tokyo",
                  pages: "pp. 35–52"
                }
              ].map((item, index) => (
                <div className="air-toc__item" key={item.title}>
                  <span className="air-toc__num">{String(index + 1).padStart(2, "0")}</span>
                  <div className="air-toc__info">
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                    <div className="author">{item.author}</div>
                  </div>
                  <span className="air-toc__pages">{item.pages}</span>
                </div>
              ))}
            </div>
            <div className="air-stats">
              {[
                { val: "6", label: "Articles" },
                { val: "108", label: "Pages" },
                { val: "6", label: "Fields" },
                { val: "100%", label: "Peer‑reviewed" }
              ].map((stat) => (
                <div key={stat.label} className="air-stat-card">
                  <div className="val">{stat.val}</div>
                  <div className="lbl">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="air-features" id="features">
        <div className="air-features__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Why Publish</div>
            <div className="air-section-title">Built for credibility, designed for impact</div>
          </div>
          <div className="air-features__grid">
            {[
              {
                title: "Peer‑Reviewed Publication",
                desc: "Independent editorial review with clear standards and transparent decisions.",
                badge: "ISSN & DOI Ready"
              },
              {
                title: "Evidence‑Backed Profiles",
                desc: "Long‑form features aligned to professional evidence standards.",
                badge: "Impact & Recognition"
              },
              {
                title: "Open Access",
                desc: "Free to read, free to share, no paywalls for professional visibility.",
                badge: "Open Access"
              },
              {
                title: "Downloadable Evidence Packs",
                desc: "PDF bundles, citations, and structured author profiles.",
                badge: "PDF & Shareable"
              },
              {
                title: "Multidisciplinary Scope",
                desc: "All fields of study welcome. Research, review, and perspectives.",
                badge: "12+ Fields"
              },
              {
                title: "Permanent Archive",
                desc: "Issue placement and long‑term archival access for every article.",
                badge: "Issue‑Based"
              }
            ].map((feature) => (
              <div className="air-feature-card" key={feature.title}>
                <div className="icon" />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <span className="badge">{feature.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                desc: "Upload your manuscript using the publish flow."
              },
              {
                num: "02",
                title: "Credibility Checklist",
                desc: "Confirm evidence, references, and author credentials."
              },
              {
                num: "03",
                title: "Editorial Review",
                desc: "Single‑blind review with 7–14 day feedback."
              },
              {
                num: "04",
                title: "Publish & Archive",
                desc: "Issue placement and DOI assignment upon approval."
              }
            ].map((step) => (
              <div key={step.num} className="air-step">
                <div className="air-step__num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="air-credentials">
        <div className="air-credentials__inner">
          {[
            { val: "ISSN", label: "Registered" },
            { val: "DOI", label: "Crossref Member" },
            { val: "OA", label: "Open Access" },
            { val: "501(c)(3)", label: "Nonprofit Publisher" }
          ].map((item, index) => (
            <div key={item.val} className="air-cred-item">
              <div className="val">{item.val}</div>
              <div className="lbl">{item.label}</div>
              {index < 3 ? <div className="air-cred-divider" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="air-resources" id="resources">
        <div className="air-resources__inner">
          <div className="air-section-header">
            <div className="air-section-kicker">Resources</div>
            <div className="air-section-title">Everything you need</div>
          </div>
          <div className="air-resources__grid">
            {[
              { title: "About the Journal", desc: "Mission, governance, and editorial board.", href: "/about-journal" },
              { title: "For Authors", desc: "Submission guide, templates, and timelines.", href: "/for-authors" },
              { title: "For Reviewers", desc: "Review standards and scoring criteria.", href: "/for-reviewers" },
              { title: "Publication Rules", desc: "Policies, ethics, and citation rules.", href: "/publication-rules" },
              { title: "Archive", desc: "Past issues, PDFs, and records.", href: "/archive" },
              { title: "Submit Article", desc: "Start a new submission in minutes.", href: "/write" }
            ].map((item) => (
              <Link key={item.title} href={item.href} className="air-resource-link">
                <div className="info">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <span className="arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="air-cta">
        <h2>Ready to publish?</h2>
        <p>Join a growing community of professionals making their work count.</p>
        <Link href={user ? "/write" : "/signup"} className="air-btn air-btn--primary">
          Submit Your Article
        </Link>
      </section>

    </>
  );
}
