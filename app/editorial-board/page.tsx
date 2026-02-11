import type { Metadata } from "next";
import EditorialBoardClient from "./EditorialBoardClient";

export const metadata: Metadata = {
  title: "Editorial Board",
  description:
    "Meet the editors and reviewers who lead American Impact Review, ensuring rigorous peer review and editorial independence.",
  alternates: {
    canonical: "https://americanimpactreview.com/editorial-board",
  },
  openGraph: {
    title: "Editorial Board",
    description:
      "Meet the editors and reviewers who lead American Impact Review, ensuring rigorous peer review and editorial independence.",
    url: "https://americanimpactreview.com/editorial-board",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editorial Board",
    description:
      "Meet the editors and reviewers who lead American Impact Review, ensuring rigorous peer review and editorial independence.",
  },
};

export default function EditorialBoardPage() {
  return <EditorialBoardClient />;
}
