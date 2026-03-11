import type { Metadata } from "next";
import ForResearchersClient from "./ForResearchersClient";

export const metadata: Metadata = {
  title: "For Researchers",
  description:
    "Information for researchers considering American Impact Review for their scholarly work. Scope, review process, and publication standards.",
  alternates: {
    canonical: "https://americanimpactreview.com/for-researchers",
  },
  openGraph: {
    title: "For Researchers",
    description:
      "Information for researchers considering American Impact Review for their scholarly work. Scope, review process, and publication standards.",
    url: "https://americanimpactreview.com/for-researchers",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Researchers",
    description:
      "Information for researchers considering American Impact Review for their scholarly work.",
  },
};

export default function ForResearchersPage() {
  return <ForResearchersClient />;
}
