import type { Metadata } from "next";
import SubmitClient from "./SubmitClient";

export const metadata: Metadata = {
  title: "Submit a Manuscript",
  description:
    "Submit your original research to American Impact Review. Upload your manuscript and complete the submission process online.",
  alternates: {
    canonical: "https://americanimpactreview.com/submit",
  },
  openGraph: {
    title: "Submit a Manuscript",
    description:
      "Submit your original research to American Impact Review. Upload your manuscript and complete the submission process online.",
    url: "https://americanimpactreview.com/submit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit a Manuscript",
    description:
      "Submit your original research to American Impact Review. Upload your manuscript and complete the submission process online.",
  },
};

export default function SubmitPage() {
  return <SubmitClient />;
}
