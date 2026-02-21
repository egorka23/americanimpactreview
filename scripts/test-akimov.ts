/**
 * Test: generate review copy PDF for Akimov HSP70 article and verify content.
 * Usage: npx tsx scripts/test-akimov.ts
 */

import fs from "fs";
import { generateReviewCopyPdf } from "../lib/generate-review-pdf";

async function main() {
  // ── 1. Load docx ──────────────────────────────────────────────────────────
  const docxPath = "/tmp/akimov-test.docx";
  if (!fs.existsSync(docxPath)) {
    console.error("ERROR: docx not found at", docxPath);
    process.exit(1);
  }

  const docxBuffer = fs.readFileSync(docxPath);
  console.log(`[1/3] Docx loaded: ${(docxBuffer.length / 1024).toFixed(1)} KB`);

  // ── 2. Generate PDF ───────────────────────────────────────────────────────
  console.log("[2/3] Generating review copy PDF...");

  const pdfBytes = await generateReviewCopyPdf({
    docxBuffer,
    manuscriptId: "AIR-AKIMOV-TEST",
    title: "Effects of Low-Level Laser Therapy on HSP70 Dynamics and Recovery Biomarkers in Elite Athletes",
    authors: "Egor Akimov",
    articleType: "Original Research",
    keywords: "HSP70, LLLT, athletes, recovery",
    category: "Sports Medicine",
    abstract: "Test generation",
    reviewerName: "Test Reviewer",
    deadline: "2026-03-15",
    receivedDate: "2026-02-15",
  });

  const outPath = "/tmp/test-akimov-review.pdf";
  fs.writeFileSync(outPath, Buffer.from(pdfBytes));
  console.log(`    PDF written: ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);

  // ── 3. Verify PDF content ─────────────────────────────────────────────────
  console.log("[3/3] Verifying PDF content...\n");

  // pdf-parse v2 API: new PDFParse(Uint8Array) → .getText()
  const { PDFParse } = await import("pdf-parse");
  const pdfBuffer = fs.readFileSync(outPath);
  const parser = new PDFParse(new Uint8Array(pdfBuffer), { verbosity: 0 });
  const pdfData = await parser.getText();

  const text = pdfData.text;
  const numPages = pdfData.total;
  const textLength = text.length;

  console.log("=== VERIFICATION RESULTS ===\n");
  console.log(`Pages:       ${numPages}`);
  console.log(`Text length: ${textLength} characters`);

  // Check for placeholder leaks
  const tablePlaceholders = (text.match(/__TABLE_/g) || []).length;
  const imagePlaceholders = (text.match(/__IMAGE_/g) || []).length;

  console.log(`\n--- Placeholder leak check ---`);
  console.log(`__TABLE_ occurrences: ${tablePlaceholders} ${tablePlaceholders === 0 ? "(PASS)" : "(FAIL - tables not rendered!)"}`);
  console.log(`__IMAGE_ occurrences: ${imagePlaceholders} ${imagePlaceholders === 0 ? "(PASS)" : "(FAIL - images not rendered!)"}`);

  // Check for key scientific terms
  const keyTerms = [
    "HSP70",
    "LLLT",
    "athlete",
    "recovery",
    "laser",
    "biomarker",
    "CONFIDENTIAL",
    "AIR-AKIMOV-TEST",
    "Egor Akimov",
    "Sports Medicine",
    "Original Research",
    "Test Reviewer",
  ];

  console.log(`\n--- Key content check ---`);
  let allFound = true;
  for (const term of keyTerms) {
    const found = text.toLowerCase().includes(term.toLowerCase());
    const status = found ? "FOUND" : "MISSING";
    if (!found) allFound = false;
    console.log(`  "${term}": ${status}`);
  }

  // Overall result
  console.log(`\n=== OVERALL ===`);
  const pass = tablePlaceholders === 0 && imagePlaceholders === 0 && allFound;
  if (pass) {
    console.log("RESULT: ALL CHECKS PASSED");
  } else {
    console.log("RESULT: SOME CHECKS FAILED");
    if (tablePlaceholders > 0) console.log("  - Table placeholders leaked into PDF text");
    if (imagePlaceholders > 0) console.log("  - Image placeholders leaked into PDF text");
    if (!allFound) console.log("  - Some key terms missing from PDF text");
  }

  // Print a short excerpt of extracted text for manual review
  console.log(`\n--- First 500 chars of extracted text ---`);
  console.log(text.slice(0, 500));
  console.log("...\n");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
