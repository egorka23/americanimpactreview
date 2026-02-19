import type { Metadata } from "next";
import ReviewersClient from "./ReviewersClient";

export const metadata: Metadata = {
  title: "Peer Reviewers",
  description:
    "Peer reviewers of American Impact Review - researchers, scholars, and practitioners selected by the Editorial Board to evaluate manuscripts.",
  alternates: {
    canonical: "https://americanimpactreview.com/reviewers",
  },
  openGraph: {
    title: "Peer Reviewers | American Impact Review",
    description:
      "Peer reviewers of American Impact Review - researchers, scholars, and practitioners selected by the Editorial Board to evaluate manuscripts.",
    url: "https://americanimpactreview.com/reviewers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peer Reviewers | American Impact Review",
    description:
      "Peer reviewers of American Impact Review - researchers, scholars, and practitioners selected by the Editorial Board to evaluate manuscripts.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Peer Reviewers",
  url: "https://americanimpactreview.com/reviewers",
  description:
    "Peer reviewers of American Impact Review, a peer-reviewed multidisciplinary journal published by Global Talent Foundation.",
  isPartOf: {
    "@type": "Periodical",
    name: "American Impact Review",
    url: "https://americanimpactreview.com",
  },
};

export default function ReviewersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReviewersClient />
    </>
  );
}
