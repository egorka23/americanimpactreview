import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  // Check published_articles
  const pub = await db.execute("SELECT slug, title, status, visibility, published_at FROM published_articles WHERE slug = 'e2026016'");
  console.log("published_articles:", pub.rows[0]);

  // Check submissions
  const sub = await db.execute("SELECT slug, title, status, pipeline_status FROM submissions WHERE slug = 'e2026016'");
  console.log("submissions:", sub.rows[0]);
}

main().catch(console.error);
