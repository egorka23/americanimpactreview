import { getAllPublishedArticles } from "@/lib/articles";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allArticles = await getAllPublishedArticles();

  const sorted = [...allArticles].sort((a, b) => {
    const da = a.publishedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
    const db_ = b.publishedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
    return db_ - da;
  });

  const latest = sorted.slice(0, 6).map((a) => ({
    slug: a.slug,
    title: a.title,
    authors: a.authors ?? ["Unknown"],
    category: a.category,
    abstract: a.abstract || "",
    publishedAt: a.publishedAt
      ? a.publishedAt.toISOString()
      : a.createdAt
        ? a.createdAt.toISOString()
        : null,
  }));

  return <HomeClient articles={latest} />;
}
