import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  let content = r.rows[0]?.content as string;

  // Find the references section — after <h2>References</h2>
  const refsIdx = content.indexOf("<h2>References</h2>");
  if (refsIdx < 0) {
    console.log("No <h2>References</h2> found");
    return;
  }

  const before = content.slice(0, refsIdx + "<h2>References</h2>".length);
  let refs = content.slice(refsIdx + "<h2>References</h2>".length);

  // Show current refs
  console.log("Refs before fix (first 500):", refs.slice(0, 500));

  // Each reference is in a <p> tag like: <p>1. Amici JM, ...</p>
  // Remove the leading "N. " from each reference paragraph
  refs = refs.replace(/<p>\s*(\d+)\.\s+/g, "<p>");

  console.log("\nRefs after fix (first 500):", refs.slice(0, 500));

  content = before + refs;

  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [content, "e2026021"],
  });
  console.log("\nUpdated!");
}

main().catch(console.error);
