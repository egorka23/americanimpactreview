import { MetadataRoute } from "next";

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

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : path === "/explore" ? 0.9 : 0.7,
  }));
}
