/**
 * Seed co-authors for published articles.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/seed-coauthors.ts
 */
import { db } from "../lib/db";
import { submissions } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";

const coauthorData: { titlePrefix: string; coAuthors: { name: string; email: string; affiliation: string }[] }[] = [
  {
    titlePrefix: "Monitoring and Scalability",
    coAuthors: [
      { name: "Bogdan Mikhaylov", email: "b.mikhaylov@example.edu", affiliation: "Department of Computer Science, Moscow State University" },
    ],
  },
  {
    titlePrefix: "Diagnostic Capabilities",
    coAuthors: [], // single author
  },
  {
    titlePrefix: "Finger Dermatoglyphics",
    coAuthors: [
      { name: "Tatyana M. Nikitina", email: "t.nikitina@vniifk.ru", affiliation: "Federal Research Center for Physical Culture and Sports, Moscow" },
      { name: "Nadezhda I. Kochetkova", email: "n.kochetkova@vniifk.ru", affiliation: "Federal Research Center for Physical Culture and Sports, Moscow" },
    ],
  },
  {
    titlePrefix: "Laboratory Assessment of Aerobic",
    coAuthors: [], // single author
  },
  {
    titlePrefix: "Genetic Markers for Talent",
    coAuthors: [], // single author
  },
  {
    titlePrefix: "Longitudinal Physiological Monitoring",
    coAuthors: [], // single author
  },
  {
    titlePrefix: "Leveraging Artificial Intelligence",
    coAuthors: [
      { name: "Irina Smirnova", email: "i.smirnova@example.edu", affiliation: "School of Business, European University" },
    ],
  },
];

async function main() {
  for (const entry of coauthorData) {
    if (entry.coAuthors.length === 0) continue;

    const rows = await db
      .select({ id: submissions.id, title: submissions.title })
      .from(submissions)
      .where(like(submissions.title, `${entry.titlePrefix}%`));

    for (const row of rows) {
      await db
        .update(submissions)
        .set({ coAuthors: JSON.stringify(entry.coAuthors) })
        .where(eq(submissions.id, row.id));
      console.log(`✓ ${row.title.slice(0, 50)}... → ${entry.coAuthors.length} co-author(s)`);
    }
  }
  console.log("Done!");
}

main().catch(console.error);
