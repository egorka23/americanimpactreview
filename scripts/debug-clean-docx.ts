import mammoth from "mammoth";

const CLEAN_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/Olha_Kolesnyk_Clean_Article.docx";

async function main() {
  const resp = await fetch(CLEAN_URL);
  const buf = Buffer.from(await resp.arrayBuffer());
  console.log("DOCX size:", buf.length);

  const result = await (mammoth as any).convertToMarkdown({ buffer: buf });
  const md: string = result.value || "";
  const clean = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = clean.split("\n");

  console.log(`Total lines: ${lines.length}`);
  console.log("\nFirst 40 non-empty lines:");
  let count = 0;
  for (let i = 0; i < lines.length && count < 40; i++) {
    if (lines[i].trim()) {
      console.log(`[${i}]: ${lines[i].trim().slice(0, 100)}`);
      count++;
    }
  }

  console.log("\n--- Checking for artifacts ---");
  console.log("STRUCTURE AND KEY:", clean.includes("STRUCTURE AND KEY"));
  console.log("ADDED SCIENTIFIC:", clean.includes("ADDED SCIENTIFIC"));
  console.log("ADDITIONAL CONCLUSIONS:", clean.includes("ADDITIONAL CONCLUSIONS"));
  console.log("APPENDIX:", clean.includes("APPENDIX"));
  console.log("BASE MATERIAL:", clean.includes("BASE MATERIAL"));
  console.log("JEL:", clean.includes("JEL"));
}

main().catch(console.error);
