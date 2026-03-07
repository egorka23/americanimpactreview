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

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Indexing & Recognition",
    url: "https://americanimpactreview.com/indexing",
    description:
      "American Impact Review is indexed in Google Scholar, Crossref, OpenAlex, Semantic Scholar, and ResearchGate. Every article receives a permanent DOI. Published by Global Talent Foundation 501(c)(3).",
    isPartOf: {
      "@type": "Periodical",
      name: "American Impact Review",
      url: "https://americanimpactreview.com",
      publisher: {
        "@type": "Organization",
        name: "Global Talent Foundation",
        url: "https://globaltalentfoundation.org",
        "@id": "https://americanimpactreview.com/#publisher",
        taxID: "33-2266959",
        nonprofitStatus: "501(c)(3)",
      },
      isAccessibleForFree: true,
      license: "https://creativecommons.org/licenses/by/4.0/",
    },
    about: [
      { "@type": "Thing", name: "Google Scholar", url: "https://scholar.google.com" },
      { "@type": "Thing", name: "Crossref", url: "https://www.crossref.org" },
      { "@type": "Thing", name: "OpenAlex", url: "https://openalex.org" },
      { "@type": "Thing", name: "Semantic Scholar", url: "https://www.semanticscholar.org" },
      { "@type": "Thing", name: "ResearchGate", url: "https://www.researchgate.net" },
      { "@type": "Thing", name: "ORCID", url: "https://orcid.org" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is American Impact Review indexed in academic databases?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. American Impact Review is indexed in Google Scholar, Crossref, OpenAlex, Semantic Scholar, and ResearchGate. Articles typically appear in Google Scholar within days of publication. The journal is also integrated with ORCID for author identification.",
        },
      },
      {
        "@type": "Question",
        name: "Does every article receive a DOI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every published article receives a permanent Digital Object Identifier (DOI) through Crossref membership. DOIs ensure your work is permanently citable and discoverable across all academic databases worldwide.",
        },
      },
      {
        "@type": "Question",
        name: "Is American Impact Review peer-reviewed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every manuscript submitted to American Impact Review undergoes peer review by independent expert reviewers before publication. Double-blind review is available. The median time from submission to first editorial decision is 14 days.",
        },
      },
      {
        "@type": "Question",
        name: "Who publishes American Impact Review?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "American Impact Review is published by Global Talent Foundation, a federally recognized 501(c)(3) nonprofit organization based in the United States (EIN: 33-2266959). Tax-exempt status can be verified directly on IRS.gov.",
        },
      },
      {
        "@type": "Question",
        name: "Is American Impact Review open access?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All articles are freely available immediately upon publication under a Creative Commons CC BY 4.0 license. There are no paywalls, subscriptions, or access fees for readers. Authors retain copyright of their work.",
        },
      },
    ],
  },
];

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
