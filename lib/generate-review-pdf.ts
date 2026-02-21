/**
 * Server-side review copy PDF generator.
 * Uses mammoth (docx → text) + pdf-lib (PDF creation).
 * No Puppeteer/Chrome — works on Vercel Serverless.
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import mammoth from "mammoth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReviewCopyOptions = {
  /** Raw docx buffer from author upload */
  docxBuffer?: Buffer;
  /** Or plain text / markdown content */
  textContent?: string;
  manuscriptId: string;
  title: string;
  authors: string;
  articleType: string;
  keywords: string;
  category: string;
  abstract: string;
  reviewerName: string;
  deadline: string;
  receivedDate: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_W = 612; // Letter width in points
const PAGE_H = 792; // Letter height in points
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 15;
const PARA_SPACING = 10;

const NAVY = rgb(0.039, 0.086, 0.157); // #0a1628
const RED = rgb(0.71, 0.26, 0.16);     // #b5432a
const GRAY = rgb(0.4, 0.45, 0.51);     // #677382
const LIGHT_GRAY = rgb(0.78, 0.8, 0.83);
const BLACK = rgb(0, 0, 0);
const BG_LIGHT = rgb(0.973, 0.98, 0.988); // #f8fafc

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateStr(dateStr: string): string {
  if (!dateStr || dateStr === "—") return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Sanitize text for WinAnsi encoding (standard PDF fonts).
 * Replaces non-encodable characters with ASCII approximations.
 */
function sanitize(text: string): string {
  // Common Cyrillic → Latin transliteration for manuscript display
  const cyMap: Record<string, string> = {
    "А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ё":"E","Ж":"Zh","З":"Z","И":"I","Й":"Y",
    "К":"K","Л":"L","М":"M","Н":"N","О":"O","П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F",
    "Х":"Kh","Ц":"Ts","Ч":"Ch","Ш":"Sh","Щ":"Shch","Ъ":"","Ы":"Y","Ь":"","Э":"E","Ю":"Yu","Я":"Ya",
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y",
    "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
    "х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
  };
  let result = "";
  for (const ch of text) {
    if (cyMap[ch] !== undefined) {
      result += cyMap[ch];
    } else {
      // Map common Unicode to WinAnsi equivalents
      const uniMap: Record<string, string> = {
        "\u2014": "-",      // em dash → hyphen (safe)
        "\u2013": "-",      // en dash → hyphen (safe)
        "\u2018": "'",      // left single quote
        "\u2019": "'",      // right single quote
        "\u201C": '"',      // left double quote
        "\u201D": '"',      // right double quote
        "\u2026": "...",    // ellipsis
        "\u00B7": "\u00B7", // middle dot (WinAnsi)
        "\u2022": "-",      // bullet
        "\u00A0": " ",      // nbsp
      };
      if (uniMap[ch] !== undefined) {
        result += uniMap[ch];
      } else {
        const code = ch.charCodeAt(0);
        // Keep printable ASCII + Latin-1 Supplement (WinAnsi-safe)
        if (code <= 255 || ch === "\n" || ch === "\t") {
          result += ch;
        } else {
          result += " ";
        }
      }
    }
  }
  return result;
}

/** Strip markdown formatting from text (for .md article sources) */
function stripMarkdown(text: string): string {
  return text
    // Remove YAML frontmatter
    .replace(/^---[\s\S]*?---\n*/m, "")
    // Remove markdown headings → keep text
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/___(.+?)___/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links → keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown images → [alt text]
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove HTML tags (from md files with embedded HTML)
    .replace(/<[^>]+>/g, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Word-wrap text to fit within maxWidth, returns array of lines */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

/** Draw text with word wrapping, returns Y position after text */
function drawWrappedText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  fontSize: number,
  x: number,
  startY: number,
  maxWidth: number,
  color = BLACK,
  lineHeight = LINE_HEIGHT,
): number {
  const lines = wrapText(text, font, fontSize, maxWidth);
  let y = startY;
  for (const line of lines) {
    if (y < MARGIN_BOTTOM + 20) return y; // overflow protection
    if (line === "") {
      y -= lineHeight * 0.5;
      continue;
    }
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

// ─── Cover Page ──────────────────────────────────────────────────────────────

function drawCoverPage(page: PDFPage, opts: ReviewCopyOptions, fonts: {
  serif: PDFFont;
  serifBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
}) {
  const { serif, serifBold, sans, sansBold } = fonts;
  let y = PAGE_H - 60;

  // Journal name
  const journalName = "AMERICAN IMPACT REVIEW";
  const jnWidth = sansBold.widthOfTextAtSize(journalName, 16);
  page.drawText(journalName, { x: (PAGE_W - jnWidth) / 2, y, size: 16, font: sansBold, color: NAVY });
  y -= 16;

  const sub = "A Peer-Reviewed Multidisciplinary Journal";
  const subWidth = sans.widthOfTextAtSize(sub, 8);
  page.drawText(sub, { x: (PAGE_W - subWidth) / 2, y, size: 8, font: sans, color: BLACK });
  y -= 20;

  // Divider
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_W - MARGIN_RIGHT, y },
    thickness: 2,
    color: NAVY,
  });
  y -= 30;

  // Title
  const titleLines = wrapText(opts.title, serifBold, 15, CONTENT_W);
  for (const line of titleLines) {
    const w = serifBold.widthOfTextAtSize(line, 15);
    page.drawText(line, { x: (PAGE_W - w) / 2, y, size: 15, font: serifBold, color: NAVY });
    y -= 20;
  }
  y -= 4;

  // "— Manuscript Draft —"
  const draft = "-- Manuscript Draft --";
  const dw = sans.widthOfTextAtSize(draft, 9);
  page.drawText(draft, { x: (PAGE_W - dw) / 2, y, size: 9, font: sans, color: BLACK });
  y -= 28;

  // Meta table
  const drawMetaRow = (label: string, value: string) => {
    // Draw cell backgrounds
    page.drawRectangle({ x: MARGIN_LEFT, y: y - 4, width: 160, height: 22, color: BG_LIGHT });
    page.drawRectangle({ x: MARGIN_LEFT + 160, y: y - 4, width: CONTENT_W - 160, height: 22, color: rgb(1, 1, 1) });
    // Borders
    page.drawLine({ start: { x: MARGIN_LEFT, y: y + 18 }, end: { x: MARGIN_LEFT + CONTENT_W, y: y + 18 }, thickness: 0.5, color: LIGHT_GRAY });
    page.drawLine({ start: { x: MARGIN_LEFT, y: y - 4 }, end: { x: MARGIN_LEFT + CONTENT_W, y: y - 4 }, thickness: 0.5, color: LIGHT_GRAY });
    page.drawLine({ start: { x: MARGIN_LEFT + 160, y: y + 18 }, end: { x: MARGIN_LEFT + 160, y: y - 4 }, thickness: 0.5, color: LIGHT_GRAY });

    page.drawText(label, { x: MARGIN_LEFT + 8, y: y + 3, size: 10, font: sansBold, color: BLACK });

    // Fit value: shrink font size if needed, only truncate as last resort
    let val = value;
    const maxValW = CONTENT_W - 170 - 12;
    let valSize = 10;
    while (sans.widthOfTextAtSize(val, valSize) > maxValW && valSize > 7) {
      valSize -= 0.5;
    }
    if (sans.widthOfTextAtSize(val, valSize) > maxValW) {
      while (sans.widthOfTextAtSize(val, valSize) > maxValW && val.length > 10) {
        val = val.slice(0, -4) + "...";
      }
    }
    page.drawText(val, { x: MARGIN_LEFT + 168, y: y + 3, size: valSize, font: sans, color: BLACK });
    y -= 22;
  };

  drawMetaRow("Manuscript Number", opts.manuscriptId);
  drawMetaRow("Article Type", opts.articleType);
  drawMetaRow("Received", formatDateStr(opts.receivedDate));
  drawMetaRow("Subject Area", opts.category);
  drawMetaRow("Keywords", opts.keywords);
  drawMetaRow("Authors", opts.authors);

  // Bottom border
  page.drawLine({ start: { x: MARGIN_LEFT, y: y + 18 }, end: { x: MARGIN_LEFT + CONTENT_W, y: y + 18 }, thickness: 0.5, color: LIGHT_GRAY });

  // Abstract if fits
  if (opts.abstract && y > 260) {
    y -= 6;
    // Abstract label row
    page.drawRectangle({ x: MARGIN_LEFT, y: y - 4, width: 160, height: 22, color: BG_LIGHT });
    page.drawLine({ start: { x: MARGIN_LEFT, y: y - 4 }, end: { x: MARGIN_LEFT + CONTENT_W, y: y - 4 }, thickness: 0.5, color: LIGHT_GRAY });
    page.drawLine({ start: { x: MARGIN_LEFT + 160, y: y + 18 }, end: { x: MARGIN_LEFT + 160, y: y - 4 }, thickness: 0.5, color: LIGHT_GRAY });
    page.drawText("Abstract", { x: MARGIN_LEFT + 8, y: y + 3, size: 10, font: sansBold, color: BLACK });
    y -= 22;

    // Abstract text block
    const absLines = wrapText(opts.abstract, serif, 9.5, CONTENT_W - 16);
    const absHeight = absLines.length * 13 + 12;
    page.drawRectangle({ x: MARGIN_LEFT, y: y - absHeight + 18, width: CONTENT_W, height: absHeight, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: MARGIN_LEFT, y: y - absHeight + 18 }, end: { x: MARGIN_LEFT + CONTENT_W, y: y - absHeight + 18 }, thickness: 0.5, color: LIGHT_GRAY });

    let absY = y + 4;
    for (const line of absLines) {
      if (absY < 100) break;
      page.drawText(line, { x: MARGIN_LEFT + 8, y: absY, size: 9.5, font: serif, color: BLACK });
      absY -= 13;
    }
    y = absY - 10;
  }

  y -= 20;

  // CONFIDENTIAL line
  const confText = "CONFIDENTIAL - FOR PEER REVIEW ONLY";
  const confW = sansBold.widthOfTextAtSize(confText, 9);
  page.drawText(confText, { x: (PAGE_W - confW) / 2, y, size: 9, font: sansBold, color: RED });
  y -= 24;

  // Review Assignment box
  page.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 100,
    width: CONTENT_W,
    height: 100,
    borderColor: LIGHT_GRAY,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  let boxY = y - 10;
  page.drawText("REVIEW ASSIGNMENT", { x: MARGIN_LEFT + 14, y: boxY, size: 8, font: sansBold, color: BLACK });
  boxY -= 20;
  page.drawText("Reviewer:", { x: MARGIN_LEFT + 14, y: boxY, size: 10, font: sansBold, color: BLACK });
  page.drawText(opts.reviewerName, { x: MARGIN_LEFT + 130, y: boxY, size: 10, font: sans, color: BLACK });
  boxY -= 18;
  page.drawText("Deadline:", { x: MARGIN_LEFT + 14, y: boxY, size: 10, font: sansBold, color: BLACK });
  page.drawText(formatDateStr(opts.deadline), { x: MARGIN_LEFT + 130, y: boxY, size: 10, font: sans, color: BLACK });
  boxY -= 22;
  page.drawText("This document is confidential. Do not distribute, cite, or upload to any AI tools.", {
    x: MARGIN_LEFT + 14, y: boxY, size: 8, font: sans, color: GRAY,
  });

  // Footer
  const footerText = "American Impact Review | 501(c)(3) nonprofit (Global Talent Foundation) | CONFIDENTIAL";
  const footerW = sans.widthOfTextAtSize(footerText, 7.5);
  page.drawLine({
    start: { x: MARGIN_LEFT, y: 60 },
    end: { x: PAGE_W - MARGIN_RIGHT, y: 60 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
  page.drawText(footerText, { x: (PAGE_W - footerW) / 2, y: 48, size: 7.5, font: sans, color: GRAY });
}

// ─── Watermark ───────────────────────────────────────────────────────────────

function drawWatermark(page: PDFPage, font: PDFFont) {
  const text = "CONFIDENTIAL - PEER REVIEW COPY";
  // At -45deg rotation, text goes diagonally from start point toward bottom-right.
  // To center on page: start at left margin, well above center so diagonal crosses middle.
  page.drawText(text, {
    x: 40,
    y: PAGE_H / 2 + 180,
    size: 42,
    font,
    color: rgb(0.78, 0.12, 0.12),
    opacity: 0.35,
    rotate: degrees(-45),
  });
}

// ─── Header / Footer ─────────────────────────────────────────────────────────

function drawHeaderFooter(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  msId: string,
  pageNum: number,
  totalPages: number,
) {
  // Header
  page.drawText(msId, { x: MARGIN_LEFT, y: PAGE_H - 42, size: 8, font, color: GRAY });
  const confLabel = "CONFIDENTIAL";
  const cw = fontBold.widthOfTextAtSize(confLabel, 8);
  page.drawText(confLabel, { x: PAGE_W - MARGIN_RIGHT - cw, y: PAGE_H - 42, size: 8, font: fontBold, color: RED });
  page.drawLine({
    start: { x: MARGIN_LEFT, y: PAGE_H - 48 },
    end: { x: PAGE_W - MARGIN_RIGHT, y: PAGE_H - 48 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });

  // Footer
  const ft = `American Impact Review  |  For Peer Review Only  |  Page ${pageNum} of ${totalPages}`;
  const ftw = font.widthOfTextAtSize(ft, 8);
  page.drawLine({
    start: { x: MARGIN_LEFT, y: MARGIN_BOTTOM - 10 },
    end: { x: PAGE_W - MARGIN_RIGHT, y: MARGIN_BOTTOM - 10 },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
  page.drawText(ft, { x: (PAGE_W - ftw) / 2, y: MARGIN_BOTTOM - 24, size: 8, font, color: GRAY });
}

// ─── Extract content from docx ───────────────────────────────────────────────

type DocxTable = {
  headers: string[];
  rows: string[][];
};

type DocxContent = {
  text: string;
  images: { data: Buffer; contentType: string }[];
  tables: DocxTable[];
};

async function extractContentFromDocx(buffer: Buffer): Promise<DocxContent> {
  const images: { data: Buffer; contentType: string }[] = [];
  const tables: DocxTable[] = [];

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const b64 = await image.read("base64");
        images.push({
          data: Buffer.from(b64, "base64"),
          contentType: image.contentType,
        });
        // Return a placeholder that drawBodyPages will detect
        return { src: `__IMAGE_${images.length - 1}__` };
      }),
    },
  );

  // Convert HTML to structured text, preserving images, tables, and block structure
  let html = result.value;

  // 1. Preserve image placeholders BEFORE stripping tags
  html = html.replace(/<img[^>]*src="(__IMAGE_\d+__)"[^>]*\/?>/gi, "\n$1\n");

  // 2. Flatten inline tags inside table cells (<td><p>text</p></td> → <td>text</td>)
  html = html.replace(/<(td|th)([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag, attrs, inner) => {
    const flat = inner.replace(/<\/?(p|strong|em|span|b|i|u|a|sup|sub)[^>]*>/gi, "").trim();
    return `<${tag}${attrs}>${flat}</${tag}>`;
  });

  // 3. Extract tables as structured data with placeholders
  html = html.replace(/<table[\s\S]*?<\/table>/gi, (table) => {
    const rowMatches = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    const parsedRows: string[][] = [];
    let hasHeader = false;

    for (let ri = 0; ri < rowMatches.length; ri++) {
      const row = rowMatches[ri];
      const cellMatches = row.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      const cells = cellMatches.map((cell) => {
        let t = cell.replace(/<[^>]+>/g, "").trim();
        // Decode HTML entities that mammoth produces (before table extraction)
        t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
        return t;
      });
      // Detect if first row uses <th> tags
      if (ri === 0 && /<th[\s>]/i.test(row)) hasHeader = true;
      parsedRows.push(cells);
    }

    if (parsedRows.length === 0) return "\n";

    // First row is header (either <th> or just the first row)
    const headers = parsedRows[0];
    const dataRows = parsedRows.slice(1);

    // If no data rows, treat all as data with empty headers
    const tableObj: DocxTable = dataRows.length > 0
      ? { headers, rows: dataRows }
      : { headers: [], rows: parsedRows };

    tables.push(tableObj);
    return `\n__TABLE_${tables.length - 1}__\n`;
  });

  // 4. Add newlines for block elements
  html = html.replace(/<\/?(h[1-6]|p|div|li|blockquote|figcaption|caption|dt|dd)[^>]*>/gi, "\n");
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // 5. Strip all remaining HTML tags
  html = html.replace(/<[^>]+>/g, "");

  // 6. Decode common HTML entities
  let text = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    // 7. Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, images, tables };
}

// ─── Table rendering ─────────────────────────────────────────────────────────

const TABLE_FONT_SIZE = 8;
const TABLE_CELL_PAD_X = 4;
const TABLE_CELL_PAD_Y = 3;
const TABLE_HEADER_BG = rgb(0.92, 0.93, 0.95); // light gray header
const TABLE_BORDER_COLOR = rgb(0.55, 0.58, 0.62);
const TABLE_ALT_ROW_BG = rgb(0.97, 0.98, 0.99);

/**
 * Calculate the height needed for a table row (accounts for text wrapping).
 */
function calcRowHeight(
  cells: string[],
  colWidths: number[],
  font: PDFFont,
  fontSize: number,
): number {
  let maxLines = 1;
  for (let c = 0; c < cells.length; c++) {
    const cellW = (colWidths[c] || 60) - TABLE_CELL_PAD_X * 2;
    const lines = wrapText(cells[c] || "", font, fontSize, Math.max(cellW, 20));
    maxLines = Math.max(maxLines, lines.length);
  }
  return maxLines * (fontSize + 3) + TABLE_CELL_PAD_Y * 2;
}

/**
 * Calculate column widths based on content.
 * Strategy: proportional to max content width per column, capped to CONTENT_W.
 */
function calcColWidths(
  table: DocxTable,
  font: PDFFont,
  fontBold: PDFFont,
  fontSize: number,
): number[] {
  const allRows = table.headers.length > 0 ? [table.headers, ...table.rows] : table.rows;
  const numCols = Math.max(...allRows.map((r) => r.length), 1);
  const maxWidths: number[] = new Array(numCols).fill(30); // minimum 30pt

  for (const row of allRows) {
    const isHeader = row === table.headers;
    const f = isHeader ? fontBold : font;
    for (let c = 0; c < row.length; c++) {
      const textW = f.widthOfTextAtSize(row[c] || "", fontSize) + TABLE_CELL_PAD_X * 2;
      maxWidths[c] = Math.max(maxWidths[c], Math.min(textW, CONTENT_W * 0.5)); // cap single col at 50%
    }
  }

  // Scale to fit CONTENT_W
  const total = maxWidths.reduce((a, b) => a + b, 0);
  if (total > CONTENT_W) {
    const scale = CONTENT_W / total;
    return maxWidths.map((w) => Math.max(w * scale, 25));
  }
  // If table is narrow, expand proportionally to fill width
  const scale = CONTENT_W / total;
  return maxWidths.map((w) => w * scale);
}

// ─── Body pages ──────────────────────────────────────────────────────────────

async function drawBodyPages(
  pdfDoc: PDFDocument,
  text: string,
  fonts: { serif: PDFFont; serifBold: PDFFont; sans: PDFFont; sansBold: PDFFont },
  msId: string,
  images: { data: Buffer; contentType: string }[] = [],
  tables: DocxTable[] = [],
): Promise<number> {
  const { serif, serifBold, sans, sansBold } = fonts;
  const contentTop = PAGE_H - MARGIN_TOP - 16;
  const contentBottom = MARGIN_BOTTOM + 10;

  // Pre-embed all images
  const embeddedImages: (Awaited<ReturnType<typeof pdfDoc.embedPng>> | null)[] = [];
  for (const img of images) {
    try {
      if (img.contentType.includes("png")) {
        embeddedImages.push(await pdfDoc.embedPng(img.data));
      } else if (img.contentType.includes("jpeg") || img.contentType.includes("jpg")) {
        embeddedImages.push(await pdfDoc.embedJpg(img.data));
      } else {
        // Try PNG first, then JPG
        try {
          embeddedImages.push(await pdfDoc.embedPng(img.data));
        } catch {
          try {
            embeddedImages.push(await pdfDoc.embedJpg(img.data));
          } catch {
            embeddedImages.push(null);
          }
        }
      }
    } catch {
      embeddedImages.push(null);
    }
  }

  const paragraphs = text.split(/\n/);
  const pages: PDFPage[] = [];
  let currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(currentPage);
  let y = contentTop;

  const newPageIfNeeded = (height: number) => {
    if (y - height < contentBottom) {
      currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pages.push(currentPage);
      y = contentTop;
    }
  };

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed === "") {
      y -= PARA_SPACING;
      newPageIfNeeded(0);
      continue;
    }

    // Check for image placeholder
    const imgMatch = trimmed.match(/^__IMAGE_(\d+)__$/);
    if (imgMatch) {
      const imgIdx = parseInt(imgMatch[1], 10);
      const embedded = embeddedImages[imgIdx];
      if (embedded) {
        // Scale image to fit content width, max 300pt tall
        const scale = Math.min(CONTENT_W / embedded.width, 300 / embedded.height, 1);
        const imgW = embedded.width * scale;
        const imgH = embedded.height * scale;

        newPageIfNeeded(imgH + 20);
        y -= 10;
        const imgX = MARGIN_LEFT + (CONTENT_W - imgW) / 2; // center
        currentPage.drawImage(embedded, { x: imgX, y: y - imgH, width: imgW, height: imgH });
        y -= imgH + 15;
      }
      continue;
    }

    // Check for table placeholder
    const tblMatch = trimmed.match(/^__TABLE_(\d+)__$/);
    if (tblMatch) {
      const tblIdx = parseInt(tblMatch[1], 10);
      const table = tables[tblIdx];
      if (table) {
        const colWidths = calcColWidths(table, sans, sansBold, TABLE_FONT_SIZE);
        const allRows = table.headers.length > 0 ? [table.headers, ...table.rows] : table.rows;

        y -= 8; // spacing before table

        for (let ri = 0; ri < allRows.length; ri++) {
          const row = allRows[ri];
          const isHeader = table.headers.length > 0 && ri === 0;
          const cellFont = isHeader ? sansBold : sans;
          const rowH = calcRowHeight(row, colWidths, cellFont, TABLE_FONT_SIZE);

          // New page if row doesn't fit
          if (y - rowH < contentBottom) {
            currentPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
            pages.push(currentPage);
            y = contentTop;
          }

          // Draw row background
          let cellX = MARGIN_LEFT;
          for (let c = 0; c < colWidths.length; c++) {
            const bgColor = isHeader
              ? TABLE_HEADER_BG
              : ri % 2 === 0
                ? TABLE_ALT_ROW_BG
                : rgb(1, 1, 1);

            currentPage.drawRectangle({
              x: cellX,
              y: y - rowH,
              width: colWidths[c],
              height: rowH,
              color: bgColor,
            });

            // Cell borders
            currentPage.drawRectangle({
              x: cellX,
              y: y - rowH,
              width: colWidths[c],
              height: rowH,
              borderColor: TABLE_BORDER_COLOR,
              borderWidth: 0.5,
            });

            // Cell text
            const cellText = sanitize(row[c] || "");
            const cellContentW = colWidths[c] - TABLE_CELL_PAD_X * 2;
            const lines = wrapText(cellText, cellFont, TABLE_FONT_SIZE, Math.max(cellContentW, 20));
            let textY = y - TABLE_CELL_PAD_Y - TABLE_FONT_SIZE;
            for (const line of lines) {
              currentPage.drawText(line, {
                x: cellX + TABLE_CELL_PAD_X,
                y: textY,
                size: TABLE_FONT_SIZE,
                font: cellFont,
                color: BLACK,
              });
              textY -= TABLE_FONT_SIZE + 3;
            }

            cellX += colWidths[c];
          }

          y -= rowH;
        }

        y -= 12; // spacing after table
      }
      continue;
    }

    // Detect headings
    const isHeading = (
      (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      /^\d+\.\s+[A-Z]/.test(trimmed)
    );

    const font = isHeading ? serifBold : serif;
    const fontSize = isHeading ? 12 : 11;
    const lh = isHeading ? 17 : LINE_HEIGHT;

    const lines = wrapText(trimmed, font, fontSize, CONTENT_W);
    const neededHeight = lines.length * lh + (isHeading ? 12 : 0);
    newPageIfNeeded(neededHeight);

    if (isHeading) y -= 8;

    for (const line of lines) {
      currentPage.drawText(line, { x: MARGIN_LEFT, y, size: fontSize, font, color: BLACK });
      y -= lh;
    }
    y -= (isHeading ? 4 : PARA_SPACING * 0.5);
  }

  // Draw watermarks, headers, footers on all body pages
  const totalBodyPages = pages.length;
  pages.forEach((p, i) => {
    drawWatermark(p, sansBold);
    drawHeaderFooter(p, sans, sansBold, msId, i + 1, totalBodyPages);
  });

  return totalBodyPages;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateReviewCopyPdf(rawOpts: ReviewCopyOptions): Promise<Uint8Array> {
  // 1. Extract content (text + images from docx)
  let bodyText: string;
  let images: { data: Buffer; contentType: string }[] = [];

  let tables: DocxTable[] = [];

  if (rawOpts.docxBuffer) {
    const content = await extractContentFromDocx(rawOpts.docxBuffer);
    bodyText = content.text;
    images = content.images;
    tables = content.tables;
  } else if (rawOpts.textContent) {
    bodyText = rawOpts.textContent;
    // Strip markdown syntax only for plain text / .md sources (not docx)
    bodyText = stripMarkdown(bodyText);
  } else {
    bodyText = "(No manuscript content available)";
  }

  // 3. Sanitize all text for WinAnsi standard fonts
  bodyText = sanitize(bodyText);
  const opts: ReviewCopyOptions = {
    ...rawOpts,
    manuscriptId: sanitize(rawOpts.manuscriptId),
    title: sanitize(rawOpts.title),
    authors: sanitize(rawOpts.authors),
    articleType: sanitize(rawOpts.articleType),
    keywords: sanitize(rawOpts.keywords),
    category: sanitize(rawOpts.category),
    abstract: sanitize(rawOpts.abstract),
    reviewerName: sanitize(rawOpts.reviewerName).replace(/\b[a-zA-Z]/g, (ch, i, str) => i === 0 || /\s/.test(str[i - 1]) ? ch.toUpperCase() : ch),
    deadline: sanitize(rawOpts.deadline),
    receivedDate: sanitize(rawOpts.receivedDate),
  };

  // 4. Create PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const serif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { serif, serifBold, sans, sansBold };

  // 4. Cover page
  const coverPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  drawCoverPage(coverPage, opts, fonts);

  // 5. Body pages (with images and tables from docx)
  await drawBodyPages(pdfDoc, bodyText, fonts, opts.manuscriptId, images, tables);

  // 5. Set metadata
  pdfDoc.setTitle(`${opts.manuscriptId} - ${opts.title}`);
  pdfDoc.setAuthor("American Impact Review");
  pdfDoc.setSubject("Confidential Manuscript for Peer Review");
  pdfDoc.setKeywords(["peer review", "confidential", "manuscript", opts.manuscriptId]);
  pdfDoc.setProducer("American Impact Review");
  pdfDoc.setCreator("AIR Review Copy Generator");

  return pdfDoc.save();
}
