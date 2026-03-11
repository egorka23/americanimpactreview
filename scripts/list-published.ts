import { db } from "../lib/db";
import { publishedArticles, articleContent } from "../lib/db/schema";
import { eq } from "drizzle-orm";

function extractReferencesBlock(content: string): string {
  if (!content) return "";
  // HTML: find References section
  const htmlMatch = content.match(/<(?:h[12])>\s*References\s*<\/(?:h[12])>([\s\S]*?)(?:<h[12]>|$)/)
    || content.match(/<strong>\s*References\s*<\/strong>\s*<\/p>([\s\S]*?)(?:<h[12]>|<strong>|$)/);
  if (htmlMatch) return htmlMatch[0];
  // Markdown: ## References or ### References (multiline flag for ^)
  const mdMatch = content.match(/^#{1,3}\s+References\s*\n[\s\S]*?(?=\n#{1,2}\s+[A-Z])/m);
  if (mdMatch) return mdMatch[0];
  // Broader fallback: ## References until end of content
  const mdMatch2 = content.match(/^#{1,3}\s+References\s*\n[\s\S]*/m);
  if (mdMatch2) return mdMatch2[0];
  return "";
}

async function main() {
  const rows = await db
    .select({
      slug: publishedArticles.slug,
      title: publishedArticles.title,
      authors: publishedArticles.authors,
      affiliations: publishedArticles.affiliations,
      abstract: publishedArticles.abstract,
      keywords: publishedArticles.keywords,
      orcids: publishedArticles.orcids,
      status: publishedArticles.status,
      publishedAt: publishedArticles.publishedAt,
      receivedAt: publishedArticles.receivedAt,
      acceptedAt: publishedArticles.acceptedAt,
      doi: publishedArticles.doi,
      volume: publishedArticles.volume,
      issue: publishedArticles.issue,
      year: publishedArticles.year,
      articleId: publishedArticles.id,
    })
    .from(publishedArticles)
    .where(eq(publishedArticles.status, "published"));

  console.log(`Total published: ${rows.length}\n`);

  // Fetch article_content and extract only references block
  const contentRows = await db
    .select({
      articleId: articleContent.articleId,
      content: articleContent.content,
    })
    .from(articleContent);

  const contentMap = new Map<string, string>();
  for (const cr of contentRows) {
    contentMap.set(cr.articleId, cr.content);
  }

  const output = rows.map((r) => {
    const fullContent = contentMap.get(r.articleId) || "";
    const refsBlock = extractReferencesBlock(fullContent);
    console.log(`${r.slug} | ${r.title?.slice(0, 80)} | ${r.authors?.slice(0, 60)} | pub: ${r.publishedAt} | refs: ${refsBlock.length} chars`);
    return {
      ...r,
      content: refsBlock, // Only the references block, not full content
    };
  });

  // Output full JSON for crossref script
  const outPath = "./published-articles-dump.json";
  const fs = await import("fs");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nFull data saved to ${outPath}`);
}

main().catch(console.error);
