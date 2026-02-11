import type { Metadata } from "next";
import PublicationRulesClient from "./PublicationRulesClient";

export const metadata: Metadata = {
  title: "Publication Rules",
  description:
    "Manuscript requirements, peer review process, and editorial standards for submissions to American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/publication-rules",
  },
  openGraph: {
    title: "Publication Rules",
    description:
      "Manuscript requirements, peer review process, and editorial standards for submissions to American Impact Review.",
    url: "https://americanimpactreview.com/publication-rules",
  },
  twitter: {
    card: "summary_large_image",
    title: "Publication Rules",
    description:
      "Manuscript requirements, peer review process, and editorial standards for submissions to American Impact Review.",
  },
};

export default function PublicationRulesPage() {
  return <PublicationRulesClient />;
}
