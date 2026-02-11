import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the American Impact Review editorial office for questions about submissions, editorial decisions, or general inquiries.",
  alternates: {
    canonical: "https://americanimpactreview.com/contact",
  },
  openGraph: {
    title: "Contact",
    description:
      "Reach the American Impact Review editorial office for questions about submissions, editorial decisions, or general inquiries.",
    url: "https://americanimpactreview.com/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact",
    description:
      "Reach the American Impact Review editorial office for questions about submissions, editorial decisions, or general inquiries.",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
