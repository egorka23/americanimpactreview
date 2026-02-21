import type { Metadata } from "next";
import TermsOfUseClient from "./TermsOfUseClient";

export const metadata: Metadata = {
  title: "Terms of Use | American Impact Review",
  description:
    "Terms and conditions governing use of the American Impact Review website and services.",
  alternates: {
    canonical: "https://americanimpactreview.com/terms-of-use",
  },
  openGraph: {
    title: "Terms of Use",
    description:
      "Terms and conditions governing use of the American Impact Review website and services.",
    url: "https://americanimpactreview.com/terms-of-use",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use",
    description:
      "Terms and conditions governing use of the American Impact Review website and services.",
  },
};

export default function TermsOfUsePage() {
  return <TermsOfUseClient />;
}
