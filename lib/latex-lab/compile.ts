import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import AdmZip from "adm-zip";
import mammoth from "mammoth";
import { markdownToLatex } from "./markdown";
import { buildLatexDocument, type LatexMeta } from "./template";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DOCKER_IMAGE = process.env.LATEX_LAB_IMAGE || "air-latex-lab:latest";
const TIMEOUT_MS = 25_000;

export type CompileResult = {
  ok: boolean;
  pdf?: Buffer;
  logText: string;
  bundle?: Buffer;
  userMessage?: string;
};

export type CompileInput = {
  filename: string;
  content: Buffer;
  meta: LatexMeta;
  debug?: boolean;
};

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

function extractAssetsFromMarkdown(md: string, assets: Record<string, Buffer>) {
  return md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    if (/^https?:\/\//i.test(src)) {
      return `![${alt}](${src})`;
    }
    const normalized = src.replace(/^\.\/+/, "").replace(/^\//, "");
    if (!assets[normalized]) {
      return `![${alt}](${normalized})`;
    }
    return `![${alt}](${normalized})`;
  });
}

function normalizeHtmlImages(md: string): string {
  return md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    return `![](${src})`;
  });
}

function runDocker(workDir: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
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
      "HOME=/tmp",
      "-e",
      "TEXMFVAR=/tmp/texmf-var",
      "-e",
      "TEXMFCONFIG=/tmp/texmf-config",
      "-e",
      "TEXMFCACHE=/tmp/texmf-cache",
      "-v",
      `${workDir}:/data:rw`,
      DOCKER_IMAGE,
      "main.tex",
    ];

    execFile("docker", args, { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const error = new Error(`Docker compile failed: ${stderr || stdout || err.message}`);
        // @ts-expect-error attach for caller
        error.stdout = stdout;
        // @ts-expect-error attach for caller
        error.stderr = stderr;
        return reject(error);
      }
      return resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
}

function buildMetaBlock(meta: LatexMeta) {
  return {
    title: meta.title || "Untitled Manuscript",
    authors: meta.authors || "Anonymous",
    doi: meta.doi,
    received: meta.received,
    accepted: meta.accepted,
    published: meta.published,
  };
}

function createBundle(workDir: string): Buffer {
  const zip = new AdmZip();
  zip.addLocalFolder(workDir);
  return zip.toBuffer();
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
      const result = await mammoth.convertToMarkdown(
        { buffer: input.content },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
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
      mdContent = normalizeHtmlImages(result.value || "");
      assets = docxAssets;
      if (result.messages?.length) {
        conversionWarnings = result.messages.map((msg) => `[${msg.type}] ${msg.message}`).join("\n");
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

  const safeAssets: Record<string, Buffer> = {};
  Object.entries(assets).forEach(([name, buffer]) => {
    const safeName = ensureSafeFilename(name);
    const extName = path.extname(safeName).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".pdf"].includes(extName)) return;
    safeAssets[safeName] = buffer;
  });

  const normalizedMd = extractAssetsFromMarkdown(mdContent, safeAssets);
  const body = markdownToLatex(normalizedMd);
  const latex = buildLatexDocument(body, buildMetaBlock(input.meta));

  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "air-latex-"));
  try {
    await fs.promises.writeFile(path.join(workDir, "main.md"), mdContent, "utf8");
    await fs.promises.writeFile(path.join(workDir, "main.tex"), latex, "utf8");

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
    const logText = [conversionWarnings, rawLog].filter(Boolean).join("\n").trim();

    if (!pdf) {
      return { ok: false, logText, userMessage: "PDF was not generated." };
    }

    return {
      ok: true,
      pdf,
      logText,
      bundle: input.debug ? createBundle(workDir) : undefined,
    };
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true });
  }
}
