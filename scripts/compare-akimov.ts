/**
 * compare-akimov.ts
 *
 * Compares the SOURCE docx and GENERATED review-copy PDF for the Akimov HSP70
 * article to verify that nothing is lost in the conversion pipeline.
 *
 * Usage: npx tsx scripts/compare-akimov.ts
 */

import fs from "fs";
import mammoth from "mammoth";

// ─── Config ──────────────────────────────────────────────────────────────────

const DOCX_PATH = "/tmp/akimov-test.docx";
const PDF_PATH = fs.existsSync("/tmp/dalas-review-copy.pdf")
  ? "/tmp/dalas-review-copy.pdf"
  : "/tmp/test-akimov-review.pdf";

// ─── Types ───────────────────────────────────────────────────────────────────

type TableInfo = {
  index: number;
  rows: number;
  cols: number;
  headerText: string;
};

type SourceInfo = {
  totalImages: number;
  imageTypes: string[];
  totalTables: number;
  tables: TableInfo[];
  textLength: number;
  plainText: string;
  sectionPreviews: { heading: string; preview: string }[];
};

type PdfInfo = {
  pages: number;
  textLength: number;
  text: string;
  fileSizeKB: number;
  tablePlaceholderLeaks: number;
  imagePlaceholderLeaks: number;
};

// ─── 1. Extract content from SOURCE docx ─────────────────────────────────────

async function extractSource(): Promise<SourceInfo> {
  console.log("=== Step 1: Extracting content from SOURCE docx ===\n");

  if (!fs.existsSync(DOCX_PATH)) {
    console.error(`ERROR: Source docx not found at ${DOCX_PATH}`);
    process.exit(1);
  }

  const docxBuffer = fs.readFileSync(DOCX_PATH);
  console.log(`  Docx file: ${DOCX_PATH} (${(docxBuffer.length / 1024).toFixed(1)} KB)`);

  // --- Count images ---
  const imageTypes: string[] = [];
  const htmlResult = await mammoth.convertToHtml(
    { buffer: docxBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        imageTypes.push(image.contentType);
        const b64 = await image.read("base64");
        return { src: `data:${image.contentType};base64,${b64}` };
      }),
    },
  );

  const html = htmlResult.value;

  // --- Count tables and extract structure ---
  const tables: TableInfo[] = [];
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];

  for (let i = 0; i < tableMatches.length; i++) {
    const tableHtml = tableMatches[i];
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    let maxCols = 0;
    let headerText = "";

    for (let ri = 0; ri < rowMatches.length; ri++) {
      const cellMatches = rowMatches[ri].match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      const cells = cellMatches.map((cell) =>
        cell.replace(/<[^>]+>/g, "").trim()
      );
      maxCols = Math.max(maxCols, cells.length);
      if (ri === 0) {
        headerText = cells.join(" | ");
      }
    }

    tables.push({
      index: i,
      rows: rowMatches.length,
      cols: maxCols,
      headerText,
    });
  }

  // --- Extract plain text for character count & section previews ---
  const textResult = await mammoth.extractRawText({ buffer: docxBuffer });
  const plainText = textResult.value;

  // --- Extract section previews ---
  // Find headings in HTML (h1-h4 tags), then grab text after each
  const sectionPreviews: { heading: string; preview: string }[] = [];
  const headingRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let match;
  const headings: { title: string; endIndex: number }[] = [];

  while ((match = headingRegex.exec(html)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, "").trim();
    headings.push({ title, endIndex: match.index + match[0].length });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].endIndex;
    const end = i + 1 < headings.length ? headings[i + 1].endIndex - headings[i + 1].title.length - 10 : html.length;
    const sectionHtml = html.slice(start, Math.min(start + 600, end));
    const sectionText = sectionHtml.replace(/<[^>]+>/g, "").trim();
    sectionPreviews.push({
      heading: headings[i].title,
      preview: sectionText.slice(0, 200),
    });
  }

  console.log(`  Images found:    ${imageTypes.length}`);
  console.log(`  Image types:     ${[...new Set(imageTypes)].join(", ") || "(none)"}`);
  console.log(`  Tables found:    ${tables.length}`);
  for (const t of tables) {
    console.log(`    Table ${t.index}: ${t.rows} rows x ${t.cols} cols — header: "${t.headerText.slice(0, 80)}"`);
  }
  console.log(`  Text length:     ${plainText.length} characters`);
  console.log(`  Sections found:  ${sectionPreviews.length}`);
  for (const s of sectionPreviews.slice(0, 12)) {
    console.log(`    [${s.heading}] ${s.preview.slice(0, 60)}...`);
  }
  console.log();

  return {
    totalImages: imageTypes.length,
    imageTypes,
    totalTables: tables.length,
    tables,
    textLength: plainText.length,
    plainText,
    sectionPreviews,
  };
}

