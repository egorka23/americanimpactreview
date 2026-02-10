import { getAllArticles } from "@/lib/articles";
import HomeClient from "./HomeClient";

function extractExcerpt(content: string, maxLen = 150): string {
  // Strip markdown headings, bold markers, metadata lines
  const lines = content.split(/\r?\n/);
  const textLines = lines.filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith("#")) return false;
    if (t.startsWith("**") && t.endsWith("**")) return false;
    if (/^\*\*[^*]+:\*\*/.test(t)) return false;
    if (t.startsWith("---")) return false;
    if (t.startsWith("![")) return false;
    return true;
  });

  const plain = textLines
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

export default function HomePage() {
  const allArticles = getAllArticles();

  // Sort by publishedAt descending, take latest 6
  const sorted = [...allArticles].sort((a, b) => {
    const da = a.publishedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
    const db = b.publishedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
    return db - da;
  });

  const latest = sorted.slice(0, 6).map((a) => ({
    slug: a.slug,
    title: a.title,
    authors: a.authors ?? ["Unknown"],
    category: a.category,
    publishedAt: a.publishedAt
      ? a.publishedAt.toISOString()
      : a.createdAt
        ? a.createdAt.toISOString()
        : null,
    excerpt: extractExcerpt(a.content),
  }));

  return <HomeClient articles={latest} />;
}
