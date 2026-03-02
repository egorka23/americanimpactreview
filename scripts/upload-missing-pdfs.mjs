/**
 * Upload local PDF files to Vercel Blob Storage for articles
 * that are missing from Blob but exist locally in public/articles/.
 *
 * Usage: BLOB_READ_WRITE_TOKEN=... node scripts/upload-missing-pdfs.mjs
 */

import { put } from "@vercel/blob";
import { readFileSync, existsSync } from "fs";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error("Set BLOB_READ_WRITE_TOKEN env variable");
  process.exit(1);
}

const slugs = ["e2026002", "e2026004", "e2026005", "e2026007"];

for (const slug of slugs) {
  const localPath = `public/articles/${slug}.pdf`;
  if (!existsSync(localPath)) {
    console.log(`SKIP ${slug} — file not found at ${localPath}`);
    continue;
  }

  const buffer = readFileSync(localPath);
  console.log(`Uploading ${slug}.pdf (${(buffer.length / 1024).toFixed(0)} KB)...`);

  const blob = await put(`articles/${slug}.pdf`, buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: TOKEN,
  });

  console.log(`  ✓ ${blob.url}`);
}

console.log("\nDone! Now update pdfUrl in the database for these articles.");
