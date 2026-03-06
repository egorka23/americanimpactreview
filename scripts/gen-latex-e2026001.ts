/**
 * Generate LaTeX PDF for article e2026001.
 * Reads the markdown, bundles it with figure images as a .zip,
 * and compiles via the Docker LaTeX pipeline.
 *
 * Usage: npx tsx scripts/gen-latex-e2026001.ts
 */
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { compileLatexLab } from "@/lib/latex-lab/compile";
import { PDFDocument, PDFName } from "pdf-lib";

const SLUG = "e2026001";
const ARTICLES_DIR = path.join(process.cwd(), "articles");
const IMAGES_DIR = path.join(process.cwd(), "public", "articles", SLUG);
const OUTPUT_PATH = path.join(process.cwd(), "public", "articles", `${SLUG}.pdf`);

async function main() {
  const mdPath = path.join(ARTICLES_DIR, `${SLUG}.md`);
  const rawMd = fs.readFileSync(mdPath, "utf8");

  // Parse metadata from the markdown frontmatter
  const lines = rawMd.split("\n");
  const titleLine = lines.find((l) => l.trim().startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled";

  function parseField(label: string): string {
    const line = lines.find((l) => l.toLowerCase().includes(`**${label.toLowerCase()}:**`));
    if (!line) return "";
    return line.replace(/\*\*/g, "").replace(new RegExp(`${label}:\\s*`, "i"), "").trim();
  }

  const authorsRaw = parseField("Authors");
  const authors = authorsRaw.split(",").map((n) => n.replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "").trim()).filter(Boolean);

  const affiliationsArr: string[] = [];
  let inAffil = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^\*\*affiliations?:\*\*/i.test(t)) { inAffil = true; continue; }
    if (inAffil) {
      if (t.startsWith("- ")) {
        affiliationsArr.push(t.replace(/^-\s*/, "").replace(/^[\u00B9\u00B2\u00B3\u2070-\u209F]+\s*/, "").trim());
      } else if (t === "" || t.startsWith("**")) { inAffil = false; }
    }
  }

  const keywordsRaw = parseField("Keywords");
  const keywords = keywordsRaw ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean) : [];

  // Extract abstract
  let abstract = "";
  let inAbstract = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^#{1,4}\s+abstract/i.test(t)) { inAbstract = true; continue; }
    if (inAbstract) {
      if (/^\*\*keywords?:\*\*/i.test(t) || t.startsWith("## ") || t === "---") break;
      abstract += (abstract ? "\n" : "") + line;
    }
  }
  abstract = abstract.trim();

  // Extract body: everything from first numbered heading (## 1. ...)
  let bodyStartIdx = lines.findIndex((l) => /^#{1,4}\s+\d+\.?\s+/.test(l.trim()));
  if (bodyStartIdx === -1) bodyStartIdx = 0;
  let bodyMd = lines.slice(bodyStartIdx).join("\n");

  // Build a zip bundle with main.md + images
  const zip = new AdmZip();
  zip.addFile("main.md", Buffer.from(bodyMd, "utf8"));

  // Add figure images
  const figFiles = ["fig1.png", "fig2.png", "fig3.png", "fig4.png", "fig5.png"];
  for (const fig of figFiles) {
    const figPath = path.join(IMAGES_DIR, fig);
    if (fs.existsSync(figPath)) {
      zip.addFile(`images/${fig}`, fs.readFileSync(figPath));
      console.log(`  Added image: ${fig}`);
    } else {
      console.warn(`  WARNING: Missing image: ${figPath}`);
    }
  }

  // Rewrite image paths in body: ![...](/articles/e2026001/figN.png) → ![...](images/figN.png)
  bodyMd = bodyMd.replace(/\(\/articles\/e2026001\//g, "(images/");
  zip.updateFile("main.md", Buffer.from(bodyMd, "utf8"));

  const authorsDetailed = authors.map((name, i) => ({
    name,
    affiliation: affiliationsArr[i] || undefined,
  }));

  console.log(`\nCompiling LaTeX PDF for ${SLUG}...`);
  console.log(`  Title: ${title.slice(0, 70)}...`);
  console.log(`  Authors: ${authors.join(", ")}`);

  const result = await compileLatexLab({
    filename: "bundle.zip",
    content: zip.toBuffer(),
    meta: {
      title,
      authors: authors.join(", "),
      authorsDetailed,
      received: parseField("Received"),
      accepted: parseField("Accepted"),
      published: parseField("Publication Date"),
      articleType: "Research Article",
      keywords,
      abstract,
    },
    debug: false,
    imageFit: true,
    imageMaxHeight: "0.85",
  });

  if (!result.ok || !result.pdf) {
    console.error("\nLaTeX compilation FAILED!");
    console.error(result.userMessage || "Unknown error");
    // Print last 3000 chars of log
    if (result.logText) {
      console.error("\n--- Log tail ---");
      console.error(result.logText.slice(-3000));
    }
    process.exit(1);
  }

  // Set PDF metadata with pdf-lib
  const pdfDoc = await PDFDocument.load(result.pdf);
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(authors.join(", "));
  pdfDoc.setSubject(abstract.slice(0, 500));
  pdfDoc.setKeywords(keywords);
  pdfDoc.setCreator("American Impact Review");
  pdfDoc.setProducer("American Impact Review / Global Talent Foundation (LaTeX)");
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  // Force open on page 1
  const catalog = pdfDoc.catalog;
  catalog.delete(PDFName.of("OpenAction"));
  catalog.delete(PDFName.of("Dests"));
  const firstPageRef = pdfDoc.getPage(0).ref;
  const destArray = pdfDoc.context.obj([firstPageRef, PDFName.of("Fit")]);
  catalog.set(PDFName.of("OpenAction"), destArray);

  const finalPdf = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PATH, Buffer.from(finalPdf));

  console.log(`\nSuccess! ${pdfDoc.getPageCount()} pages, ${(finalPdf.byteLength / 1024).toFixed(1)} KB`);
  console.log(`  -> ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
