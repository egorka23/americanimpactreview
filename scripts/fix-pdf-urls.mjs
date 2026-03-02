/**
 * Update pdfUrl in the database for articles that were missing Blob URLs.
 *
 * Usage: node scripts/fix-pdf-urls.mjs
 * (reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from .env.local)
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

// Parse .env.local
const envText = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^(\w+)="?([^"]*)"?$/);
  if (m) env[m[1]] = m[2];
}

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

const BLOB_BASE = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/articles";

// First check which articles have null pdfUrl
const result = await client.execute(
  "SELECT slug, pdf_url FROM published_articles ORDER BY slug"
);

console.log("Current pdfUrl status:");
for (const row of result.rows) {
  console.log(`  ${row.slug}: ${row.pdf_url || "(null)"}`);
}

// Update articles with missing pdfUrl
const slugsToFix = result.rows
  .filter((r) => !r.pdf_url)
  .map((r) => r.slug);

if (slugsToFix.length === 0) {
  console.log("\nAll articles already have pdfUrl set!");
} else {
  console.log(`\nFixing ${slugsToFix.length} articles...`);
  for (const slug of slugsToFix) {
    const blobUrl = `${BLOB_BASE}/${slug}.pdf`;
    await client.execute({
      sql: "UPDATE published_articles SET pdf_url = ?, updated_at = unixepoch() WHERE slug = ?",
      args: [blobUrl, slug],
    });
    console.log(`  ✓ ${slug} → ${blobUrl}`);
  }
}

client.close();
console.log("\nDone!");
