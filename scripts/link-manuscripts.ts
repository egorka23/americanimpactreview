/**
 * Link manuscript PDFs to seeded published articles.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/link-manuscripts.ts
 */
import { db } from "../lib/db";
import { submissions } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";

const links: { titlePrefix: string; slug: string }[] = [
  { titlePrefix: "Monitoring and Scalability", slug: "e2026001" },
  { titlePrefix: "Diagnostic Capabilities", slug: "e2026002" },
  { titlePrefix: "Finger Dermatoglyphics", slug: "e2026003" },
  { titlePrefix: "Laboratory Assessment of Aerobic", slug: "e2026004" },
  { titlePrefix: "Genetic Markers for Talent", slug: "e2026005" },
  { titlePrefix: "Longitudinal Physiological Monitoring", slug: "e2026006" },
  { titlePrefix: "Leveraging Artificial Intelligence", slug: "e2026007" },
];

async function main() {
  for (const l of links) {
    const rows = await db
      .select({ id: submissions.id, title: submissions.title })
      .from(submissions)
      .where(like(submissions.title, `${l.titlePrefix}%`));

    for (const row of rows) {
      await db
        .update(submissions)
        .set({
          manuscriptUrl: `/articles/${l.slug}.pdf`,
          manuscriptName: `${l.slug}.pdf`,
        })
        .where(eq(submissions.id, row.id));
      console.log(`✓ Linked: ${row.title.slice(0, 50)}... → /articles/${l.slug}.pdf`);
    }
  }
  console.log("Done!");
}

main().catch(console.error);
