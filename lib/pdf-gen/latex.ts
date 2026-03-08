/**
 * LaTeX-based PDF generation for published articles.
 * Downloads DOCX from Vercel Blob, converts via mammoth → markdown → LaTeX → LuaLaTeX (Docker).
 * Metadata comes from the database (publishedArticles), NOT from extractFrontmatter.
 */

import { compileLatexLab, type CompileInput } from "@/lib/latex-lab/compile";
import type { LatexMeta, AuthorDetail } from "@/lib/latex-lab/template";
import { PDFDocument, PDFName } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

export type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  abstract: string | null;
  content: string | null;
  authors: string | null;
  affiliations: string | null;
  keywords: string | null;
  orcids: string | null;
  authorUsername: string | null;
  articleType: string | null;
  doi: string | null;
  volume: string | null;
  issue: string | null;
  year: number | null;
  manuscriptUrl: string | null;
  pdfUrl: string | null;
  receivedAt: Date | null;
  acceptedAt: Date | null;
  publishedAt: Date | null;
};

export type PdfResult = {
  pdfBuffer: Buffer;
  pageCount: number;
  logText?: string;
};

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(",").map((s: string) => s.trim()).filter(Boolean); }
}

function formatDateShort(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Build LatexMeta from publishedArticles row.
 * All metadata comes from the database — no parsing from the manuscript.
 */
function buildLatexMeta(r: ArticleRow): LatexMeta {
  const authors = parseJsonArray(r.authors);
  const affiliations = parseJsonArray(r.affiliations);
  const orcids = parseJsonArray(r.orcids);
  const keywords = parseJsonArray(r.keywords);

  const authorsDetailed: AuthorDetail[] = authors.map((name, i) => ({
    name,
    affiliation: affiliations[i] || undefined,
    orcid: orcids[i] || undefined,
  }));

  return {
    title: r.title,
    authors: authors.join(", ") || r.authorUsername || "Anonymous",
    authorsDetailed: authorsDetailed.length > 0 ? authorsDetailed : undefined,
    doi: r.doi || undefined,
    received: formatDateShort(r.receivedAt),
    accepted: formatDateShort(r.acceptedAt),
    published: formatDateShort(r.publishedAt),
    articleType: r.articleType || "Research Article",
    keywords: keywords.length > 0 ? keywords : undefined,
    abstract: r.abstract || undefined,
    volume: r.volume || undefined,
    issue: r.issue || undefined,
  };
}

export async function generatePdfLatex(r: ArticleRow): Promise<PdfResult> {
  // We need the original DOCX to convert via mammoth → markdown → LaTeX.
  // The manuscriptUrl points to Vercel Blob storage.
  if (!r.manuscriptUrl) {
    throw new Error(
      "LaTeX PDF generation requires a manuscript DOCX file. " +
      "This article has no manuscriptUrl. Use Puppeteer fallback or upload a DOCX."
    );
  }

  // Download the DOCX from Vercel Blob
  const docxRes = await fetch(r.manuscriptUrl, { cache: "no-store" });
  if (!docxRes.ok) {
    throw new Error(`Failed to download manuscript from ${r.manuscriptUrl}: ${docxRes.status}`);
  }
  const docxBuffer = Buffer.from(await docxRes.arrayBuffer());
  console.log(`[latex] Downloaded DOCX: ${docxBuffer.length} bytes from ${r.manuscriptUrl}`);

  // Build metadata from database (bypasses extractFrontmatter)
  const meta = buildLatexMeta(r);

  // Load per-article image overrides (corrected figures stored in public/article-assets/)
  const assetOverrides: Record<string, Buffer> = {};
  const overrideDir = path.join(process.cwd(), "public", "article-assets");
  const overridePrefix = `${r.slug}-figure`;
  try {
    if (fs.existsSync(overrideDir)) {
      for (const file of fs.readdirSync(overrideDir)) {
        if (!file.startsWith(overridePrefix)) continue;
        // e.g., "e2026015-figure1.png" → override "images/docx-1.png"
        const m = file.match(/figure(\d+)\.\w+$/);
        if (m) {
          const imgIdx = m[1];
          const ext = path.extname(file).slice(1);
          assetOverrides[`images/docx-${imgIdx}.${ext}`] = fs.readFileSync(path.join(overrideDir, file));
          console.log(`[latex] Image override: images/docx-${imgIdx}.${ext} ← ${file}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[latex] Could not load image overrides: ${err}`);
  }

  // Compile via the LaTeX pipeline
  const input: CompileInput = {
    filename: "manuscript.docx",
    content: docxBuffer,
    meta,
    debug: false,
    imageFit: true,
    imageMaxHeight: "0.85",
    assetOverrides: Object.keys(assetOverrides).length > 0 ? assetOverrides : undefined,
  };

  const result = await compileLatexLab(input);

  if (!result.ok || !result.pdf) {
    const errorDetail = result.userMessage || "LaTeX compilation failed.";
    const logSnippet = (result.logText || "").slice(-2000);
    throw new Error(`${errorDetail}\n\nLog tail:\n${logSnippet}`);
  }

  // Set PDF metadata with pdf-lib (same as Puppeteer path)
  const authors = parseJsonArray(r.authors);
  const keywords = parseJsonArray(r.keywords);

  const pdfDoc = await PDFDocument.load(result.pdf);
  pdfDoc.setTitle(r.title);
  pdfDoc.setAuthor(authors.join(", "));
  pdfDoc.setSubject((r.abstract || "").slice(0, 500));
  pdfDoc.setKeywords(keywords);
  pdfDoc.setCreator("American Impact Review");
  pdfDoc.setProducer("American Impact Review / Global Talent Foundation (LaTeX)");
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  // Force PDF to open on page 1
  const catalog = pdfDoc.catalog;
  catalog.delete(PDFName.of("OpenAction"));
  catalog.delete(PDFName.of("Dests"));
  const firstPageRef = pdfDoc.getPage(0).ref;
  const destArray = pdfDoc.context.obj([firstPageRef, PDFName.of("Fit")]);
  catalog.set(PDFName.of("OpenAction"), destArray);
  catalog.set(PDFName.of("PageLayout"), PDFName.of("SinglePage"));
  catalog.set(PDFName.of("PageMode"), PDFName.of("UseNone"));

  const finalPdf = await pdfDoc.save();

  return {
    pdfBuffer: Buffer.from(finalPdf),
    pageCount: pdfDoc.getPageCount(),
    logText: result.logText,
  };
}
