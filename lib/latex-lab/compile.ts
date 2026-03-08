import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import AdmZip from "adm-zip";
import mammoth from "mammoth";
import { markdownToLatex } from "./markdown";
import { buildLatexDocument, type LatexMeta } from "./template";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Convert HTML tables from mammoth to markdown pipe-table format.
 * mammoth.convertToMarkdown loses table structure, but convertToHtml preserves it.
 * This extracts HTML tables and returns them as markdown strings.
 */
function htmlTableToMarkdown(tableHtml: string): string {
  const rows: string[][] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cm;
    while ((cm = cellRegex.exec(rm[1])) !== null) {
      // Strip HTML tags, normalize whitespace
      const text = cm[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return "";

  // Normalize column count
  const colCount = Math.max(...rows.map((r) => r.length));
  const normalized = rows.map((r) => {
    while (r.length < colCount) r.push("");
    return r;
  });

  // Build markdown table
  const header = "| " + normalized[0].join(" | ") + " |";
  const separator = "| " + normalized[0].map(() => "---").join(" | ") + " |";
  const body = normalized
    .slice(1)
    .map((r) => "| " + r.join(" | ") + " |")
    .join("\n");

  return [header, separator, body].join("\n");
}

/**
 * Extract HTML tables from mammoth HTML output and return them indexed.
 */
async function extractHtmlTables(
  docxBuffer: Buffer,
): Promise<string[]> {
  const result = await (mammoth as any).convertToHtml({ buffer: docxBuffer });
  const html: string = result.value || "";
  const tables: string[] = [];
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let m;
  while ((m = tableRegex.exec(html)) !== null) {
    const md = htmlTableToMarkdown(m[0]);
    if (md) tables.push(md);
  }
  return tables;
}

/**
 * In mammoth markdown, tables appear as linearized paragraphs
 * (each cell on its own line). Detect these regions by finding
 * "Table N." caption lines and matching the linearized header cells
 * against the pipe-table headers extracted from HTML.
 *
 * Strategy:
 * 1. Find all "Table N." caption lines in the markdown.
 * 2. After each caption, the next non-blank line should be the first
 *    header cell of the linearized table (e.g., "__Category__").
 * 3. Match it against the corresponding HTML pipe-table.
 * 4. Scan forward to find the end of the linearized region (heading,
 *    next table caption, or "Note." line).
 * 5. Replace the linearized region with the pipe table.
 */
function spliceTablesIntoMarkdown(md: string, tables: string[]): string {
  if (tables.length === 0) return md;

  const lines = md.split("\n");

  // Helper: strip escapes and bold markers for comparison
  const cleanLine = (s: string) =>
    s.trim()
      .replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1")
      .replace(/^[_*]+|[_*]+$/g, "")
      .trim()
      .toLowerCase();

  // Helper: check if a line is a "Table N." caption
  const isTableCaptionLine = (s: string) =>
    /Table\s+\d+\./i.test(
      s.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1").replace(/[_*]/g, "")
    );

  // Extract all header cell texts from each pipe table
  const tableFirstHeaders: string[] = tables.map((t) => {
    const firstLine = t.split("\n")[0];
    const cells = firstLine.split("|").filter((c) => c.trim());
    return cells[0]?.trim().toLowerCase() || "";
  });

  // Phase 1: Find all "Table N." caption positions and their linearized regions
  type TableRegion = {
    captionLine: number;      // line index of "Table N." caption
    dataStart: number;        // first line of linearized data (header cell)
    dataEnd: number;          // line after last line of linearized data
    noteLines: number[];      // indices of "Note." lines to preserve
    pipeTableIdx: number;     // index into tables[] array
  };

  const regions: TableRegion[] = [];
  let nextTableIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!isTableCaptionLine(lines[i])) continue;

    // Find the first non-blank line after the caption — should be the first header cell
    let dataStart = -1;
    for (let k = i + 1; k < lines.length && k <= i + 3; k++) {
      if (lines[k].trim()) {
        dataStart = k;
        break;
      }
    }
    if (dataStart < 0) continue;

    // Match against the expected table header
    const lineText = cleanLine(lines[dataStart]);
    if (nextTableIdx >= tables.length) continue;

    // Try to match: the linearized first header cell should match the pipe table's first header
    const expectedHeader = tableFirstHeaders[nextTableIdx];
    if (lineText !== expectedHeader && !lineText.startsWith(expectedHeader)) {
      continue; // Not a match — skip this caption
    }

    // Found a match. Scan forward from dataStart to find the end of linearized data.
    let dataEnd = dataStart;
    const noteLines: number[] = [];
    for (let j = dataStart; j < lines.length; j++) {
      const lt = lines[j].trim();
      if (lt === "") continue;

      // Stop at headings
      if (/^#{1,6}\s/.test(lt)) {
        dataEnd = j;
        break;
      }

      // Stop at the NEXT "Table N." caption (but not the current one)
      if (j > dataStart + 2 && isTableCaptionLine(lt)) {
        dataEnd = j;
        break;
      }

      // "Note." line — include it after the table, then stop
      if (/^Note\b/i.test(lt.replace(/^[_*]+/, ""))) {
        // Collect consecutive non-blank Note lines
        for (let k = j; k < lines.length; k++) {
          if (lines[k].trim() === "" && k > j) break;
          noteLines.push(k);
        }
        dataEnd = noteLines[noteLines.length - 1] + 1;
        break;
      }

      dataEnd = j + 1;
    }

    regions.push({
      captionLine: i,
      dataStart,
      dataEnd,
      noteLines,
      pipeTableIdx: nextTableIdx,
    });
    nextTableIdx++;

    // Skip past this region
    i = dataEnd - 1;
  }

  // Phase 2: Rebuild the markdown, replacing linearized regions with pipe tables
  const result: string[] = [];
  let lineIdx = 0;

  for (const region of regions) {
    // Copy everything before this region's data (including the caption line)
    while (lineIdx < region.dataStart) {
      result.push(lines[lineIdx]);
      lineIdx++;
    }

    // Insert the pipe table
    result.push(tables[region.pipeTableIdx]);
    result.push("");

    // Insert Note lines if any
    for (const noteLine of region.noteLines) {
      result.push(lines[noteLine]);
    }

    // Skip past the linearized data
    lineIdx = region.dataEnd;
  }

  // Copy remaining lines
  while (lineIdx < lines.length) {
    result.push(lines[lineIdx]);
    lineIdx++;
  }

  return result.join("\n");
}
const DOCKER_IMAGE = process.env.LATEX_LAB_IMAGE || "air-latex-lab:latest";
const TIMEOUT_MS = 120_000;
const LOGO_PATH = path.join(process.cwd(), "public", "android-chrome-512x512.png");
const ORCID_ICON_PATH = path.join(process.cwd(), "public", "orcid-icon.png");

