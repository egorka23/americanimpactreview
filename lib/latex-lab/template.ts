import fs from "fs";
import path from "path";
import { escapeLatex } from "./markdown";

export type AuthorDetail = {
  name: string;
  affiliation?: string;
  orcid?: string;
};

export type LatexMeta = {
  title?: string;
  authors?: string;
  authorsDetailed?: AuthorDetail[];
  doi?: string;
  received?: string;
  accepted?: string;
  published?: string;
  articleType?: string;
  keywords?: string[];
  lineNumbers?: boolean;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;
};

const TEMPLATE_PATH = path.join(process.cwd(), "templates/latex/air.tex");

/**
 * Build the authors block for the first page.
 * If detailed authors are available, show name + affiliation + ORCID (no email).
 */
function buildAuthorsBlock(meta: LatexMeta): string {
  if (meta.authorsDetailed && meta.authorsDetailed.length > 0) {
    // Deduplicate affiliations: same text → same number
    const uniqueAffils: string[] = [];
    const authorAffilNums: number[] = [];
    for (const a of meta.authorsDetailed) {
      const affil = (a.affiliation || "").trim();
      if (!affil) {
        authorAffilNums.push(0);
        continue;
      }
      let idx = uniqueAffils.indexOf(affil);
      if (idx === -1) {
        uniqueAffils.push(affil);
        idx = uniqueAffils.length - 1;
      }
      authorAffilNums.push(idx + 1); // 1-based
    }

    // Authors in one line with superscript affiliation numbers
    const nameLine = meta.authorsDetailed
      .map((a, i) => {
        const num = authorAffilNums[i];
        const sup = num > 0 ? `$^{${num}}$` : "";
        return `${escapeLatex(a.name)}${sup}`;
      })
      .join(", ");

    // Unique affiliations list
    const affiliationLines = uniqueAffils
      .map((affil, idx) => `$^{${idx + 1}}$\\,${escapeLatex(affil)}`)
      .join("\\\\");

    return [
      `\\noindent ${nameLine}\\par`,
      "\\vspace{0.2em}",
      `\\noindent{\\footnotesize ${affiliationLines}}\\par`,
      "\\vspace{0.1em}",
      "\\noindent{\\footnotesize * Corresponding author}\\par",
    ].join("\n");
  }
  const safe = escapeLatex(meta.authors || "Anonymous");
  return `{\\large ${safe}}\\par`;
}

/**
 * Build the PLOS ONE–style sidebar (left column on first page).
 */
function buildSidebar(meta: LatexMeta): string {
  const lines: string[] = [];
  const yearMatch = (meta.published || "").match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  const authorsList = (meta.authors || "Anonymous").split(",").map((a) => a.trim()).filter(Boolean);

  // OPEN ACCESS
  lines.push("\\textbf{\\textcolor{airnavy}{OPEN ACCESS}}\\par");
  lines.push("\\vspace{0.6em}");

  // Citation
  const citationAuthors = authorsList.length <= 3
    ? authorsList.map((a) => escapeLatex(a)).join(", ")
    : `${escapeLatex(authorsList[0])} et al.`;
  const safeTitle = escapeLatex(meta.title || "Untitled");

  lines.push("\\textbf{Citation:}\\\\");
  lines.push(`${citationAuthors} (${year}). ${safeTitle}. \\textit{Am. Impact Rev.}`);
  if (meta.doi) {
    const doiUrl = meta.doi.startsWith("http") ? meta.doi : `https://doi.org/${meta.doi}`;
    lines.push(`\\\\\\href{${doiUrl}}{${escapeLatex(meta.doi)}}`);
  }
  lines.push("\\par\\vspace{0.6em}");

  // Dates
  if (meta.received) {
    lines.push(`\\textbf{Received:} ${escapeLatex(meta.received)}\\\\`);
  }
  if (meta.accepted) {
    lines.push(`\\textbf{Accepted:} ${escapeLatex(meta.accepted)}\\\\`);
  }
  if (meta.published) {
    lines.push(`\\textbf{Published:} ${escapeLatex(meta.published)}\\\\`);
  }
  if (meta.received || meta.accepted || meta.published) {
    lines.push("\\vspace{0.6em}");
  }

  // Copyright
  const firstAuthor = authorsList[0] ? escapeLatex(authorsList[0]) : "Authors";
  lines.push("\\textbf{Copyright:}\\\\");
  lines.push(
    `\\copyright\\ ${year} ${firstAuthor}. This is an open access article distributed under the terms of the Creative Commons Attribution License (CC BY 4.0).`,
  );

  return lines.join("\n");
}

