import fs from "fs";
import path from "path";
import type { Article } from "./types";

const ARTICLES_DIR = path.join(process.cwd(), "articles");

/**
 * Strip the markdown header block (title, authors, affiliations, publication
 * info, abstract, keywords, and horizontal rules) so that only the article
 * body text remains (typically starting from the Introduction section).
 */
function stripHeaderBlock(raw: string): string {
  const lines = raw.split(/\r?\n/);

  // Find the line index of the first numbered section heading (e.g. "## 1. Introduction")
  // or the first heading after the Keywords line.
  let bodyStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match section headings like "## 1. Introduction", "## 2. Methods", etc.
    if (/^#{1,3}\s+\d+\.?\s+/.test(trimmed)) {
      bodyStartIndex = i;
      break;
    }
  }

  // If we found a section heading, skip it and return everything after
  if (bodyStartIndex !== -1) {
    // Skip the heading line itself, start from the paragraph text
    const afterHeading = lines.slice(bodyStartIndex + 1).join("\n").trim();
    return afterHeading;
  }

  // Fallback: return everything after the last "---" separator
  let lastSeparator = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      lastSeparator = i;
    }
  }
  if (lastSeparator !== -1) {
    return lines.slice(lastSeparator + 1).join("\n").trim();
  }

  return raw;
}

/**
 * Remove markdown formatting characters from a string to produce plain text
 * suitable for card excerpts.
 */
