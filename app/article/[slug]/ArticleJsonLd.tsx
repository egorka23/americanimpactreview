interface ArticleJsonLdProps {
  title: string;
  authors: string[];
  publishedAt: string | null;
  description: string;
  slug: string;
  imageUrl: string;
}

export default function ArticleJsonLd({
  title,
  authors,
  publishedAt,
  description,
  slug,
  imageUrl,
}: ArticleJsonLdProps) {
  const articleUrl = `https://americanimpactreview.com/article/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    author: authors.map((name) => ({
      "@type": "Person",
      name,
    })),
    datePublished: publishedAt || undefined,
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
