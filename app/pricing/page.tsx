import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Article processing charges, fee waivers, and voucher program details for publishing in American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/pricing",
  },
  openGraph: {
    title: "Pricing",
    description:
      "Article processing charges, fee waivers, and voucher program details for publishing in American Impact Review.",
    url: "https://americanimpactreview.com/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing",
    description:
      "Article processing charges, fee waivers, and voucher program details for publishing in American Impact Review.",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
