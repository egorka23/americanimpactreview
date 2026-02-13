import type { Metadata } from "next";
import { getAllArticles, getPublishedArticlesFromDB } from "@/lib/articles";
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
  const mdArticles = getAllArticles();
  let dbArticles: Awaited<ReturnType<typeof getPublishedArticlesFromDB>> = [];
  try {
    dbArticles = await getPublishedArticlesFromDB();
  } catch (err) {
    console.error("Failed to load DB articles:", err);
  }

  // Merge: DB articles take priority, deduplicate by slug
  const slugSet = new Set<string>();
  const merged = [...dbArticles, ...mdArticles].filter((a) => {
    if (slugSet.has(a.slug)) return false;
    slugSet.add(a.slug);
    return true;
  });

  const articles = merged.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.excerpt || a.content,
    slug: a.slug,
    authorUsername: a.authorUsername,
    authors: a.authors,
    category: a.category,
    subject: a.subject,
    imageUrl: a.imageUrl,
    createdAt: a.createdAt ? a.createdAt.toISOString() : null,
  }));

  return <ExploreClient articles={articles} />;
}
