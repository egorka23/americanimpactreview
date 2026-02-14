import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PageSizes } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface PublicationCertificateData {
  title: string;
  authors?: string;
  receivedDate?: string;
  publishedDate?: string;
  doi?: string;
  issn?: string;
}

const TEMPLATE_URL = "/certificate-template.png";
const TITLE_COLOR = rgb(15 / 255, 42 / 255, 68 / 255);
const FONT_URLS = {
  playfairSemibold: "/fonts/PlayfairDisplay-SemiBold.ttf",
  interRegular: "/fonts/Inter-Regular.ttf",
  interItalic: "/fonts/Inter-Italic.ttf",
  interSemibold: "/fonts/Inter-SemiBold.ttf",
};

function centerText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = TITLE_COLOR,
  centerX?: number
) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (centerX ?? page.getWidth() / 2) - width / 2;
  page.drawText(text, { x, y, size, font, color });
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitTitleSize(text: string, font: PDFFont, maxWidth: number, maxLines: number, startSize: number, minSize: number) {
  let size = startSize;
  let lines = wrapText(text, font, size, maxWidth);
  while (size > minSize && lines.length > maxLines) {
    size -= 1;
    lines = wrapText(text, font, size, maxWidth);
  }
  return { size, lines };
}

function drawWrappedCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  maxWidth: number,
  color = TITLE_COLOR,
  lineSpacing = 1.2,
  centerX?: number
) {
  const lines = wrapText(text, font, size, maxWidth);
  let currentY = y;
  for (const line of lines) {
    centerText(page, line, font, size, currentY, color, centerX);
    currentY -= size * lineSpacing;
  }
  return currentY;
}

async function loadFont(
  pdfDoc: PDFDocument,
  url: string,
  fallback: StandardFonts
): Promise<PDFFont> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font not found at ${url}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    return await pdfDoc.embedFont(bytes, { subset: true });
  } catch {
    return await pdfDoc.embedFont(fallback);
  }
}

