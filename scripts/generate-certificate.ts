import { PDFDocument, rgb, PageSizes, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';

// ─── CLI Args ────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  const name = get('--name');
  const reviews = parseInt(get('--reviews') || '1', 10);
  const field = get('--field') || 'their respective field';
  const period = get('--period') || 'February 2026';
  const output = get('--output') || `./certificate-${(name || 'output').toLowerCase().replace(/\s+/g, '-')}.pdf`;

  if (!name) {
    console.error('Usage: npx tsx scripts/generate-certificate.ts --name "Full Name" [--reviews N] [--field "Field"] [--period "Month Year"] [--output path.pdf]');
    process.exit(1);
  }
  return { name, reviews, field, period, output };
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const NAVY = rgb(11 / 255, 44 / 255, 74 / 255);          // #0B2C4A
const GOLD = rgb(178 / 255, 138 / 255, 60 / 255);         // #B28A3C
const GOLD_LIGHT = rgb(212 / 255, 175 / 255, 95 / 255);   // #D4AF5F
const GOLD_DARK = rgb(139 / 255, 109 / 255, 48 / 255);    // #8B6D30
const DARK_TEXT = rgb(35 / 255, 35 / 255, 35 / 255);      // #232323

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ASSETS = path.join(__dirname, 'certificate-assets');

function centerText(page: PDFPage, text: string, font: PDFFont, size: number, y: number, color = NAVY) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, { x, y, size, font, color });
}

function drawStarDivider(page: PDFPage, y: number, count: number = 5) {
  const pageW = page.getWidth();
  const spacing = 18;
  const totalW = (count - 1) * spacing;
  let x = (pageW - totalW) / 2;
  for (let i = 0; i < count; i++) {
    drawStar(page, x, y, 3, GOLD);
    x += spacing;
  }
}

function drawStar(page: PDFPage, cx: number, cy: number, r: number, color: typeof NAVY) {
  // Draw a simple 5-pointed star as a filled circle (pdf-lib has no star primitive)
  // Use a small diamond shape for visual star effect
  const s = r;
  page.drawCircle({ x: cx, y: cy, size: s, color, borderWidth: 0 });
}

