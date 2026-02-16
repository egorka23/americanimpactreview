interface ArticleJsonLdProps {
  title: string;
  authors: string[];
  orcids?: string[];
  publishedAt: string | null;
  createdAt?: string | null;
  receivedAt?: string | null;
  acceptedAt?: string | null;
  description: string;
  slug: string;
  imageUrl: string;
  doi?: string | null;
  keywords?: string[];
  openAccess?: boolean;
  license?: string | null;
}

export default function ArticleJsonLd({
  title,
  authors,
  orcids,
  publishedAt,
  createdAt,
  receivedAt,
  acceptedAt,
  description,
  slug,
  imageUrl,
  doi,
  keywords,
  openAccess,
  license,
}: ArticleJsonLdProps) {
  const articleUrl = `https://americanimpactreview.com/article/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    author: authors.map((name, i) => {
      const orcid = orcids?.[i];
      const validOrcid = orcid && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid) ? orcid : null;
      return {
        "@type": "Person",
        name,
        ...(validOrcid ? { sameAs: `https://orcid.org/${validOrcid}` } : {}),
      };
    }),
    datePublished: publishedAt || createdAt || undefined,
    ...(receivedAt ? { dateReceived: receivedAt } : {}),
    ...(acceptedAt ? { dateAccepted: acceptedAt } : {}),
    description,
    url: articleUrl,
    image: imageUrl.startsWith("http")
      ? imageUrl
      : `https://americanimpactreview.com${imageUrl}`,
    publisher: {
      "@id": "https://americanimpactreview.com/#organization",
    },
    isPartOf: {
      "@id": "https://americanimpactreview.com/#periodical",
    },
    volumeNumber: "1",
    issueNumber: "1",
    isAccessibleForFree: openAccess ?? true,
    ...(license ? { license } : {}),
    ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
    ...(doi ? { sameAs: `https://doi.org/${doi}` } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
