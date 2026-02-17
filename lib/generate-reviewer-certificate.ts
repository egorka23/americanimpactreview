import { PDFDocument, rgb, PageSizes } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type ReviewerCertificateData = {
  reviewerName: string;
  reviewCount: number;
  editCount: number;
  periodFrom: string;
  periodTo: string;
  issuedDate?: string;
};

const FONT_PLAYFAIR = "/fonts/PlayfairDisplay-SemiBold.ttf";
const FONT_INTER = "/fonts/Inter-Regular.ttf";
const FONT_INTER_BOLD = "/fonts/Inter-SemiBold.ttf";

async function fetchBinary(path: string): Promise<Uint8Array> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function centerText(page: any, text: string, font: any, size: number, y: number, color: { r: number; g: number; b: number }) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, { x, y, size, font, color: rgb(color.r, color.g, color.b) });
}

export async function generateReviewerCertificate(data: ReviewerCertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const [playfairBytes, interBytes, interBoldBytes] = await Promise.all([
    fetchBinary(FONT_PLAYFAIR),
    fetchBinary(FONT_INTER),
    fetchBinary(FONT_INTER_BOLD),
  ]);

  const playfair = await pdf.embedFont(playfairBytes);
  const inter = await pdf.embedFont(interBytes);
  const interBold = await pdf.embedFont(interBoldBytes);

  const page = pdf.addPage(PageSizes.A4);
  const { width: W, height: H } = page.getSize();

  // Background
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: rgb(0.7, 0.66, 0.45), borderWidth: 1.2 });

  const navy = { r: 0.07, g: 0.16, b: 0.28 };
  const gold = { r: 0.69, g: 0.54, b: 0.22 };

  let y = H - 90;
  centerText(page, "American Impact Review", playfair, 26, y, navy);
  y -= 28;
  centerText(page, "Certificate of Review", playfair, 20, y, gold);
  y -= 40;

  centerText(page, "This certifies that", inter, 14, y, navy);
  y -= 34;
  centerText(page, data.reviewerName || "Reviewer", playfair, 24, y, navy);
  y -= 36;

  centerText(page, "served as a peer reviewer for American Impact Review.", inter, 13, y, navy);
  y -= 26;

  const reviewsLine = `Reviews completed: ${data.reviewCount}`;
  const editsLine = `Editorial evaluations: ${data.editCount}`;
  centerText(page, reviewsLine, interBold, 13, y, navy);
  y -= 20;
  centerText(page, editsLine, interBold, 13, y, navy);
  y -= 28;

  const periodLine = `Period: ${data.periodFrom} – ${data.periodTo}`;
  centerText(page, periodLine, inter, 13, y, navy);
  y -= 40;

  const issued = data.issuedDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  centerText(page, `Issued: ${issued}`, inter, 12, y, { r: 0.4, g: 0.4, b: 0.4 });

  // Signature line
  page.drawLine({ start: { x: 110, y: 110 }, end: { x: W - 110, y: 110 }, thickness: 0.6, color: rgb(0.7, 0.66, 0.45) });
  centerText(page, "Editor-in-Chief", inter, 11, 90, { r: 0.4, g: 0.4, b: 0.4 });

  return await pdf.save();
}
