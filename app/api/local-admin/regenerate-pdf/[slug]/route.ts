import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";
import { put } from "@vercel/blob";
import { PDFDocument, PDFName, PDFArray, PDFDict } from "pdf-lib";

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
  let inUl = false, inOl = false, inTable = false, tableWrapped = false;

  const closeList = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
    if (inOl) { output.push("</ol>"); inOl = false; }
  };
  const closeTable = () => {
    if (inTable) {
      output.push("</tbody></table>");
      if (tableWrapped) { output.push("</div>"); tableWrapped = false; }
      inTable = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^---+$/.test(trimmed)) { closeList(); closeTable(); continue; }

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

    if (/^\*Table \d+\./.test(trimmed)) {
      closeList(); closeTable();
      output.push(`<p class="table-caption">${inlineFormat(trimmed)}</p>`);
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList();
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s\-:|]/g, "")) continue;
      if (!inTable) {
        inTable = true;
        // Wrap preceding table-caption + table in a single block to prevent page split
        const lastOut = output[output.length - 1] || "";
        if (lastOut.includes('class="table-caption"')) {
          const caption = output.pop();
          output.push(`<div style="page-break-inside:avoid;break-inside:avoid;">${caption}`);
          tableWrapped = true;
        }
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

    if (/^[-*+]\s+/.test(trimmed)) {
      closeTable();
      if (inOl) { output.push("</ol>"); inOl = false; }
      if (!inUl) { output.push("<ul>"); inUl = true; }
      output.push(`<li>${inlineFormat(trimmed.replace(/^[-*+]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (inUl) { output.push("</ul>"); inUl = false; }
      if (!inOl) { output.push("<ol>"); inOl = true; }
      output.push(`<li>${inlineFormat(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    if (inUl || inOl) closeList();
    if (!trimmed) continue;

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

function buildPdfHtml(article: {
  title: string; slug: string; authors: string[]; affiliations: string[];
  abstract: string; keywords: string[]; content: string; category: string;
  articleType?: string; doi?: string;
  receivedAt: Date | null; acceptedAt: Date | null; publishedAt: Date | null;
}): string {
  const rawContent = article.content || "";
  const isHtml = rawContent.trimStart().startsWith("<");

  let bodyHtml = "";
  let refsHtml = "";
  let disclosureHtml = "";

  if (isHtml) {
    // HTML content from mammoth docx conversion — extract sections by headings
    const headingRegex = /<h([12])[^>]*>(.*?)<\/h\1>/gi;
    const headings: { level: number; title: string; index: number; endTag: number }[] = [];
    let match;
    while ((match = headingRegex.exec(rawContent)) !== null) {
      const endTag = match.index + match[0].length;
      headings.push({ level: parseInt(match[1]), title: match[2].replace(/<[^>]+>/g, "").trim(), index: match.index, endTag });
    }

    // Fallback: if no <h1>/<h2> found, detect <p><strong>SectionName</strong></p> as headings
    if (!headings.length) {
      const boldHeadingRegex = /<p><strong>([^<]*)<\/strong><\/p>/gi;
      const knownSections = /^(abstract|introduction|methods?|methodology|analytical\s+procedure|materials?\s+and\s+methods?|results?|discussion|conclusions?|limitations?|implications?|recommendations?|acknowledgm?ents?|author\s+contributions?|funding|data\s+availability|conflicts?\s+of\s+interest|disclosure|ethics|references|bibliography|appendix|literature\s+review|theoretical\s+framework|background|objectives?|aim|purpose|study\s+design|participants?|procedure|analysis|findings|future\s+research|significance)/i;
      const titleLower = article.title.toLowerCase();
      let bm;
      while ((bm = boldHeadingRegex.exec(rawContent)) !== null) {
        const text = bm[1].replace(/<[^>]+>/g, "").trim();
        if (!text || text.length > 120) continue;
        const textLower = text.toLowerCase();
        if (textLower === titleLower) continue;
        if (/orcid/i.test(text)) continue;
        if (/@/.test(text)) continue;
        if (/^(table|figure|fig\.?)\s+\d/i.test(text)) continue;
        const stripped = text.replace(/^\d+\.?\s*/, "");
        if (knownSections.test(stripped) || /^\d+\.?\s+\S/.test(text)) {
          const endTag = bm.index + bm[0].length;
          headings.push({ level: 1, title: text, index: bm.index, endTag });
        }
      }
    }

    const skipTitles = new Set(["abstract", article.title.toLowerCase()]);
    const metaPatterns = [/^original research/i, /^corresponding author/i];
    let foundBody = false;

    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const nextIdx = i + 1 < headings.length ? headings[i + 1].index : rawContent.length;
      const sectionHtml = rawContent.slice(h.endTag, nextIdx).trim();
      const titleLower = h.title.toLowerCase().replace(/^\d+\.?\s*/, "");

      if (titleLower === "abstract" || titleLower.startsWith("abstract")) {
        continue; // Abstract shown separately
      } else if (titleLower === "references" || titleLower.startsWith("references")) {
        refsHtml = `<h2>References</h2>\n${sectionHtml}`;
      } else if (skipTitles.has(titleLower) || metaPatterns.some(p => p.test(h.title))) {
        continue;
      } else {
        foundBody = true;
        const tag = h.level === 1 ? "h2" : h.level === 2 ? "h2" : "h3";
        bodyHtml += `<${tag}>${h.title}</${tag}>\n${sectionHtml}\n`;
      }
    }

    if (!foundBody && rawContent.length > 0) {
      bodyHtml = rawContent;
    }
  } else {
    // Markdown content path
    const { sections, references, disclosure } = parseSectionsAndReferences(rawContent);

    for (const s of sections) {
      const tag = s.level === 2 ? "h2" : s.level === 3 ? "h3" : "h4";
      bodyHtml += `<${tag}>${s.heading}</${tag}>\n`;
      for (const p of s.paragraphs) bodyHtml += renderParagraph(p) + "\n";
    }

    if (references.length) {
      refsHtml = `<h2>References</h2>\n<ol class="references">\n`;
      for (const ref of references) {
        const clean = ref.replace(/^\d+\.\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
        refsHtml += `<li>${clean}</li>\n`;
      }
      refsHtml += `</ol>\n`;
    }

    if (disclosure) disclosureHtml = `<div class="disclosure"><p><strong>Disclosure:</strong> ${inlineFormat(disclosure)}</p></div>\n`;
  }

  // Strip keywords line from body (we render them separately under abstract)
  bodyHtml = bodyHtml.replace(/<p>\s*(?:<strong>)?\s*Keywords?\s*:?\s*(?:<\/strong>)?\s*[^<]*<\/p>/gi, "");

  // Post-process: wrap figure/table captions + their content in break-inside:avoid divs.
  // Caption <p> must contain ONLY "Figure/Table N" (possibly bold) — not prose starting with "Table 1 summarizes..."
  // Then optional italic description, then the actual element (figure/table/img).
  bodyHtml = bodyHtml.replace(
    /(<p>(?:<strong>)?\s*(?:Figure|Fig\.?|Table)\s+\d+\.?\s*(?:<\/strong>)?<\/p>)((?:\s*<p><em>[^<]*<\/em><\/p>)*)\s*(?:<p>\s*)?(<(?:figure|table)\b[\s\S]*?<\/(?:figure|table)>|<img\b[^>]*\/?>)(?:\s*<\/p>)?/gi,
    '<div style="page-break-inside:avoid;break-inside:avoid;">$1$2$3</div>'
  );

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
    font-size: 12pt;
    line-height: 1.5;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .logo-header { margin-bottom: 24px; }
  .logo-header table { border-collapse: collapse; width: auto; margin: 0; }
  .logo-header td { vertical-align: middle; padding: 0; border: none; background: none; }
  .logo-header img { height: 48px; width: 48px; display: block; }
  .logo-header .journal-title { font-size: 22pt; font-weight: 700; color: #1e3a5f; letter-spacing: 0.3px; padding-left: 12px; white-space: nowrap; }

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
  .keywords { font-size: 9pt; color: #444; line-height: 1.5; margin-bottom: 10px; text-indent: 0; }
  .keywords strong { color: #1e3a5f; margin-right: 6px; }

  /* Page break rules: keep headings with following content, keep figures/tables whole */
  h2, h3, h4 { page-break-after: avoid; break-after: avoid; }
  h2 { font-size: 13pt; font-weight: 700; color: #1a1a1a; margin-top: 18px; margin-bottom: 6px; }
  h3 { font-size: 11pt; font-weight: 700; color: #1a1a1a; margin-top: 14px; margin-bottom: 4px; }
  h4 { font-size: 10pt; font-weight: 700; color: #333; margin-top: 10px; margin-bottom: 4px; }
  p { margin-bottom: 8px; text-align: justify; text-indent: 16px; orphans: 3; widows: 3; }
  h2 + p, h3 + p, h4 + p, .abstract-text p { text-indent: 0; }
  ul, ol { margin: 6px 0 6px 24px; font-size: 10pt; }
  li { margin-bottom: 3px; }
  code { font-family: "Courier New", monospace; font-size: 9pt; background: #f0f0f0; padding: 1px 3px; border-radius: 2px; }
  a { color: #1e3a5f; text-decoration: underline; }
  .formula { text-align: center; font-style: italic; margin: 10px 0; padding: 6px; background: #fafafa; page-break-inside: avoid; break-inside: avoid; }

  .article-figure { margin: 18px 0; page-break-inside: avoid; break-inside: avoid; }
  .article-figure img { max-width: 100%; max-height: 420px; display: block; margin: 0 auto; }
  .article-figure figcaption { font-size: 9pt; color: #333; margin-top: 8px; line-height: 1.45; text-align: left; text-indent: 0; }
  .article-figure figcaption strong { color: #000; }

  /* Table with caption: keep caption + table together */
  .table-caption { font-size: 9pt; color: #333; margin: 4px 0 10px; text-indent: 0; page-break-after: avoid; break-after: avoid; }
  .table-caption strong { color: #000; }
  .article-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; page-break-inside: avoid; break-inside: avoid; }
  .article-table th { background: #eef1f5; color: #1a1a1a; font-weight: 700; padding: 6px 8px; text-align: left; text-indent: 0; border-top: 2px solid #333; border-bottom: 1px solid #333; }
  .article-table td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; text-align: left; text-indent: 0; }
  .article-table td p, .article-table th p { text-indent: 0; text-align: left; margin: 0; }
  .article-table tr:last-child td { border-bottom: 2px solid #333; }

  .references { font-size: 9pt; line-height: 1.5; color: #000; padding-left: 24px; list-style-type: decimal; }
  .references li { margin-bottom: 4px; text-align: left; text-indent: 0; }

  .disclosure { margin-top: 16px; padding-top: 12px; border-top: 1px solid #aaa; font-size: 9pt; color: #000; }
  .disclosure p { text-indent: 0; }

  /* Mammoth HTML content styles — same page-break rules */
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; page-break-inside: avoid; break-inside: avoid; }
  table th { background: #eef1f5; color: #1a1a1a; font-weight: 700; padding: 6px 8px; text-align: left; border-top: 2px solid #333; border-bottom: 1px solid #333; }
  table td { padding: 5px 8px; border-bottom: 1px solid #ddd; vertical-align: top; text-align: left; text-indent: 0; }
  table tr:last-child td { border-bottom: 2px solid #333; }
  td p, th p { text-indent: 0; text-align: left; margin: 0; }
  img { max-width: 100%; max-height: 500px; display: block; margin: 12px auto; page-break-inside: avoid; break-inside: avoid; }
  figure { margin: 18px 0; page-break-inside: avoid; break-inside: avoid; }
  figcaption { font-size: 9pt; color: #333; margin-top: 6px; text-align: left; text-indent: 0; }
  sup { font-size: 0.7em; vertical-align: super; }
  sub { font-size: 0.7em; vertical-align: sub; }
</style>
</head>
<body>

  <div class="logo-header">
    <table><tr>
      <td><img src="https://americanimpactreview.com/android-chrome-512x512.png" alt="AIR" /></td>
      <td><span class="journal-title">American Impact Review</span></td>
    </tr></table>
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
      ${article.keywords.length ? `
        <div class="keywords"><strong>Keywords</strong> ${article.keywords.join(", ")}</div>
      ` : ""}
    </div>
  </div>

  ${bodyHtml}
  ${refsHtml}
  ${disclosureHtml}

</body>
</html>`;
}

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = params.slug;

    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug));

    const r = rows[0];
    if (!r) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const authors = parseJsonArray(r.authors);
    const affiliations = parseJsonArray(r.affiliations);
    const keywords = parseJsonArray(r.keywords);

    // Deduplicate abstract: remove repeated trailing substring
    function dedupeAbstract(text: string): string {
      const t = text.trim();
      for (let len = Math.floor(t.length / 2); len >= 40; len--) {
        const suffix = t.slice(-len).toLowerCase();
        const idx = t.toLowerCase().indexOf(suffix);
        if (idx >= 0 && idx < t.length - len) {
          return t.slice(0, t.length - len).trimEnd();
        }
      }
      return t;
    }

    const html = buildPdfHtml({
      title: r.title,
      slug: r.slug,
      authors: authors.length ? authors : [r.authorUsername || "Author"],
      affiliations,
      abstract: dedupeAbstract(r.abstract || ""),
      keywords,
      content: r.content || "",
      category: r.category || "Article",
      articleType: r.articleType || undefined,
      doi: r.doi || undefined,
      receivedAt: r.receivedAt || null,
      acceptedAt: r.acceptedAt || null,
      publishedAt: r.publishedAt || null,
    });

    // Launch headless Chrome via @sparticuz/chromium-min + remote binary
    const chromiumMod = await import("@sparticuz/chromium-min");
    const Chromium = chromiumMod.default;
    const puppeteer = (await import("puppeteer-core")).default;

    const chromiumPack =
      "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";

    const browser = await puppeteer.launch({
      args: Chromium.args,
      executablePath: await Chromium.executablePath(chromiumPack),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const articleUrl = `https://americanimpactreview.com/article/${slug}`;
    const pubDate = r.publishedAt
      ? r.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().getFullYear().toString();

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
        <div style="width:100%; padding: 0 0.75in; font-size:10px; color:#000; font-family: Times New Roman, serif; border-top: 1px solid #999; padding-top: 6px; display: flex; justify-content: space-between;">
          <span>American Impact Review | <a href="${articleUrl}" style="color:#000; text-decoration:none;">${articleUrl}</a> &nbsp; ${pubDate}</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `,
    });

    await page.close();
    await browser.close();

    // Set PDF metadata with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.setTitle(r.title);
    pdfDoc.setAuthor(authors.join(", "));
    pdfDoc.setSubject((r.abstract || "").slice(0, 500));
    pdfDoc.setKeywords(keywords);
    pdfDoc.setCreator("American Impact Review");
    pdfDoc.setProducer("American Impact Review / Global Talent Foundation");
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Force PDF to open on page 1
    const catalog = pdfDoc.catalog;
    // Remove any existing open/destination actions
    catalog.delete(PDFName.of("OpenAction"));
    catalog.delete(PDFName.of("Dests"));
    // Set OpenAction: go to first page, fit to window
    const firstPageRef = pdfDoc.getPage(0).ref;
    const destArray = pdfDoc.context.obj([firstPageRef, PDFName.of("Fit")]);
    catalog.set(PDFName.of("OpenAction"), destArray);
    // Also set page layout to single page
    catalog.set(PDFName.of("PageLayout"), PDFName.of("SinglePage"));
    catalog.set(PDFName.of("PageMode"), PDFName.of("UseNone"));

    const finalPdf = await pdfDoc.save();

    // Upload to Vercel Blob
    const blob = await put(`articles/${slug}.pdf`, Buffer.from(finalPdf), {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Save the blob URL in published_articles
    await db
      .update(publishedArticles)
      .set({ pdfUrl: blob.url, updatedAt: new Date() })
      .where(eq(publishedArticles.id, r.id));

    return NextResponse.json({
      success: true,
      pdfUrl: blob.url,
      size: finalPdf.length,
      pageCount: pdfDoc.getPageCount(),
      title: r.title,
      slug,
    });
  } catch (error) {
    console.error("PDF regeneration error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
