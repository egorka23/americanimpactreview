/**
 * generate-pdfs.ts
 *
 * Build-time script that reads each article markdown file from /articles/,
 * parses metadata and body content, and generates a professional journal-style
 * PDF using pdf-lib with standard fonts (no external font files needed).
 *
 * Output: /public/articles/{slug}.pdf
 *
 * Run with: npx tsx scripts/generate-pdfs.ts
 */

import fs from "fs";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
} from "pdf-lib";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ARTICLES_DIR = path.join(process.cwd(), "articles");
const OUTPUT_DIR = path.join(process.cwd(), "public", "articles");

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT_BODY = 13;
const LINE_HEIGHT_SMALL = 11;
const PARAGRAPH_SPACING = 8;
const SECTION_SPACING = 18;

// Colors
const COLOR_BLACK = rgb(0, 0, 0);
const COLOR_DARK_GRAY = rgb(0.25, 0.25, 0.25);
const COLOR_MEDIUM_GRAY = rgb(0.4, 0.4, 0.4);
const COLOR_LIGHT_GRAY = rgb(0.6, 0.6, 0.6);
const COLOR_RULE = rgb(0.75, 0.75, 0.75);
const COLOR_JOURNAL = rgb(0.1, 0.2, 0.5);

// ---------------------------------------------------------------------------
// Article parsing (mirrors lib/articles.ts logic)
// ---------------------------------------------------------------------------

interface ParsedArticle {
  slug: string;
  title: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  receivedDate: string;
  acceptedDate: string;
  publicationDate: string;
  sections: { heading: string; paragraphs: string[] }[];
  references: string[];
}

function parseAuthors(lines: string[]): string[] {
  const authorLine = lines.find(
    (line) =>
      line.toLowerCase().includes("**authors:**") ||
      line.toLowerCase().includes("**author:**")
  );
  if (!authorLine) return [];
  const raw = authorLine
    .replace(/\*\*/g, "")
    .replace(/authors?:\s*/i, "")
    .trim();
  return raw
    .split(",")
    .map((name) =>
      name
        .replace(/[\u00B9\u00B2\u00B3\u2070-\u209F]/g, "")
        .replace(/\d+$/g, "")
        .trim()
    )
    .filter(Boolean);
}

function parseAffiliations(lines: string[]): string[] {
  const affiliations: string[] = [];
  let inAffiliations = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.toLowerCase().startsWith("**affiliations:**") ||
      trimmed.toLowerCase().startsWith("**affiliation:**")
    ) {
      inAffiliations = true;
      continue;
    }
    if (inAffiliations) {
      if (trimmed.startsWith("- ")) {
        const text = trimmed
          .replace(/^-\s*/, "")
          .replace(/^[\u00B9\u00B2\u00B3\u2070-\u209F]+\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim();
        if (text) affiliations.push(text);
      } else if (trimmed === "" || trimmed.startsWith("**")) {
        inAffiliations = false;
      }
    }
  }
  return affiliations;
}

function parseAbstract(lines: string[]): string {
  let inAbstract = false;
  const abstractLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s+abstract/i.test(trimmed)) {
      inAbstract = true;
      continue;
    }
    if (inAbstract) {
      if (
        trimmed.toLowerCase().startsWith("**keywords:**") ||
        trimmed.toLowerCase().startsWith("**keyword:**")
      ) {
        break;
      }
      if (trimmed.startsWith("## ") || trimmed === "---") break;
      abstractLines.push(line);
    }
  }
  return abstractLines.join("\n").trim();
}