export function buildLatexDocument(body: string, meta: LatexMeta): string {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  const safeTitle = escapeLatex(meta.title || "Untitled Manuscript");
  const articleType = meta.articleType || "Research Article";

  const rawDoi = (meta.doi || "").trim();
  const footerUrl = rawDoi
    ? rawDoi.startsWith("http")
      ? rawDoi
      : `https://doi.org/${rawDoi}`
    : "https://americanimpactreview.com";
  const published = meta.published ? escapeLatex(meta.published) : "2026";

  // Year for running header
  const yearMatch = (meta.published || "").match(/\d{4}/);
  const headerYear = yearMatch ? yearMatch[0] : "2026";

  // Footer
  const footerParts = ["American Impact Review"];
  if (meta.volume) {
    let volIssue = `Vol.~${escapeLatex(meta.volume)}`;
    if (meta.issue) {
      volIssue += `, No.~${escapeLatex(meta.issue)}`;
    }
    footerParts.push(volIssue);
  }
  if (meta.pages) {
    footerParts.push(`pp.~${escapeLatex(meta.pages)}`);
  }
  footerParts.push(`\\href{${footerUrl}}{${footerUrl}}`);
  footerParts.push(published);
  footerParts.push("Page \\thepage");
  const footerText = footerParts.join(" \\;|\\; ");

  // Line numbering
  const lineNumbersCmd = meta.lineNumbers ? "\\linenumbers" : "";

  // Keywords
  let keywordsBlock = "";
  if (meta.keywords && meta.keywords.length > 0) {
    const safeKeywords = meta.keywords.map((kw) => escapeLatex(kw)).join(", ");
    keywordsBlock = `\\noindent\\textbf{Keywords:} ${safeKeywords}\\par\\vspace{0.5em}`;
  }

  // Abstract — for the right column of the first-page grid
  let abstractBlock = "";
  if (meta.abstract && meta.abstract.trim()) {
    const safeAbstract = escapeLatex(meta.abstract.trim());
    abstractBlock = [
      "\\begin{abstract}",
      safeAbstract,
      "\\end{abstract}",
    ].join("\n");
  }

  // Authors block
  const authorsBlock = buildAuthorsBlock(meta);

  // Sidebar
  const sidebar = buildSidebar(meta);

  // If abstract is shown in the sidebar column, strip it from the body to avoid duplication
  let cleanBody = body;
  if (meta.abstract && meta.abstract.trim()) {
    // The body contains literal \begin{abstract}...\end{abstract}
    const absStart = cleanBody.indexOf("\\begin{abstract}");
    const absEnd = cleanBody.indexOf("\\end{abstract}");
    if (absStart >= 0 && absEnd > absStart) {
      cleanBody = cleanBody.slice(0, absStart) + cleanBody.slice(absEnd + "\\end{abstract}".length);
    }
  }

  return template
    .replace("%%AIR_TITLE%%", safeTitle)
    .replace("%%AIR_AUTHORS_BLOCK%%", authorsBlock)
    .replace("%%AIR_FOOTER%%", footerText)
    .replace("%%AIR_YEAR%%", headerYear)
    .replace("%%AIR_BODY%%", cleanBody)
    .replace("%%AIR_ARTICLE_TYPE%%", escapeLatex(articleType))
    .replace("%%AIR_LINENUMBERS%%", lineNumbersCmd)
    .replace("%%AIR_KEYWORDS%%", keywordsBlock)
    .replace("%%AIR_ABSTRACT%%", abstractBlock)
    .replace("%%AIR_SIDEBAR%%", sidebar);
}
