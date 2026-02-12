/**
 * generate-review-copy.ts
 *
 * Generates a professional Manuscript Review Copy PDF from an author's
 * Word (.docx) file — matching the format used by Elsevier Editorial Manager.
 *
 * Output: Cover sheet (page 1) + manuscript body with headers/footers/watermark.
 *
 * Usage:
 *   npx tsx scripts/generate-review-copy.ts \
 *     --manuscript /path/to/paper.docx \
 *     --id AIR-2026-0042 \
 *     --title "Paper Title" \
 *     --authors "John Smith, Jane Doe" \
 *     --article-type "Original Research" \
 *     --keywords "ML, NLP, robotics" \
 *     --category "Computer Science" \
 *     --abstract "This paper proposes..." \
 *     --reviewer "Dr. Bogdan Mikhailov" \
 *     --deadline "2026-03-09" \
 *     --received "2026-02-09" \
 *     [--output /path/to/output.pdf]
 */

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

const CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const manuscript = get("--manuscript");
  const id = get("--id");
  const title = get("--title");

  if (!manuscript || !id || !title) {
    console.error(`Usage: npx tsx scripts/generate-review-copy.ts
  --manuscript <path.docx>   Word file from author (required)
  --id <AIR-2026-XXXX>       Manuscript ID (required)
  --title <string>           Paper title (required)
  --authors <string>         Author names, comma-separated
  --article-type <string>    Original Research | Review Article | Short Communication | Case Study
  --keywords <string>        Comma-separated keywords
  --category <string>        Subject area
  --abstract <string>        Abstract text (or auto-extracted from Word)
  --reviewer <string>        Reviewer full name
  --deadline <YYYY-MM-DD>    Review deadline
  --received <YYYY-MM-DD>    Date manuscript received
  --output <path.pdf>        Output PDF path`);
    process.exit(1);
  }

  return {
    manuscript,
    id,
    title,
    authors: get("--authors") || "—",
    articleType: get("--article-type") || "Original Research",
    keywords: get("--keywords") || "—",
    category: get("--category") || "—",
    abstract: get("--abstract") || "",
    reviewer: get("--reviewer") || "—",
    deadline: get("--deadline") || "—",
    received: get("--received") || new Date().toISOString().slice(0, 10),
    output:
      get("--output") ||
      path.join(
        path.dirname(manuscript),
        `${id}-review-copy.pdf`
      ),
  };
}

// ─── Date formatting ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (dateStr === "—") return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Cover page HTML ────────────────────────────────────────────────────────

