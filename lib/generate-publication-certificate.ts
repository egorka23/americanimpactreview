import { PDFDocument, rgb, PageSizes, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

// ─── Colors ──────────────────────────────────────────────────────────────────
const NAVY = rgb(11 / 255, 44 / 255, 74 / 255);
const GOLD = rgb(178 / 255, 138 / 255, 60 / 255);
const GOLD_LIGHT = rgb(212 / 255, 175 / 255, 95 / 255);
const DARK_TEXT = rgb(35 / 255, 35 / 255, 35 / 255);
const LIGHT_TEXT = rgb(100 / 255, 100 / 255, 100 / 255);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function centerText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = NAVY
) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, { x, y, size, font, color });
}

function drawOrnamentalLine(page: PDFPage, y: number, lineWidth: number = 200) {
  const pageW = page.getWidth();
  const x = (pageW - lineWidth) / 2;
  page.drawLine({ start: { x, y }, end: { x: x + lineWidth, y }, thickness: 0.8, color: GOLD });
  const cx = pageW / 2;
  page.drawCircle({ x: cx, y, size: 2.5, color: GOLD });
  page.drawCircle({ x, y, size: 1.5, color: GOLD });
  page.drawCircle({ x: x + lineWidth, y, size: 1.5, color: GOLD });
}

