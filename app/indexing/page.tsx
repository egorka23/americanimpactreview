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
        name: "Where can I find articles published in American Impact Review?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Articles are discoverable through Google Scholar, Crossref, OpenAlex, Semantic Scholar, and ResearchGate. They typically appear in Google Scholar within days of publication. Author profiles are linked via ORCID.",
        },
      },
      {
        "@type": "Question",
        name: "How are articles made permanently citable?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every published article receives a permanent Digital Object Identifier (DOI) through Crossref membership. This means the article can be cited, tracked, and found in any academic database worldwide.",
        },
      },
      {
        "@type": "Question",
        name: "What does the peer review process look like?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every manuscript is evaluated by independent expert reviewers before publication. Double-blind review is available upon request. The median time from submission to first editorial decision is 14 days.",
        },
      },
      {
        "@type": "Question",
        name: "Who is behind American Impact Review?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "American Impact Review is published by Global Talent Foundation, a federally recognized 501(c)(3) nonprofit organization based in the United States (EIN: 33-2266959). Tax-exempt status can be verified directly on IRS.gov.",
        },
      },
      {
        "@type": "Question",
        name: "Do readers need to pay for access?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. All articles are freely available immediately upon publication under a Creative Commons CC BY 4.0 license. No paywalls, no subscriptions, no access fees. Authors retain copyright of their work.",
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
