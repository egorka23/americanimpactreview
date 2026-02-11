import type { Metadata } from "next";
import GettingStartedClient from "./GettingStartedClient";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Step-by-step guide to preparing and submitting your manuscript to American Impact Review, including checklists and templates.",
  alternates: {
    canonical: "https://americanimpactreview.com/getting-started",
  },
  openGraph: {
    title: "Getting Started",
    description:
      "Step-by-step guide to preparing and submitting your manuscript to American Impact Review, including checklists and templates.",
    url: "https://americanimpactreview.com/getting-started",
  },
  twitter: {
    card: "summary_large_image",
    title: "Getting Started",
    description:
      "Step-by-step guide to preparing and submitting your manuscript to American Impact Review, including checklists and templates.",
  },
};

export default function GettingStartedPage() {
  return <GettingStartedClient />;
}
