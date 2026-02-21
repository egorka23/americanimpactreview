/**
 * Test: verify tables render as proper tables in review copy PDF.
 * Usage: npx tsx scripts/test-table-render.ts
 */

import fs from "fs";
import { generateReviewCopyPdf } from "../lib/generate-review-pdf";

async function main() {
  const docxPath = "/tmp/akimov-test.docx";
  if (!fs.existsSync(docxPath)) {
    console.error("Download docx first: curl -sL <url> -o /tmp/akimov-test.docx");
    process.exit(1);
  }

  const docxBuffer = fs.readFileSync(docxPath);
  console.log(`Docx: ${(docxBuffer.length / 1024).toFixed(1)} KB`);
  console.log("Generating PDF...");

  const pdfBytes = await generateReviewCopyPdf({
    docxBuffer,
    manuscriptId: "AIR-TEST-TABLES",
    title: "HSP70 and Low-Level Laser Therapy in Athletes",
    authors: "Akimov E.B.",
    articleType: "Original Research",
    keywords: "HSP70, LLLT, athletes, recovery",
    category: "Sports Medicine",
    abstract: "Testing table rendering.",
    reviewerName: "Dr. Test Reviewer",
    deadline: "2026-03-15",
    receivedDate: "2026-02-15",
  });

  const outPath = "/tmp/test-table-render.pdf";
  fs.writeFileSync(outPath, Buffer.from(pdfBytes));
  console.log(`PDF: ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
