/**
 * Assign DOIs to all published articles in the database.
 * Sets doi = "10.66308/air.{slug}" for all articles where doi is null.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/assign-dois.ts
 */

import { db } from "../lib/db";
import { publishedArticles } from "../lib/db/schema";
import { eq, isNull } from "drizzle-orm";

const DOI_PREFIX = "10.66308";

async function main() {
  const rows = await db
    .select({
      id: publishedArticles.id,
      slug: publishedArticles.slug,
      doi: publishedArticles.doi,
    })
    .from(publishedArticles)
    .where(eq(publishedArticles.status, "published"));

  console.log(`Found ${rows.length} published articles\n`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const newDoi = `${DOI_PREFIX}/air.${row.slug}`;

    if (row.doi && row.doi === newDoi) {
      console.log(`  SKIP  ${row.slug} — already has DOI: ${row.doi}`);
      skipped++;
      continue;
    }

    if (row.doi && row.doi !== newDoi) {
      console.log(`  WARN  ${row.slug} — has different DOI: ${row.doi} → updating to ${newDoi}`);
    }

    await db
      .update(publishedArticles)
      .set({ doi: newDoi })
      .where(eq(publishedArticles.id, row.id));

    console.log(`  SET   ${row.slug} → ${newDoi}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main().catch(console.error);
