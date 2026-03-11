import mammoth from "mammoth";

const DOCX_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";

async function main() {
  const resp = await fetch(DOCX_URL);
  const buf = Buffer.from(await resp.arrayBuffer());
  const result = await (mammoth as any).convertToMarkdown({ buffer: buf }, {
    convertImage: (mammoth as any).images.imgElement(async () => ({ src: "img.png" })),
  });
  const md: string = result.value || "";
  const clean = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = clean.split("\n");

  // Find ALL occurrences of JEL in the mammoth output
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("JEL")) {
      console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }

  // Find CHEMOTHERAPY-INDUCED
  console.log("\n--- CHEMOTHERAPY-INDUCED ---");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("CHEMOTHERAPY")) {
      console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }

  // Find "ADDED"
  console.log("\n--- ADDED ---");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("ADDED")) {
      console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }

  // Find APPENDIX
  console.log("\n--- APPENDIX ---");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("APPENDIX")) {
      console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }

  // Find "Olha Kolesnyk"
  console.log("\n--- Olha Kolesnyk ---");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Olha")) {
      console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
    }
  }

  // Show lines around second occurrence of CHEMOTHERAPY (if any)
  console.log("\n--- Lines 620-660 ---");
  for (let i = 620; i < Math.min(660, lines.length); i++) {
    if (lines[i].trim()) console.log(`Line ${i}: "${lines[i].trim().slice(0, 120)}"`);
  }
}

main().catch(console.error);