function stripMarkdownSyntax(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")        // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1")   // bold
    .replace(/\*([^*]+)\*/g, "$1")       // italic
    .replace(/__([^_]+)__/g, "$1")       // bold (underscores)
    .replace(/_([^_]+)_/g, "$1")         // italic (underscores)
    .replace(/~~([^~]+)~~/g, "$1")       // strikethrough
    .replace(/`([^`]+)`/g, "$1")         // inline code
    .replace(/^---+$/gm, "")             // horizontal rules
    .replace(/^\s*[-*+]\s+/gm, "")       // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "")       // ordered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // images
    .replace(/\n{2,}/g, " ")             // collapse multiple newlines
    .replace(/\n/g, " ")                 // remaining newlines to spaces
    .replace(/\s{2,}/g, " ")             // collapse multiple spaces
    .trim();
}

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
    text.includes("marketing") ||
    text.includes("advertising") ||
    text.includes("martech") ||
    text.includes("consumer behavior")
  ) {
    return "Marketing";
  }
  if (
    text.includes("business") ||
    text.includes("entrepreneurship") ||
    text.includes("management strategy")
  ) {
    return "Business";
  }
  if (
    /\bai\b/.test(text) ||
    text.includes("algorithm") ||
    text.includes("machine learning") ||
    text.includes("artificial intelligence") ||
    text.includes("bias")
  ) {
    return "AI & Data";
  }
  if (
    text.includes("health") ||
    text.includes("immuno") ||
    text.includes("vaccine") ||
    text.includes("genomic")
  ) {
    return "Health & Biotech";
  }
  if (
    text.includes("diagnostic") ||
    text.includes("sports medicine") ||
    text.includes("physiological")
  ) {
    return "Sports Medicine";
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
  if (
    text.includes("sport") ||
    text.includes("athlete") ||
    text.includes("dermatoglyphics") ||
    text.includes("fingerprint") ||
    text.includes("training optimization") ||
    text.includes("wrestling") ||
    text.includes("wrestler")
  ) {
    return "Sports Science";
  }
  if (
    text.includes("monitoring") ||
    text.includes("scalability") ||
    text.includes("high-load") ||
    text.includes("microservice")
  ) {
    return "Computer Science";
  }
  return "Impact Profile";
}

/**
 * Parse the **Authors:** line to extract all author names, stripping
 * superscript numbers/symbols (unicode superscripts and plain digits after names).
 */
function parseAuthors(lines: string[]): string[] {
  const authorLine = lines.find(
    (line) =>
      line.toLowerCase().includes("**authors:**") ||
      line.toLowerCase().includes("**author:**")
  );
  if (!authorLine) return ["Serafim A."];

  // Remove bold markers and the "Authors:" / "Author:" label
  const raw = authorLine
    .replace(/\*\*/g, "")
    .replace(/authors?:\s*/i, "")
    .trim();

  // Split by comma, strip superscript characters and trailing digits
  const authors = raw
    .split(",")
    .map((name) =>
      name
        .replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "") // unicode superscripts
        .replace(/\d+$/g, "") // trailing plain digits
        .trim()
    )
    .filter(Boolean);

  return authors.length ? authors : ["Serafim A."];
}

/**
 * Parse the **Affiliations:** block. Lines start with `- ` followed by a
 * superscript number and the affiliation text.
 */
function parseAffiliations(lines: string[]): string[] {
  const affiliations: string[] = [];
  let inAffiliations = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase().startsWith("**affiliations:**") || trimmed.toLowerCase().startsWith("**affiliation:**")) {
      inAffiliations = true;
      continue;
    }

    if (inAffiliations) {
      if (trimmed.startsWith("- ")) {
        // Strip the leading "- ", superscript numbers, and clean up
        const affiliationText = trimmed
          .replace(/^-\s*/, "")
          .replace(/^[\u00B9\u00B2\u00B3\u2070-\u209F]+\s*/, "") // unicode superscripts
          .replace(/^\d+[.\s)]*\s*/, "") // plain digit with period/paren/space
          .trim();
        if (affiliationText) {
          affiliations.push(affiliationText);
        }
      } else if (trimmed === "" || trimmed.startsWith("**")) {
        // End of affiliations block
        inAffiliations = false;
      }
    }
  }

  return affiliations;
}

/**
 * Extract abstract text from between "## Abstract" heading and the "**Keywords:**" line.
 */
function parseAbstract(lines: string[]): string {
  let inAbstract = false;
  const abstractLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#{1,3}\s+abstract/i.test(trimmed)) {
      inAbstract = true;
      continue;
    }

    if (inAbstract) {
      if (trimmed.toLowerCase().startsWith("**keywords:**") || trimmed.toLowerCase().startsWith("**keyword:**")) {
        break;
      }
      if (trimmed.startsWith("## ") || trimmed === "---") {
        break;
      }
      abstractLines.push(line);
    }
  }

  return abstractLines.join("\n").trim();
}

/**
 * Parse the **Keywords:** line, split by comma.
 */
/**
 * Parse the **Images:** line - comma-separated image URLs.
 */
function parseImageUrls(lines: string[]): string[] {
  const imgLine = lines.find(
    (line) => line.toLowerCase().includes("**images:**")
  );
  if (!imgLine) return [];

  const raw = imgLine
    .replace(/\*\*/g, "")
    .replace(/images?:\s*/i, "")
    .trim();

  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

/**
 * Parse the **Figure Captions:** line - comma-separated captions.
 */
function parseFigureCaptions(lines: string[]): string[] {
  const capLine = lines.find(
    (line) => line.toLowerCase().includes("**figure captions:**")
  );
  if (!capLine) return [];

  const raw = capLine
    .replace(/\*\*/g, "")
    .replace(/figure captions?:\s*/i, "")
    .trim();

  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function parseKeywords(lines: string[]): string[] {
  const keywordLine = lines.find(
    (line) =>
      line.toLowerCase().includes("**keywords:**") ||
      line.toLowerCase().includes("**keyword:**")
  );
  if (!keywordLine) return [];

  const raw = keywordLine
    .replace(/\*\*/g, "")
    .replace(/keywords?:\s*/i, "")
    .trim();

  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function parseArticle(filePath: string): Article {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);

  const titleLine = lines.find((line) => line.trim().startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled Article";

  const authors = parseAuthors(lines);
  const affiliations = parseAffiliations(lines);
  const abstract = parseAbstract(lines);
  const keywords = parseKeywords(lines);
  const imageUrls = parseImageUrls(lines);
  const figureCaptions = parseFigureCaptions(lines);

  const publicationLine = lines.find((line) =>
    line.toLowerCase().includes("**publication date:**")
  );
  const publicationDateRaw = publicationLine
    ? publicationLine.replace(/\*\*/g, "").replace(/publication date:\s*/i, "").trim()
    : "";

  const receivedLine = lines.find((line) =>
    line.toLowerCase().includes("**received:**")
  );
  const receivedDateRaw = receivedLine
    ? receivedLine.replace(/\*\*/g, "").replace(/received:\s*/i, "").trim()
    : "";

  const acceptedLine = lines.find((line) =>
    line.toLowerCase().includes("**accepted:**")
  );
  const acceptedDateRaw = acceptedLine
    ? acceptedLine.replace(/\*\*/g, "").replace(/accepted:\s*/i, "").trim()
    : "";

  const slug = path.basename(filePath, ".md");

  const toValidDate = (raw: string): Date | null => {
    if (!raw) return null;
    const d = new Date(raw);
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  };

  const validPublishedAt = toValidDate(publicationDateRaw);
  const validReceivedAt = toValidDate(receivedDateRaw);
  const validAcceptedAt = toValidDate(acceptedDateRaw);

  // Strip header block and markdown syntax for the excerpt
  const bodyText = stripHeaderBlock(raw);
  const excerpt = stripMarkdownSyntax(bodyText).slice(0, 300);

  return {
    id: slug,
    title,
    abstract: abstract || undefined,
    content: raw,
    excerpt,
    slug,
    authorId: "seed-serafim",
    authorUsername: "serafim",
    category: inferCategory(title),
    imageUrl: `/article-covers/${slug}.svg`,
    imageUrls,
    figureCaptions: figureCaptions.length ? figureCaptions : undefined,
    authors,
    affiliations: affiliations.length ? affiliations : undefined,
    keywords: keywords.length ? keywords : undefined,
    publishedAt: validPublishedAt,
    createdAt: validPublishedAt ?? new Date("2026-01-15"),
    receivedAt: validReceivedAt || undefined,
    acceptedAt: validAcceptedAt || undefined,
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

/* ── DB-backed published articles (single source of truth) ── */

import { db } from "./db";
import { publishedArticles } from "./db/schema";
import { eq } from "drizzle-orm";

type PublishedRow = typeof publishedArticles.$inferSelect;

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(",").map((s: string) => s.trim()).filter(Boolean); }
}

function dbRowToArticle(r: PublishedRow): Article & { manuscriptUrl?: string } {
  const authors = parseJsonArray(r.authors);
  const keywords = parseJsonArray(r.keywords);
  const affiliations = parseJsonArray(r.affiliations);

  return {
    id: r.id,
    title: r.title,
    abstract: r.abstract || undefined,
    content: r.content || "",
    excerpt: r.excerpt || (r.abstract ? r.abstract.slice(0, 300) : ""),
    slug: r.slug,
    authorId: r.submissionId || r.id,
    authorUsername: r.authorUsername || "author",
    category: r.category || "Impact Profile",
    subject: r.subject || undefined,
    articleType: r.articleType || undefined,
    authors: authors.length ? authors : undefined,
    affiliations: affiliations.length ? affiliations : undefined,
    keywords: keywords.length ? keywords : undefined,
    imageUrl: `/article-covers/${r.slug}.svg`,
    imageUrls: [],
    doi: r.doi || undefined,
    publishedAt: r.publishedAt || null,
    receivedAt: r.receivedAt || undefined,
    acceptedAt: r.acceptedAt || undefined,
    createdAt: r.createdAt || null,
    manuscriptUrl: r.manuscriptUrl || undefined,
  };
}

/** Lightweight listing — no content column (saves ~240KB on 7 articles) */
export async function getAllPublishedArticles(): Promise<Article[]> {
  const rows = await db
    .select({
      id: publishedArticles.id,
      submissionId: publishedArticles.submissionId,
      title: publishedArticles.title,
      slug: publishedArticles.slug,
      abstract: publishedArticles.abstract,
      excerpt: publishedArticles.excerpt,
      category: publishedArticles.category,
      subject: publishedArticles.subject,
      authors: publishedArticles.authors,
      affiliations: publishedArticles.affiliations,
      keywords: publishedArticles.keywords,
      authorUsername: publishedArticles.authorUsername,
      articleType: publishedArticles.articleType,
      doi: publishedArticles.doi,
      manuscriptUrl: publishedArticles.manuscriptUrl,
      status: publishedArticles.status,
      publishedAt: publishedArticles.publishedAt,
      receivedAt: publishedArticles.receivedAt,
      acceptedAt: publishedArticles.acceptedAt,
      createdAt: publishedArticles.createdAt,
    })
    .from(publishedArticles)
    .where(eq(publishedArticles.status, "published"))
    .orderBy(publishedArticles.createdAt);

  // Deduplicate by submissionId (keep latest by publishedAt, then createdAt)
  const seen = new Map<string, typeof rows[0]>();
  for (const r of rows) {
    const key = r.submissionId || r.id;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, r);
    } else {
      const prevTime = prev.publishedAt?.getTime() ?? prev.createdAt?.getTime() ?? 0;
      const curTime = r.publishedAt?.getTime() ?? r.createdAt?.getTime() ?? 0;
      if (curTime > prevTime) seen.set(key, r);
    }
  }
  const unique = Array.from(seen.values());

  return unique.map((r) => {
    const authors = parseJsonArray(r.authors);
    const keywords = parseJsonArray(r.keywords);
    const affiliations = parseJsonArray(r.affiliations);
    return {
      id: r.id,
      title: r.title,
      abstract: r.abstract || undefined,
      content: "",
      excerpt: r.excerpt || (r.abstract ? r.abstract.slice(0, 300) : ""),
      slug: r.slug,
      authorId: r.submissionId || r.id,
      authorUsername: r.authorUsername || "author",
      category: r.category || "Impact Profile",
      subject: r.subject || undefined,
      articleType: r.articleType || undefined,
      authors: authors.length ? authors : undefined,
      affiliations: affiliations.length ? affiliations : undefined,
      keywords: keywords.length ? keywords : undefined,
      imageUrl: `/article-covers/${r.slug}.svg`,
      imageUrls: [],
      doi: r.doi || undefined,
      publishedAt: r.publishedAt || null,
      receivedAt: r.receivedAt || undefined,
      acceptedAt: r.acceptedAt || undefined,
      createdAt: r.createdAt || null,
      manuscriptUrl: r.manuscriptUrl || undefined,
    };
  });
}

/** @deprecated Use getAllPublishedArticles() instead */
export const getPublishedArticlesFromDB = getAllPublishedArticles;

export async function getPublishedArticleBySlug(slug: string): Promise<(Article & { manuscriptUrl?: string }) | null> {
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, slug));

  const r = rows[0];
  if (!r || r.status !== "published") return null;

  return dbRowToArticle(r);
}
