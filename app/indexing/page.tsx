import type { Metadata } from "next";
import { getAllPublishedArticles } from "@/lib/articles";
import IndexingClient from "./IndexingClient";

export const metadata: Metadata = {
  title: "Indexing & Recognition",
  description:
    "American Impact Review is indexed in Google Scholar, Crossref, OpenAlex, Semantic Scholar, ResearchGate, and ORCID. Published by Global Talent Foundation 501(c)(3).",
  alternates: {
    canonical: "https://americanimpactreview.com/indexing",
  },
  openGraph: {
    title: "Indexing & Recognition | American Impact Review",
    description:
      "American Impact Review is indexed in Google Scholar, Crossref, OpenAlex, Semantic Scholar, ResearchGate, and ORCID. Published by Global Talent Foundation 501(c)(3).",
    url: "https://americanimpactreview.com/indexing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indexing & Recognition | American Impact Review",
    description:
      "American Impact Review is indexed in Google Scholar, Crossref, OpenAlex, Semantic Scholar, ResearchGate, and ORCID.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Indexing & Recognition",
  url: "https://americanimpactreview.com/indexing",
  description:
    "Indexing, recognition, and transparency metrics for American Impact Review, a peer-reviewed multidisciplinary open access journal.",
  isPartOf: {
    "@type": "Periodical",
    name: "American Impact Review",
    url: "https://americanimpactreview.com",
    publisher: {
      "@type": "Organization",
      name: "Global Talent Foundation",
      url: "https://globaltalentfoundation.org",
    },
  },
};

export default async function IndexingPage() {
  const articles = await getAllPublishedArticles();
  const articleCount = articles.length;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <IndexingClient articleCount={articleCount} />
    </>
  );
}
