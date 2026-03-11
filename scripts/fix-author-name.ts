import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  // Check current
  const r = await db.execute("SELECT authors FROM published_articles WHERE slug = 'e2026021'");
  console.log("Current authors:", r.rows[0]?.authors);

  // Update authors field — it's JSON array
  const newAuthors = JSON.stringify(["Olha Kolesnyk"]);
  await db.execute({
    sql: "UPDATE published_articles SET authors = ? WHERE slug = ?",
    args: [newAuthors, "e2026021"],
  });

  // submissions table doesn't have authors column — skip

  // Verify
  const v = await db.execute("SELECT authors FROM published_articles WHERE slug = 'e2026021'");
  console.log("Updated authors:", v.rows[0]?.authors);
}

main().catch(console.error);
