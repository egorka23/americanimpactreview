import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export interface PublicationCertificateData {
  title: string;
  authors?: string;
  /** Single author name for individual certificate */
  authorName?: string;
  receivedDate?: string;
  publishedDate?: string;
  doi?: string;
  issn?: string;
}

const TEMPLATE_PATH = "/certificate-template.png";
const FONT_PLAYFAIR = "/fonts/PlayfairDisplay-SemiBold.ttf";
const FONT_INTER = "/fonts/Inter-Regular.ttf";
const FONT_INTER_ITALIC = "/fonts/Inter-Italic.ttf";
const FONT_INTER_SEMIBOLD = "/fonts/Inter-SemiBold.ttf";

const PAGE_W = 1536;
const PAGE_H = 1024;

async function fetchBinary(path: string): Promise<Uint8Array> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitTextToLines(
  text: string,
  font: any,
  startSize: number,
  maxWidth: number,
  maxLines: number,
  minSize: number
) {
  let size = startSize;
  let lines = wrapText(text, font, size, maxWidth);
  while (lines.length > maxLines && size > minSize) {
    size -= 1;
    lines = wrapText(text, font, size, maxWidth);
  }
  return { size, lines };
}

function drawCenteredLines(params: {
  page: any;
  lines: string[];
  font: any;
  size: number;
  centerX: number;
  top: number;
  bottom: number;
  color: { r: number; g: number; b: number };
  lineGap?: number;
}) {
  const { page, lines, font, size, centerX, top, bottom, color, lineGap = 1.2 } = params;
  const lineHeight = size * lineGap;
  const blockHeight = lines.length * lineHeight;
  const startTop = top + (bottom - top - blockHeight) / 2;

  lines.forEach((line, i) => {
    const width = font.widthOfTextAtSize(line, size);
    const x = centerX - width / 2;
    const yFromTop = startTop + i * lineHeight;
    const y = PAGE_H - yFromTop - size;
    page.drawText(line, { x, y, size, font, color: rgb(color.r, color.g, color.b) });
  });
}

export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const [templateBytes, playfairBytes, interBytes, interItalicBytes, interSemiBoldBytes] =
    await Promise.all([
      fetchBinary(TEMPLATE_PATH),
      fetchBinary(FONT_PLAYFAIR),
      fetchBinary(FONT_INTER),
      fetchBinary(FONT_INTER_ITALIC),
      fetchBinary(FONT_INTER_SEMIBOLD),
    ]);

  const template = await pdf.embedPng(templateBytes);
  const playfair = await pdf.embedFont(playfairBytes);
  const inter = await pdf.embedFont(interBytes);
  const interItalic = await pdf.embedFont(interItalicBytes);
  const interSemiBold = await pdf.embedFont(interSemiBoldBytes);

  const page = pdf.addPage([PAGE_W, PAGE_H]);
  page.drawImage(template, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  const centerX = PAGE_W / 2;
  const title = data.title || "Untitled";
  const authorName = data.authorName || data.authors || "";

  // Title: between the two template lines
  const titleFit = fitTextToLines(title, playfair, 34, 980, 3, 18);
  drawCenteredLines({
    page,
    lines: titleFit.lines,
    font: playfair,
    size: titleFit.size,
    centerX,
    top: 330,
    bottom: 420,
    color: { r: 0.06, g: 0.16, b: 0.29 },
    lineGap: 1.15,
  });

  // Written by + author block (centered below the template "American Impact Review" line)
  const writtenBySize = 20;
  const writtenByY = 520;
  page.drawText("Written by", {
    x: centerX - interItalic.widthOfTextAtSize("Written by", writtenBySize) / 2,
    y: PAGE_H - writtenByY - writtenBySize,
    size: writtenBySize,
    font: interItalic,
    color: rgb(0.42, 0.45, 0.52),
  });

  if (authorName) {
    const authorFit = fitTextToLines(authorName, interSemiBold, 30, 900, 2, 18);
    drawCenteredLines({
      page,
      lines: authorFit.lines,
      font: interSemiBold,
      size: authorFit.size,
      centerX,
      top: 545,
      bottom: 610,
      color: { r: 0.06, g: 0.16, b: 0.29 },
      lineGap: 1.1,
    });
  }

  // Metadata block (received/published/DOI) lower center
  const metaFontSize = 20;
  const metaColor = rgb(0.22, 0.25, 0.3);
  const metaStartTop = 690;
  const metaLineGap = 30;
  const received = data.receivedDate || "N/A";
  const published = data.publishedDate || "N/A";
  const doi = data.doi || "Pending";

  const metaLines = [
    `Received: ${received}`,
    `Published: ${published}`,
    `DOI: ${doi}`,
  ];

  metaLines.forEach((line, i) => {
    const width = inter.widthOfTextAtSize(line, metaFontSize);
    const x = centerX - width / 2;
    const yFromTop = metaStartTop + i * metaLineGap;
    const y = PAGE_H - yFromTop - metaFontSize;
    page.drawText(line, { x, y, size: metaFontSize, font: inter, color: metaColor });
  });

  // ISSN under the seal, bottom-right
  const issn = data.issn || "0000-0000";
  const issnText = `ISSN: ${issn}`;
  const issnSize = 18;
  const issnWidth = inter.widthOfTextAtSize(issnText, issnSize);
  const issnX = PAGE_W - issnWidth - 80;
  const issnYFromTop = 930;
  const issnY = PAGE_H - issnYFromTop - issnSize;
  page.drawText(issnText, {
    x: issnX,
    y: issnY,
    size: issnSize,
    font: inter,
    color: rgb(0.42, 0.45, 0.52),
  });

  return await pdf.save();
}
