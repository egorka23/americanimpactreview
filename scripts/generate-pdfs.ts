/**
 * generate-pdfs.ts
 *
 * Build-time script that reads each article markdown file from /articles/,
 * converts to styled HTML, and renders to PDF via Puppeteer (headless Chrome).
 * Images and tables are rendered natively — no redrawing.
 *
 * Output: /public/articles/{slug}.pdf
 *
 * Run with: npx tsx scripts/generate-pdfs.ts
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { PDFDocument } from "pdf-lib";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUTPUT_DIR = path.join(PUBLIC_DIR, "articles");

// Chrome path for macOS
const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ---------------------------------------------------------------------------
// Article parsing (mirrors lib/articles.ts logic)
// ---------------------------------------------------------------------------

interface ParsedArticle {
  slug: string;
  title: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  receivedDate: string;
  acceptedDate: string;
  publicationDate: string;
  category: string;
  imageUrls: string[];
  figureCaptions: string[];
  sections: { heading: string; level: number; paragraphs: string[] }[];
  references: string[];
  disclosure: string;
}

function parseField(lines: string[], label: string): string {
  const line = lines.find((l) =>
    l.toLowerCase().includes(`**${label.toLowerCase()}:**`)
  );
  if (!line) return "";
  return line
    .replace(/\*\*/g, "")
    .replace(new RegExp(`${label}:\\s*`, "i"), "")
    .trim();
}

function parseAuthors(lines: string[]): string[] {
  const raw = parseField(lines, "Authors") || parseField(lines, "Author");
  if (!raw) return [];
  return raw
    .split(",")
    .map((name) =>
      name
        .replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "")
        .replace(/\d+$/g, "")
        .trim()
    )
    .filter(Boolean);
}

function parseAffiliations(lines: string[]): string[] {
  const affiliations: string[] = [];
  let inAffiliations = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\*\*affiliations?:\*\*/i.test(trimmed)) {
      inAffiliations = true;
      continue;
    }
    if (inAffiliations) {
      if (trimmed.startsWith("- ")) {
        const text = trimmed
          .replace(/^-\s*/, "")
          .replace(/^[\u00B9\u00B2\u00B3\u2070-\u209F]+\s*/, "")
          .replace(/^\d+[.):\s]\s*/, "")
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
    if (/^#{1,4}\s+abstract/i.test(trimmed)) {
      inAbstract = true;
      continue;
    }
    if (inAbstract) {
      if (/^\*\*keywords?:\*\*/i.test(trimmed)) break;
      if (trimmed.startsWith("## ") || trimmed === "---") break;
      abstractLines.push(line);
    }
  }
  return abstractLines.join("\n").trim();
}

function parseKeywords(lines: string[]): string[] {
  const raw = parseField(lines, "Keywords") || parseField(lines, "Keyword");
  if (!raw) return [];
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function parseImageUrls(lines: string[]): string[] {
  const raw = parseField(lines, "Images");
  if (!raw) return [];
  return raw.split(",").map((u) => u.trim()).filter(Boolean);
}

function parseFigureCaptions(lines: string[]): string[] {
  const raw = parseField(lines, "Figure Captions");
  if (!raw) return [];
  return raw.split(",").map((c) => c.trim()).filter(Boolean);
}

function parseSectionsAndReferences(lines: string[]): {
  sections: { heading: string; level: number; paragraphs: string[] }[];
  references: string[];
  disclosure: string;
} {
  const sections: { heading: string; level: number; paragraphs: string[] }[] = [];
  const references: string[] = [];
  let disclosure = "";

  let currentSection: { heading: string; level: number; paragraphs: string[] } | null = null;
  let inReferences = false;
  let inDisclosure = false;
  let currentParagraph = "";

  let bodyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,4}\s+\d+\.?\s+/.test(lines[i].trim())) {
      bodyStart = i;
      break;
    }
  }
  if (bodyStart === -1) return { sections, references, disclosure };

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // References section
    if (/^#{1,4}\s+references/i.test(trimmed)) {
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      if (currentSection) sections.push(currentSection);
      currentSection = null;
      currentParagraph = "";
      inReferences = true;
      inDisclosure = false;
      continue;
    }

    // Disclosure section
    if (/^#{1,4}\s+disclosure/i.test(trimmed)) {
      inReferences = false;
      inDisclosure = true;
      continue;
    }

    if (inDisclosure) {
      if (trimmed && !trimmed.startsWith("## ")) {
        disclosure += (disclosure ? "\n" : "") + trimmed;
      }
      continue;
    }

    if (inReferences) {
      if (trimmed && !trimmed.startsWith("## ")) {
        references.push(trimmed);
      }
      continue;
    }

    // Section heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      if (currentSection) sections.push(currentSection);
      currentParagraph = "";
      const level = headingMatch[1].length;
      currentSection = {
        heading: headingMatch[2].trim(),
        level,
        paragraphs: [],
      };
      continue;
    }

    if (trimmed === "") {
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = "";
      continue;
    }

    if (currentSection) {
      currentParagraph += (currentParagraph ? "\n" : "") + trimmed;
    }
  }

  if (currentParagraph.trim() && currentSection) {
    currentSection.paragraphs.push(currentParagraph.trim());
  }
  if (currentSection) sections.push(currentSection);

  return { sections, references, disclosure };
}

