export default function JsonLd() {
  const BASE = "https://americanimpactreview.com";

  const structuredData = [
    /* ── Organization ── */
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Global Talent Foundation",
      alternateName: "GTF",
      url: BASE,
      logo: `${BASE}/logo.png`,
      description:
        "Global Talent Foundation is a 501(c)(3) nonprofit organization that publishes American Impact Review, a peer-reviewed multidisciplinary open-access journal.",
      nonprofitStatus: "Nonprofit501c3",
      contactPoint: {
        "@type": "ContactPoint",
        email: "editor@americanimpactreview.com",
        contactType: "editorial",
        availableLanguage: ["English"],
      },
      sameAs: [
        "https://www.linkedin.com/company/american-impact-review",
      ],
    },

    /* ── WebSite ── */
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      name: "American Impact Review",
      alternateName: "AIR",
      url: BASE,
      publisher: { "@id": `${BASE}/#organization` },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE}/explore?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },

    /* ── Periodical (journal) ── */
    {
      "@context": "https://schema.org",
      "@type": "Periodical",
      "@id": `${BASE}/#periodical`,
      name: "American Impact Review",
      alternateName: "Am. Impact Rev.",
      url: BASE,
      publisher: { "@id": `${BASE}/#organization` },
      description:
        "A peer-reviewed, open-access, multidisciplinary journal publishing original research across Computer Science, Health Sciences, AI, Sports Science, Energy and more.",
      isAccessibleForFree: true,
      inLanguage: "en-US",
    },

    /* ── SiteNavigationElement — key pages for sitelinks ── */
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${BASE}/#navigation`,
      name: "Main Navigation",
      itemListElement: [
        {
          "@type": "SiteNavigationElement",
          position: 1,
          name: "Submit a Manuscript",
          description: "Submit your research paper to American Impact Review",
          url: `${BASE}/submit`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 2,
          name: "Browse Articles",
          description: "Explore published peer-reviewed articles",
          url: `${BASE}/explore`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 3,
          name: "About the Journal",
          description: "Mission, scope, and journal information",
          url: `${BASE}/about-journal`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 4,
          name: "Editorial Board",
          description: "Meet the editors and advisory board members",
          url: `${BASE}/editorial-board`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 5,
          name: "Author Guidelines",
          description: "Instructions and requirements for authors",
          url: `${BASE}/for-authors`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 6,
          name: "Submission Guidelines",
          description: "Formatting rules and publication standards",
          url: `${BASE}/publication-rules`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 7,
          name: "Indexing & Recognition",
          description: "Database coverage and quality metrics",
          url: `${BASE}/indexing`,
        },
        {
          "@type": "SiteNavigationElement",
          position: 8,
          name: "Contact",
          description: "Get in touch with the editorial team",
          url: `${BASE}/contact`,
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
