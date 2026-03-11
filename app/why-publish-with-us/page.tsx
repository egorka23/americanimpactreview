import type { Metadata } from "next";
import WhyPublishClient from "./WhyPublishClient";

export const metadata: Metadata = {
  title: "Why Publish With Us",
  description:
    "Publication standards, editorial commitments, and institutional information about American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/why-publish-with-us",
  },
  openGraph: {
    title: "Why Publish With Us",
    description:
      "Publication standards, editorial commitments, and institutional information about American Impact Review.",
    url: "https://americanimpactreview.com/why-publish-with-us",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why Publish With Us",
    description:
      "Publication standards, editorial commitments, and institutional information about American Impact Review.",
  },
};

export default function WhyPublishPage() {
  return <WhyPublishClient />;
}
