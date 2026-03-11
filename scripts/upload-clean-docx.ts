import { put } from "@vercel/blob";
import { createClient } from "@libsql/client";
import AdmZip from "adm-zip";
import fs from "fs";

const TURSO_URL = "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA";
const SUBMISSION_ID = "21a459ee-0aff-4b6e-af8a-64316bd888ea";

// Read the original DOCX, modify its content
async function main() {
  // Download original DOCX
  const origUrl = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";
  const resp = await fetch(origUrl);
  const origBuf = Buffer.from(await resp.arrayBuffer());

  // Use adm-zip to open the DOCX (which is a zip file) and replace document.xml
  // Actually, simpler: just read the clean text, create a minimal DOCX
  // A DOCX is an OpenXML zip. Let's modify the original.

  const zip = new AdmZip(origBuf);
  const docXml = zip.readAsText("word/document.xml");

  // Read clean text
  const cleanText = fs.readFileSync("/tmp/olha-clean.txt", "utf8");
  const paragraphs = cleanText.split("\n").filter(l => l.trim());

  // Build new document.xml body
  const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const wparagraphs = paragraphs.map(p => {
    const trimmed = p.trim();
    const isAllCaps = /^[A-Z][A-Z\s\-:(),/&;.0-9–]+$/.test(trimmed) && trimmed.length > 10;
    const isSectionHeader = /^[A-D]\.\s/.test(trimmed);
    const isBullet = trimmed.startsWith("- ");

    let pStyle = "";
    if (isAllCaps) pStyle = `<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>`;
    else if (isSectionHeader) pStyle = `<w:pPr><w:pStyle w:val="Heading2"/></w:pPr>`;

    const text = isBullet ? trimmed.slice(2) : trimmed;
    const prefix = isBullet ? "• " : "";

    return `<w:p>${pStyle}<w:r><w:t xml:space="preserve">${escXml(prefix + text)}</w:t></w:r></w:p>`;
  }).join("");

  // Replace body content
  const bodyStart = docXml.indexOf("<w:body>");
  const bodyEnd = docXml.indexOf("</w:body>");
  if (bodyStart === -1 || bodyEnd === -1) {
    console.error("Could not find <w:body> in document.xml");
    process.exit(1);
  }

  // Keep sectPr if it exists
  const sectPrMatch = docXml.slice(bodyStart, bodyEnd + 9).match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : "";

  const newDocXml = docXml.slice(0, bodyStart) + `<w:body>${wparagraphs}${sectPr}</w:body>` + docXml.slice(bodyEnd + 9);

  zip.updateFile("word/document.xml", Buffer.from(newDocXml));
  const newDocxBuf = zip.toBuffer();

  // Save locally for verification
  fs.writeFileSync("/tmp/olha-clean.docx", newDocxBuf);
  console.log("Clean DOCX saved locally:", newDocxBuf.length, "bytes");

  // Upload to Vercel Blob
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_Q6WihGzfEQJX7zbu_tvkoHAcNzfRwDDfBIKBJbhgkPOEKfU";
  const blob = await put(
    `manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong_clean.docx`,
    newDocxBuf,
    { access: "public" }
  );
  console.log("Uploaded to blob:", blob.url);

  // Update DB
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  await db.execute({
    sql: "UPDATE submissions SET manuscript_url = ?, manuscript_name = ? WHERE id = ?",
    args: [blob.url, "Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong_clean.docx", SUBMISSION_ID],
  });
  console.log("Database updated!");
}

main().catch(console.error);
