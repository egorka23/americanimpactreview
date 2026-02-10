import fs from "fs";
import path from "path";
import type { Article } from "./types";

const ARTICLES_DIR = path.join(process.cwd(), "articles");

function inferCategory(title: string): string {
  const text = title.toLowerCase();
  if (
    text.includes("solar") ||
    text.includes("wind") ||
    text.includes("energy") ||
    text.includes("power") ||
    text.includes("transit") ||
    text.includes("grid")
  ) {
    return "Energy & Climate";
  }
  if (
    text.includes("ai") ||
    text.includes("algorithm") ||
    text.includes("learning") ||
    text.includes("intelligence") ||
    text.includes("bias")
  ) {
    return "AI & Data";
  }
  if (
    text.includes("health") ||
    text.includes("immuno") ||
    text.includes("vaccine") ||
    text.includes("genomic") ||
    text.includes("diagnostic")
  ) {
    return "Health & Biotech";
  }
  if (
    text.includes("robot") ||
    text.includes("autonomous") ||
    text.includes("automation") ||
    text.includes("inspection") ||
    text.includes("exoskeleton") ||
    text.includes("swarm")
  ) {
    return "Robotics & Automation";
  }
  if (
    text.includes("sleep") ||
    text.includes("cognitive") ||
    text.includes("biomechanics") ||
    text.includes("altitude") ||
    text.includes("performance")
  ) {
    return "Human Performance";
  }
  return "Impact Profile";
}

function parseArticle(filePath: string): Article {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);

  const titleLine = lines.find((line) => line.trim().startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled Article";

  const authorLine = lines.find((line) => line.toLowerCase().includes("**author:**"));
  const authorRaw = authorLine
    ? authorLine.replace(/\*\*/g, "").replace(/author:\s*/i, "").trim()
    : "Serafim A.";
  const authorName = authorRaw.split(",")[0].trim() || "Serafim A.";

  const publicationLine = lines.find((line) =>
    line.toLowerCase().includes("**publication date:**")
  );
  const publicationDateRaw = publicationLine
    ? publicationLine.replace(/\*\*/g, "").replace(/publication date:\s*/i, "").trim()
    : "";

  const slug = path.basename(filePath, ".md");
  const publishedAt = publicationDateRaw ? new Date(publicationDateRaw) : null;
  const validPublishedAt =
    publishedAt instanceof Date && !Number.isNaN(publishedAt.getTime())
      ? publishedAt
      : null;

  return {
    id: slug,
    title,
    content: raw,
    slug,
    authorId: "seed-serafim",
    authorUsername: "serafim",
    category: inferCategory(title),
    imageUrl: `https://picsum.photos/seed/${slug}/1200/800`,
    imageUrls: [],
    authors: [authorName],
    publishedAt: validPublishedAt,
    createdAt: validPublishedAt ?? new Date("2026-01-15"),
  };
}

let cachedArticles: Article[] | null = null;

export function getAllArticles(): Article[] {
  if (cachedArticles) return cachedArticles;

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort();

  cachedArticles = files.map((file) => parseArticle(path.join(ARTICLES_DIR, file)));
  return cachedArticles;
}

export function getArticleBySlug(slug: string): Article | null {
  const articles = getAllArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return getAllArticles().map((a) => a.slug);
}
