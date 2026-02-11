import type { Metadata } from "next";
import PoliciesClient from "./PoliciesClient";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Publication ethics, peer review policy, open access licensing, and editorial integrity standards at American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/policies",
  },
  openGraph: {
    title: "Policies",
    description:
      "Publication ethics, peer review policy, open access licensing, and editorial integrity standards at American Impact Review.",
    url: "https://americanimpactreview.com/policies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Policies",
    description:
      "Publication ethics, peer review policy, open access licensing, and editorial integrity standards at American Impact Review.",
  },
};

export default function PoliciesPage() {
  return <PoliciesClient />;
}
