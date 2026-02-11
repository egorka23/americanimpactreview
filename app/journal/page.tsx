import type { Metadata } from "next";
import JournalClient from "./JournalClient";

export const metadata: Metadata = {
  title: "Current Issue",
  description:
    "Explore the latest published articles in American Impact Review, a continuously publishing peer-reviewed journal.",
  alternates: {
    canonical: "https://americanimpactreview.com/journal",
  },
  openGraph: {
    title: "Current Issue",
    description:
      "Explore the latest published articles in American Impact Review, a continuously publishing peer-reviewed journal.",
    url: "https://americanimpactreview.com/journal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Current Issue",
    description:
      "Explore the latest published articles in American Impact Review, a continuously publishing peer-reviewed journal.",
  },
};

export default function JournalPage() {
  return <JournalClient />;
}
