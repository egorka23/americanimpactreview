import mammoth from "mammoth";
import fs from "fs";

const DOCX_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";

async function main() {
  const resp = await fetch(DOCX_URL);
  const buf = Buffer.from(await resp.arrayBuffer());
  const result = await (mammoth as any).convertToMarkdown({ buffer: buf }, {
    convertImage: (mammoth as any).images.imgElement(async () => ({ src: "img.png" })),
  });
  const md: string = result.value || "";
  const clean = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  fs.writeFileSync("/tmp/mammoth-full.txt", clean, "utf8");
  console.log(`Saved ${clean.length} chars to /tmp/mammoth-full.txt`);
}

main().catch(console.error);