function parseArticleFile(filePath: string): ParsedArticle {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const titleLine = lines.find((line) => line.trim().startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled";

  const { sections, references, disclosure } = parseSectionsAndReferences(lines);

  return {
    slug: path.basename(filePath, ".md"),
    title,
    authors: parseAuthors(lines),
    affiliations: parseAffiliations(lines),
    abstract: parseAbstract(lines),
    keywords: parseKeywords(lines),
    receivedDate: parseField(lines, "Received"),
    acceptedDate: parseField(lines, "Accepted"),
    publicationDate: parseField(lines, "Publication Date"),
    category: parseField(lines, "Category"),
    imageUrls: parseImageUrls(lines),
    figureCaptions: parseFigureCaptions(lines),
    sections,
    references,
    disclosure,
  };
}

// ---------------------------------------------------------------------------
// Markdown → HTML (inline formatting, tables, figures, lists)
// ---------------------------------------------------------------------------

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>'
    );
}

function renderParagraphToHtml(text: string, imageBasePath: string): string {
  const lines = text.split("\n");
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableHeaderDone = false;

  const closeList = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
    if (inOl) { output.push("</ol>"); inOl = false; }
  };
  const closeTable = () => {
    if (inTable) { output.push("</tbody></table>"); inTable = false; tableHeaderDone = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^---+$/.test(trimmed)) { closeList(); closeTable(); continue; }

    // Inline figure: ![Caption](path)
    const figMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (figMatch) {
      closeList();
      closeTable();
      const alt = figMatch[1];
      const src = figMatch[2];
      // Convert image to base64 data URI for Puppeteer compatibility
      const imgAbsPath = src.startsWith("/")
        ? path.join(PUBLIC_DIR, src)
        : src;
      let imgSrc = src;
      try {
        const imgBuffer = fs.readFileSync(imgAbsPath);
        const ext = path.extname(imgAbsPath).slice(1).toLowerCase();
        const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : `image/${ext}`;
        imgSrc = `data:${mime};base64,${imgBuffer.toString("base64")}`;
      } catch {}
      output.push(
        `<figure class="article-figure">` +
        `<img src="${imgSrc}" alt="${alt}" />` +
        (alt ? `<figcaption>${alt.replace(/^(Figure \d+)\./, "<strong>$1.</strong>")}</figcaption>` : "") +
        `</figure>`
      );
      continue;
    }

    // Table caption line: *Table N. ...*
    if (/^\*Table \d+\./.test(trimmed)) {
      closeList();
      closeTable();
      output.push(`<p class="table-caption">${inlineFormat(trimmed)}</p>`);
      continue;
    }

    // Markdown table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList();
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s\-:|]/g, "")) {
        tableHeaderDone = true;
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        output.push('<table class="article-table">');
        const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
        output.push("<thead><tr>");
        cells.forEach((cell) => output.push(`<th>${inlineFormat(cell)}</th>`));
        output.push("</tr></thead><tbody>");
        continue;
      }
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
      output.push("<tr>");
      cells.forEach((cell) => output.push(`<td>${inlineFormat(cell)}</td>`));
      output.push("</tr>");
      continue;
    } else if (inTable) {
      closeTable();
    }

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

    // Formula block
    if (/^\[Formula:\s*/.test(trimmed)) {
      closeList();
      closeTable();
      const formulaText = trimmed.replace(/^\[Formula:\s*/, "").replace(/\]$/, "");
      output.push(`<div class="formula">${inlineFormat(formulaText)}</div>`);
      continue;
    }

    output.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  closeTable();
  return output.join("\n");
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

function buildHtml(article: ParsedArticle): string {
  // Build body sections HTML
  let bodyHtml = "";
  for (const section of article.sections) {
    const tag = section.level === 2 ? "h2" : section.level === 3 ? "h3" : "h4";
    bodyHtml += `<${tag}>${section.heading}</${tag}>\n`;
    for (const para of section.paragraphs) {
      bodyHtml += renderParagraphToHtml(para, "") + "\n";
    }
  }

  // References
  let refsHtml = "";
  if (article.references.length > 0) {
    refsHtml = `<h2>References</h2>\n<ol class="references">\n`;
    for (const ref of article.references) {
      const clean = ref
        .replace(/^\d+\.\s*/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1");
      refsHtml += `<li>${clean}</li>\n`;
    }
    refsHtml += `</ol>\n`;
  }

  // Disclosure
  let disclosureHtml = "";
  if (article.disclosure) {
    disclosureHtml = `<div class="disclosure"><p><strong>Disclosure:</strong> ${inlineFormat(article.disclosure)}</p></div>\n`;
  }

  // Logo as base64 data URI for Puppeteer compatibility
  let logoDataUri = "";
  try {
    const logoBuffer = fs.readFileSync(path.join(PUBLIC_DIR, "android-chrome-512x512.png"));
    logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {}

  // Authors with superscript affiliation numbers (PLOS ONE style)
  const authorsHtml = article.authors.map((name, i) => {
    const sup = article.affiliations.length > 1 ? `<sup>${i + 1}</sup>` : "";
    return `${name}${sup}`;
  }).join(", ");

  // Affiliations, each on its own line (PLOS ONE style)
  const affiliationsHtml = article.affiliations.map((a, i) => {
    const num = article.affiliations.length > 1 ? `<strong>${i + 1}</strong> ` : "";
    return `${num}${a}`;
  }).join("<br/>");

  // Citation text
  const year = article.publicationDate ? new Date(article.publicationDate).getFullYear() : "2026";
  const citationAuthors = article.authors.length > 3
    ? `${article.authors[0]} et al.`
    : article.authors.join(", ");
  const citationText = `${citationAuthors} (${year}) ${article.title}. American Impact Review. ${article.slug.toUpperCase()}. https://americanimpactreview.com/article/${article.slug}`;

  // DOI or article URL for footer
  const footerDoi = `https://americanimpactreview.com/article/${article.slug}`;
  const pubDate = article.publicationDate || "2026";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @page {
    size: letter;
    margin: 0.75in 0.75in 0.9in 0.75in;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Logo header (PLOS style) ── */
  .logo-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  .logo-header img {
    height: 48px;
  }
  .logo-header .journal-title {
    font-size: 22pt;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: 0.3px;
  }

  /* ── Article type kicker ── */
  .kicker {
    font-size: 9pt;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
    margin-top: 16px;
  }

  /* ── Article title ── */
  .article-title {
    font-size: 18pt;
    font-weight: 700;
    color: #111;
    line-height: 1.25;
    margin-bottom: 12px;
  }

  /* ── Authors & affiliations (PLOS style) ── */
  .authors {
    font-size: 11pt;
    color: #333;
    margin-bottom: 6px;
  }
  .authors sup {
    font-size: 7pt;
    color: #1e3a5f;
  }
  .affiliations {
    font-size: 8.5pt;
    color: #555;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .affiliations strong {
    color: #1e3a5f;
    font-weight: 700;
  }
  .corresponding {
    font-size: 8.5pt;
    color: #555;
    margin-bottom: 16px;
  }

  /* ── First page two-column layout ── */
  .first-page-grid {
    display: flex;
    gap: 24px;
    margin-bottom: 14px;
  }
  .sidebar {
    width: 210px;
    flex-shrink: 0;
    font-size: 7.5pt;
    color: #555;
    line-height: 1.5;
    border-top: 1px solid #ddd;
    padding-top: 10px;
    overflow-wrap: break-word;
    word-break: break-all;
  }
  .sidebar-section {
    margin-bottom: 10px;
  }
  .sidebar-section .label {
    font-weight: 700;
    color: #333;
    margin-bottom: 2px;
  }
  .sidebar-section a {
    color: #1e3a5f;
    text-decoration: none;
  }
  .main-col {
    flex: 1;
    min-width: 0;
  }

  /* ── Abstract ── */
  .abstract-heading {
    font-size: 14pt;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 8px;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
  .abstract-text {
    font-size: 9.5pt;
    line-height: 1.55;
    color: #333;
    margin-bottom: 10px;
    text-align: justify;
  }

  /* ── Body ── */
  h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 18px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 14px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 10pt;
    font-weight: 700;
    color: #333;
    margin-top: 10px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 8px;
    text-align: justify;
    text-indent: 16px;
    orphans: 3;
    widows: 3;
  }
  h2 + p, h3 + p, h4 + p,
  .abstract-text p {
    text-indent: 0;
  }

  ul, ol {
    margin: 6px 0 6px 24px;
    font-size: 10pt;
  }
  li { margin-bottom: 3px; }

  code {
    font-family: "Courier New", monospace;
    font-size: 9pt;
    background: #f0f0f0;
    padding: 1px 3px;
    border-radius: 2px;
  }

  a { color: #1e3a5f; text-decoration: underline; }

  .formula {
    text-align: center;
    font-style: italic;
    margin: 10px 0;
    padding: 6px;
    background: #fafafa;
  }

  /* ── Figures (PLOS style) ── */
  .article-figure {
    margin: 18px 0;
    page-break-inside: avoid;
  }
  .article-figure img {
    max-width: 100%;
    max-height: 420px;
    display: block;
    margin: 0 auto;
  }
  .article-figure figcaption {
    font-size: 9pt;
    color: #333;
    margin-top: 8px;
    line-height: 1.45;
    text-align: left;
    text-indent: 0;
  }
  .article-figure figcaption strong {
    color: #000;
  }

  /* ── Tables ── */
  .article-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }
  .article-table th {
    background: #eef1f5;
    color: #1a1a1a;
    font-weight: 700;
    padding: 6px 8px;
    text-align: left;
    border-top: 2px solid #333;
    border-bottom: 1px solid #333;
  }
  .article-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
  }
  .article-table tr:last-child td {
    border-bottom: 2px solid #333;
  }

  .table-caption {
    font-size: 9pt;
    color: #333;
    margin: 4px 0 10px;
    text-indent: 0;
  }
  .table-caption strong {
    color: #000;
  }

  /* ── References (PLOS style: numbered list) ── */
  .references {
    font-size: 8pt;
    line-height: 1.5;
    color: #333;
    padding-left: 24px;
    list-style-type: decimal;
  }
  .references li {
    margin-bottom: 4px;
    text-align: left;
    text-indent: 0;
  }

  /* ── Disclosure / Copyright ── */
  .disclosure {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
    font-size: 8.5pt;
    color: #555;
  }
  .disclosure p {
    text-indent: 0;
  }

  /* ── Page footer ── */
  .page-footer {
    display: none; /* rendered via Puppeteer footerTemplate instead */
  }
</style>
</head>
<body>

  <!-- Logo (PLOS style) -->
  <div class="logo-header">
    <img src="${logoDataUri}" alt="AIR" />
    <span class="journal-title">American Impact Review</span>
  </div>

  <!-- Article type kicker -->
  <div class="kicker">Research Article</div>

  <!-- Title -->
  <div class="article-title">${article.title}</div>

  <!-- Authors with superscripts -->
  <div class="authors">${authorsHtml}</div>

  <!-- Affiliations inline -->
  <div class="affiliations">${affiliationsHtml}</div>

  <!-- Corresponding author -->
  <div class="corresponding">* Corresponding author</div>

  <!-- Two-column: sidebar + abstract -->
  <div class="first-page-grid">
    <div class="sidebar">
      <div class="sidebar-section">
        <div class="label">OPEN ACCESS</div>
      </div>
      <div class="sidebar-section">
        <div class="label">Citation:</div>
        <div>${citationText}</div>
      </div>
      ${article.receivedDate ? `<div class="sidebar-section"><div class="label">Received:</div><div>${article.receivedDate}</div></div>` : ""}
      ${article.acceptedDate ? `<div class="sidebar-section"><div class="label">Accepted:</div><div>${article.acceptedDate}</div></div>` : ""}
      ${article.publicationDate ? `<div class="sidebar-section"><div class="label">Published:</div><div>${article.publicationDate}</div></div>` : ""}
      <div class="sidebar-section">
        <div class="label">Copyright:</div>
        <div>&copy; ${year} ${article.authors[0] || "Authors"}. This is an open access article distributed under the terms of the Creative Commons Attribution License (CC BY 4.0).</div>
      </div>
    </div>
    <div class="main-col">
      ${article.abstract ? `
        <div class="abstract-heading">Abstract</div>
        <div class="abstract-text">${inlineFormat(article.abstract)}</div>
      ` : ""}
    </div>
  </div>

  <!-- Body -->
  ${bodyHtml}

  <!-- References -->
  ${refsHtml}

  <!-- Disclosure -->
  ${disclosureHtml}

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// PDF generation via Puppeteer
// ---------------------------------------------------------------------------

async function generatePdf(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  article: ParsedArticle
): Promise<Buffer> {
  const html = buildHtml(article);
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

  const articleUrl = `https://americanimpactreview.com/article/${article.slug}`;
  const pubDate = article.publicationDate || "2026";

  const pdfBuffer = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: {
      top: "0.75in",
      right: "0.75in",
      bottom: "0.85in",
      left: "0.75in",
    },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%; padding: 0 0.75in; font-size:8.5px; color:#555; font-family: Times New Roman, serif; border-top: 1px solid #ccc; padding-top: 6px; display: flex; justify-content: space-between;">
        <span>American Impact Review | <a href="${articleUrl}" style="color:#1e3a5f; text-decoration:none;">${articleUrl}</a> &nbsp; ${pubDate}</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
  });

  await page.close();

  // Set PDF metadata using pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.setTitle(article.title);
  pdfDoc.setAuthor(article.authors.join(", "));
  pdfDoc.setSubject(article.abstract.slice(0, 500));
  pdfDoc.setKeywords(article.keywords);
  pdfDoc.setCreator("American Impact Review");
  pdfDoc.setProducer("American Impact Review / Global Talent Foundation");
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());
  const finalPdf = await pdfDoc.save();

  return Buffer.from(finalPdf);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("Generating article PDFs via Puppeteer...\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const mdFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();

  if (mdFiles.length === 0) {
    console.log("No article .md files found in", ARTICLES_DIR);
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const file of mdFiles) {
      const filePath = path.join(ARTICLES_DIR, file);
      const article = parseArticleFile(filePath);
      console.log(
        `  Processing: ${article.slug} - "${article.title.slice(0, 60)}..."`
      );

      const pdfBuffer = await generatePdf(browser, article);
      const outPath = path.join(OUTPUT_DIR, `${article.slug}.pdf`);
      fs.writeFileSync(outPath, pdfBuffer);
      console.log(
        `    -> ${outPath} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`
      );
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone! Generated ${mdFiles.length} PDF(s).`);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
