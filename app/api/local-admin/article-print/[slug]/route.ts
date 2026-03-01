import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(",").map((s: string) => s.trim()).filter(Boolean); }
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderParagraph(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];
  let inUl = false, inOl = false, inTable = false;

  const closeList = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
    if (inOl) { output.push("</ol>"); inOl = false; }
  };
  const closeTable = () => {
    if (inTable) { output.push("</tbody></table>"); inTable = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^---+$/.test(trimmed)) { closeList(); closeTable(); continue; }

    // Inline figure
    const figMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (figMatch) {
      closeList(); closeTable();
      const [, alt, src] = figMatch;
      output.push(
        `<figure class="article-figure"><img src="${src}" alt="${alt}" />` +
        (alt ? `<figcaption>${alt.replace(/^(Figure \d+)\./, "<strong>$1.</strong>")}</figcaption>` : "") +
        `</figure>`
      );
      continue;
    }

    // Table caption
    if (/^\*Table \d+\./.test(trimmed)) {
      closeList(); closeTable();
      output.push(`<p class="table-caption">${inlineFormat(trimmed)}</p>`);
      continue;
    }

    // Markdown table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList();
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s\-:|]/g, "")) continue;
      if (!inTable) {
        inTable = true;
        output.push('<table class="article-table">');
        const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
        output.push("<thead><tr>");
        cells.forEach(c => output.push(`<th>${inlineFormat(c)}</th>`));
        output.push("</tr></thead><tbody>");
        continue;
      }
      const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      output.push("<tr>");
      cells.forEach(c => output.push(`<td>${inlineFormat(c)}</td>`));
      output.push("</tr>");
      continue;
    } else if (inTable) { closeTable(); }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      closeTable();
      if (inOl) { output.push("</ol>"); inOl = false; }
      if (!inUl) { output.push("<ul>"); inUl = true; }
      output.push(`<li>${inlineFormat(trimmed.replace(/^[-*+]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (inUl) { output.push("</ul>"); inUl = false; }
      if (!inOl) { output.push("<ol>"); inOl = true; }
      output.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    if (inUl || inOl) closeList();
    if (!trimmed) continue;

    // Formula
    if (/^\[Formula:\s*/.test(trimmed)) {
      closeList(); closeTable();
      const f = trimmed.replace(/^\[Formula:\s*/, "").replace(/\]$/, "");
      output.push(`<div class="formula">${inlineFormat(f)}</div>`);
      continue;
    }

    output.push(`<p>${inlineFormat(trimmed)}</p>`);
  }
  closeList(); closeTable();
  return output.join("\n");
}

function parseSectionsAndReferences(content: string) {
  const lines = content.split(/\r?\n/);
  const sections: { heading: string; level: number; paragraphs: string[] }[] = [];
  const references: string[] = [];
  let disclosure = "";
  let currentSection: { heading: string; level: number; paragraphs: string[] } | null = null;
  let inReferences = false;
  let inDisclosure = false;
  let currentParagraph = "";

  let bodyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,4}\s+\d+\.?\s+/.test(lines[i].trim())) { bodyStart = i; break; }
  }
  if (bodyStart === -1) {
    // Try any heading after abstract
    for (let i = 0; i < lines.length; i++) {
      if (/^#{1,4}\s+/.test(lines[i].trim()) && !/abstract/i.test(lines[i])) { bodyStart = i; break; }
    }
  }
  if (bodyStart === -1) return { sections, references, disclosure };

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (/^#{1,4}\s+references/i.test(trimmed)) {
      if (currentParagraph.trim() && currentSection) currentSection.paragraphs.push(currentParagraph.trim());
      if (currentSection) sections.push(currentSection);
      currentSection = null; currentParagraph = "";
      inReferences = true; inDisclosure = false;
      continue;
    }
    if (/^#{1,4}\s+disclosure/i.test(trimmed)) { inReferences = false; inDisclosure = true; continue; }
    if (inDisclosure) { if (trimmed && !trimmed.startsWith("## ")) disclosure += (disclosure ? "\n" : "") + trimmed; continue; }
    if (inReferences) { if (trimmed && !trimmed.startsWith("## ")) references.push(trimmed); continue; }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      if (currentParagraph.trim() && currentSection) currentSection.paragraphs.push(currentParagraph.trim());
      if (currentSection) sections.push(currentSection);
      currentParagraph = "";
      currentSection = { heading: headingMatch[2].trim(), level: headingMatch[1].length, paragraphs: [] };
      continue;
    }
    if (trimmed === "") {
      if (currentParagraph.trim() && currentSection) currentSection.paragraphs.push(currentParagraph.trim());
      currentParagraph = "";
      continue;
    }
    if (currentSection) currentParagraph += (currentParagraph ? "\n" : "") + trimmed;
  }
  if (currentParagraph.trim() && currentSection) currentSection.paragraphs.push(currentParagraph.trim());
  if (currentSection) sections.push(currentSection);

  return { sections, references, disclosure };
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function buildPrintHtml(article: {
  title: string; slug: string; authors: string[]; affiliations: string[];
  abstract: string; keywords: string[]; content: string; category: string;
  articleType?: string; doi?: string;
  receivedAt: Date | null; acceptedAt: Date | null; publishedAt: Date | null;
}): string {
  const { sections, references, disclosure } = parseSectionsAndReferences(article.content || "");

  let bodyHtml = "";
  for (const s of sections) {
    const tag = s.level === 2 ? "h2" : s.level === 3 ? "h3" : "h4";
    bodyHtml += `<${tag}>${s.heading}</${tag}>\n`;
    for (const p of s.paragraphs) bodyHtml += renderParagraph(p) + "\n";
  }

  let refsHtml = "";
  if (references.length) {
    refsHtml = `<h2>References</h2>\n<ol class="references">\n`;
    for (const ref of references) {
      const clean = ref.replace(/^\d+\.\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
      refsHtml += `<li>${clean}</li>\n`;
    }
    refsHtml += `</ol>\n`;
  }

  let disclosureHtml = "";
  if (disclosure) disclosureHtml = `<div class="disclosure"><p><strong>Disclosure:</strong> ${inlineFormat(disclosure)}</p></div>\n`;

  const authorsHtml = article.authors.map((name, i) => {
    const sup = article.affiliations.length > 1 ? `<sup>${i + 1}</sup>` : "";
    return `${name}${sup}`;
  }).join(", ");

  const affiliationsHtml = article.affiliations.map((a, i) => {
    const num = article.affiliations.length > 1 ? `<strong>${i + 1}</strong> ` : "";
    return `${num}${a}`;
  }).join("<br/>");

  const year = article.publishedAt ? article.publishedAt.getFullYear() : new Date().getFullYear();
  const citationAuthors = article.authors.length > 3 ? `${article.authors[0]} et al.` : article.authors.join(", ");
  const citationText = `${citationAuthors} (${year}) ${article.title}. American Impact Review. ${article.slug.toUpperCase()}. https://americanimpactreview.com/article/${article.slug}`;
  const articleUrl = `https://americanimpactreview.com/article/${article.slug}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${article.title} — American Impact Review</title>
<style>
  @page {
    size: letter;
    margin: 0.75in 0.75in 0.9in 0.75in;
  }
  @media print {
    .no-print { display: none !important; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .logo-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .logo-header img { height: 48px; }
  .logo-header .journal-title { font-size: 22pt; font-weight: 700; color: #1e3a5f; letter-spacing: 0.3px; }

  .kicker { font-size: 9pt; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; margin-top: 16px; }
  .article-title { font-size: 18pt; font-weight: 700; color: #111; line-height: 1.25; margin-bottom: 12px; }
  .authors { font-size: 12pt; color: #000; margin-bottom: 6px; }
  .authors sup { font-size: 7pt; color: #1e3a5f; }
  .affiliations { font-size: 9.5pt; color: #000; line-height: 1.5; margin-bottom: 6px; }
  .affiliations strong { color: #1e3a5f; font-weight: 700; }
  .corresponding { font-size: 9.5pt; color: #000; margin-bottom: 16px; }

  .first-page-grid { display: flex; gap: 24px; margin-bottom: 14px; }
  .sidebar { width: 220px; flex-shrink: 0; font-size: 9.5pt; color: #000; line-height: 1.5; border-top: 1px solid #ddd; padding-top: 10px; overflow-wrap: break-word; word-break: break-all; }
  .sidebar-section { margin-bottom: 10px; }
  .sidebar-section .label { font-weight: 700; color: #333; margin-bottom: 2px; }
  .sidebar-section a { color: #1e3a5f; text-decoration: none; }
  .main-col { flex: 1; min-width: 0; }

  .abstract-heading { font-size: 14pt; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; border-top: 1px solid #ddd; padding-top: 10px; }
  .abstract-text { font-size: 9.5pt; line-height: 1.55; color: #333; margin-bottom: 10px; text-align: justify; }

  h2 { font-size: 13pt; font-weight: 700; color: #1a1a1a; margin-top: 18px; margin-bottom: 6px; page-break-after: avoid; }
  h3 { font-size: 11pt; font-weight: 700; color: #1a1a1a; margin-top: 14px; margin-bottom: 4px; page-break-after: avoid; }
  h4 { font-size: 10pt; font-weight: 700; color: #333; margin-top: 10px; margin-bottom: 4px; page-break-after: avoid; }
  p { margin-bottom: 8px; text-align: justify; text-indent: 16px; orphans: 3; widows: 3; }
  h2 + p, h3 + p, h4 + p, .abstract-text p { text-indent: 0; }
  ul, ol { margin: 6px 0 6px 24px; font-size: 10pt; }
  li { margin-bottom: 3px; }
  code { font-family: "Courier New", monospace; font-size: 9pt; background: #f0f0f0; padding: 1px 3px; border-radius: 2px; }
  a { color: #1e3a5f; text-decoration: underline; }
  .formula { text-align: center; font-style: italic; margin: 10px 0; padding: 6px; background: #fafafa; }

  .article-figure { margin: 18px 0; page-break-inside: avoid; }
  .article-figure img { width: 100%; display: block; margin: 0 auto; }
  .article-figure figcaption { font-size: 9pt; color: #333; margin-top: 8px; line-height: 1.45; text-align: left; text-indent: 0; }
  .article-figure figcaption strong { color: #000; }

  .article-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; page-break-inside: avoid; }
  .article-table th { background: #eef1f5; color: #1a1a1a; font-weight: 700; padding: 6px 8px; text-align: left; border-top: 2px solid #333; border-bottom: 1px solid #333; }
  .article-table td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  .article-table tr:last-child td { border-bottom: 2px solid #333; }
  .table-caption { font-size: 9pt; color: #333; margin: 4px 0 10px; text-indent: 0; }
  .table-caption strong { color: #000; }

  .references { font-size: 9pt; line-height: 1.5; color: #000; padding-left: 24px; list-style-type: decimal; }
  .references li { margin-bottom: 4px; text-align: left; text-indent: 0; }

  .disclosure { margin-top: 16px; padding-top: 12px; border-top: 1px solid #aaa; font-size: 9pt; color: #000; }
  .disclosure p { text-indent: 0; }

  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e3a5f; color: #fff; padding: 10px 24px; display: flex; align-items: center; gap: 16px; z-index: 9999; font-family: system-ui, sans-serif; font-size: 14px; }
  .print-bar button { background: #fff; color: #1e3a5f; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; }
  .print-bar button:hover { background: #e8f0fe; }
</style>
</head>
<body>

  <!-- Print bar (hidden when printing) -->
  <div class="print-bar no-print">
    <button onclick="window.print()">Save as PDF (Ctrl+P)</button>
    <span>Print this page to save as PDF. Use "Save as PDF" destination in the print dialog.</span>
  </div>
  <div class="no-print" style="height: 52px;"></div>

  <div class="logo-header">
    <img src="/android-chrome-512x512.png" alt="AIR" />
    <span class="journal-title">American Impact Review</span>
  </div>

  <div class="kicker">${article.articleType || "Research Article"}</div>
  <div class="article-title">${article.title}</div>
  <div class="authors">${authorsHtml}</div>
  <div class="affiliations">${affiliationsHtml}</div>
  <div class="corresponding">* Corresponding author</div>

  <div class="first-page-grid">
    <div class="sidebar">
      <div class="sidebar-section"><div class="label">OPEN ACCESS</div></div>
      <div class="sidebar-section"><div class="label">Citation:</div><div>${citationText}</div></div>
      ${article.receivedAt ? `<div class="sidebar-section"><div class="label">Received:</div><div>${formatDate(article.receivedAt)}</div></div>` : ""}
      ${article.acceptedAt ? `<div class="sidebar-section"><div class="label">Accepted:</div><div>${formatDate(article.acceptedAt)}</div></div>` : ""}
      ${article.publishedAt ? `<div class="sidebar-section"><div class="label">Published:</div><div>${formatDate(article.publishedAt)}</div></div>` : ""}
      <div class="sidebar-section">
        <div class="label">Copyright:</div>
        <div>&copy; ${year} ${article.authors[0] || "Authors"}. This is an open access article distributed under the terms of the Creative Commons Attribution License (CC BY 4.0).</div>
      </div>
      ${article.doi ? `<div class="sidebar-section"><div class="label">DOI:</div><div><a href="https://doi.org/${article.doi}">${article.doi}</a></div></div>` : ""}
    </div>
    <div class="main-col">
      ${article.abstract ? `
        <div class="abstract-heading">Abstract</div>
        <div class="abstract-text">${inlineFormat(article.abstract)}</div>
      ` : ""}
    </div>
  </div>

  ${bodyHtml}
  ${refsHtml}
  ${disclosureHtml}

</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, params.slug));

    const r = rows[0];
    if (!r) {
      return new NextResponse("Article not found", { status: 404 });
    }

    const authors = parseJsonArray(r.authors);
    const affiliations = parseJsonArray(r.affiliations);
    const keywords = parseJsonArray(r.keywords);

    const html = buildPrintHtml({
      title: r.title,
      slug: r.slug,
      authors: authors.length ? authors : [r.authorUsername || "Author"],
      affiliations,
      abstract: r.abstract || "",
      keywords,
      content: r.content || "",
      category: r.category || "Article",
      articleType: r.articleType || undefined,
      doi: r.doi || undefined,
      receivedAt: r.receivedAt || null,
      acceptedAt: r.acceptedAt || null,
      publishedAt: r.publishedAt || null,
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Article print error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