function parseKeywords(lines: string[]): string[] {
  const keywordLine = lines.find(
    (line) =>
      line.toLowerCase().includes("**keywords:**") ||
      line.toLowerCase().includes("**keyword:**")
  );
  if (!keywordLine) return [];
  const raw = keywordLine
    .replace(/\*\*/g, "")
    .replace(/keywords?:\s*/i, "")
    .trim();
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function parseDateField(lines: string[], label: string): string {
  const line = lines.find((l) =>
    l.toLowerCase().includes(`**${label.toLowerCase()}:**`)
  );
  if (!line) return "";
  return line
    .replace(/\*\*/g, "")
    .replace(new RegExp(`${label}:\\s*`, "i"), "")
    .trim();
}

function parseSectionsAndReferences(lines: string[]): {
  sections: { heading: string; paragraphs: string[] }[];
  references: string[];
} {
  const sections: { heading: string; paragraphs: string[] }[] = [];
  const references: string[] = [];

  let currentSection: { heading: string; paragraphs: string[] } | null = null;
  let inReferences = false;
  let currentParagraph = "";

  // Find the first numbered section heading
  let bodyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+\d+\.?\s+/.test(lines[i].trim())) {
      bodyStart = i;
      break;
    }
  }
  if (bodyStart === -1) return { sections, references };

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // References section
    if (/^#{1,3}\s+references/i.test(trimmed)) {
      // Flush current paragraph
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      if (currentSection) sections.push(currentSection);
      currentSection = null;
      currentParagraph = "";
      inReferences = true;
      continue;
    }

    if (inReferences) {
      if (/^\d+\.\s+/.test(trimmed)) {
        references.push(trimmed);
      }
      continue;
    }

    // Section heading (## N. Title or ### N.N. Title)
    const headingMatch = trimmed.match(/^#{1,3}\s+(.*)/);
    if (headingMatch) {
      // Flush current paragraph
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      if (currentSection) sections.push(currentSection);
      currentParagraph = "";
      currentSection = {
        heading: headingMatch[1].trim(),
        paragraphs: [],
      };
      continue;
    }

    // Empty line: end of paragraph
    if (trimmed === "") {
      if (currentParagraph.trim() && currentSection) {
        currentSection.paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = "";
      continue;
    }

    // Regular text line
    if (currentSection) {
      currentParagraph += (currentParagraph ? " " : "") + trimmed;
    }
  }

  // Flush remaining
  if (currentParagraph.trim() && currentSection) {
    currentSection.paragraphs.push(currentParagraph.trim());
  }
  if (currentSection) sections.push(currentSection);

  return { sections, references };
}

function parseArticleFile(filePath: string): ParsedArticle {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const titleLine = lines.find((line) => line.trim().startsWith("# "));
  const title = titleLine
    ? titleLine.replace(/^#\s*/, "").trim()
    : "Untitled Article";

  const { sections, references } = parseSectionsAndReferences(lines);

  return {
    slug: path.basename(filePath, ".md"),
    title,
    authors: parseAuthors(lines),
    affiliations: parseAffiliations(lines),
    abstract: parseAbstract(lines),
    keywords: parseKeywords(lines),
    receivedDate: parseDateField(lines, "Received"),
    acceptedDate: parseDateField(lines, "Accepted"),
    publicationDate: parseDateField(lines, "Publication Date"),
    sections,
    references,
  };
}

// ---------------------------------------------------------------------------
// PDF text utilities
// ---------------------------------------------------------------------------

/**
 * Replace Unicode characters that WinAnsi (Latin-1) cannot encode
 * with their closest ASCII equivalents. pdf-lib StandardFonts only
 * support WinAnsi encoding.
 */
function sanitizeForWinAnsi(text: string): string {
  return text
    // Superscript digits
    .replace(/\u00B9/g, "1")
    .replace(/\u00B2/g, "2")
    .replace(/\u00B3/g, "3")
    .replace(/\u2070/g, "0")
    .replace(/\u2074/g, "4")
    .replace(/\u2075/g, "5")
    .replace(/\u2076/g, "6")
    .replace(/\u2077/g, "7")
    .replace(/\u2078/g, "8")
    .replace(/\u2079/g, "9")
    // Math symbols
    .replace(/\u2248/g, "~=")    // approximately equal
    .replace(/\u2265/g, ">=")    // greater than or equal
    .replace(/\u2264/g, "<=")    // less than or equal
    .replace(/\u2260/g, "!=")    // not equal
    .replace(/\u00D7/g, "x")    // multiplication sign
    .replace(/\u2013/g, "-")    // en dash
    .replace(/\u2014/g, "--")   // em dash
    .replace(/\u2018/g, "'")    // left single quote
    .replace(/\u2019/g, "'")    // right single quote
    .replace(/\u201C/g, '"')    // left double quote
    .replace(/\u201D/g, '"')    // right double quote
    .replace(/\u2026/g, "...")  // ellipsis
    .replace(/\u2022/g, "-")   // bullet
    // Accented chars that WinAnsi DOES support - keep these as-is:
    // e-acute, e-grave, a-grave, etc. are in WinAnsi (0x80-0xFF)
    // Remove any remaining non-Latin1 chars that would cause errors
    .replace(/[^\x00-\xFF]/g, "?");
}

/** Strip markdown bold/italic/links but keep the text */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/** Detect bold segments: returns alternating [{text, bold}] */
interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

function parseInlineFormatting(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Pattern: **bold**, *italic*
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: stripMarkdown(text.slice(lastIndex, match.index)),
        bold: false,
        italic: false,
      });
    }
    if (match[1] !== undefined) {
      // bold
      segments.push({ text: match[1], bold: true, italic: false });
    } else if (match[2] !== undefined) {
      // italic
      segments.push({ text: match[2], bold: false, italic: true });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({
      text: stripMarkdown(text.slice(lastIndex)),
      bold: false,
      italic: false,
    });
  }
  if (segments.length === 0) {
    segments.push({ text: stripMarkdown(text), bold: false, italic: false });
  }
  return segments;
}

