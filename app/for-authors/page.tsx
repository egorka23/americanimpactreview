import type { Metadata } from "next";
import ForAuthorsClient from "./ForAuthorsClient";

export const metadata: Metadata = {
  title: "For Authors",
  description:
    "Submission standards, formatting guidance, and review timelines for authors publishing in American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/for-authors",
  },
  openGraph: {
    title: "For Authors",
    description:
      "Submission standards, formatting guidance, and review timelines for authors publishing in American Impact Review.",
    url: "https://americanimpactreview.com/for-authors",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Authors",
    description:
      "Submission standards, formatting guidance, and review timelines for authors publishing in American Impact Review.",
  },
};

export default function ForAuthorsPage() {
  return <ForAuthorsClient />;
}
