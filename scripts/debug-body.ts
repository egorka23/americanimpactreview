/**
 * Debug: show EXACT body that goes to markdownToLatex after extractFrontmatter.
 * Uses the ACTUAL code from compile.ts.
 */
import mammoth from "mammoth";

const DOCX_URL = "https://q6wihgzfeqjx7zbu.public.blob.vercel-storage.com/manuscripts/e4a90e5c-5ef3-4cfd-8515-a597987e7d7c/1772599360351-Olha_Kolesnyk_Chemo_Alopecia_PMU_Rehab_Strong.docx";

// Copy of extractFrontmatter from compile.ts (UPDATED version)
function extractFrontmatter(md: string) {
  const cleanMd = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = cleanMd.split("\n");
  const origLines = md.split("\n");
  let abstract = "";
  let keywords: string[] = [];

  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;

  // Skip bold title
  if (i < lines.length && /^(__|\*\*).+(__|\*\*)$/.test(lines[i].trim())) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  // Skip frontmatter
  const frontmatterStart = i;
  for (; i < lines.length; i++) {
    const lt = lines[i].trim();
    if (/^#{1,2}\s*abstract\s*$/i.test(lt)) break;
    if (/^#{1,2}\s*keywords?\s*$/i.test(lt)) break;
    if (/^#{1,2}\s+\d+\./.test(lt)) break;
    if (/^abstract\s*$/i.test(lt)) break;
    if (/^\d+[\.\)]\s+\S/.test(lt) && lt.length > 5) break;
  }
  if (i >= lines.length) {
    i = frontmatterStart;
    let nonBlank = 0;
    for (; i < lines.length; i++) {
      if (lines[i].trim() !== "") nonBlank++;
      if (nonBlank > 30) break;
    }
    if (i >= lines.length) i = frontmatterStart;
  }

  // Parse abstract
  if (i < lines.length && /^#{1,2}\s*abstract\s*$/i.test(lines[i].trim())) {
    i++;
    const abstractLines: string[] = [];
    while (i < lines.length && !/^#{1,3}\s/.test(lines[i].trim())) {
      abstractLines.push(lines[i]);
      i++;
    }
    abstract = abstractLines.join("\n").trim();
  }
  // Parse keywords
  if (i < lines.length && /^#{1,2}\s*keywords?\s*$/i.test(lines[i].trim())) {
    i++;
    const kwLines: string[] = [];
    while (i < lines.length && !/^#{1,3}\s/.test(lines[i].trim())) {
      kwLines.push(lines[i]);
      i++;
    }
    const kwText = kwLines.join(" ").trim();
    if (kwText) keywords = kwText.split(",").map((k: string) => k.trim()).filter(Boolean);
  }
  if (i < lines.length && /^[_*]*Keywords:?\s*[_*]*/i.test(lines[i].trim())) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  const bodyMd = origLines.slice(i).join("\n").trim();
  return { bodyMd, abstract, keywords, bodyStartLine: i };
}

// Normalizations from compile.ts
function normalizeHtmlImages(md: string) { return md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_m, src) => `![](${src})`); }
function normalizeHtmlLinks(md: string) { return md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_m, href, text) => `[${text.replace(/<[^>]+>/g, "")}](${href})`); }
function normalizeMarkdownEscapes(md: string) { return md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1"); }
function normalizeInlineImages(md: string) { return md.replace(/!\[[^\]]*\]\([^)]+\)/g, (m) => `\n${m}\n`); }
function normalizeMultilineImages(md: string) { return md.replace(/!\[([\s\S]*?)\]\(([^)]+)\)/g, (_m, alt, src) => `![${String(alt).replace(/\s+/g, " ").trim()}](${src})`); }

async function main() {
  const resp = await fetch(DOCX_URL);
  const buf = Buffer.from(await resp.arrayBuffer());

  const result = await (mammoth as any).convertToMarkdown(
    { buffer: buf },
    {
      convertImage: (mammoth as any).images.imgElement(async () => ({ src: "images/docx-img.png" })),
    },
  );
  const mdContent: string = result.value || "";

  const { bodyMd: rawBodyMd, bodyStartLine } = extractFrontmatter(mdContent);

  // Apply normalizations (same as compile.ts)
  const normalizedMd = normalizeInlineImages(
    normalizeMultilineImages(
      normalizeMarkdownEscapes(normalizeHtmlLinks(normalizeHtmlImages(rawBodyMd)))
    )
  );

  console.log(`Body starts at line: ${bodyStartLine}`);
  console.log(`Raw body length: ${rawBodyMd.length}`);
  console.log(`Normalized body length: ${normalizedMd.length}`);
  console.log(`\n=== FIRST 20 LINES OF NORMALIZED BODY ===`);
  const bodyLines = normalizedMd.split("\n");
  for (let i = 0; i < Math.min(20, bodyLines.length); i++) {
    console.log(`[${i}]: ${bodyLines[i].slice(0, 120)}`);
  }
  console.log(`\n=== LAST 20 LINES OF NORMALIZED BODY ===`);
  for (let i = Math.max(0, bodyLines.length - 20); i < bodyLines.length; i++) {
    console.log(`[${i}]: ${bodyLines[i].slice(0, 120)}`);
  }

  // Check for problematic content
  const hasJEL = normalizedMd.includes("JEL:");
  const hasStructure = normalizedMd.includes("STRUCTURE AND KEY POINTS");
  const hasCHEMO = normalizedMd.includes("CHEMOTHERAPY-INDUCED");
  console.log(`\nContains "JEL:": ${hasJEL}`);
  console.log(`Contains "STRUCTURE AND KEY POINTS": ${hasStructure}`);
  console.log(`Contains "CHEMOTHERAPY-INDUCED": ${hasCHEMO}`);
  console.log(`Contains "ADDED — DOES NOT REPLACE": ${normalizedMd.includes("ADDED — DOES NOT REPLACE")}`);
  console.log(`Contains "APPENDIX: READY-TO-USE": ${normalizedMd.includes("APPENDIX: READY-TO-USE")}`);
}

main().catch(console.error);
