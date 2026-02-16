export default function JsonLd() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://americanimpactreview.com/#organization",
      name: "Global Talent Foundation",
      url: "https://americanimpactreview.com",
      logo: "https://americanimpactreview.com/logo.png",
      sameAs: [
        "https://www.linkedin.com/company/american-impact-review",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://americanimpactreview.com/#website",
      name: "American Impact Review",
      url: "https://americanimpactreview.com",
      publisher: {
        "@id": "https://americanimpactreview.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target:
          "https://americanimpactreview.com/explore?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Periodical",
      "@id": "https://americanimpactreview.com/#periodical",
      name: "American Impact Review",
      alternateName: "Am. Impact Rev.",
      publisher: {
        "@id": "https://americanimpactreview.com/#organization",
      },
      url: "https://americanimpactreview.com",
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
