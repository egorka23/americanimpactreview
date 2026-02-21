import { db } from "./lib/db";
import { publishedArticles } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, "e2026008"));
  
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch(console.error);
