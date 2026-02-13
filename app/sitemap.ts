import { MetadataRoute } from "next";
import { getAllPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://americanimpactreview.com";

  const staticPages = [
    "",
    "/about-journal",
    "/editorial-board",
    "/for-authors",
    "/for-reviewers",
    "/publication-rules",
    "/getting-started",
    "/journal",
    "/explore",
    "/archive",
    "/contact",
    "/policies",
    "/login",
    "/signup",
    "/submit",
  ];

  const staticEntries = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : path === "/explore" ? 0.9 : 0.7,
  }));

  const articles = await getAllPublishedArticles();
  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.publishedAt || article.createdAt || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...articleEntries];
}