export type CompileResult = {
  ok: boolean;
  pdf?: Buffer;
  logText: string;
  bundle?: Buffer;
  markdown?: string;
  userMessage?: string;
};

export type CompileInput = {
  filename: string;
  content: Buffer;
  meta: LatexMeta;
  debug?: boolean;
  imageMaxHeight?: string;
  imageForcePage?: boolean;
  imageFit?: boolean;
  /** Override specific extracted images by filename (e.g., "images/docx-1.png" → Buffer) */
  assetOverrides?: Record<string, Buffer>;
};

class DockerError extends Error {
  stdout: string;
  stderr: string;
  constructor(message: string, stdout: string, stderr: string) {
    super(message);
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

function ensureSafeFilename(name: string): string {
  const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "");
  const noTraversal = normalized.replace(/\.\.(\/|$)/g, "");
  return noTraversal.replace(/[^a-zA-Z0-9._/-]/g, "_");
}

function resolveZipBundle(zipBuffer: Buffer): { md: string; assets: Record<string, Buffer> } {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const assets: Record<string, Buffer> = {};
  let mdContent: string | null = null;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const entryName = entry.entryName.replace(/\\/g, "/");
    if (entryName.endsWith("main.md") || entryName.endsWith("MAIN.md")) {
      mdContent = entry.getData().toString("utf8");
      continue;
    }
    if (entryName.startsWith("images/") || entryName.startsWith("assets/")) {
      const cleanName = entryName.replace(/^.*?(images|assets)\//, "images/");
      const safeName = cleanName.replace(/[^a-zA-Z0-9._/-]/g, "_");
      assets[safeName] = entry.getData();
    }
  }

  if (!mdContent) {
    throw new Error("Bundle must include a main.md file at the root.");
  }

  return { md: mdContent, assets };
}

function normalizeHtmlImages(md: string): string {
  return md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    return `![](${src})`;
  });
}

