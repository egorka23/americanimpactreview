/**
 * Migrate 7 MD articles from /articles/ into published_articles table.
 * Run: npx tsx scripts/migrate-md-to-db.ts
 */
import fs from "fs";
import path from "path";
import { db } from "../lib/db";
import { publishedArticles } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const ARTICLES_DIR = path.join(process.cwd(), "articles");

function stripHeaderBlock(raw: string): string {
  const lines = raw.split(/\r?\n/);
  let bodyStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+\d+\.?\s+/.test(lines[i].trim())) {
      bodyStartIndex = i;
      break;
    }
  }
  if (bodyStartIndex !== -1) {
    return lines.slice(bodyStartIndex + 1).join("\n").trim();
  }
  let lastSeparator = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") lastSeparator = i;
  }
  if (lastSeparator !== -1) return lines.slice(lastSeparator + 1).join("\n").trim();
  return raw;
}

function stripMarkdownSyntax(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseAuthors(lines: string[]): string[] {
  const authorLine = lines.find(
    (l) => l.toLowerCase().includes("**authors:**") || l.toLowerCase().includes("**author:**")
  );
  if (!authorLine) return ["Unknown"];
  const raw = authorLine.replace(/\*\*/g, "").replace(/authors?:\s*/i, "").trim();
  return raw
    .split(",")
    .map((name) =>
      name.replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "").replace(/\d+$/g, "").trim()
    )
    .filter(Boolean);
}

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
        const text = trimmed
          .replace(/^-\s*/, "")
          .replace(/^[\u00B9\u00B2\u00B3\u2070-\u209F]+\s*/, "")
          .replace(/^\d+[.\s)]*\s*/, "")
          .trim();
        if (text) affiliations.push(text);
      } else if (trimmed === "" || trimmed.startsWith("**")) {
        inAffiliations = false;
      }
    }
  }
  return affiliations;
}

function parseAbstract(lines: string[]): string {
  let inAbstract = false;
  const abstractLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+abstract/i.test(trimmed)) { inAbstract = true; continue; }
    if (inAbstract) {
      if (trimmed.toLowerCase().startsWith("**keywords:**") || trimmed.toLowerCase().startsWith("**keyword:**")) break;
      if (trimmed.startsWith("## ") || trimmed === "---") break;
      abstractLines.push(line);
    }
  }
  return abstractLines.join("\n").trim();
}

