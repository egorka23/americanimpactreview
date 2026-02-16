import type { Metadata } from "next";
import PrivacyPolicyClient from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | American Impact Review",
  description:
    "How American Impact Review collects, uses, and protects your personal information.",
  alternates: {
    canonical: "https://americanimpactreview.com/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy",
    description:
      "How American Impact Review collects, uses, and protects your personal information.",
    url: "https://americanimpactreview.com/privacy-policy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description:
      "How American Impact Review collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
