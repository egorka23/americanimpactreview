/**
 * Generate Crossref XML deposit for all published articles from Turso DB.
 *
 * Usage:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/generate-crossref-xml.ts
 *
 * Or with .env.local (strips quotes automatically):
 *   ./scripts/run-crossref.sh
 *
 * Output:
 *   crossref-deposit.xml in project root
 *
 * Before running:
 *   1. Replace DOI_PREFIX with your actual Crossref DOI prefix (e.g. "10.12345")
 *   2. Add ISSN when received
 */

import fs from "fs";
import path from "path";

// ─── CONFIGURATION ──────────────────────────────────────────────
const DOI_PREFIX = "10.66308";
const DEPOSITOR_NAME = "Global Talent Foundation";
const DEPOSITOR_EMAIL = "egorka23@gmail.com";
const REGISTRANT = "Global Talent Foundation";
const JOURNAL_TITLE = "American Impact Review";
const JOURNAL_ABBREV = "Am. Impact Rev.";
const ISSN = ""; // TODO: Add ISSN when received
const JOURNAL_URL = "https://americanimpactreview.com";
// ─────────────────────────────────────────────────────────────────

interface ArticleMeta {
  slug: string;
  title: string;
  authors: { given: string; surname: string; affiliation?: string; orcid?: string }[];
  abstract: string;
  keywords: string[];
  receivedDate: { year: string; month: string; day: string } | null;
  acceptedDate: { year: string; month: string; day: string } | null;
  publishedDate: { year: string; month: string; day: string };
  volume: string;
  issue: string;
  doi: string;
  url: string;
  references: string[];
}

function dateParts(d: Date | string | null): { year: string; month: string; day: string } | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, "0"),
    day: date.getDate().toString().padStart(2, "0"),
  };
}

function parseAuthorName(raw: string): { given: string; surname: string } {
  const cleaned = raw
    .replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "")
    .replace(/\d+$/g, "")
    .trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { given: parts[0], surname: parts[0] };
  const surname = parts.pop()!;
  return { given: parts.join(" "), surname };
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReferences(content: string): string[] {
  if (!content) return [];

  // Try HTML: find References section
  const htmlMatch = content.match(/<(?:h[12])>\s*References\s*<\/(?:h[12])>([\s\S]*?)(?:<h[12]>|$)/)
    || content.match(/<strong>\s*References\s*<\/strong>\s*<\/p>([\s\S]*?)(?:<h[12]>|<strong>|$)/);
  if (htmlMatch) {
    const refsBlock = htmlMatch[1];
    const liMatches = refsBlock.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
    if (liMatches && liMatches.length > 0) {
      return liMatches.map((li) => stripHtml(li)).filter(Boolean);
    }
    const pMatches = refsBlock.match(/<p>([\s\S]*?)<\/p>/g);
    if (pMatches && pMatches.length > 0) {
      return pMatches.map((p) => {
        let text = stripHtml(p);
        text = text.replace(/^\[?\d+\]?\.?\s*/, "");
        return text;
      }).filter((t) => t.length > 10);
    }
  }

  // Fallback: markdown ## References heading
  const lines = content.split(/\r?\n/);
  let inReferences = false;
  const refLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+references/i.test(trimmed)) {
      inReferences = true;
      continue;
    }
    if (inReferences) {
      if (/^#{1,3}\s+/.test(trimmed)) break;
      if (!trimmed) continue;
      let ref = trimmed;
      // Strip leading number prefix
      ref = ref.replace(/^\[?\d+\]?\.?\s*/, "");
      // Strip markdown italics
      ref = ref.replace(/\*([^*]+)\*/g, "$1");
      ref = ref.replace(/_([^_]+)_/g, "$1");
      if (ref.length > 10) refLines.push(ref);
    }
  }
  return refLines;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dbRowToArticleMeta(row: any): ArticleMeta {
  const authors = parseJsonArray(row.authors);
  const affiliations = parseJsonArray(row.affiliations);
  const orcids = parseJsonArray(row.orcids);
  const keywords = parseJsonArray(row.keywords);

  const authorList = authors.map((name: string, i: number) => {
    const parsed = parseAuthorName(name);
    const orcid = orcids[i] && orcids[i].match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/) ? orcids[i] : undefined;
    return {
      ...parsed,
      affiliation: affiliations[i] || affiliations[0] || undefined,
      orcid,
    };
  });

  const abstract = row.abstract ? stripMarkdown(row.abstract) : "";

  const references = extractReferences(row.content || "");

  return {
    slug: row.slug,
    title: row.title,
    authors: authorList,
    abstract,
    keywords,
    receivedDate: dateParts(row.receivedAt),
    acceptedDate: dateParts(row.acceptedAt),
    publishedDate: dateParts(row.publishedAt) || { year: "2026", month: "02", day: "10" },
    volume: row.volume || "1",
    issue: row.issue || "1",
    doi: `${DOI_PREFIX}/air.${row.slug}`,
    url: `${JOURNAL_URL}/article/${row.slug}`,
    references,
  };
}

