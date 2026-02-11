import type { Metadata } from "next";
import EditorialBoardClient from "./EditorialBoardClient";

export const metadata: Metadata = {
  title: "Editorial Board",
  description:
    "Editors and reviewers of American Impact Review, a peer-reviewed multidisciplinary journal.",
  alternates: {
    canonical: "https://americanimpactreview.com/editorial-board",
  },
  openGraph: {
    title: "Editorial Board",
    description:
      "Editors and reviewers of American Impact Review, a peer-reviewed multidisciplinary journal.",
    url: "https://americanimpactreview.com/editorial-board",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editorial Board",
    description:
      "Editors and reviewers of American Impact Review, a peer-reviewed multidisciplinary journal.",
  },
};

export default function EditorialBoardPage() {
  return <EditorialBoardClient />;
}
