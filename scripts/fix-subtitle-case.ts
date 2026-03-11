import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  let content = r.rows[0]?.content as string;

  // Replace the ALL CAPS subtitle with proper Title Case
  const oldTitle = "PERMANENT MICROPIGMENTATION IN THE SYSTEM OF COMPREHENSIVE REHABILITATION OF PATIENTS AFTER ONCOLOGICAL TREATMENT: CLINICAL AND PSYCHOLOGICAL ASPECTS";
  const newTitle = "Permanent Micropigmentation in the System of Comprehensive Rehabilitation of Patients After Oncological Treatment: Clinical and Psychological Aspects";

  // It's inside an <h2> tag
  content = content.replace(
    `<h2>${oldTitle}</h2>`,
    `<h2>${newTitle}</h2>`
  );

  // Check if replacement worked
  if (content.includes(oldTitle)) {
    // Maybe split across tags — try broader replacement
    console.log("Direct replacement didn't work, trying broader...");
    content = content.replace(oldTitle, newTitle);
  }

  if (content.includes(newTitle)) {
    console.log("Replacement successful!");
  } else {
    console.log("WARNING: Could not find/replace the subtitle");
    // Show what's near "PERMANENT"
    const idx = content.indexOf("PERMANENT");
    if (idx >= 0) {
      console.log("Found at:", idx, content.slice(idx, idx + 200));
    }
  }

  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [content, "e2026021"],
  });
  console.log("Updated!");
  console.log("First 300 chars:", content.slice(0, 300));
}

main().catch(console.error);