function generateArticleXml(article: ArticleMeta): string {
  const contributorsXml = article.authors
    .map((a, i) => {
      const seq = i === 0 ? "first" : "additional";
      // Crossref 5.3.1 order: given_name, surname, affiliations, ORCID
      const affXml = a.affiliation
        ? `\n                <affiliations><institution><institution_name>${escapeXml(a.affiliation)}</institution_name></institution></affiliations>`
        : "";
      const orcidXml = a.orcid
        ? `\n                <ORCID>https://orcid.org/${escapeXml(a.orcid)}</ORCID>`
        : "";
      return `              <person_name sequence="${seq}" contributor_role="author">
                <given_name>${escapeXml(a.given)}</given_name>
                <surname>${escapeXml(a.surname)}</surname>${affXml}${orcidXml}
              </person_name>`;
    })
    .join("\n");

  const abstractXml = article.abstract
    ? `          <jats:abstract>
            <jats:p>${escapeXml(article.abstract)}</jats:p>
          </jats:abstract>`
    : "";

  // Build citation_list from references
  let citationListXml = "";
  if (article.references.length > 0) {
    const citations = article.references.map((ref, i) => {
      const key = `ref${(i + 1).toString().padStart(3, "0")}`;
      return `              <citation key="${key}">
                <unstructured_citation>${escapeXml(ref)}</unstructured_citation>
              </citation>`;
    }).join("\n");
    citationListXml = `
          <citation_list>
${citations}
          </citation_list>`;
  }

  return `        <journal_article publication_type="full_text">
          <titles>
            <title>${escapeXml(article.title)}</title>
          </titles>
          <contributors>
${contributorsXml}
          </contributors>
${abstractXml}
          <publication_date media_type="online">
            <month>${article.publishedDate.month}</month>
            <day>${article.publishedDate.day}</day>
            <year>${article.publishedDate.year}</year>
          </publication_date>
          <doi_data>
            <doi>${escapeXml(article.doi)}</doi>
            <resource>${escapeXml(article.url)}</resource>
          </doi_data>${citationListXml}
        </journal_article>`;
}

function generateFullXml(articles: ArticleMeta[]): string {
  const timestamp = Date.now().toString();
  const batchId = `air-deposit-${timestamp}`;

  const issnXml = ISSN
    ? `          <issn media_type="electronic">${escapeXml(ISSN)}</issn>`
    : "";
  const journalDoiXml = `          <doi_data>
            <doi>${DOI_PREFIX}/air</doi>
            <resource>${JOURNAL_URL}</resource>
          </doi_data>`;

  const articlesXml = articles.map(generateArticleXml).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:jats="http://www.ncbi.nlm.nih.gov/JATS1"
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 https://www.crossref.org/schemas/crossref5.3.1.xsd"
           version="5.3.1">
  <head>
    <doi_batch_id>${batchId}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>${escapeXml(DEPOSITOR_NAME)}</depositor_name>
      <email_address>${escapeXml(DEPOSITOR_EMAIL)}</email_address>
    </depositor>
    <registrant>${escapeXml(REGISTRANT)}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${escapeXml(JOURNAL_TITLE)}</full_title>
        <abbrev_title>${escapeXml(JOURNAL_ABBREV)}</abbrev_title>
${issnXml}
${journalDoiXml}
      </journal_metadata>
      <journal_issue>
        <publication_date media_type="online">
          <month>02</month>
          <year>2026</year>
        </publication_date>
        <journal_volume>
          <volume>1</volume>
        </journal_volume>
        <issue>1</issue>
      </journal_issue>
${articlesXml}
    </journal>
  </body>
</doi_batch>
`;
}

// ─── MAIN ───────────────────────────────────────────────────────
async function main() {
  // Read from JSON dump (generated by list-published.ts) to avoid env issues
  const dumpPath = path.join(process.cwd(), "published-articles-dump.json");

  if (!fs.existsSync(dumpPath)) {
    console.error("Error: published-articles-dump.json not found.");
    console.error("Run first: TURSO_DATABASE_URL=... npx tsx scripts/list-published.ts");
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log(`Loaded ${rows.length} published articles from dump\n`);

  const articles: ArticleMeta[] = [];
  for (const row of rows) {
    const meta = dbRowToArticleMeta(row);
    articles.push(meta);
    const orcidCount = meta.authors.filter((a) => a.orcid).length;
    console.log(
      `  ${meta.slug}: "${meta.title.slice(0, 60)}..." (${meta.authors.length} authors${orcidCount ? `, ${orcidCount} ORCID` : ""}, ${meta.references.length} refs)`
    );
  }

  const xml = generateFullXml(articles);
  const outPath = path.join(process.cwd(), "crossref-deposit.xml");
  fs.writeFileSync(outPath, xml, "utf8");

  console.log(`\nGenerated: ${outPath}`);
  console.log(`Articles:  ${articles.length}`);
  console.log(`\nBefore uploading to Crossref:`);
  console.log(`  1. Replace DOI_PREFIX "${DOI_PREFIX}" with your actual prefix`);
  if (!ISSN) console.log(`  2. Add ISSN when received`);
  console.log(`  3. Upload at: https://doi.crossref.org/servlet/deposit`);
}

main().catch(console.error);
