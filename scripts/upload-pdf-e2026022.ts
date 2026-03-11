/**
 * Upload the locally generated LaTeX PDF to Vercel Blob
 * and update the pdfUrl in the database.
 *
 * Usage: npx tsx scripts/upload-pdf-e2026022.ts
 */
import fs from "fs";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SLUG = "e2026022";
const PDF_PATH = "/Users/aeb/Desktop/e2026022.pdf";

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  console.log(`Uploading ${SLUG}.pdf (${(pdfBuffer.length / 1024).toFixed(1)} KB) to Vercel Blob...`);

  const blob = await put(`articles/${SLUG}.pdf`, pdfBuffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`  Blob URL: ${blob.url}`);

  // Update database
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, SLUG));

  if (!rows[0]) {
    console.error(`Article ${SLUG} not found in database!`);
    process.exit(1);
  }

  await db
    .update(publishedArticles)
    .set({ pdfUrl: blob.url, updatedAt: new Date() })
    .where(eq(publishedArticles.id, rows[0].id));

  console.log(`  Updated pdfUrl in database for ${SLUG}`);
  console.log(`\nDone! PDF is now live at: ${blob.url}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
