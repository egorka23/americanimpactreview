import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
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
    "/pricing",
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

  const articleEntries = getAllArticles().map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.publishedAt || article.createdAt || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...articleEntries];
}
