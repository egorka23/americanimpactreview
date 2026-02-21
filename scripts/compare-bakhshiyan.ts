/**
 * Compare SOURCE docx vs GENERATED review copy PDF for the Bakhshiyan article.
 * Verifies nothing is lost in the conversion pipeline.
 *
 * Usage: npx tsx scripts/compare-bakhshiyan.ts
 */

import fs from "fs";
import mammoth from "mammoth";
import { generateReviewCopyPdf } from "../lib/generate-review-pdf";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceStats = {
  totalImages: number;
  imageTypes: string[];
  totalTables: number;
  tables: { rows: number; cols: number; headerText: string[] }[];
  textLength: number;
  sectionHeadings: string[];
  rawText: string;
};

type PdfStats = {
  pages: number;
  textLength: number;
  fileSizeKB: number;
  rawText: string;
  tablePlaceholders: number;
  imagePlaceholders: number;
};

// ─── Step 1: Extract content from SOURCE docx ─────────────────────────────────

async function analyzeSourceDocx(docxPath: string): Promise<SourceStats> {
  const buffer = fs.readFileSync(docxPath);

  const images: { contentType: string }[] = [];

  // Convert to HTML with image extraction
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        images.push({ contentType: image.contentType });
        return { src: `__IMAGE_${images.length - 1}__` };
      }),
    },
  );

  const html = result.value;

  // ── Extract tables ────────────────────────────────────────────────────────
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const tables: SourceStats["tables"] = [];

  for (const tableHtml of tableMatches) {
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    let maxCols = 0;
    let headerText: string[] = [];

    for (let ri = 0; ri < rowMatches.length; ri++) {
      const row = rowMatches[ri];
      const cellMatches = row.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      const cells = cellMatches.map((cell) => cell.replace(/<[^>]+>/g, "").trim());
      maxCols = Math.max(maxCols, cells.length);
      if (ri === 0) headerText = cells;
    }

    tables.push({
      rows: rowMatches.length,
      cols: maxCols,
      headerText,
    });
  }

  // ── Extract section headings ──────────────────────────────────────────────
  const headingMatches = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || [];
  const sectionHeadings = headingMatches.map((h) =>
    h.replace(/<[^>]+>/g, "").trim(),
  );

  // ── Extract plain text (strip all HTML) ───────────────────────────────────
  let plainText = html
    .replace(/<img[^>]*>/gi, "") // remove image tags
    .replace(/<[^>]+>/g, " ") // strip all tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    totalImages: images.length,
    imageTypes: images.map((i) => i.contentType),
    totalTables: tables.length,
    tables,
    textLength: plainText.length,
    sectionHeadings,
    rawText: plainText,
  };
}

// ─── Step 2 & 3: Generate PDF and extract content ────────────────────────────

async function generateAndAnalyzePdf(docxPath: string): Promise<PdfStats> {
  const outPath = "/tmp/test-bakhshiyan-review.pdf";
  let pdfBytes: Uint8Array;

  if (fs.existsSync(outPath)) {
    console.log("  PDF already exists, skipping generation.");
    pdfBytes = fs.readFileSync(outPath);
  } else {
    const docxBuffer = fs.readFileSync(docxPath);
    console.log("  Generating PDF...");
    pdfBytes = await generateReviewCopyPdf({
      docxBuffer,
      manuscriptId: "AIR-BAKHSHIYAN-TEST",
      title:
        "Syndromic Analysis of the Comorbidity of Reading Disorders and Neurodevelopmental Disorders in Children with Preserved Intellectual Functioning",
      authors: "IRINA BAKHSHIIAN",
      articleType: "Theoretical Article",
      keywords: "reading disorders, neurodevelopmental, comorbidity, children",
      category: "Neuroscience",
      abstract: "Test generation",
      reviewerName: "Test Reviewer",
      deadline: "2026-03-15",
      receivedDate: "2026-02-12",
    });
    fs.writeFileSync(outPath, Buffer.from(pdfBytes));
    console.log(`  PDF saved: ${outPath}`);
  }

  const fileSizeKB = pdfBytes.length / 1024;

  // Parse PDF text using pdf-parse v2 API
  const { PDFParse } = await import("pdf-parse");
  const pdfBuffer = fs.readFileSync(outPath);
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer), verbosity: 0 });
  const textResult = await parser.getText();
  const infoResult = await parser.getInfo();
  await parser.destroy();

  const text = textResult.text;

  return {
    pages: (infoResult as any).total ?? (infoResult as any).numPages ?? 0,
    textLength: text.length,
    fileSizeKB,
    rawText: text,
    tablePlaceholders: (text.match(/__TABLE_/g) || []).length,
    imagePlaceholders: (text.match(/__IMAGE_/g) || []).length,
  };
}

