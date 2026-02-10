import { getAllArticles } from "@/lib/articles";
import ExploreClient from "./ExploreClient";

export default function ExplorePage() {
  const articles = getAllArticles().map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    slug: a.slug,
    authorUsername: a.authorUsername,
    authors: a.authors,
    category: a.category,
    imageUrl: a.imageUrl,
    createdAt: a.createdAt ? a.createdAt.toISOString() : null,
  }));

  return <ExploreClient articles={articles} />;
}