export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const titleFont = await loadFont(pdfDoc, FONT_URLS.playfairSemibold, StandardFonts.TimesRomanBold);
  const bodyFont = await loadFont(pdfDoc, FONT_URLS.interRegular, StandardFonts.Helvetica);
  const bodyItalic = await loadFont(pdfDoc, FONT_URLS.interItalic, StandardFonts.HelveticaOblique);
  const bodyBold = await loadFont(pdfDoc, FONT_URLS.interSemibold, StandardFonts.HelveticaBold);

  const templateResponse = await fetch(TEMPLATE_URL);
  if (!templateResponse.ok) {
    throw new Error(`Certificate template not found at ${TEMPLATE_URL}`);
  }
  const templateBytes = new Uint8Array(await templateResponse.arrayBuffer());
  const templateImage = await pdfDoc.embedPng(templateBytes);

  const page = pdfDoc.addPage([PageSizes.A4[1], PageSizes.A4[0]]); // A4 landscape
  const { width: W, height: H } = page.getSize();

  const tW = templateImage.width;
  const tH = templateImage.height;
  const baseScale = Math.min(W / tW, H / tH);
  const scale = baseScale * 0.92; // smaller to reduce stretched feel
  const drawW = tW * scale;
  const drawH = tH * scale;
  const offsetX = (W - drawW) / 2;
  const offsetY = (H - drawH) / 2;

  page.drawImage(templateImage, { x: offsetX, y: offsetY, width: drawW, height: drawH });
  const centerX = offsetX + drawW / 2;

  // Place the title between the two template lines
  const maxTitleWidth = drawW * 0.62;
  const maxAuthorWidth = drawW * 0.6;
  const titleText = `“${data.title}”`;
  const titleFit = fitTitleSize(titleText, titleFont, maxTitleWidth, 2, 20 * scale, 14 * scale);

  // Template is landscape. Coordinates are based on the blank template:
  // Line 1 around y≈400 (top-origin), Line 2 around y≈500.
  const toPdfY = (topY: number) => offsetY + (tH - topY) * scale;
  // Auto-align blocks so vertical spacing is balanced based on content length
  const titleLineSpacing = 1.2;
  const titleBlockHeight = titleFit.size + (titleFit.lines.length - 1) * titleFit.size * titleLineSpacing;
  const TITLE_REGION_TOP = 385;
  const TITLE_REGION_BOTTOM = 520;
  const titleTop = TITLE_REGION_TOP + (TITLE_REGION_BOTTOM - TITLE_REGION_TOP - titleBlockHeight / scale) / 2;
  const titleStartY = toPdfY(titleTop + titleFit.size);

  drawWrappedCentered(page, titleText, titleFont, titleFit.size, titleStartY, maxTitleWidth, TITLE_COLOR, titleLineSpacing, centerX);

  // Author + metadata block below the second line
  const authorText = data.authors || "—";
  const authorFit = fitTitleSize(authorText, bodyBold, maxAuthorWidth, 2, 40 * scale, 24 * scale);
  const authoredBySize = 30 * scale;
  const authorLineSpacing = 1.2;
  const authorBlockHeight = authorFit.size + (authorFit.lines.length - 1) * authorFit.size * authorLineSpacing;
  const metaSize = 15 * scale;
  const metaSpacing = 22 * scale;
  const metaBlockHeight = metaSpacing * 2 + metaSize;

  const AUTHOR_REGION_TOP = 585;
  const AUTHOR_REGION_BOTTOM = 730;
  const authorRegionHeight = AUTHOR_REGION_BOTTOM - AUTHOR_REGION_TOP;
  const totalBlockHeight =
    authoredBySize +
    14 * scale +
    authorBlockHeight +
    16 * scale +
    metaBlockHeight;

  const authorTop = AUTHOR_REGION_TOP + (authorRegionHeight - totalBlockHeight / scale) / 2 + 30 * scale;
  const authoredByY = toPdfY(authorTop + authoredBySize);
  // Nudge "Written by" to align with the template's centered journal text above
  const writtenByCenterX = centerX - 20 * scale;
  centerText(page, "Written by", bodyItalic, authoredBySize, authoredByY, rgb(107 / 255, 114 / 255, 128 / 255), writtenByCenterX);

  const authorStartY = toPdfY(authorTop + authoredBySize + 42 * scale + authorFit.size);
  drawWrappedCentered(page, authorText, bodyBold, authorFit.size, authorStartY, maxAuthorWidth, TITLE_COLOR, authorLineSpacing, centerX - 20 * scale);

  const metaStartTop = authorTop + authoredBySize + 22 * scale + authorBlockHeight + 230 * scale;
  const metaStartY = toPdfY(metaStartTop + metaSize);
  centerText(page, `Received: ${data.receivedDate || "N/A"}`, bodyFont, metaSize, metaStartY, rgb(55 / 255, 65 / 255, 81 / 255), centerX);
  centerText(page, `Published: ${data.publishedDate || "N/A"}`, bodyFont, metaSize, metaStartY - metaSpacing, rgb(55 / 255, 65 / 255, 81 / 255), centerX);
  centerText(page, `DOI: ${data.doi || "Pending"}`, bodyFont, metaSize, metaStartY - metaSpacing * 2, rgb(55 / 255, 65 / 255, 81 / 255), centerX);

  // ISSN under the seal (bottom-right)
  const issnText = `ISSN: ${data.issn || "Pending"}`;
  const issnSize = 12 * scale;
  const issnWidth = bodyFont.widthOfTextAtSize(issnText, issnSize);
  const ISSN_Y = 995;
  page.drawText(issnText, {
    x: offsetX + drawW - issnWidth - 25 * scale,
    y: toPdfY(ISSN_Y),
    size: issnSize,
    font: bodyFont,
    color: rgb(107 / 255, 114 / 255, 128 / 255),
  });

  return pdfDoc.save();
}