function parseKeywords(lines: string[]): string[] {
  const keywordLine = lines.find(
    (l) => l.toLowerCase().includes("**keywords:**") || l.toLowerCase().includes("**keyword:**")
  );
  if (!keywordLine) return [];
  const raw = keywordLine.replace(/\*\*/g, "").replace(/keywords?:\s*/i, "").trim();
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function inferCategory(title: string): string {
  const text = title.toLowerCase();
  if (text.includes("solar") || text.includes("wind") || text.includes("energy") || text.includes("power") || text.includes("transit") || text.includes("grid")) return "Energy & Climate";
  if (text.includes("marketing") || text.includes("advertising") || text.includes("martech") || text.includes("consumer behavior")) return "Marketing";
  if (text.includes("business") || text.includes("entrepreneurship") || text.includes("management strategy")) return "Business";
  if (/\bai\b/.test(text) || text.includes("algorithm") || text.includes("machine learning") || text.includes("artificial intelligence") || text.includes("bias")) return "AI & Data";
  if (text.includes("health") || text.includes("immuno") || text.includes("vaccine") || text.includes("genomic")) return "Health & Biotech";
  if (text.includes("diagnostic") || text.includes("sports medicine") || text.includes("physiological")) return "Sports Medicine";
  if (text.includes("robot") || text.includes("autonomous") || text.includes("automation") || text.includes("inspection") || text.includes("exoskeleton") || text.includes("swarm")) return "Robotics & Automation";
  if (text.includes("sleep") || text.includes("cognitive") || text.includes("biomechanics") || text.includes("altitude") || text.includes("performance")) return "Human Performance";
  if (text.includes("sport") || text.includes("athlete") || text.includes("dermatoglyphics") || text.includes("fingerprint") || text.includes("training optimization") || text.includes("wrestling") || text.includes("wrestler")) return "Sports Science";
  if (text.includes("monitoring") || text.includes("scalability") || text.includes("high-load") || text.includes("microservice")) return "Computer Science";
  return "Impact Profile";
}

function parseDateField(lines: string[], label: string): Date | null {
  const line = lines.find((l) => l.toLowerCase().includes(`**${label}:**`));
  if (!line) return null;
  const raw = line.replace(/\*\*/g, "").replace(new RegExp(`${label}:\\s*`, "i"), "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md")).sort();
  console.log(`Found ${files.length} markdown articles to migrate.`);

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8").trim();
    const lines = raw.split(/\r?\n/);

    // Check for existing entry by slug
    const existing = await db
      .select({ id: publishedArticles.id })
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug));

    if (existing.length > 0) {
      console.log(`  [SKIP] ${slug} — already exists in DB (id: ${existing[0].id}), updating content...`);
      // Update existing record with content and metadata
      const updTitle = lines.find((l) => l.trim().startsWith("# "));
      const updTitleText = updTitle ? updTitle.replace(/^#\s*/, "").trim() : undefined;
      const updAbstract = parseAbstract(lines);
      const updKeywords = parseKeywords(lines);
      const updAuthors = parseAuthors(lines);
      await db
        .update(publishedArticles)
        .set({
          ...(updTitleText ? { title: updTitleText } : {}),
          ...(updAbstract ? { abstract: updAbstract } : {}),
          ...(updKeywords.length ? { keywords: JSON.stringify(updKeywords) } : {}),
          ...(updAuthors.length ? { authors: JSON.stringify(updAuthors) } : {}),
          content: raw,
          excerpt: stripMarkdownSyntax(stripHeaderBlock(raw)).slice(0, 300),
          affiliations: JSON.stringify(parseAffiliations(lines)),
          category: inferCategory(updTitleText || slug),
          receivedAt: parseDateField(lines, "received") || undefined,
          acceptedAt: parseDateField(lines, "accepted") || undefined,
          updatedAt: new Date(),
        })
        .where(eq(publishedArticles.slug, slug));
      console.log(`  [UPDATED] ${slug} — content/excerpt/affiliations added`);
      continue;
    }

    const titleLine = lines.find((l) => l.trim().startsWith("# "));
    const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled";
    const authors = parseAuthors(lines);
    const affiliations = parseAffiliations(lines);
    const abstract = parseAbstract(lines);
    const keywords = parseKeywords(lines);
    const category = inferCategory(title);
    const bodyText = stripHeaderBlock(raw);
    const excerpt = stripMarkdownSyntax(bodyText).slice(0, 300);

    const publishedAt = parseDateField(lines, "publication date");
    const receivedAt = parseDateField(lines, "received");
    const acceptedAt = parseDateField(lines, "accepted");

    await db.insert(publishedArticles).values({
      title,
      slug,
      abstract: abstract || null,
      content: raw,
      excerpt,
      category,
      authors: JSON.stringify(authors),
      affiliations: JSON.stringify(affiliations),
      keywords: keywords.length ? JSON.stringify(keywords) : null,
      authorUsername: authors[0]?.split(" ")[0]?.toLowerCase() || "author",
      articleType: "Research Article",
      volume: "1",
      issue: "1",
      year: 2026,
      status: "published",
      publishedAt,
      receivedAt,
      acceptedAt,
      createdAt: receivedAt || publishedAt || new Date(),
      updatedAt: new Date(),
    });

    console.log(`  [INSERT] ${slug} — "${title.slice(0, 60)}..."`);
  }

  console.log("\nMigration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