function normalizeHtmlLinks(md: string): string {
  return md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_match, href, text) => {
    const cleanText = String(text).replace(/<[^>]+>/g, "");
    return `[${cleanText}](${href})`;
  });
}

type ExtractedAuthor = {
  name: string;
  affiliation?: string;
  orcid?: string;
};

/**
 * Parse docx-converted markdown to extract frontmatter:
 * - Title (bold line at top) — skipped (comes from form)
 * - Authors with affiliations and ORCID (no email)
 * - Abstract section
 * - Keywords section
 * Returns cleaned body markdown starting from first numbered heading or Introduction.
 */
function extractFrontmatter(md: string): {
  bodyMd: string;
  authors: ExtractedAuthor[];
  abstract: string;
  keywords: string[];
} {
  // Strip markdown escapes for parsing (mammoth outputs co\-creation, al\. etc.)
  const cleanMd = md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
  const lines = cleanMd.split("\n");
  const origLines = md.split("\n");
  const authors: ExtractedAuthor[] = [];
  let abstract = "";
  let keywords: string[] = [];

  let i = 0;

  // Skip leading blank lines
  while (i < lines.length && lines[i].trim() === "") i++;

  // Skip the first bold line (document title) — e.g. __Title__ or **Title**
  if (i < lines.length && /^(__|\*\*).+(__|\*\*)$/.test(lines[i].trim())) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  // Skip all frontmatter lines (authors, affiliations, email, correspondence)
  // until we hit # Abstract, # Keywords, or # 1. Introduction.
  // Metadata comes from the database, so we don't need to parse authors from DOCX.
  const frontmatterStart = i;
  for (; i < lines.length; i++) {
    const lt = lines[i].trim();
    // Stop at Abstract heading, Keywords heading, or first numbered heading
    if (/^#{1,2}\s*abstract\s*$/i.test(lt)) break;
    if (/^#{1,2}\s*keywords?\s*$/i.test(lt)) break;
    if (/^#{1,2}\s+\d+\./.test(lt)) break;
    // Also stop at plain-text "Abstract" line (no markdown heading, common in DOCX without styles)
    if (/^abstract\s*$/i.test(lt)) break;
    // Also stop at plain-text numbered section like "1. Introduction" or "1) Problem"
    if (/^\d+[\.\)]\s+\S/.test(lt) && lt.length > 5) break;
  }
  // Safety: if we consumed the entire document (no headings found at all),
  // the DOCX likely has no heading styles. Fall back: start body right after
  // the first ~30 non-blank lines (title + authors + affiliations).
  if (i >= lines.length) {
    i = frontmatterStart;
    let nonBlank = 0;
    for (; i < lines.length; i++) {
      if (lines[i].trim() !== "") nonBlank++;
      if (nonBlank > 30) break;
    }
    // If even 30 lines takes us to the end, just start from the beginning
    if (i >= lines.length) i = frontmatterStart;
  }

  // Parse # Abstract
  if (i < lines.length && /^#{1,2}\s*abstract\s*$/i.test(lines[i].trim())) {
    i++;
    const abstractLines: string[] = [];
    while (i < lines.length && !/^#{1,3}\s/.test(lines[i].trim())) {
      abstractLines.push(lines[i]);
      i++;
    }
    abstract = abstractLines.join("\n").trim();
    // Strip trailing "Keywords: ..." line from abstract (parsed separately below)
    abstract = abstract.replace(/\n\s*[_*]*\s*Keywords?:?\s*[_*]*\s*[^\n]+$/i, "").trim();
  }

  // Parse # Keywords or __Keywords:__ inline
  if (i < lines.length && /^#{1,2}\s*keywords?\s*$/i.test(lines[i].trim())) {
    i++;
    const kwLines: string[] = [];
    while (i < lines.length && !/^#{1,3}\s/.test(lines[i].trim())) {
      kwLines.push(lines[i]);
      i++;
    }
    const kwText = kwLines.join(" ").trim();
    if (kwText) {
      keywords = kwText.split(",").map((k) => k.trim()).filter(Boolean);
    }
  }
  // Also check for inline __Keywords:__ line (MDPI style: right after abstract)
  if (i < lines.length && /^[_*]*Keywords:?\s*[_*]*/i.test(lines[i].trim())) {
    const kwLine = lines[i].trim()
      .replace(/^[_*]+\s*Keywords:?\s*[_*]*/i, "")
      .trim();
    if (kwLine) {
      keywords = kwLine.split(/[;,]/).map((k) => k.trim()).filter(Boolean);
    }
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  // Return body from ORIGINAL md (with escapes intact) so downstream normalization works
  const bodyMd = origLines.slice(i).join("\n").trim();

  return { bodyMd, authors, abstract, keywords };
}

function normalizeMarkdownEscapes(md: string): string {
  return md.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1");
}

function normalizeInlineImages(md: string): string {
  return md.replace(/!\[[^\]]*\]\([^)]+\)/g, (match) => `\n${match}\n`);
}

function normalizeMultilineImages(md: string): string {
  return md.replace(/!\[([\s\S]*?)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const cleanAlt = String(alt).replace(/\s+/g, " ").trim();
    return `![${cleanAlt}](${src})`;
  });
}

function runDocker(workDir: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const uid = typeof process.getuid === "function" ? process.getuid() : null;
    const gid = typeof process.getgid === "function" ? process.getgid() : null;
    const args = [
      "run",
      "--rm",
      "--network=none",
      "--cpus=1",
      "--memory=512m",
      "--pids-limit=256",
      "--security-opt=no-new-privileges",
      "--cap-drop=ALL",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64m",
      "--tmpfs",
      "/var/tmp:rw,noexec,nosuid,size=64m",
      "-e",
      "HOME=/data",
      "-e",
      "TEXMFVAR=/data/.texmf-var",
      "-e",
      "TEXMFCONFIG=/data/.texmf-config",
      "-e",
      "TEXMFCACHE=/data/.texmf-cache",
      "-v",
      `${workDir}:/data:rw`,
    ];
    if (uid !== null && gid !== null) {
      args.push("--user", `${uid}:${gid}`);
    }
    args.push(DOCKER_IMAGE, "main.tex");

    execFile("docker", args, { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new DockerError(
          `Docker compile failed: ${stderr || stdout || err.message}`,
          stdout || "",
          stderr || "",
        ));
      }
      return resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
}

function buildMetaBlock(meta: LatexMeta): LatexMeta {
  return {
    title: meta.title || "Untitled Manuscript",
    authors: meta.authors || "Anonymous",
    authorsDetailed: meta.authorsDetailed,
    doi: meta.doi,
    received: meta.received,
    accepted: meta.accepted,
    published: meta.published,
    articleType: meta.articleType,
    keywords: meta.keywords,
    lineNumbers: meta.lineNumbers,
    volume: meta.volume,
    issue: meta.issue,
    pages: meta.pages,
    abstract: meta.abstract,
  };
}

function createBundle(workDir: string): Buffer {
  const zip = new AdmZip();
  zip.addLocalFolder(workDir);
  return zip.toBuffer();
}

function buildSafeAssets(assets: Record<string, Buffer>) {
  const safeAssets: Record<string, Buffer> = {};
  const pathMap: Record<string, string> = {};
  Object.entries(assets).forEach(([name, buffer]) => {
    const safeName = ensureSafeFilename(name);
    const extName = path.extname(safeName).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".pdf"].includes(extName)) return;
    safeAssets[safeName] = buffer;
    pathMap[name] = safeName;
    const normalized = name.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\//, "");
    pathMap[normalized] = safeName;
  });
  return { safeAssets, pathMap };
}

