import type { Metadata } from "next";
import ForReviewersClient from "./ForReviewersClient";

export const metadata: Metadata = {
  title: "For Reviewers",
  description:
    "Reviewer guidelines, ethical responsibilities, and application form for peer reviewers at American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/for-reviewers",
  },
  openGraph: {
    title: "For Reviewers",
    description:
      "Reviewer guidelines, ethical responsibilities, and application form for peer reviewers at American Impact Review.",
    url: "https://americanimpactreview.com/for-reviewers",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Reviewers",
    description:
      "Reviewer guidelines, ethical responsibilities, and application form for peer reviewers at American Impact Review.",
  },
};

export default function ForReviewersPage() {
  return <ForReviewersClient />;
}
