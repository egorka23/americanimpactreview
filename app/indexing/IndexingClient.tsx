"use client";

import { useEffect } from "react";
import Link from "next/link";
import TriangleNav from "@/components/TriangleNav";

/* ── Badge data ── */
const badges = [
  {
    name: "Google Scholar",
    status: "Indexed",
    color: "#4285F4",
    url: "https://scholar.google.com/citations?user=Lso2fHIAAAAJ",
    comment:
      "Articles appear in Google Scholar within days of publication. Discoverable by 300M+ researchers worldwide.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        {/* Mortarboard */}
        <polygon points="12,2 2,8.5 12,15 22,8.5" stroke="#4285F4" strokeWidth="1.5" fill="rgba(66,133,244,0.08)" strokeLinejoin="round" />
        {/* Tassel */}
        <line x1="22" y1="8.5" x2="22" y2="14" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="22" cy="15" r="1" fill="#4285F4" />
        {/* "A" shape — book/body */}
        <path d="M6,11.5 v6.5 a6,6 0 0 0 12,0 v-6.5" stroke="#4285F4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* "A" crossbar */}
        <line x1="7.5" y1="16" x2="16.5" y2="16" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Crossref",
    status: "Member - DOI Assigned",
    color: "#F36F21",
    url: "https://www.crossref.org",
    comment:
      "Every article receives a permanent DOI. Citations tracked automatically across all academic databases worldwide.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="12" r="6" stroke="#F36F21" strokeWidth="2.2" fill="none" />
        <circle cx="16" cy="12" r="6" stroke="#F36F21" strokeWidth="2.2" fill="none" />
      </svg>
    ),
  },
  {
    name: "Open Access",
    status: "CC BY 4.0",
    color: "#F68212",
    url: "https://www.budapestopenaccessinitiative.org",
    comment:
      "All articles freely available immediately upon publication. Authors retain copyright. Readers can share and reuse under Creative Commons license.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#F68212" strokeWidth="2" fill="none" />
        <path
          d="M12 6v1a5 5 0 0 0-5 5"
          stroke="#F68212"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="12" cy="14" r="3" stroke="#F68212" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    name: "ORCID",
    status: "Integrated",
    color: "#A6CE39",
    url: "https://orcid.org",
    comment:
      "Author identities verified and linked to global researcher profiles. Ensures proper attribution across all platforms and databases.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 256 256">
        <circle cx="128" cy="128" r="128" fill="#A6CE39" />
        <path
          d="M86.3 186.2H70.9V79.1h15.4v107.1zM78.6 47.2c-5.7 0-10.3 4.6-10.3 10.3s4.6 10.3 10.3 10.3 10.3-4.6 10.3-10.3-4.6-10.3-10.3-10.3z"
          fill="#fff"
        />
        <path
          d="M108.9 79.1h41.6c39.6 0 57.1 30.3 57.1 53.6 0 27.3-21.3 53.6-56.5 53.6h-42.2V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    name: "OpenAlex",
    status: "Indexed",
    color: "#CD4631",
    url: "https://openalex.org",
    comment:
      "Indexed in the world's largest open catalog of scholarly works. 250M+ research outputs tracked and connected.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L2 7l10 5 10-5-10-5z"
          fill="#CD4631"
          fillOpacity="0.15"
          stroke="#CD4631"
          strokeWidth="1.5"
        />
        <path
          d="M2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="#CD4631"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Semantic Scholar",
    status: "Indexed",
    color: "#1857B6",
    url: "https://www.semanticscholar.org",
    comment:
      "Discoverable through AI-powered academic search by the Allen Institute for AI. Smart citation analysis and research recommendations.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#1857B6" strokeWidth="1.8" fill="none" />
        <path d="M8 12h8M12 8v8" stroke="#1857B6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "ResearchGate",
    status: "Listed",
    color: "#00CCBB",
    url: "https://www.researchgate.net",
    comment:
      "Published articles shared and discussed on the world's largest academic social network. 25M+ researchers use the platform.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="#00CCBB" strokeWidth="1.8" fill="none" />
        <text x="12" y="17" textAnchor="middle" fill="#00CCBB" fontSize="14" fontWeight="700" fontFamily="sans-serif">
          RG
        </text>
      </svg>
    ),
  },
  {
    name: "Peer-Reviewed",
    status: "Every Article",
    color: "#059669",
    url: "/policies",
    comment:
      "Every manuscript undergoes rigorous evaluation by independent expert reviewers before publication. Double-blind review available.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    name: "501(c)(3) Nonprofit",
    status: "Verified Publisher",
    color: "#c4a87c",
    url: "https://apps.irs.gov/app/eos/detailsPage?ein=332266959&name=Global%20Talent%20Foundation&city=&state=&countryAbbr=US&dba=&type=CHARITIES,%20DETERMINATIONLETTERS,%20EPOSTCARD&orgTags=CHARITIES&orgTags=DETERMINATIONLETTERS&orgTags=EPOSTCARD",
    comment:
      "Published by Global Talent Foundation, a federally recognized nonprofit organization. EIN: 33-2266959. Verify status on IRS.gov.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4a87c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        <path d="M9 9h1m4 0h1m-6 4h1m4 0h1" />
      </svg>
    ),
  },
];

