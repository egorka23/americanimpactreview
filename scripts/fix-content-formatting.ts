import { createClient } from "@libsql/client";
import fs from "fs";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  let content = r.rows[0]?.content as string;

  // Save original for reference
  fs.writeFileSync("/tmp/content-before.html", content);
  console.log("Original length:", content.length);

  // 1. Make section headers bold: "Abstract.", "Introduction.", "Results.", "Conclusions.", "References"
  // These appear as the start of <p> elements
  const sectionHeaders = [
    "Abstract.",
    "Introduction.",
    "Results.",
    "Conclusions.",
    "References",
    "Keywords:",
  ];

  for (const header of sectionHeaders) {
    // Pattern: <p>Header Rest of text</p>  →  <p><strong>Header</strong> Rest of text</p>
    // Or: <p>Header</p> (standalone)
    const regex = new RegExp(`<p>${header.replace(/\./g, "\\.")}`, "g");
    content = content.replace(regex, `<p><strong>${header}</strong>`);
  }

  // 2. Convert the subtitle from <h2> to just bold text within a paragraph
  // Since it's an internal subtitle, not a page heading
  // Actually, keep as <h2> but that's fine for structure

  // 3. Check for weird indentation — extra spaces at start of paragraphs
  content = content.replace(/<p>\s+/g, "<p>");

  // 4. Show what we changed
  console.log("\nAfter fixes length:", content.length);

  // Show sections that got bolded
  for (const header of sectionHeaders) {
    const idx = content.indexOf(`<strong>${header}</strong>`);
    if (idx >= 0) {
      console.log(`✓ Bolded: ${header} at pos ${idx}`);
    } else {
      console.log(`✗ Not found: ${header}`);
    }
  }

  // Save for inspection
  fs.writeFileSync("/tmp/content-after.html", content);

  // Update DB
  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [content, "e2026021"],
  });
  console.log("\nDatabase updated!");
}

main().catch(console.error);
