import fs from "fs";
import path from "path";
import { escapeLatex } from "./markdown";

export type LatexMeta = {
  title?: string;
  authors?: string;
  doi?: string;
  received?: string;
  accepted?: string;
  published?: string;
};

const TEMPLATE_PATH = path.join(process.cwd(), "templates/latex/air.tex");

export function buildLatexDocument(body: string, meta: LatexMeta): string {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const safeTitle = escapeLatex(meta.title || "Untitled Manuscript");
  const safeAuthors = escapeLatex(meta.authors || "Anonymous");

  const rawDoi = (meta.doi || "").trim();
  const footerUrl = rawDoi
    ? rawDoi.startsWith("http")
      ? rawDoi
      : `https://doi.org/${rawDoi}`
    : "https://americanimpactreview.com";
  const published = meta.published ? escapeLatex(meta.published) : "2026";

  const metaLines = [
    meta.doi ? `DOI: ${escapeLatex(meta.doi)}` : "",
    meta.received ? `Received: ${escapeLatex(meta.received)}` : "",
    meta.accepted ? `Accepted: ${escapeLatex(meta.accepted)}` : "",
    meta.published ? `Published: ${escapeLatex(meta.published)}` : "",
  ].filter(Boolean);

  const metaText = metaLines.length ? metaLines.join(" \\quad ") : "";
  const footerText = `American Impact Review \\;|\\; \\href{${footerUrl}}{${footerUrl}} \\;|\\; ${published} \\;|\\; Page \\thepage`;

  return template
    .replace("{title}", safeTitle)
    .replace("{authors}", safeAuthors)
    .replace("{meta}", metaText)
    .replace("{footer}", footerText)
    .replace("{body}", body);
}
