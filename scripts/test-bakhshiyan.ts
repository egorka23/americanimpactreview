/**
 * Test: generate review copy PDF for Bakhshiyan article and verify content.
 * Usage: npx tsx scripts/test-bakhshiyan.ts
 */

import fs from "fs";
import { generateReviewCopyPdf } from "../lib/generate-review-pdf";

async function main() {
  const docxPath = "/tmp/bakhshiyan-test.docx";
  if (!fs.existsSync(docxPath)) {
    console.error("Missing docx at", docxPath);
    process.exit(1);
  }

  const docxBuffer = fs.readFileSync(docxPath);
  console.log(`[1/3] Docx loaded: ${(docxBuffer.length / 1024).toFixed(1)} KB`);

  // ── Generate PDF ────────────────────────────────────────────────────────
  console.log("[2/3] Generating review copy PDF...");
  const pdfBytes = await generateReviewCopyPdf({
    docxBuffer,
    manuscriptId: "AIR-BAKHSHIYAN-TEST",
    title: "Syndromic Analysis of the Comorbidity of Reading Disorders and Neurodevelopmental Disorders in Children with Preserved Intellectual Functioning",
    authors: "IRINA BAKHSHIIAN",
    articleType: "Theoretical Article",
    keywords: "reading disorders, neurodevelopmental, comorbidity, children",
    category: "Neuroscience",
    abstract: "Test generation",
    reviewerName: "Test Reviewer",
    deadline: "2026-03-15",
    receivedDate: "2026-02-12",
  });

  const outPath = "/tmp/test-bakhshiyan-review.pdf";
  fs.writeFileSync(outPath, Buffer.from(pdfBytes));
  console.log(`   PDF saved: ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);

  // ── Verify PDF content ──────────────────────────────────────────────────
  console.log("[3/3] Verifying PDF content with pdf-parse...\n");

  // pdf-parse v2 — constructor takes {data: Buffer} or {url: string}
  const { PDFParse } = await import("pdf-parse");
  const pdfBuffer = fs.readFileSync(outPath);
  const parser = new PDFParse({ data: pdfBuffer });

  // getInfo gives us page count
  const info = await parser.getInfo();
  const pageCount = info.total;

  // getText gives us all text
  const textResult = await parser.getText();
  const text = textResult.text;
  const textLength = text.length;

  await parser.destroy();

  // Placeholder leak checks
  const tablePlaceholders = (text.match(/__TABLE_/g) || []).length;
  const imagePlaceholders = (text.match(/__IMAGE_/g) || []).length;

  // Key content checks
  const keyTerms = ["reading disorders", "comorbidity", "neurodevelopmental"];
  const keyTermResults: Record<string, boolean> = {};
  for (const term of keyTerms) {
    keyTermResults[term] = text.toLowerCase().includes(term.toLowerCase());
  }

  // ── Report ──────────────────────────────────────────────────────────────
  console.log("===================================================");
  console.log("  BAKHSHIYAN REVIEW COPY PDF - VERIFICATION REPORT");
  console.log("===================================================");
  console.log(`  Pages:          ${pageCount}`);
  console.log(`  Text length:    ${textLength.toLocaleString()} chars`);
  console.log(`  PDF size:       ${(pdfBytes.length / 1024).toFixed(1)} KB`);
  console.log("");
  console.log("  PLACEHOLDER LEAK CHECK:");
  console.log(`    __TABLE_ count: ${tablePlaceholders}  ${tablePlaceholders === 0 ? "PASS" : "FAIL"}`);
  console.log(`    __IMAGE_ count: ${imagePlaceholders}  ${imagePlaceholders === 0 ? "PASS" : "FAIL"}`);
  console.log("");
  console.log("  KEY CONTENT CHECK:");
  for (const [term, found] of Object.entries(keyTermResults)) {
    console.log(`    "${term}": ${found ? "FOUND" : "MISSING"}  ${found ? "PASS" : "FAIL"}`);
  }
  console.log("===================================================");

  const allPassed =
    tablePlaceholders === 0 &&
    imagePlaceholders === 0 &&
    Object.values(keyTermResults).every(Boolean);

  if (allPassed) {
    console.log("\n  ALL CHECKS PASSED\n");
  } else {
    console.log("\n  SOME CHECKS FAILED\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