function rewriteMarkdownImagePaths(md: string, pathMap: Record<string, string>) {
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const normalized = String(src).replace(/^\.\/+/, "").replace(/^\//, "");
    const mapped = pathMap[normalized] || pathMap[src] || src;
    return `![${alt}](${mapped})`;
  });
}

function normalizeImageMaxHeight(input?: string): string | undefined {
  if (!input) return undefined;
  const num = Number(input);
  if (!Number.isFinite(num)) return undefined;
  const clamped = Math.min(0.95, Math.max(0.3, num));
  return `${clamped}\\textheight`;
}

export async function compileLatexLab(input: CompileInput): Promise<CompileResult> {
  if (input.content.length > MAX_UPLOAD_BYTES) {
    return { ok: false, logText: "", userMessage: "File exceeds 10 MB limit." };
  }

  const ext = path.extname(input.filename).toLowerCase();
  let mdContent = "";
  let assets: Record<string, Buffer> = {};
  let conversionWarnings = "";

  try {
    if (ext === ".zip") {
      const bundle = resolveZipBundle(input.content);
      mdContent = bundle.md;
      assets = bundle.assets;
    } else if (ext === ".md") {
      mdContent = input.content.toString("utf8");
    } else if (ext === ".docx") {
      let imageIndex = 0;
      const docxAssets: Record<string, Buffer> = {};
      const result = await (mammoth as any).convertToMarkdown(
        { buffer: input.content },
        {
          convertImage: (mammoth as any).images.imgElement(async (image: any) => {
            const base64 = await image.read("base64");
            const contentType = image.contentType || "image/png";
            const ext = contentType.split("/")[1] || "png";
            const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "") || "png";
            imageIndex += 1;
            const filename = `images/docx-${imageIndex}.${safeExt}`;
            docxAssets[filename] = Buffer.from(base64, "base64");
            return { src: filename };
          }),
        },
      );
      mdContent = result.value || "";
      assets = docxAssets;
      // Apply asset overrides (e.g., replace incorrect images)
      if (input.assetOverrides) {
        for (const [key, buf] of Object.entries(input.assetOverrides)) {
          assets[key] = buf;
        }
      }
      if (result.messages?.length) {
        conversionWarnings = result.messages.map((msg: any) => `[${msg.type}] ${msg.message}`).join("\n");
      }
      // mammoth markdown loses table structure — extract tables from HTML and splice in
      try {
        const htmlTables = await extractHtmlTables(input.content);
        if (htmlTables.length > 0) {
          mdContent = spliceTablesIntoMarkdown(mdContent, htmlTables);
        }
      } catch (tableErr) {
        conversionWarnings += `\n[warn] Could not extract HTML tables: ${tableErr}`;
      }
    } else {
      return { ok: false, logText: "", userMessage: "Only .md, .docx, or .zip files are supported." };
    }
  } catch (error) {
    return {
      ok: false,
      logText: String(error),
      userMessage: "Unable to read input. Provide a valid .md, .docx, or .zip with main.md.",
    };
  }

  if (/data:image\/[^;]+;base64/i.test(mdContent)) {
    return {
      ok: false,
      logText: "",
      userMessage: "Base64 images are not supported. Upload images via zip bundle or use .docx.",
    };
  }

  // Strip remote image URLs — Docker runs with --network=none so LuaLaTeX cannot fetch them.
  const remoteImageWarnings: string[] = [];
  mdContent = mdContent.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/gi, (_match, alt, url) => {
    remoteImageWarnings.push(`[warn] Remote image stripped (network disabled): ${url}`);
    const label = alt ? `${alt} — ` : "";
    return `[Image not available: ${label}${url}]`;
  });
  if (remoteImageWarnings.length) {
    conversionWarnings = [conversionWarnings, ...remoteImageWarnings].filter(Boolean).join("\n");
  }

  // Extract frontmatter (title, authors, abstract, keywords) from RAW markdown BEFORE normalization
  const resolvedMeta = buildMetaBlock(input.meta);
  const { bodyMd: rawBodyMd, authors: extractedAuthors, abstract: extractedAbstract, keywords: extractedKeywords } =
    extractFrontmatter(mdContent);

  // Use extracted data only if not already provided via form/database
  if (!resolvedMeta.abstract && extractedAbstract) {
    resolvedMeta.abstract = extractedAbstract;
  }
  if ((!resolvedMeta.keywords || resolvedMeta.keywords.length === 0) && extractedKeywords.length > 0) {
    resolvedMeta.keywords = extractedKeywords;
  }
  if ((!resolvedMeta.authorsDetailed || resolvedMeta.authorsDetailed.length === 0) && extractedAuthors.length > 0) {
    resolvedMeta.authorsDetailed = extractedAuthors;
  }

  // Now normalize the body (without frontmatter)
  const { safeAssets, pathMap } = buildSafeAssets(assets);
  const normalizedMd = normalizeInlineImages(
    normalizeMultilineImages(
      rewriteMarkdownImagePaths(
        normalizeMarkdownEscapes(normalizeHtmlLinks(normalizeHtmlImages(rawBodyMd))),
        pathMap,
      ),
    ),
  );

  const isDocx = ext === ".docx";
  const body = markdownToLatex(normalizedMd, {
    imageMaxHeight: normalizeImageMaxHeight(input.imageMaxHeight),
    imageForcePage: input.imageForcePage,
    imageFit: input.imageFit,
    noMath: isDocx,
  });
  if (isDocx) resolvedMeta.noMath = true;
  const latex = buildLatexDocument(body, resolvedMeta);

  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "air-latex-"));
  try {
    await fs.promises.writeFile(path.join(workDir, "main.md"), mdContent, "utf8");
    await fs.promises.writeFile(path.join(workDir, "main.tex"), latex, "utf8");
    await fs.promises.mkdir(path.join(workDir, ".texmf-var"), { recursive: true });
    await fs.promises.mkdir(path.join(workDir, ".texmf-config"), { recursive: true });
    await fs.promises.mkdir(path.join(workDir, ".texmf-cache"), { recursive: true });

    if (fs.existsSync(LOGO_PATH)) {
      await fs.promises.copyFile(LOGO_PATH, path.join(workDir, "air-logo.png"));
    }
    if (fs.existsSync(ORCID_ICON_PATH)) {
      await fs.promises.copyFile(ORCID_ICON_PATH, path.join(workDir, "orcid-icon.png"));
    }

    for (const [name, buffer] of Object.entries(safeAssets)) {
      const target = path.join(workDir, name);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, buffer);
    }

    let stdout = "";
    let stderr = "";
    try {
      const run = await runDocker(workDir);
      stdout = run.stdout;
      stderr = run.stderr;
    } catch (err) {
      const logPath = path.join(workDir, "main.log");
      const logText = fs.existsSync(logPath) ? await fs.promises.readFile(logPath, "utf8") : "";
      return {
        ok: false,
        logText: `${conversionWarnings}\n${(err as Error).message}\n${logText}`.trim(),
        userMessage: "LaTeX compilation failed. Check the logs for details.",
      };
    }

    const pdfPath = path.join(workDir, "main.pdf");
    const logPath = path.join(workDir, "main.log");
    const pdf = fs.existsSync(pdfPath) ? await fs.promises.readFile(pdfPath) : null;
    const rawLog = fs.existsSync(logPath) ? await fs.promises.readFile(logPath, "utf8") : `${stdout}\n${stderr}`.trim();
    const assetNote = `Extracted images: ${Object.keys(safeAssets).length}`;
    const logText = [conversionWarnings, assetNote, rawLog].filter(Boolean).join("\n").trim();

    if (!pdf) {
      return { ok: false, logText, userMessage: "PDF was not generated." };
    }

    return {
      ok: true,
      pdf,
      logText,
      bundle: input.debug ? createBundle(workDir) : undefined,
      markdown: input.debug ? normalizedMd : undefined,
    };
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}
