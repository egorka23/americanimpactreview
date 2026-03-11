/**
 * Clean Olha Kolesnyk's DOCX: remove ChatGPT meta-sections, keep only the actual article.
 * Strategy: modify document.xml in the DOCX zip, removing unwanted paragraphs.
 */
import AdmZip from "adm-zip";
import mammoth from "mammoth";
import fs from "fs";
import { put } from "@vercel/blob";
import { createClient } from "@libsql/client";

const DOCX_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";
const SUBMISSION_ID = "21a459ee-0aff-4b6e-af8a-64316bd888ea";
const TURSO_URL = "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA";

// Patterns to identify paragraphs to REMOVE
const REMOVE_PATTERNS = [
  // Title block (repeated inside body)
  /^CHEMOTHERAPY[\s\-]*INDUCED/i,
  /^EYEBROW,?\s+AND\s+EYELASH\s+ALOPECIA/i,
  /^PSYCHOLOGICAL\s+HEALTH/i,
  /^PERMANENT\s+MICROPIGMENTATION\s+AS\s+A$/i,
  /^COMPONENT\s+OF\s+MULTIDISCIPLINARY/i,
  /^\s*REHABILITATION\s*$/i,
  // JEL classification
  /^JEL:\s*I?\d/i,
  /^JEL:\s*$/i,
  // Author name (standalone, not within text)
  /^Olha\s+Kolesnyk\s*$/i,
  // Affiliation (standalone)
  /^Permanent\s+Makeup\s+Specialist\s+in\s+Aesthetic/i,
  /^Arizona,\s+Scottsdale,\s+USA\s*$/i,
  // ChatGPT meta-sections
  /^STRUCTURE\s+AND\s+KEY\s+POINTS/i,
  /^SCIENTIFIC\s+ADDITIONS/i,
  /^ADDED\s+SCIENTIFIC\s+SECTIONS/i,
  /^BASE\s+MATERIAL\s+\(PRESERVED\s+VERBATIM/i,
  /^The following section reproduces the source material/i,
  /new scientific sections before and after this base text/i,
  /^ADDITIONAL\s+CONCLUSIONS\s+\(ADDED/i,
  /^REPLACE\s+ORIGINAL\)/i,
  /^APPENDIX:\s+READY[\s\-]*TO[\s\-]*USE/i,
  /^\(ADDED\)\s*$/i,
  /^DOES\s+NOT\s+REPLACE\s+ORIGINAL/i,
];

// Section headers that indicate ChatGPT-added sections (to remove entire sections)
const CHATGPT_SECTION_STARTS = [
  "STRUCTURE AND KEY POINTS",
  "ADDED SCIENTIFIC SECTIONS",
  "BASE MATERIAL (PRESERVED VERBATIM",
  "ADDITIONAL CONCLUSIONS (ADDED",
  "APPENDIX: READY-TO-USE",
];

// The real article starts with this section
const REAL_ARTICLE_START = "PERMANENT MICROPIGMENTATION IN THE SYSTEM OF COMPREHENSIVE REHABILITATION";

async function main() {
  console.log("Downloading original DOCX...");
  const resp = await fetch(DOCX_URL);
  const origBuf = Buffer.from(await resp.arrayBuffer());
  console.log(`Original DOCX: ${origBuf.length} bytes`);

  // Get mammoth markdown to understand structure
  const mdResult = await (mammoth as any).convertToMarkdown({ buffer: origBuf });
  const md: string = mdResult.value || "";
  const cleanMd = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = cleanMd.split("\n");

  // Find boundaries
  let realArticleStart = -1;
  let additionalConclusionsStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const lt = lines[i].trim();
    if (lt.includes(REAL_ARTICLE_START)) {
      realArticleStart = i;
      console.log(`Real article starts at line ${i}: "${lt.slice(0, 80)}"`);
    }
    if (/^ADDITIONAL\s+CONCLUSIONS\s+\(ADDED/i.test(lt)) {
      additionalConclusionsStart = i;
      console.log(`Additional conclusions (ChatGPT) at line ${i}`);
    }
  }

  // Strategy: work with document.xml directly
  // Extract all <w:p> paragraphs, get their text, decide keep/remove
  const zip = new AdmZip(origBuf);
  const docXml = zip.readAsText("word/document.xml");

  // Extract all paragraphs
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  const paragraphs: { xml: string; text: string }[] = [];
  let match;
  while ((match = paragraphRegex.exec(docXml)) !== null) {
    const xml = match[0];
    // Extract text from <w:t> elements
    const textParts: string[] = [];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tm;
    while ((tm = tRegex.exec(xml)) !== null) {
      textParts.push(tm[1]);
    }
    const text = textParts.join("").trim();
    paragraphs.push({ xml, text });
  }

  console.log(`Total paragraphs in document.xml: ${paragraphs.length}`);

  // Log all paragraph texts for analysis
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].text) {
      console.log(`  P[${i}]: "${paragraphs[i].text.slice(0, 100)}"`);
    }
  }

  // Phase 1: Find the real article title paragraph
  let realTitleIdx = -1;
  let additionalConclusionsIdx = -1;
  let appendixIdx = -1;

  for (let i = 0; i < paragraphs.length; i++) {
    const t = paragraphs[i].text;
    if (t.includes("PERMANENT MICROPIGMENTATION IN THE SYSTEM")) {
      realTitleIdx = i;
    }
    if (/^ADDITIONAL CONCLUSIONS \(ADDED/i.test(t)) {
      additionalConclusionsIdx = i;
    }
    if (/^APPENDIX: READY-TO-USE/i.test(t)) {
      appendixIdx = i;
    }
  }

  console.log(`\nReal article title at paragraph index: ${realTitleIdx}`);
  console.log(`Additional conclusions at: ${additionalConclusionsIdx}`);
  console.log(`Appendix at: ${appendixIdx}`);

  // Phase 2: Determine which paragraphs to keep
  // Keep: everything from realTitleIdx up to (but not including) additionalConclusionsIdx
  // Remove: everything before realTitleIdx (frontmatter + ChatGPT outline + ChatGPT sections A-D)
  // Remove: everything from additionalConclusionsIdx onwards (ChatGPT additions)

  if (realTitleIdx < 0) {
    console.error("Could not find real article title!");
    process.exit(1);
  }

  const keepStart = realTitleIdx;
  const keepEnd = additionalConclusionsIdx > 0 ? additionalConclusionsIdx : paragraphs.length;

  console.log(`\nKeeping paragraphs ${keepStart} to ${keepEnd - 1} (${keepEnd - keepStart} paragraphs)`);
  console.log(`Removing: 0-${keepStart - 1} (before article) and ${keepEnd}-${paragraphs.length - 1} (ChatGPT additions after)`);

  // Also remove the "BASE MATERIAL (PRESERVED VERBATIM" header and its description
  // These should be right before the real article
  // And remove the repeated JEL/author/affiliation block between "BASE MATERIAL" and the real title

  // Build new body: keep only real article paragraphs
  const keptParagraphs: string[] = [];
  for (let i = keepStart; i < keepEnd; i++) {
    const t = paragraphs[i].text;
    // Skip "BASE MATERIAL" leftover lines if any snuck in
    if (/^BASE MATERIAL/i.test(t)) continue;
    if (/^The following section reproduces/i.test(t)) continue;
    if (/^new scientific sections/i.test(t)) continue;
    // Skip standalone JEL, author name, affiliation that appear right before the title
    if (/^JEL:\s*$/i.test(t)) continue;
    if (/^Olha Kolesnyk\s*$/i.test(t)) continue;
    if (/^Permanent Makeup Specialist in Aesthetic/i.test(t)) continue;
    if (/^Arizona, Scottsdale, USA\s*$/i.test(t)) continue;
    keptParagraphs.push(paragraphs[i].xml);
  }

  console.log(`\nKept ${keptParagraphs.length} paragraphs (from ${keepEnd - keepStart} candidates)`);

  // Rebuild document.xml
  const bodyStart = docXml.indexOf("<w:body>");
  const bodyEnd = docXml.indexOf("</w:body>");
  if (bodyStart === -1 || bodyEnd === -1) {
    console.error("Could not find <w:body> in document.xml");
    process.exit(1);
  }

  // Keep sectPr if exists
  const sectPrMatch = docXml.slice(bodyStart, bodyEnd + 9).match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : "";

  const newDocXml = docXml.slice(0, bodyStart + 8) + keptParagraphs.join("") + sectPr + "</w:body>" + docXml.slice(bodyEnd + 9);

  zip.updateFile("word/document.xml", Buffer.from(newDocXml));
  const newDocxBuf = zip.toBuffer();

  // Save locally
  fs.writeFileSync("/tmp/olha-clean-v2.docx", newDocxBuf);
  console.log(`\nClean DOCX saved: ${newDocxBuf.length} bytes`);

  // Verify with mammoth
  console.log("\n=== Verifying cleaned DOCX ===");
  const verifyResult = await (mammoth as any).convertToMarkdown({ buffer: newDocxBuf });
  const verifyMd: string = verifyResult.value || "";
  const verifyClean = verifyMd.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const verifyLines = verifyClean.split("\n").filter((l: string) => l.trim());

  console.log(`Clean DOCX mammoth output: ${verifyClean.length} chars, ${verifyLines.length} non-empty lines`);
  console.log("First 10 non-empty lines:");
  for (let i = 0; i < Math.min(10, verifyLines.length); i++) {
    console.log(`  [${i}]: ${verifyLines[i].slice(0, 100)}`);
  }
  console.log("Last 5 non-empty lines:");
  for (let i = Math.max(0, verifyLines.length - 5); i < verifyLines.length; i++) {
    console.log(`  [${i}]: ${verifyLines[i].slice(0, 100)}`);
  }

  // Check for leftover ChatGPT artifacts
  const artifacts = ["STRUCTURE AND KEY POINTS", "ADDED SCIENTIFIC", "BASE MATERIAL", "PRESERVED VERBATIM",
    "ADDITIONAL CONCLUSIONS (ADDED", "APPENDIX: READY-TO-USE", "DOES NOT REPLACE"];
  for (const a of artifacts) {
    if (verifyClean.includes(a)) {
      console.log(`WARNING: still contains "${a}"`);
    }
  }

  // Upload to Vercel Blob
  console.log("\nUploading to Vercel Blob...");
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_Q6WihGzfEQJX7zbu_tvkoHAcNzfRwDDfBIKBJbhgkPOEKfU";
  const blob = await put(
    `manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/Olha_Kolesnyk_Clean_Article.docx`,
    newDocxBuf,
    { access: "public" }
  );
  console.log("Uploaded:", blob.url);

  // Update both tables in DB
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  await db.execute({
    sql: "UPDATE submissions SET manuscript_url = ? WHERE id = ?",
    args: [blob.url, SUBMISSION_ID],
  });
  console.log("Updated submissions table");

  await db.execute({
    sql: "UPDATE published_articles SET manuscript_url = ? WHERE slug = ?",
    args: [blob.url, "e2026021"],
  });
  console.log("Updated published_articles table");

  console.log("\nDone! Now regenerate the LaTeX PDF.");
}

main().catch(console.error);