function drawStarDivider(page: PDFPage, y: number, count = 5) {
  const pageW = page.getWidth();
  const spacing = 18;
  const totalW = (count - 1) * spacing;
  let x = (pageW - totalW) / 2;
  for (let i = 0; i < count; i++) {
    page.drawCircle({ x, y, size: 3, color: GOLD });
    x += spacing;
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawWrappedCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  maxWidth: number,
  color = DARK_TEXT,
  lineSpacing = 1.5
): number {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;
  for (const line of lines) {
    centerText(page, line, font, size, currentY, color);
    currentY -= size * lineSpacing;
  }
  return currentY;
}

function drawBorder(page: PDFPage) {
  const w = page.getWidth();
  const h = page.getHeight();
  const margin = 36;
  const gap = 6;
  const thickness = 1.5;
  const innerThickness = 0.8;

  page.drawRectangle({
    x: margin,
    y: margin,
    width: w - margin * 2,
    height: h - margin * 2,
    borderColor: GOLD,
    borderWidth: thickness,
    opacity: 0,
  });

  const m2 = margin + gap + thickness;
  page.drawRectangle({
    x: m2,
    y: m2,
    width: w - m2 * 2,
    height: h - m2 * 2,
    borderColor: GOLD_LIGHT,
    borderWidth: innerThickness,
    opacity: 0,
  });

  // Corner ornaments
  page.drawCircle({ x: margin + 2, y: margin + 2, size: 3, color: GOLD });
  page.drawCircle({ x: w - margin - 2, y: margin + 2, size: 3, color: GOLD });
  page.drawCircle({ x: margin + 2, y: h - margin - 2, size: 3, color: GOLD });
  page.drawCircle({ x: w - margin - 2, y: h - margin - 2, size: 3, color: GOLD });
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PublicationCertificateData {
  title: string;
  authors: string;
  articleType: string;
  category: string;
  subject?: string;
  volume?: string;
  issue?: string;
  year?: number;
  publishedDate: string; // formatted date string
  doi?: string;
  slug: string;
}

// ─── Main Generator ──────────────────────────────────────────────────────────
export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width: W, height: H } = page.getSize();
  const maxTextWidth = W - 140;

  // Border
  drawBorder(page);

  let y = H - 72;

  // "AMERICAN IMPACT REVIEW" header
  centerText(page, "AMERICAN IMPACT REVIEW", timesBold, 24, y, NAVY);
  y -= 18;

  // Tagline
  centerText(page, "A Peer-Reviewed Multidisciplinary Journal", timesItalic, 10, y, LIGHT_TEXT);
  y -= 24;

  // Ornamental divider
  drawOrnamentalLine(page, y, 220);
  y -= 32;

  // "CERTIFICATE OF PUBLICATION"
  centerText(page, "CERTIFICATE", timesBold, 30, y, GOLD);
  y -= 26;
  centerText(page, "OF PUBLICATION", timesBold, 18, y, GOLD);
  y -= 28;

  // Star divider
  drawStarDivider(page, y, 5);
  y -= 36;

  // "This is to certify that the following article"
  centerText(page, "This is to certify that the following article", timesRoman, 12, y, DARK_TEXT);
  y -= 16;
  centerText(page, "has been published in American Impact Review", timesRoman, 12, y, DARK_TEXT);
  y -= 32;

  // Star divider
  drawStarDivider(page, y, 3);
  y -= 32;

  // Article title (large, bold, wrapped)
  const titleSize = data.title.length > 60 ? 14 : 16;
  y = drawWrappedCentered(page, `"${data.title}"`, timesBold, titleSize, y, maxTextWidth, NAVY, 1.5);
  y -= 16;

  // Authors
  centerText(page, data.authors, timesRoman, 13, y, DARK_TEXT);
  y -= 24;

  // Article metadata line
  const metaParts: string[] = [];
  if (data.articleType) metaParts.push(data.articleType);
  if (data.category) metaParts.push(data.category);
  if (data.subject) metaParts.push(data.subject);
  const metaLine = metaParts.join("  ·  ");
  centerText(page, metaLine, timesItalic, 10, y, LIGHT_TEXT);
  y -= 28;

  // Ornamental line
  drawOrnamentalLine(page, y, 160);
  y -= 28;

  // Publication details — left-aligned block centered on page
  const detailFont = timesRoman;
  const detailSize = 11;
  const labelFont = timesBold;
  const detailLines: [string, string][] = [];

  if (data.volume || data.issue || data.year) {
    const volParts: string[] = [];
    if (data.volume) volParts.push(`Volume ${data.volume}`);
    if (data.issue) volParts.push(`Issue ${data.issue}`);
    if (data.year) volParts.push(`${data.year}`);
    detailLines.push(["Publication:", volParts.join(", ")]);
  }

  detailLines.push(["Published:", data.publishedDate]);

  if (data.doi) {
    detailLines.push(["DOI:", data.doi]);
  }

  const articleUrl = `https://americanimpactreview.com/article/${data.slug}`;
  detailLines.push(["URL:", articleUrl]);

  const certNumber = `AIR-${data.year || new Date().getFullYear()}-${data.slug}`;
  detailLines.push(["Certificate #:", certNumber]);

  // Calculate block width for centering
  const blockX = 170;
  const labelWidth = 90;

  for (const [label, value] of detailLines) {
    page.drawText(label, { x: blockX, y, size: detailSize, font: labelFont, color: NAVY });
    // Wrap long values
    const valueMaxW = W - blockX - labelWidth - 70;
    const valueLines = wrapText(value, detailFont, detailSize, valueMaxW);
    for (const vline of valueLines) {
      page.drawText(vline, {
        x: blockX + labelWidth,
        y,
        size: detailSize,
        font: detailFont,
        color: DARK_TEXT,
      });
      y -= detailSize * 1.6;
    }
  }

  y -= 16;

  // Star divider
  drawStarDivider(page, y, 3);
  y -= 36;

  // Signature block
  const sigBlockX = 90;

  // Signature line
  page.drawLine({
    start: { x: sigBlockX, y },
    end: { x: sigBlockX + 180, y },
    thickness: 0.6,
    color: GOLD,
  });
  y -= 16;

  page.drawText("Egor Akimov, Ph.D.", {
    x: sigBlockX,
    y,
    size: 14,
    font: timesBold,
    color: NAVY,
  });
  y -= 16;

  page.drawText("Editor-in-Chief", {
    x: sigBlockX,
    y,
    size: 10,
    font: timesRoman,
    color: DARK_TEXT,
  });
  y -= 14;

  page.drawText("American Impact Review", {
    x: sigBlockX,
    y,
    size: 10,
    font: timesRoman,
    color: DARK_TEXT,
  });

  // Seal area — right side (decorative circle with text)
  const sealCX = W - 140;
  const sealCY = y + 40;
  // Outer ring
  page.drawCircle({
    x: sealCX,
    y: sealCY,
    size: 45,
    borderColor: GOLD,
    borderWidth: 2,
    opacity: 0,
  });
  // Inner ring
  page.drawCircle({
    x: sealCX,
    y: sealCY,
    size: 38,
    borderColor: GOLD_LIGHT,
    borderWidth: 1,
    opacity: 0,
  });
  // Center dot
  page.drawCircle({ x: sealCX, y: sealCY, size: 4, color: GOLD });
  // "AIR" text in seal
  const airWidth = helveticaBold.widthOfTextAtSize("AIR", 16);
  page.drawText("AIR", {
    x: sealCX - airWidth / 2,
    y: sealCY - 6,
    size: 16,
    font: helveticaBold,
    color: NAVY,
  });

  // Footer
  centerText(page, "www.AmericanImpactReview.com", timesRoman, 9, 48, GOLD);

  return pdfDoc.save();
}
