import type { Metadata } from "next";
import AboutJournalClient from "./AboutJournalClient";

export const metadata: Metadata = {
  title: "About the Journal",
  description:
    "Learn about American Impact Review, a multidisciplinary peer-reviewed open-access journal published by Global Talent Foundation.",
  alternates: {
    canonical: "https://americanimpactreview.com/about-journal",
  },
  openGraph: {
    title: "About the Journal",
    description:
      "Learn about American Impact Review, a multidisciplinary peer-reviewed open-access journal published by Global Talent Foundation.",
    url: "https://americanimpactreview.com/about-journal",
  },
  twitter: {
    card: "summary_large_image",
    title: "About the Journal",
    description:
      "Learn about American Impact Review, a multidisciplinary peer-reviewed open-access journal published by Global Talent Foundation.",
  },
};

export default function AboutJournalPage() {
  return <AboutJournalClient />;
}
