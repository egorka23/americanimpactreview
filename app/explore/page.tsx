import type { Metadata } from "next";
import { getAllPublishedArticles } from "@/lib/articles";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Articles",
  description:
    "Browse and search peer-reviewed research articles across multiple disciplines published in American Impact Review.",
  alternates: {
    canonical: "https://americanimpactreview.com/explore",
  },
  openGraph: {
    title: "Explore Articles",
    description:
      "Browse and search peer-reviewed research articles across multiple disciplines published in American Impact Review.",
    url: "https://americanimpactreview.com/explore",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Articles",
    description:
      "Browse and search peer-reviewed research articles across multiple disciplines published in American Impact Review.",
  },
};

export default async function ExplorePage() {
  const allArticles = await getAllPublishedArticles();

  const articles = allArticles.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.excerpt || a.content,
    slug: a.slug,
    authorUsername: a.authorUsername,
    authors: a.authors,
    category: a.category,
    subject: a.subject,
    imageUrl: a.imageUrl,
    viewCount: a.viewCount ?? 0,
    createdAt: a.createdAt ? a.createdAt.toISOString() : null,
  }));

  return <ExploreClient articles={articles} />;
}
