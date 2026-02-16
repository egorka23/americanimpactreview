import type { Metadata } from "next";
import PoliciesClient from "./PoliciesClient";

export const metadata: Metadata = {
  title: "Publication Ethics & Policies",
  description:
    "Comprehensive publication ethics statement covering duties of editors, reviewers, and authors; plagiarism policy; conflict of interest; corrections and retractions; research ethics; data sharing; and open access licensing at American Impact Review. Aligned with COPE guidelines.",
  alternates: {
    canonical: "https://americanimpactreview.com/policies",
  },
  openGraph: {
    title: "Publication Ethics & Policies",
    description:
      "Comprehensive publication ethics statement covering duties of editors, reviewers, and authors; peer review; plagiarism; conflict of interest; corrections and retractions; and open access policy. Aligned with COPE guidelines.",
    url: "https://americanimpactreview.com/policies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Publication Ethics & Policies",
    description:
      "Comprehensive publication ethics statement covering duties of editors, reviewers, and authors; peer review; plagiarism; conflict of interest; corrections and retractions; and open access policy. Aligned with COPE guidelines.",
  },
};

export default function PoliciesPage() {
  return <PoliciesClient />;
}
