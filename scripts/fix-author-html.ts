import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  // Update author_username
  await db.execute({
    sql: "UPDATE published_articles SET author_username = ? WHERE slug = ?",
    args: ["Olha Kolesnyk", "e2026021"],
  });

  // Verify all fields
  const r = await db.execute("SELECT authors, author_username, pdf_url FROM published_articles WHERE slug = 'e2026021'");
  console.log("authors:", r.rows[0]?.authors);
  console.log("author_username:", r.rows[0]?.author_username);
  console.log("pdf_url:", r.rows[0]?.pdf_url);
}

main().catch(console.error);
