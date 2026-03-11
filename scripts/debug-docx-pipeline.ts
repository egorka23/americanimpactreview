/**
 * Debug: show first 50 lines of mammoth markdown with line numbers.
 */
import mammoth from "mammoth";

const DOCX_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";

async function main() {
  const resp = await fetch(DOCX_URL);
  const buf = Buffer.from(await resp.arrayBuffer());

  const result = await (mammoth as any).convertToMarkdown(
    { buffer: buf },
    {
      convertImage: (mammoth as any).images.imgElement(async () => {
        return { src: "images/docx-img.png" };
      }),
    },
  );
  const md: string = result.value || "";
  // Unescape for readability
  const clean = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = clean.split("\n");

  console.log(`Total lines: ${lines.length}\n`);
  for (let i = 0; i < Math.min(60, lines.length); i++) {
    const line = lines[i];
    console.log(`[${String(i).padStart(3)}] ${line.length > 0 ? line.slice(0, 120) : '(empty)'}`);
  }
}

main().catch(console.error);
