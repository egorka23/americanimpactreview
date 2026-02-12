import type { Metadata } from "next";
import ReviewFormClient from "./ReviewFormClient";

export const metadata: Metadata = {
  title: "Submit Peer Review",
  description:
    "Submit your peer review for a manuscript under consideration at American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/review-form",
  },
};

export default function ReviewFormPage() {
  return <ReviewFormClient />;
}