function buildCoverHtml(opts: ReturnType<typeof parseArgs>): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    width: 8.5in; height: 11in;
    padding: 1in 1.15in;
    color: #1a2332;
    display: flex;
    flex-direction: column;
  }

  .journal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 6px;
  }
  .journal-logo svg {
    display: block;
  }
  .journal-text {
    text-align: left;
  }
  .journal-name {
    font-size: 14pt;
    font-weight: bold;
    color: #0a1628;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }
  .journal-sub {
    font-size: 8pt;
    color: #000;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .divider {
    border: none;
    border-top: 2px solid #0a1628;
    margin: 14px 0 28px 0;
  }

  .title {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    color: #0a1628;
    line-height: 1.35;
    margin-bottom: 6px;
  }
  .draft-label {
    text-align: center;
    font-size: 10pt;
    color: #000;
    letter-spacing: 0.05em;
    margin-bottom: 30px;
  }

  .meta-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12pt;
    margin-bottom: 32px;
  }
  .meta-table td {
    padding: 8px 14px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  .meta-table .label {
    width: 170px;
    font-weight: bold;
    color: #000;
    background: #f8fafc;
  }
  .meta-table .value {
    color: #000;
  }
  .meta-table .abstract-cell {
    font-size: 11pt;
    line-height: 1.55;
    color: #000;
  }

  .review-info {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 18px 22px;
    margin-bottom: 0;
    font-size: 10pt;
    color: #000;
    line-height: 1.65;
  }
  .review-info .section-label {
    font-size: 8.5pt;
    font-weight: bold;
    color: #000;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .review-info table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  .review-info table td {
    padding: 4px 0;
    vertical-align: top;
  }
  .review-info table td:first-child {
    width: 140px;
    font-weight: 600;
    color: #000;
  }
  .review-info .instructions {
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    margin-top: 4px;
    font-size: 9pt;
    color: #000;
    line-height: 1.6;
  }
  .review-info .instructions p {
    margin: 0 0 6px;
  }

  .confidential-line {
    text-align: center;
    font-size: 8.5pt;
    font-weight: bold;
    color: #b5432a;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .content { flex: 1; }
  .footer {
    border-top: 1px solid #cbd5e1;
    padding-top: 8px;
    font-size: 10pt;
    color: #000;
    text-align: center;
  }
</style>
</head>
<body>

<div class="content">
<div class="journal-header">
  <div class="journal-logo">
    <svg width="44" height="44" viewBox="0 0 38 38" fill="none">
      <circle cx="19" cy="19" r="17" stroke="#c0b8a8" stroke-width="1" fill="none"/>
      <circle cx="19" cy="19" r="11" stroke="#8a7e6e" stroke-width="1" fill="none"/>
      <circle cx="19" cy="19" r="6" stroke="#b5432a" stroke-width="1.2" fill="none"/>
      <circle cx="19" cy="19" r="2.2" fill="#b5432a"/>
    </svg>
  </div>
  <div class="journal-text">
    <div class="journal-name">AMERICAN IMPACT REVIEW</div>
    <div class="journal-sub">A Peer-Reviewed Multidisciplinary Journal</div>
  </div>
</div>
<hr class="divider" />

<div class="title">${escapeHtml(opts.title)}</div>
<div class="draft-label">— Manuscript Draft —</div>

<table class="meta-table">
  <tr>
    <td class="label">Manuscript Number</td>
    <td class="value">${escapeHtml(opts.id)}</td>
  </tr>
  <tr>
    <td class="label">Article Type</td>
    <td class="value">${escapeHtml(opts.articleType)}</td>
  </tr>
  <tr>
    <td class="label">Received</td>
    <td class="value">${formatDate(opts.received)}</td>
  </tr>
  <tr>
    <td class="label">Subject Area</td>
    <td class="value">${escapeHtml(opts.category)}</td>
  </tr>
  <tr>
    <td class="label">Keywords</td>
    <td class="value">${escapeHtml(opts.keywords)}</td>
  </tr>
  <tr>
    <td class="label">Authors</td>
    <td class="value">${escapeHtml(opts.authors)}</td>
  </tr>
  ${opts.abstract ? `<tr>
    <td class="label">Abstract</td>
    <td class="value abstract-cell">${escapeHtml(opts.abstract)}</td>
  </tr>` : ""}
</table>

<div class="confidential-line">Confidential — For Peer Review Only</div>

<div class="review-info">
  <div class="section-label">Review Assignment</div>
  <table>
    <tr>
      <td>Reviewer</td>
      <td>${escapeHtml(opts.reviewer)}</td>
    </tr>
    <tr>
      <td>Deadline</td>
      <td>${formatDate(opts.deadline)}</td>
    </tr>
  </table>
  <div class="instructions">
    <p>Please evaluate this manuscript for originality, methodological rigor, clarity of presentation, and significance of findings. Submit your review and recommendation to the Editor-in-Chief at <strong>egor@americanimpactreview.com</strong>.</p>
    <p>This document is confidential. Do not distribute, cite, or upload to any AI tools.</p>
  </div>
</div>
</div>

<div class="footer">
  American Impact Review &middot; Published by Global Talent Foundation 501(c)(3) &middot; CONFIDENTIAL
</div>

</body>
</html>`;
}

// ─── Manuscript body HTML ───────────────────────────────────────────────────

function buildBodyHtml(
  bodyContent: string,
  opts: ReturnType<typeof parseArgs>
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {
    size: letter;
    margin: 1in 1in 1.2in 1in;
  }

  * { box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: relative;
  }

  /* Watermark */
  body::before {
    content: "CONFIDENTIAL — PEER REVIEW COPY";
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-family: Arial, sans-serif;
    font-size: 48pt;
    font-weight: bold;
    color: rgba(200, 30, 30, 0.40);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    letter-spacing: 0.05em;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
  }

  h1 { font-size: 18pt; margin: 1em 0 0.5em; color: #000; }
  h2 { font-size: 14pt; margin: 1em 0 0.4em; color: #000; }
  h3 { font-size: 12pt; margin: 0.8em 0 0.3em; color: #000; }
  p { margin: 0 0 0.8em; text-align: justify; }
  img { max-width: 100%; height: auto; margin: 1em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 10pt; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f8f9fa; font-weight: bold; }
  ul, ol { margin: 0 0 0.8em 1.5em; }
  li { margin-bottom: 0.3em; }
  blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 3px solid #cbd5e1; color: #000; }
  sup, sub { font-size: 0.75em; }
  a { color: #1a1a1a; text-decoration: none; }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Markdown → HTML ─────────────────────────────────────────────────────────

function convertMarkdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const output: string[] = [];
  let inList = false;
  let listType = "";
  let paragraph = "";
  let bodyStarted = false;

  const flush = () => { if (paragraph.trim()) { output.push(`<p>${ifmt(paragraph.trim())}</p>`); paragraph = ""; } };
  const closeList = () => { if (inList) { output.push(listType === "ol" ? "</ol>" : "</ul>"); inList = false; } };
  function ifmt(t: string): string {
    return t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!bodyStarted) { if (/^#{1,3}\s+(Abstract|\d)/.test(trimmed)) bodyStarted = true; else continue; }
    const hm = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (hm) { flush(); closeList(); const l = Math.min(hm[1].length, 4); output.push(`<h${l}>${ifmt(hm[2])}</h${l}>`); continue; }
    if (/^\[Formula:/.test(trimmed)) { flush(); closeList(); output.push(`<p style="text-align:center;font-style:italic;padding:6px;background:#fafafa;">${ifmt(trimmed.replace(/^\[Formula:\s*/, "").replace(/\]$/, ""))}</p>`); continue; }
    if (/^\d+\.\s+/.test(trimmed)) { flush(); if (!inList || listType !== "ol") { closeList(); output.push("<ol>"); inList = true; listType = "ol"; } output.push(`<li>${ifmt(trimmed.replace(/^\d+\.\s+/, ""))}</li>`); continue; }
    if (/^[-*+]\s+/.test(trimmed)) { flush(); if (!inList || listType !== "ul") { closeList(); output.push("<ul>"); inList = true; listType = "ul"; } output.push(`<li>${ifmt(trimmed.replace(/^[-*+]\s+/, ""))}</li>`); continue; }
    if (trimmed === "") { flush(); closeList(); continue; }
    if (inList) closeList();
    paragraph += (paragraph ? " " : "") + trimmed;
  }
  flush(); closeList();
  return output.join("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  // Validate input file
  if (!fs.existsSync(opts.manuscript)) {
    console.error(`File not found: ${opts.manuscript}`);
    process.exit(1);
  }

  const ext = path.extname(opts.manuscript).toLowerCase();
  if (![".docx", ".doc", ".md"].includes(ext)) {
    console.error(`Unsupported format: ${ext}. Use .docx, .doc, or .md`);
    process.exit(1);
  }

  console.log(`\n  Manuscript Review Copy Generator`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  ID:       ${opts.id}`);
  console.log(`  Title:    ${opts.title.slice(0, 60)}${opts.title.length > 60 ? "..." : ""}`);
  console.log(`  Reviewer: ${opts.reviewer}`);
  console.log(`  Input:    ${opts.manuscript}`);
  console.log(`  Output:   ${opts.output}\n`);

  // 1. Convert source → HTML
  let bodyHtml: string;
  if (ext === ".md") {
    console.log("  [1/4] Converting Markdown to HTML...");
    const mdContent = fs.readFileSync(opts.manuscript, "utf-8");
    bodyHtml = convertMarkdownToHtml(mdContent);
  } else {
    console.log("  [1/4] Converting Word to HTML...");
    const docBuffer = fs.readFileSync(opts.manuscript);
    const result = await mammoth.convertToHtml(
      { buffer: docBuffer },
      {
        convertImage: mammoth.images.imgElement(function (image) {
          return image.read("base64").then(function (imageBuffer) {
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          });
        }),
      }
    );
    bodyHtml = result.value;
    if (result.messages.length > 0) {
      console.log(`    (${result.messages.length} conversion warnings)`);
    }
  }

  // 2. Launch browser
  console.log("  [2/4] Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // 3. Generate cover page PDF
    console.log("  [3/4] Generating cover page...");
    const coverHtml = buildCoverHtml(opts);
    await page.setContent(coverHtml, { waitUntil: "domcontentloaded" });
    const coverPdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    // 4. Generate manuscript body PDF
    console.log("  [4/4] Generating manuscript body...");
    const manuscriptHtml = buildBodyHtml(bodyHtml, opts);
    await page.setContent(manuscriptHtml, { waitUntil: "domcontentloaded", timeout: 60000 });
    const bodyPdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:11px;padding:0 0.7in;display:flex;justify-content:space-between;color:#000;font-family:Arial,sans-serif;">
          <span>${escapeHtml(opts.id)}</span>
          <span style="color:#b5432a;letter-spacing:0.05em;">CONFIDENTIAL</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:10px;text-align:center;color:#000000;font-family:Arial,sans-serif;padding:0 0.7in;">
          American Impact Review &nbsp;|&nbsp; For Peer Review Only &nbsp;|&nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
      margin: {
        top: "1in",
        bottom: "1in",
        left: "1in",
        right: "1in",
      },
    });

    // 5. Merge PDFs
    const finalPdf = await PDFDocument.create();

    const coverDoc = await PDFDocument.load(coverPdfBuffer);
    const [coverPage] = await finalPdf.copyPages(coverDoc, [0]);
    finalPdf.addPage(coverPage);

    const bodyDoc = await PDFDocument.load(bodyPdfBuffer);
    const bodyPages = await finalPdf.copyPages(
      bodyDoc,
      bodyDoc.getPageIndices()
    );
    for (const p of bodyPages) {
      finalPdf.addPage(p);
    }

    // Set metadata
    finalPdf.setTitle(`${opts.id} — ${opts.title}`);
    finalPdf.setAuthor("American Impact Review");
    finalPdf.setSubject("Confidential Manuscript for Peer Review");
    finalPdf.setKeywords([
      "peer review",
      "confidential",
      "manuscript",
      opts.id,
    ]);
    finalPdf.setProducer("American Impact Review");
    finalPdf.setCreator("AIR Review Copy Generator");

    const finalBytes = await finalPdf.save();

    // Ensure output directory exists
    const outDir = path.dirname(opts.output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(opts.output, finalBytes);

    const sizeMb = (finalBytes.length / 1024 / 1024).toFixed(2);
    const totalPages = 1 + bodyDoc.getPageCount();
    console.log(
      `\n  Done! ${totalPages} pages, ${sizeMb} MB → ${opts.output}\n`
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Review copy generation failed:", err);
  process.exit(1);
});