// ─── Step 4: Compare and report ──────────────────────────────────────────────

function compare(source: SourceStats, pdf: PdfStats) {
  const results: { check: string; status: "PASS" | "FAIL"; detail: string }[] =
    [];

  // ── Images ──────────────────────────────────────────────────────────────
  // If source has images, PDF should be noticeably large (images embedded)
  if (source.totalImages > 0) {
    const hasImages = pdf.fileSizeKB > 50; // a PDF with embedded images should be well above 50KB
    results.push({
      check: "Images embedded",
      status: hasImages ? "PASS" : "FAIL",
      detail: `${source.totalImages} image(s) in source, PDF = ${pdf.fileSizeKB.toFixed(1)} KB`,
    });
  } else {
    results.push({
      check: "Images (none in source)",
      status: "PASS",
      detail: "No images in source docx",
    });
  }

  // ── Tables ──────────────────────────────────────────────────────────────
  for (let i = 0; i < source.tables.length; i++) {
    const tbl = source.tables[i];
    // Check that header text appears in PDF
    let headersFound = 0;
    for (const hdr of tbl.headerText) {
      if (hdr.length > 2 && pdf.rawText.toLowerCase().includes(hdr.toLowerCase())) {
        headersFound++;
      }
    }
    const headerRatio =
      tbl.headerText.filter((h) => h.length > 2).length > 0
        ? headersFound / tbl.headerText.filter((h) => h.length > 2).length
        : 1;

    results.push({
      check: `Table ${i + 1} content`,
      status: headerRatio >= 0.5 ? "PASS" : "FAIL",
      detail: `${tbl.rows} rows x ${tbl.cols} cols, headers: ${tbl.headerText.join(" | ")} -- ${headersFound}/${tbl.headerText.filter((h) => h.length > 2).length} found in PDF`,
    });
  }

  // Check for pipe-delimited table rendering (indicates fallback/bad rendering).
  // Exclude pipes from known header/footer text ("American Impact Review | ...")
  if (source.totalTables > 0) {
    const lines = pdf.rawText.split("\n");
    let contentPipes = 0;
    for (const line of lines) {
      // Skip header/footer lines that naturally contain pipe separators
      if (
        line.includes("American Impact Review") ||
        line.includes("For Peer Review Only") ||
        line.includes("Published by Global Talent Foundation")
      ) {
        continue;
      }
      contentPipes += (line.match(/\|/g) || []).length;
    }
    results.push({
      check: "Table NOT pipe-delimited",
      status: contentPipes < 5 ? "PASS" : "FAIL",
      detail: `${contentPipes} pipe characters in body text (excluding headers/footers)`,
    });
  }

  // ── Text coverage ───────────────────────────────────────────────────────
  // PDF text includes cover page + headers/footers + watermarks, so it may
  // actually be longer. But the core body text should cover source text.
  // The sanitize() function transliterates Cyrillic → Latin, so we compare
  // normalized lengths. Also pdf-parse extracts all text including repeated
  // watermarks, headers, footers.
  const coverageRatio = pdf.textLength / source.textLength;
  const coveragePct = (coverageRatio * 100).toFixed(1);
  results.push({
    check: "Text coverage",
    status: coverageRatio >= 0.9 ? "PASS" : "FAIL",
    detail: `Source: ${source.textLength.toLocaleString()} chars, PDF: ${pdf.textLength.toLocaleString()} chars (${coveragePct}%)`,
  });

  // ── Key terms ───────────────────────────────────────────────────────────
  const keyTerms = [
    "reading disorders",
    "comorbidity",
    "neurodevelopmental",
    "dyslexia",
    "children",
    "intellectual",
  ];
  const foundTerms: string[] = [];
  const missingTerms: string[] = [];
  for (const term of keyTerms) {
    if (pdf.rawText.toLowerCase().includes(term.toLowerCase())) {
      foundTerms.push(term);
    } else {
      missingTerms.push(term);
    }
  }
  results.push({
    check: "Key terms",
    status: foundTerms.length >= 4 ? "PASS" : "FAIL",
    detail: `${foundTerms.length}/${keyTerms.length} found. Missing: ${missingTerms.length > 0 ? missingTerms.join(", ") : "none"}`,
  });

  // ── Placeholder leaks ──────────────────────────────────────────────────
  results.push({
    check: "No __TABLE_ leaks",
    status: pdf.tablePlaceholders === 0 ? "PASS" : "FAIL",
    detail: `${pdf.tablePlaceholders} occurrences`,
  });
  results.push({
    check: "No __IMAGE_ leaks",
    status: pdf.imagePlaceholders === 0 ? "PASS" : "FAIL",
    detail: `${pdf.imagePlaceholders} occurrences`,
  });

  // ── Section headings coverage ─────────────────────────────────────────
  if (source.sectionHeadings.length > 0) {
    let headingsFound = 0;
    for (const heading of source.sectionHeadings) {
      // Transliterate roughly for comparison (Cyrillic → Latin happens in sanitize)
      const words = heading.split(/\s+/).filter((w) => w.length > 3);
      const anyWordFound = words.some((w) =>
        pdf.rawText.toLowerCase().includes(w.toLowerCase()),
      );
      if (anyWordFound) headingsFound++;
    }
    results.push({
      check: "Section headings",
      status:
        headingsFound / source.sectionHeadings.length >= 0.5 ? "PASS" : "FAIL",
      detail: `${headingsFound}/${source.sectionHeadings.length} headings found in PDF`,
    });
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const docxPath = "/tmp/bakhshiyan-test.docx";
  if (!fs.existsSync(docxPath)) {
    console.error("ERROR: Missing docx at", docxPath);
    process.exit(1);
  }

  console.log("\n[1/4] Analyzing SOURCE docx...");
  const source = await analyzeSourceDocx(docxPath);
  console.log(`  Text length:      ${source.textLength.toLocaleString()} chars`);
  console.log(`  Images:           ${source.totalImages}`);
  if (source.imageTypes.length > 0) {
    console.log(`  Image types:      ${source.imageTypes.join(", ")}`);
  }
  console.log(`  Tables:           ${source.totalTables}`);
  for (let i = 0; i < source.tables.length; i++) {
    const t = source.tables[i];
    console.log(`    Table ${i + 1}: ${t.rows} rows x ${t.cols} cols`);
    console.log(`    Headers: ${t.headerText.join(" | ")}`);
  }
  console.log(`  Section headings: ${source.sectionHeadings.length}`);
  for (const h of source.sectionHeadings) {
    console.log(`    - ${h}`);
  }

  console.log("\n[2/4] Generating / loading PDF...");
  const pdf = await generateAndAnalyzePdf(docxPath);
  console.log(`  Pages:            ${pdf.pages}`);
  console.log(`  Text length:      ${pdf.textLength.toLocaleString()} chars`);
  console.log(`  File size:        ${pdf.fileSizeKB.toFixed(1)} KB`);

  console.log("\n[3/4] Comparing...");
  const results = compare(source, pdf);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  BAKHSHIYAN: Source vs Generated PDF Comparison");
  console.log("=".repeat(60));
  console.log(`  Images in source:     ${source.totalImages}`);
  console.log(`  PDF file size:        ${pdf.fileSizeKB.toFixed(1)} KB`);
  console.log(`  PDF pages:            ${pdf.pages}`);
  console.log(`  Tables in source:     ${source.totalTables}`);
  console.log("-".repeat(60));

  let allPassed = true;
  for (const r of results) {
    const icon = r.status === "PASS" ? "PASS" : "FAIL";
    if (r.status === "FAIL") allPassed = false;
    console.log(`  [${icon}] ${r.check}`);
    console.log(`         ${r.detail}`);
  }

  console.log("-".repeat(60));
  console.log(
    `  OVERALL: ${allPassed ? "PASS -- All checks passed" : "FAIL -- Some checks failed"}`,
  );
  console.log("=".repeat(60));
  console.log("");

  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