// ─── 2. Extract content from GENERATED PDF ───────────────────────────────────

async function extractPdf(): Promise<PdfInfo> {
  console.log("=== Step 2: Extracting content from GENERATED PDF ===\n");

  if (!fs.existsSync(PDF_PATH)) {
    console.error(`ERROR: PDF not found at ${PDF_PATH}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`  PDF file: ${PDF_PATH} (${fileSizeKB} KB)`);

  // pdf-parse v2 API: PDFParse class, requires Uint8Array
  const { PDFParse } = await import("pdf-parse");
  const uint8 = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
  const parser = new PDFParse(uint8);
  const info = await parser.load();
  const textResult = await parser.getText();

  const pages = info.numPages;
  const text = textResult.pages.map((pg: any) => pg.text).join("\n");

  // Strip boilerplate (watermark, headers, footers) for cleaner text length
  // These repeat on every page: "CONFIDENTIAL", "American Impact Review", "For Peer Review Only", "Page X of Y"
  let cleanText = text;
  // Remove watermark text occurrences
  cleanText = cleanText.replace(/CONFIDENTIAL\s*-?\s*PEER REVIEW COPY/gi, "");
  // Remove header/footer boilerplate
  cleanText = cleanText.replace(/American Impact Review\s*\|\s*For Peer Review Only\s*\|\s*Page \d+ of \d+/gi, "");
  cleanText = cleanText.replace(/CONFIDENTIAL/gi, "");
  cleanText = cleanText.replace(/For Peer Review Only/gi, "");

  // Count placeholder leaks
  const tablePlaceholderLeaks = (text.match(/__TABLE_/g) || []).length;
  const imagePlaceholderLeaks = (text.match(/__IMAGE_/g) || []).length;

  console.log(`  Pages:           ${pages}`);
  console.log(`  Raw text length: ${text.length} characters`);
  console.log(`  Clean text len:  ${cleanText.length} characters (boilerplate removed)`);
  console.log(`  __TABLE_ leaks:  ${tablePlaceholderLeaks}`);
  console.log(`  __IMAGE_ leaks:  ${imagePlaceholderLeaks}`);
  console.log();

  return {
    pages,
    textLength: cleanText.length,
    text,
    fileSizeKB,
    tablePlaceholderLeaks,
    imagePlaceholderLeaks,
  };
}

// ─── 3. Compare ──────────────────────────────────────────────────────────────

function compare(source: SourceInfo, pdf: PdfInfo) {
  console.log("=== Step 3: Comparison ===\n");

  const results: { check: string; status: string; detail: string }[] = [];

  // --- Images ---
  // A PDF with embedded images should be sizeable. Rule of thumb: 7 images => >500KB easily.
  const expectedMinSizeKB = source.totalImages > 0 ? 500 : 50;
  const imagesLikelyEmbedded = pdf.fileSizeKB >= expectedMinSizeKB;
  results.push({
    check: "Images embedded",
    status: imagesLikelyEmbedded ? "PASS" : "FAIL",
    detail: `Source: ${source.totalImages} images, PDF: ${pdf.fileSizeKB} KB (${imagesLikelyEmbedded ? "size suggests images present" : "file too small, images may be missing"})`,
  });

  // --- Tables: header text present in PDF ---
  let tablesFound = 0;
  const tableDetails: string[] = [];
  for (const t of source.tables) {
    // Check that key words from the table header appear in the PDF text
    const headerWords = t.headerText
      .split(/[\s|]+/)
      .filter((w) => w.length > 3); // skip short words
    const matchCount = headerWords.filter((w) =>
      pdf.text.toLowerCase().includes(w.toLowerCase())
    ).length;
    const ratio = headerWords.length > 0 ? matchCount / headerWords.length : 1;
    const found = ratio >= 0.5; // at least half of header words found
    if (found) tablesFound++;
    tableDetails.push(
      `  Table ${t.index} ("${t.headerText.slice(0, 50)}"): ${found ? "FOUND" : "MISSING"} (${matchCount}/${headerWords.length} header words)`
    );
  }
  results.push({
    check: "Table headers found",
    status: tablesFound === source.totalTables ? "PASS" : "FAIL",
    detail: `${tablesFound}/${source.totalTables}\n${tableDetails.join("\n")}`,
  });

  // --- Check tables are NOT pipe-delimited ---
  // Look for patterns like "Cell1 | Cell2 | Cell3" which would indicate raw text tables
  const pipeTablePattern = /\w+\s*\|\s*\w+\s*\|\s*\w+/g;
  const pipeMatches = pdf.text.match(pipeTablePattern) || [];
  // Filter out "American Impact Review | For Peer Review Only | Page" footer which is expected
  const nonFooterPipeMatches = pipeMatches.filter(
    (m) => !m.includes("Peer Review") && !m.includes("Impact Review")
  );
  results.push({
    check: "Tables not pipe-delimited",
    status: nonFooterPipeMatches.length === 0 ? "PASS" : "WARN",
    detail: nonFooterPipeMatches.length === 0
      ? "No pipe-delimited tables found (tables rendered properly)"
      : `${nonFooterPipeMatches.length} pipe-delimited patterns found (tables may not be properly rendered)`,
  });

  // --- Text coverage ---
  // Source text from mammoth's extractRawText vs PDF extracted text
  // PDF will have additional cover page text, headers, footers, etc., but should contain
  // the bulk of the source text. We compare lengths.
  const coverage = source.textLength > 0 ? (pdf.textLength / source.textLength) * 100 : 0;
  results.push({
    check: "Text coverage",
    status: coverage >= 90 ? "PASS" : coverage >= 70 ? "WARN" : "FAIL",
    detail: `Source: ${source.textLength} chars, PDF: ${pdf.textLength} chars (${coverage.toFixed(1)}%)`,
  });

  // --- Key sections ---
  const keySections = [
    "HSP70",
    "LLLT",
    "Abstract",
    "Introduction",
    "Methods",
    "Results",
    "Discussion",
    "Conclusion",
    "References",
  ];
  let sectionsFound = 0;
  const sectionDetails: string[] = [];
  for (const section of keySections) {
    const found = pdf.text.toLowerCase().includes(section.toLowerCase());
    if (found) sectionsFound++;
    sectionDetails.push(`  "${section}": ${found ? "FOUND" : "MISSING"}`);
  }
  results.push({
    check: "Key sections",
    status: sectionsFound === keySections.length ? "PASS" : "FAIL",
    detail: `${sectionsFound}/${keySections.length}\n${sectionDetails.join("\n")}`,
  });

  // --- Placeholder leaks ---
  const totalLeaks = pdf.tablePlaceholderLeaks + pdf.imagePlaceholderLeaks;
  results.push({
    check: "No placeholder leaks",
    status: totalLeaks === 0 ? "PASS" : "FAIL",
    detail: `__TABLE_: ${pdf.tablePlaceholderLeaks}, __IMAGE_: ${pdf.imagePlaceholderLeaks}`,
  });

  // ─── Print detailed results ─────────────────────────────────────────────

  for (const r of results) {
    console.log(`[${r.status}] ${r.check}`);
    console.log(`       ${r.detail.split("\n").join("\n       ")}`);
    console.log();
  }

  // ─── 4. Summary table ────────────────────────────────────────────────────

  const overallPass = results.every((r) => r.status === "PASS");

  console.log("=".repeat(58));
  console.log("=== AKIMOV: Source vs Generated PDF Comparison ===");
  console.log("=".repeat(58));
  console.log(`Images in source:     ${source.totalImages}`);
  console.log(`Image types:          ${[...new Set(source.imageTypes)].join(", ") || "(none)"}`);
  console.log(`PDF file size:        ${pdf.fileSizeKB} KB (images likely embedded: ${results[0].status})`);
  console.log(`PDF pages:            ${pdf.pages}`);
  console.log(`Tables in source:     ${source.totalTables}`);
  console.log(`Table headers found:  ${tablesFound}/${source.totalTables} ${results[1].status}`);
  console.log(`Tables pipe-delim:    ${nonFooterPipeMatches.length === 0 ? "None" : nonFooterPipeMatches.length} ${results[2].status}`);
  console.log(`Text coverage:        ${coverage.toFixed(1)}% ${results[3].status}`);
  console.log(`Key sections:         ${sectionsFound}/${keySections.length} ${results[4].status}`);
  console.log(`Placeholder leaks:    ${totalLeaks} ${results[5].status}`);
  console.log("-".repeat(58));
  console.log(`OVERALL:              ${overallPass ? "PASS" : "FAIL"}`);
  console.log("=".repeat(58));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  Akimov HSP70 — Source vs PDF Comparison Tool\n");
  console.log(`  Source:    ${DOCX_PATH}`);
  console.log(`  PDF:       ${PDF_PATH}\n`);

  const source = await extractSource();
  const pdf = await extractPdf();
  compare(source, pdf);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