export default function IndexingClient({ articleCount }: { articleCount: number }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.gtag?.("event", "view_indexing", {
        value: 10,
        currency: "USD",
      });
    }
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Indexing &amp; Recognition</h1>
          <p>
            Where American Impact Review is indexed, who recognizes us, and why
            it matters for your research.
          </p>
          <div className="page-meta">
            <span>5 Databases &amp; Indexes</span>
            <span>DOI Assigned</span>
            <span>Open Access</span>
            <span>501(c)(3) Publisher</span>
          </div>
        </div>
      </section>

      {/* ── About our indexing (SEO / LLM text) ── */}
      <section className="page-section indexing-about">
        <p>
          American Impact Review is an open-access, peer-reviewed, multidisciplinary
          academic journal published by Global Talent Foundation, a U.S.-based
          501(c)(3) nonprofit organization (EIN: 33-2266959). The journal publishes
          original research across all academic disciplines and is committed to
          making scholarly work freely and permanently accessible.
        </p>
        <p>
          All published articles are discoverable through Google Scholar, Crossref,
          OpenAlex, Semantic Scholar, and ResearchGate. Every article receives a
          permanent Digital Object Identifier (DOI) through Crossref membership
          and is freely available under a Creative Commons CC BY 4.0 license.
          Author identities are verified through ORCID integration.
        </p>
        <p>
          The journal maintains a median turnaround time of 14 days from submission
          to first editorial decision. Every manuscript undergoes peer review by
          independent expert reviewers before publication. As of {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })},
          the journal has published {articleCount} peer-reviewed articles by
          researchers from 9+ countries worldwide.
        </p>
      </section>

      {/* ── Badges with comments ── */}
      <section className="page-section">
        <div className="indexing-grid">
          {badges.map((b) => {
            const isExternal = b.url.startsWith("http");
            const CardTag = isExternal ? "a" : Link;
            const linkProps = isExternal
              ? { href: b.url, target: "_blank", rel: "noopener noreferrer" }
              : { href: b.url };

            return (
              <CardTag key={b.name} {...(linkProps as any)} className="indexing-card">
                <div className="indexing-card__header">
                  <div className="indexing-card__icon">{b.icon}</div>
                  <div className="indexing-card__title">
                    <div className="indexing-card__name">{b.name}</div>
                    <div
                      className="indexing-card__status"
                      style={{ color: b.color }}
                    >
                      {b.status}
                    </div>
                  </div>
                </div>
                <p className="indexing-card__comment">{b.comment}</p>
              </CardTag>
            );
          })}
        </div>
      </section>

      {/* ── Transparency Metrics ── */}
      <section className="page-section indexing-metrics-section">
        <h2 className="indexing-metrics__title">Transparency Metrics</h2>
        <p className="indexing-metrics__subtitle">
          Real numbers. No &ldquo;reasonable time&rdquo; promises. We publish
          our performance so you can compare.
        </p>
        <div className="indexing-metrics-grid">
          {[
            {
              value: "14",
              unit: "days",
              label: "Median Time to First Decision",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
            {
              value: String(articleCount),
              unit: "",
              label: "Peer-Reviewed Articles Published",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              ),
            },
            {
              value: "100%",
              unit: "",
              label: "Open Access, No Paywall",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              ),
            },
            {
              value: "9+",
              unit: "",
              label: "Countries Represented by Authors",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              ),
            },
            {
              value: "DOI",
              unit: "",
              label: "Assigned to Every Published Article",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b5432a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ),
            },
          ].map((m) => (
            <div key={m.label} className="indexing-metric">
              <div className="indexing-metric__icon">{m.icon}</div>
              <div className="indexing-metric__value">
                {m.value}
                {m.unit && (
                  <span className="indexing-metric__unit">{m.unit}</span>
                )}
              </div>
              <div className="indexing-metric__label">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="page-section indexing-faq-section">
        <h2 className="indexing-metrics__title">Frequently Asked Questions</h2>
        <div className="faq-grid">
          {[
            {
              q: "Where can I find published articles?",
              a: "Articles are discoverable through Google Scholar, Crossref, OpenAlex, Semantic Scholar, and ResearchGate. They typically appear in Google Scholar within days of publication. Author profiles are linked via ORCID.",
            },
            {
              q: "How are articles made permanently citable?",
              a: "Every published article receives a permanent Digital Object Identifier (DOI) through our Crossref membership. This means the article can be cited, tracked, and found in any academic database worldwide.",
            },
            {
              q: "What does the peer review process look like?",
              a: "Every manuscript is evaluated by independent expert reviewers before publication. Double-blind review is available upon request. The median time from submission to first editorial decision is 14 days.",
            },
            {
              q: "Who is behind the journal?",
              a: "American Impact Review is published by Global Talent Foundation, a federally recognized 501(c)(3) nonprofit organization based in the United States (EIN: 33-2266959). Tax-exempt status can be verified directly on IRS.gov.",
            },
            {
              q: "Do readers need to pay for access?",
              a: "No. All articles are freely available immediately upon publication under a Creative Commons CC BY 4.0 license. No paywalls, no subscriptions, no access fees. Authors retain copyright of their work.",
            },
          ].map((faq) => (
            <details key={faq.q} className="faq-card">
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Cross-links ── */}
      <TriangleNav current="indexing" />
    </>
  );
}
