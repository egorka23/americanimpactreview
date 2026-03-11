/**
 * Clean the `content` HTML field in published_articles for article e2026021.
 * Remove ChatGPT meta-sections, keep only the actual article.
 */
import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA";

async function main() {
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // Get current content
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  let content = r.rows[0]?.content as string;
  if (!content) {
    console.error("No content found!");
    process.exit(1);
  }

  console.log("Original content length:", content.length);

  // Strategy: parse the HTML, find the real article section, remove ChatGPT stuff
  // The real article starts with "PERMANENT MICROPIGMENTATION IN THE SYSTEM OF COMPREHENSIVE REHABILITATION"
  // and the ChatGPT additions start with "ADDITIONAL CONCLUSIONS (ADDED"

  // 1. Remove everything before the real article title
  const realTitlePattern = "PERMANENT MICROPIGMENTATION IN THE SYSTEM OF COMPREHENSIVE REHABILITATION";
  const realTitleIdx = content.indexOf(realTitlePattern);
  if (realTitleIdx < 0) {
    console.error("Could not find real article title in content!");
    process.exit(1);
  }

  // Find the opening tag of the element containing the real title
  // Walk backward to find the nearest < before realTitleIdx
  let tagStart = realTitleIdx;
  while (tagStart > 0 && content[tagStart] !== "<") tagStart--;
  console.log(`Real article starts at char ${tagStart}: "${content.slice(tagStart, tagStart + 80)}..."`);

  // 2. Find "ADDITIONAL CONCLUSIONS (ADDED" - everything from here to end is ChatGPT
  const additionalIdx = content.indexOf("ADDITIONAL CONCLUSIONS (ADDED");
  let endIdx: number;
  if (additionalIdx > 0) {
    // Walk backward to find the opening tag
    let addTagStart = additionalIdx;
    while (addTagStart > 0 && content[addTagStart] !== "<") addTagStart--;
    endIdx = addTagStart;
    console.log(`ChatGPT additions start at char ${addTagStart}: "${content.slice(addTagStart, addTagStart + 80)}..."`);
  } else {
    endIdx = content.length;
  }

  // Extract just the real article
  let cleanContent = content.slice(tagStart, endIdx).trim();

  // 3. Also remove any "BASE MATERIAL (PRESERVED VERBATIM" remnants inside
  // These shouldn't be in the clean range, but check
  if (cleanContent.includes("BASE MATERIAL")) {
    console.log("WARNING: 'BASE MATERIAL' found in clean content - removing...");
    // Remove the paragraph containing it
    cleanContent = cleanContent.replace(/<[^>]*>.*?BASE MATERIAL.*?<\/[^>]*>/gi, "");
  }

  // 4. Remove "The following section reproduces the source material" if present
  cleanContent = cleanContent.replace(/<p>The following section reproduces.*?<\/p>/gi, "");
  cleanContent = cleanContent.replace(/<p>.*?new scientific sections before and after.*?<\/p>/gi, "");

  // 5. Remove standalone JEL, Olha Kolesnyk, affiliation lines
  // Only remove if they're standalone <p> or <h2> elements (not part of body text)
  cleanContent = cleanContent.replace(/<h2>JEL:.*?<\/h2>/gi, "");
  cleanContent = cleanContent.replace(/<p>JEL:\s*<\/p>/gi, "");
  cleanContent = cleanContent.replace(/<p>Olha Kolesnyk\s*<\/p>/gi, "");
  cleanContent = cleanContent.replace(/<p>Permanent Makeup Specialist in Aesthetic Correction.*?<\/p>/gi, "");
  cleanContent = cleanContent.replace(/<p>Arizona, Scottsdale, USA\s*<\/p>/gi, "");

  console.log("\nClean content length:", cleanContent.length);
  console.log("First 300 chars:", cleanContent.slice(0, 300));
  console.log("\nLast 300 chars:", cleanContent.slice(-300));

  // Verify no artifacts
  const artifacts = ["STRUCTURE AND KEY POINTS", "ADDED SCIENTIFIC", "BASE MATERIAL",
    "ADDITIONAL CONCLUSIONS (ADDED", "APPENDIX: READY-TO-USE", "DOES NOT REPLACE"];
  for (const a of artifacts) {
    if (cleanContent.includes(a)) {
      console.log(`WARNING: still contains "${a}"`);
    }
  }

  // Update DB
  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [cleanContent, "e2026021"],
  });
  console.log("\nDatabase updated!");
}

main().catch(console.error);