function drawOrnamentalLine(page: PDFPage, y: number, lineWidth: number = 200) {
  const pageW = page.getWidth();
  const x = (pageW - lineWidth) / 2;
  // Main line
  page.drawLine({ start: { x, y }, end: { x: x + lineWidth, y }, thickness: 0.8, color: GOLD });
  // Small diamond at center
  const cx = pageW / 2;
  drawStar(page, cx, y, 2.5, GOLD);
  // End caps - small circles
  page.drawCircle({ x, y, size: 1.5, color: GOLD });
  page.drawCircle({ x: x + lineWidth, y, size: 1.5, color: GOLD });
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawWrappedCentered(page: PDFPage, text: string, font: PDFFont, size: number, y: number, maxWidth: number, color = DARK_TEXT, lineSpacing = 1.5): number {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;
  for (const line of lines) {
    centerText(page, line, font, size, currentY, color);
    currentY -= size * lineSpacing;
  }
  return currentY;
}

// ─── Gold Double-Line Border ─────────────────────────────────────────────────
function drawBorder(page: PDFPage) {
  const w = page.getWidth();
  const h = page.getHeight();
  const margin = 36;   // outer margin
  const gap = 6;       // space between double lines
  const thickness = 1.5;
  const innerThickness = 0.8;

  // Outer rectangle
  page.drawRectangle({
    x: margin, y: margin,
    width: w - margin * 2, height: h - margin * 2,
    borderColor: GOLD, borderWidth: thickness,
    color: undefined as any, opacity: 0,
  });

  // Inner rectangle
  const m2 = margin + gap + thickness;
  page.drawRectangle({
    x: m2, y: m2,
    width: w - m2 * 2, height: h - m2 * 2,
    borderColor: GOLD_LIGHT, borderWidth: innerThickness,
    color: undefined as any, opacity: 0,
  });

  // Corner ornaments (small L-shapes at each corner)
  const ornSize = 20;
  const orn = margin + gap / 2;
  const ornT = 2.5;
  const corners = [
    { x: margin - 2, y: margin - 2, dx: 1, dy: 1 },           // bottom-left
    { x: w - margin + 2, y: margin - 2, dx: -1, dy: 1 },      // bottom-right
    { x: margin - 2, y: h - margin + 2, dx: 1, dy: -1 },      // top-left
    { x: w - margin + 2, y: h - margin + 2, dx: -1, dy: -1 }, // top-right
  ];
  for (const c of corners) {
    // Small decorative diamond at corner
    page.drawCircle({ x: c.x + c.dx * 4, y: c.y + c.dy * 4, size: 3, color: GOLD });
  }
}

// Seal is now loaded from pre-generated PNG (scripts/generate-seal.ts)

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const { name, reviews, field, period, output } = parseArgs();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load fonts
  const cinzelRegularBytes = fs.readFileSync(path.join(ASSETS, 'Cinzel-Regular.ttf'));
  const cinzelBoldBytes = fs.readFileSync(path.join(ASSETS, 'Cinzel-Bold.ttf'));
  const cinzelDecoBytes = fs.readFileSync(path.join(ASSETS, 'CinzelDecorative-Bold.ttf'));
  const greatVibesBytes = fs.readFileSync(path.join(ASSETS, 'GreatVibes-Regular.ttf'));

  const cinzelRegular = await pdfDoc.embedFont(cinzelRegularBytes);
  const cinzelBold = await pdfDoc.embedFont(cinzelBoldBytes);
  const cinzelDeco = await pdfDoc.embedFont(cinzelDecoBytes);
  const greatVibes = await pdfDoc.embedFont(greatVibesBytes);

  // Load images
  const bgBytes = fs.readFileSync(path.join(ASSETS, 'background.jpg'));
  const bgImage = await pdfDoc.embedJpg(bgBytes);

  const sigBytes = fs.readFileSync(path.join(ASSETS, 'signature.png'));
  const sigImage = await pdfDoc.embedPng(sigBytes);

  const eagleBytes = fs.readFileSync(path.join(ASSETS, 'eagle-watermark.png'));
  const eagleImage = await pdfDoc.embedPng(eagleBytes);

  const sealBytes = fs.readFileSync(path.join(ASSETS, 'seal.png'));
  const sealImage = await pdfDoc.embedPng(sealBytes);

  // Create page (Letter size: 612 x 792 points)
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width: W, height: H } = page.getSize();

  // 1. Background
  page.drawImage(bgImage, { x: 0, y: 0, width: W, height: H });

  // 2. Eagle watermark (center, very subtle)
  const eagleSize = 280;
  page.drawImage(eagleImage, {
    x: (W - eagleSize) / 2,
    y: (H - eagleSize) / 2 + 40,
    width: eagleSize,
    height: eagleSize,
    opacity: 0.07,
  });

  // 3. Gold double-line border
  drawBorder(page);

  // ─── Content layout (top to bottom) ──────────────────────────────────────
  let y = H - 72;

  // "AMERICAN IMPACT REVIEW" header
  centerText(page, 'AMERICAN IMPACT REVIEW', cinzelBold, 26, y, NAVY);
  y -= 32;

  // Ornamental divider
  drawOrnamentalLine(page, y, 220);
  y -= 28;

  // "CERTIFICATE OF REVIEWING" title
  centerText(page, 'CERTIFICATE', cinzelDeco, 32, y, GOLD);
  y -= 30;
  centerText(page, 'OF REVIEWING', cinzelDeco, 20, y, GOLD);
  y -= 28;

  // Star divider
  drawStarDivider(page, y, 5);
  y -= 32;

  // "This is to certify that"
  centerText(page, 'This is to certify that', cinzelRegular, 13, y, DARK_TEXT);
  y -= 38;

  // Reviewer name — large, prominent
  const nameSize = name.length > 25 ? 24 : name.length > 18 ? 28 : 32;
  centerText(page, name, cinzelBold, nameSize, y, NAVY);
  y -= 12;

  // Underline beneath name
  const nameWidth = cinzelBold.widthOfTextAtSize(name, nameSize);
  const nameX = (W - nameWidth) / 2;
  page.drawLine({
    start: { x: nameX, y: y },
    end: { x: nameX + nameWidth, y: y },
    thickness: 0.8,
    color: GOLD,
  });
  y -= 30;

  // Star divider
  drawStarDivider(page, y, 3);
  y -= 28;

  // Body text
  const reviewWord = reviews === 1 ? 'independent peer review' : 'independent peer reviews';
  const bodyText = `has successfully completed ${reviews} ${reviewWord} in the field of ${field} for manuscripts submitted to American Impact Review during ${period}.`;
  const maxTextWidth = W - 140;
  y = drawWrappedCentered(page, bodyText, cinzelRegular, 12, y, maxTextWidth, DARK_TEXT, 1.6);
  y -= 16;

  // Star divider
  drawStarDivider(page, y, 3);
  y -= 24;

  // Authority paragraph
  const authorityText = 'Reviewers for American Impact Review are selected based on demonstrated academic expertise, peer-reviewed publication record, and professional standing in their respective fields.';
  y = drawWrappedCentered(page, authorityText, cinzelRegular, 10, y, maxTextWidth - 20, rgb(80 / 255, 80 / 255, 80 / 255), 1.5);
  y -= 30;

  // ─── Signature block (left) + Seal (right) ──────────────────────────────
  const sigBlockX = 90;
  const sealCenterX = W - 140;

  // Signature image
  const sigW = 160;
  const sigH = sigW * (sigImage.height / sigImage.width);
  page.drawImage(sigImage, {
    x: sigBlockX,
    y: y - sigH + 10,
    width: sigW,
    height: sigH,
  });
  y -= sigH + 2;

  // Signature line
  page.drawLine({
    start: { x: sigBlockX, y: y },
    end: { x: sigBlockX + 180, y: y },
    thickness: 0.6,
    color: GOLD,
  });
  y -= 16;

  // "Egor Akimov, Ph.D." in script font
  page.drawText('Egor Akimov, Ph.D.', {
    x: sigBlockX,
    y: y,
    size: 16,
    font: greatVibes,
    color: NAVY,
  });
  y -= 16;

  // "Editor-in-Chief"
  page.drawText('Editor-in-Chief', {
    x: sigBlockX,
    y: y,
    size: 10,
    font: cinzelRegular,
    color: DARK_TEXT,
  });
  y -= 14;

  // "American Impact Review"
  page.drawText('American Impact Review', {
    x: sigBlockX,
    y: y,
    size: 10,
    font: cinzelRegular,
    color: DARK_TEXT,
  });

  // Seal PNG (right side, aligned with signature block)
  const sealSize = 120;
  const sealY = y + sigH / 2 + 20 - sealSize / 2;
  page.drawImage(sealImage, {
    x: sealCenterX - sealSize / 2,
    y: sealY,
    width: sealSize,
    height: sealSize,
  });

  // ─── Footer ──────────────────────────────────────────────────────────────
  centerText(page, 'www.AmericanImpactReview.com', cinzelRegular, 9, 48, GOLD);

  // ─── Save ────────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(output);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Certificate generated: ${outputPath}`);
  console.log(`  Name: ${name}`);
  console.log(`  Reviews: ${reviews}`);
  console.log(`  Field: ${field}`);
  console.log(`  Period: ${period}`);
  console.log(`  Size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('Error generating certificate:', err);
  process.exit(1);
});
