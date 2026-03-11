import fs from "fs";
import mammoth from "mammoth";

const DOCX_PATH = "/Users/aeb/Desktop/бизнес статьи для AIR/Article_05_SaaS_Freemium_CaseStudy_revised.docx";

async function main() {
  const buffer = fs.readFileSync(DOCX_PATH);
  const mdResult = await (mammoth as any).convertToMarkdown({ buffer });
  const mdContent: string = mdResult.value || "";
  const lines = mdContent.split("\n");

  // Show lines 255-385 to see what's between the two tables
  console.log("=== Lines 255-390 (between Table 1 and Table 2 regions) ===\n");
  for (let i = 255; i <= 390 && i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const marker = (i === 260) ? " ← TABLE 1 HEADER" : (i === 372) ? " ← TABLE 2 HEADER" : "";
    console.log(`[${i}] ${trimmed.substring(0, 120)}${marker}`);
  }
}

main().catch(console.error);