/**
 * Word-wrap text to fit within maxWidth, returning an array of lines.
 * Uses a single font for simplicity.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = sanitizeForWinAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Draw text with inline bold/italic formatting using word wrapping.
 * Returns the new Y position.
 */
function drawFormattedParagraph(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
  },
  color: typeof COLOR_BLACK,
  addPageFn: () => PDFPage
): { page: PDFPage; y: number } {
  // For complex formatting, we wrap using the regular font as sizing reference,
  // then draw segments per line with proper fonts.
  const plainText = stripMarkdown(text);
  const wrappedLines = wrapText(plainText, fonts.regular, fontSize, maxWidth);

  let currentPage = page;
  let currentY = y;

  for (const line of wrappedLines) {
    if (currentY < MARGIN_BOTTOM + 20) {
      currentPage = addPageFn();
      currentY = PAGE_HEIGHT - MARGIN_TOP;
    }
    currentPage.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font: fonts.regular,
      color,
    });
    currentY -= lineHeight;
  }

  return { page: currentPage, y: currentY };
}

/**
 * Draw a simple text block (no inline formatting) with word wrapping.
 */
function drawTextBlock(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  font: PDFFont,
  color: typeof COLOR_BLACK,
  addPageFn: () => PDFPage
): { page: PDFPage; y: number } {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let currentPage = page;
  let currentY = y;

  for (const line of lines) {
    if (currentY < MARGIN_BOTTOM + 20) {
      currentPage = addPageFn();
      currentY = PAGE_HEIGHT - MARGIN_TOP;
    }
    currentPage.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return { page: currentPage, y: currentY };
}

/**
 * Draw a horizontal rule across the content width.
 */
function drawRule(
  page: PDFPage,
  y: number,
  color: typeof COLOR_RULE = COLOR_RULE,
  thickness: number = 0.5
): void {
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
    thickness,
    color,
  });
}

// ---------------------------------------------------------------------------
// Page numbering helper
// ---------------------------------------------------------------------------

let pageCount = 0;

function drawPageFooter(
  page: PDFPage,
  pageNum: number,
  totalPages: number,
  slug: string,
  fontRegular: PDFFont,
  fontItalic: PDFFont
): void {
  const footerY = MARGIN_BOTTOM - 30;

  // Left: journal name
  page.drawText("American Impact Review", {
    x: MARGIN_LEFT,
    y: footerY,
    size: 7.5,
    font: fontItalic,
    color: COLOR_LIGHT_GRAY,
  });

  // Center: page number
  const pageText = `${pageNum}`;
  const pageTextWidth = fontRegular.widthOfTextAtSize(pageText, 8);
  page.drawText(pageText, {
    x: (PAGE_WIDTH - pageTextWidth) / 2,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: COLOR_MEDIUM_GRAY,
  });

  // Right: article ID
  page.drawText(slug.toUpperCase(), {
    x: PAGE_WIDTH - MARGIN_RIGHT - fontRegular.widthOfTextAtSize(slug.toUpperCase(), 7.5),
    y: footerY,
    size: 7.5,
    font: fontRegular,
    color: COLOR_LIGHT_GRAY,
  });

  // Thin rule above footer
  page.drawLine({
    start: { x: MARGIN_LEFT, y: footerY + 12 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: footerY + 12 },
    thickness: 0.3,
    color: COLOR_RULE,
  });
}

