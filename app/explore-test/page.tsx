import { getAllArticles } from "@/lib/articles";
import ExploreTestClient from "./ExploreTestClient";

export default function ExploreTestPage() {
  const articles = getAllArticles().map((a) => ({
    id: a.id,
    title: a.title,
    content: a.excerpt || a.content,
    slug: a.slug,
    authorUsername: a.authorUsername,
    authors: a.authors,
    category: a.category,
    imageUrl: a.imageUrl,
    createdAt: a.createdAt ? a.createdAt.toISOString() : null,
  }));

  return <ExploreTestClient articles={articles} />;
}