// ---------------------------------------------------------------------------
// Main PDF generation
// ---------------------------------------------------------------------------

async function generatePdf(article: ParsedArticle): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(article.title);
  pdfDoc.setAuthor(article.authors.join(", "));
  pdfDoc.setSubject(article.abstract.slice(0, 200));
  pdfDoc.setKeywords(article.keywords);
  pdfDoc.setProducer("American Impact Review / pdf-lib");
  pdfDoc.setCreator("American Impact Review");

  // Embed standard fonts
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalic = await pdfDoc.embedFont(
    StandardFonts.TimesRomanBoldItalic
  );
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaItalic = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique
  );

  const fonts = {
    regular: timesRoman,
    bold: timesBold,
    italic: timesItalic,
  };

  const pages: PDFPage[] = [];

  function addPage(): PDFPage {
    const p = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(p);
    return p;
  }

  let page = addPage();
  let y = PAGE_HEIGHT - MARGIN_TOP;

  // -----------------------------------------------------------------------
  // Title page header: Journal name
  // -----------------------------------------------------------------------

  const journalName = "American Impact Review";
  const journalNameWidth = helveticaBold.widthOfTextAtSize(journalName, 11);
  page.drawText(journalName, {
    x: (PAGE_WIDTH - journalNameWidth) / 2,
    y,
    size: 11,
    font: helveticaBold,
    color: COLOR_JOURNAL,
  });
  y -= 14;

  // Subtitle line
  const subtitle = "Volume 1, Issue 1 (2026)  |  Published by Global Talent Foundation 501(c)(3)";
  const subtitleWidth = helvetica.widthOfTextAtSize(subtitle, 7);
  page.drawText(subtitle, {
    x: (PAGE_WIDTH - subtitleWidth) / 2,
    y,
    size: 7,
    font: helvetica,
    color: COLOR_MEDIUM_GRAY,
  });
  y -= 10;

  // Rule below header
  drawRule(page, y, COLOR_JOURNAL, 1.2);
  y -= 20;

  // -----------------------------------------------------------------------
  // Article title
  // -----------------------------------------------------------------------

  const titleFontSize = 16;
  const titleLineHeight = 20;
  const titleLines = wrapText(
    article.title,
    timesBold,
    titleFontSize,
    CONTENT_WIDTH
  );
  for (const line of titleLines) {
    page.drawText(line, {
      x: MARGIN_LEFT,
      y,
      size: titleFontSize,
      font: timesBold,
      color: COLOR_BLACK,
    });
    y -= titleLineHeight;
  }
  y -= 6;

  // -----------------------------------------------------------------------
  // Authors
  // -----------------------------------------------------------------------

  const authorsText = article.authors.join(", ");
  const authorsLines = wrapText(
    authorsText,
    timesItalic,
    10.5,
    CONTENT_WIDTH
  );
  for (const line of authorsLines) {
    page.drawText(line, {
      x: MARGIN_LEFT,
      y,
      size: 10.5,
      font: timesItalic,
      color: COLOR_DARK_GRAY,
    });
    y -= 13;
  }
  y -= 2;

  // -----------------------------------------------------------------------
  // Affiliations
  // -----------------------------------------------------------------------

  for (const affiliation of article.affiliations) {
    const affLines = wrapText(affiliation, timesRoman, 8.5, CONTENT_WIDTH);
    for (const line of affLines) {
      if (y < MARGIN_BOTTOM + 20) {
        page = addPage();
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
      page.drawText(line, {
        x: MARGIN_LEFT,
        y,
        size: 8.5,
        font: timesRoman,
        color: COLOR_MEDIUM_GRAY,
      });
      y -= LINE_HEIGHT_SMALL;
    }
  }
  y -= 6;

  // -----------------------------------------------------------------------
  // Dates line
  // -----------------------------------------------------------------------

  const datesLine = [
    article.receivedDate ? `Received: ${article.receivedDate}` : "",
    article.acceptedDate ? `Accepted: ${article.acceptedDate}` : "",
    article.publicationDate
      ? `Published: ${article.publicationDate}`
      : "",
  ]
    .filter(Boolean)
    .join("   |   ");

  if (datesLine) {
    page.drawText(datesLine, {
      x: MARGIN_LEFT,
      y,
      size: 8,
      font: helvetica,
      color: COLOR_MEDIUM_GRAY,
    });
    y -= 14;
  }

  // Rule before abstract
  drawRule(page, y, COLOR_RULE, 0.5);
  y -= 16;

  // -----------------------------------------------------------------------
  // Abstract
  // -----------------------------------------------------------------------

  if (article.abstract) {
    // "Abstract" heading
    page.drawText("Abstract", {
      x: MARGIN_LEFT,
      y,
      size: 11,
      font: timesBold,
      color: COLOR_BLACK,
    });
    y -= 14;

    const result = drawTextBlock(
      page,
      article.abstract,
      MARGIN_LEFT,
      y,
      CONTENT_WIDTH,
      9.5,
      12,
      timesItalic,
      COLOR_DARK_GRAY,
      addPage
    );
    page = result.page;
    y = result.y - PARAGRAPH_SPACING;
  }

  // -----------------------------------------------------------------------
  // Keywords
  // -----------------------------------------------------------------------

  if (article.keywords.length > 0) {
    const kwLabel = "Keywords: ";
    const kwText = article.keywords.join(", ");
    const kwFull = kwLabel + kwText;

    // Draw "Keywords:" in bold, rest in regular
    if (y < MARGIN_BOTTOM + 20) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    const kwLines = wrapText(kwFull, timesRoman, 9, CONTENT_WIDTH);
    for (let i = 0; i < kwLines.length; i++) {
      if (y < MARGIN_BOTTOM + 20) {
        page = addPage();
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
      // First line: render "Keywords: " part in bold if it fits
      if (i === 0) {
        const boldWidth = timesBold.widthOfTextAtSize(kwLabel, 9);
        page.drawText(kwLabel, {
          x: MARGIN_LEFT,
          y,
          size: 9,
          font: timesBold,
          color: COLOR_BLACK,
        });
        // Remaining text of first line after the label
        const restOfLine = kwLines[0].slice(kwLabel.length);
        if (restOfLine) {
          page.drawText(restOfLine, {
            x: MARGIN_LEFT + boldWidth,
            y,
            size: 9,
            font: timesRoman,
            color: COLOR_DARK_GRAY,
          });
        }
      } else {
        page.drawText(kwLines[i], {
          x: MARGIN_LEFT,
          y,
          size: 9,
          font: timesRoman,
          color: COLOR_DARK_GRAY,
        });
      }
      y -= LINE_HEIGHT_SMALL;
    }
    y -= 4;
  }

  // Rule after abstract/keywords block
  drawRule(page, y, COLOR_RULE, 0.5);
  y -= SECTION_SPACING;

  // -----------------------------------------------------------------------
  // Body sections
  // -----------------------------------------------------------------------

  for (const section of article.sections) {
    if (y < MARGIN_BOTTOM + 40) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    // Determine heading level from the number of dots
    const isSubsection = /^\d+\.\d+/.test(section.heading);
    const headingFont = isSubsection ? timesBold : timesBold;
    const headingSize = isSubsection ? 10.5 : 12;
    const headingSpaceBefore = isSubsection ? 10 : SECTION_SPACING;

    y -= headingSpaceBefore;
    if (y < MARGIN_BOTTOM + 30) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    // Draw heading
    const headingText = stripMarkdown(section.heading);
    const headingLines = wrapText(
      headingText,
      headingFont,
      headingSize,
      CONTENT_WIDTH
    );
    for (const hl of headingLines) {
      if (y < MARGIN_BOTTOM + 20) {
        page = addPage();
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
      page.drawText(hl, {
        x: MARGIN_LEFT,
        y,
        size: headingSize,
        font: headingFont,
        color: COLOR_BLACK,
      });
      y -= headingSize + 3;
    }
    y -= 4;

    // Draw paragraphs
    for (const para of section.paragraphs) {
      if (y < MARGIN_BOTTOM + 20) {
        page = addPage();
        y = PAGE_HEIGHT - MARGIN_TOP;
      }

      // Check if paragraph looks like a list item
      const isListItem =
        /^[-*+]\s+/.test(para) || /^\d+\.\s+/.test(para);
      // Check if it looks like a table header or figure caption
      const isSpecial =
        para.startsWith("[Formula:") ||
        para.startsWith("Figure ") ||
        para.startsWith("*Figure ") ||
        para.startsWith("**Figure ") ||
        para.startsWith("**Table ") ||
        para.startsWith("**Scenario ") ||
        para.startsWith("**Example.");

      const cleanPara = stripMarkdown(para);
      const paraFont = isSpecial ? timesItalic : timesRoman;
      const paraSize = isSpecial ? 9 : 10;
      const paraLineHeight = isSpecial ? 11.5 : LINE_HEIGHT_BODY;
      const indent = isListItem ? 18 : 0;

      const result = drawTextBlock(
        page,
        cleanPara,
        MARGIN_LEFT + indent,
        y,
        CONTENT_WIDTH - indent,
        paraSize,
        paraLineHeight,
        paraFont,
        COLOR_BLACK,
        addPage
      );
      page = result.page;
      y = result.y - PARAGRAPH_SPACING;
    }
  }

  // -----------------------------------------------------------------------
  // References
  // -----------------------------------------------------------------------

  if (article.references.length > 0) {
    y -= SECTION_SPACING;
    if (y < MARGIN_BOTTOM + 50) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    // Rule before references
    drawRule(page, y + 8, COLOR_RULE, 0.5);
    y -= 2;

    page.drawText("References", {
      x: MARGIN_LEFT,
      y,
      size: 12,
      font: timesBold,
      color: COLOR_BLACK,
    });
    y -= 16;

    for (const ref of article.references) {
      if (y < MARGIN_BOTTOM + 20) {
        page = addPage();
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
      const cleanRef = stripMarkdown(ref);
      const result = drawTextBlock(
        page,
        cleanRef,
        MARGIN_LEFT,
        y,
        CONTENT_WIDTH,
        8.5,
        LINE_HEIGHT_SMALL,
        timesRoman,
        COLOR_DARK_GRAY,
        addPage
      );
      page = result.page;
      y = result.y - 4;
    }
  }

  // -----------------------------------------------------------------------
  // Final footer: publisher info
  // -----------------------------------------------------------------------

  y -= SECTION_SPACING;
  if (y < MARGIN_BOTTOM + 40) {
    page = addPage();
    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  drawRule(page, y, COLOR_RULE, 0.5);
  y -= 14;

  const footerLines = [
    `Published by Global Talent Foundation, a 501(c)(3) nonprofit organization.`,
    `Article ID: ${article.slug.toUpperCase()}  |  American Impact Review, Vol. 1, Issue 1, 2026.`,
    `Open Access: This article is distributed under the terms of open access.`,
  ];

  for (const fl of footerLines) {
    if (y < MARGIN_BOTTOM + 10) {
      page = addPage();
      y = PAGE_HEIGHT - MARGIN_TOP;
    }
    const flWidth = helvetica.widthOfTextAtSize(fl, 7.5);
    page.drawText(fl, {
      x: (PAGE_WIDTH - flWidth) / 2,
      y,
      size: 7.5,
      font: helvetica,
      color: COLOR_MEDIUM_GRAY,
    });
    y -= 10;
  }

  // -----------------------------------------------------------------------
  // Add page numbers to all pages
  // -----------------------------------------------------------------------

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    drawPageFooter(pages[i], i + 1, totalPages, article.slug, helvetica, helveticaItalic);
  }

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("Generating article PDFs...\n");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const mdFiles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();

  if (mdFiles.length === 0) {
    console.log("No article .md files found in", ARTICLES_DIR);
    return;
  }

  for (const file of mdFiles) {
    const filePath = path.join(ARTICLES_DIR, file);
    const article = parseArticleFile(filePath);
    console.log(`  Processing: ${article.slug} - "${article.title.slice(0, 60)}..."`);

    const pdfBytes = await generatePdf(article);
    const outPath = path.join(OUTPUT_DIR, `${article.slug}.pdf`);
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`    -> ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nDone! Generated ${mdFiles.length} PDF(s).`);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
