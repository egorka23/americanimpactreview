import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const PAGE_W = 816;
const PAGE_H = 1056;
const SCALE = 2; // html2canvas renders at 2x

function adaptFontSizes(titleLen: number, nameLen: number) {
  let titleSize: number;
  let nameSize: number;
  if (titleLen <= 60) titleSize = 26;
  else if (titleLen <= 100) titleSize = 22;
  else if (titleLen <= 150) titleSize = 19;
  else if (titleLen <= 200) titleSize = 17;
  else titleSize = 15;

  if (nameLen <= 15) nameSize = 48;
  else if (nameLen <= 25) nameSize = 42;
  else if (nameLen <= 35) nameSize = 36;
  else nameSize = 30;

  return { titleSize, nameSize };
}

/** Convert ALL CAPS or mixed text to Title Case for certificate display */
function toTitleCase(text: string): string {
  const small = new Set(["a","an","the","and","but","or","nor","for","yet","so","in","on","at","to","by","of","up","as","is","if","it","vs"]);
  const words = text.toLowerCase().split(/\s+/);
  return words.map((w, i) => {
    const capitalized = w.replace(/(^|-)(\w)/g, (_m, sep, ch) => sep + ch.toUpperCase());
    if (i === 0 || i === words.length - 1 || !small.has(w)) {
      return capitalized;
    }
    return w;
  }).join(' ');
}

/**
 * Create a NEW canvas, copy html2canvas output, then draw title text manually.
 * html2canvas's returned canvas doesn't support further draw operations,
 * so we must copy to a fresh canvas first.
 */
function compositeWithTitle(
  h2cCanvas: HTMLCanvasElement,
  title: string,
  titleSize: number,
  titleBoxTop: number,    // Y position of the title box top border (in CSS px)
  titleBoxHeight: number, // Height of the title box (in CSS px)
  maxWidth: number,       // Max text width (in CSS px)
  centerX: number,        // Center X (in CSS px)
): HTMLCanvasElement {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = h2cCanvas.width;
  finalCanvas.height = h2cCanvas.height;
  const ctx = finalCanvas.getContext("2d")!;

  // Copy html2canvas result onto the new canvas
  ctx.drawImage(h2cCanvas, 0, 0);

  // Now draw title text on the fresh canvas
  const font = `bold ${titleSize * SCALE}px 'Playfair Display', 'Georgia', serif`;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const fullText = `\u201C${title}\u201D`;
  const words = fullText.split(/\s+/);
  const lineHeight = titleSize * 1.35 * SCALE;
  const mw = maxWidth * SCALE;
  const cx = centerX * SCALE;

  // Word-wrap into lines
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > mw && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Calculate vertical centering within the title box
  const totalTextHeight = lines.length * lineHeight;
  const boxTopPx = titleBoxTop * SCALE;
  const boxHeightPx = titleBoxHeight * SCALE;
  const startY = boxTopPx + (boxHeightPx - totalTextHeight) / 2;

  // Clear the title area first (fill with background color)
  ctx.fillStyle = "#ece6f5";
  ctx.fillRect(
    (centerX - maxWidth / 2 - 10) * SCALE,
    boxTopPx + 3 * SCALE,
    (maxWidth + 20) * SCALE,
    boxHeightPx - 6 * SCALE
  );

  // Draw each line centered
  ctx.fillStyle = "#1a2550";
  ctx.font = font;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, startY + i * lineHeight);
  }

  return finalCanvas;
}

/** Estimate how many lines the title will occupy on canvas (must match compositeWithTitle logic) */
function estimateTitleLines(title: string, titleSize: number): number {
  // Approximate character width for Playfair Display bold at given size
  // Average char width ~= fontSize * 0.55 for this serif font
  const avgCharWidth = titleSize * 0.55;
  const maxWidth = 572; // same as compositeWithTitle maxWidth param
  const fullText = `\u201C${title}\u201D`;
  const words = fullText.split(/\s+/);

  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = word.length * avgCharWidth;
    const spaceWidth = avgCharWidth;
    if (lineWidth > 0 && lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines++;
      lineWidth = wordWidth;
    } else {
      lineWidth += (lineWidth > 0 ? spaceWidth : 0) + wordWidth;
    }
  }
  return Math.max(lines, 2); // at least 2 lines to ensure enough space
}

function buildCertificateHTML(data: PublicationCertificateData): string {
  const rawAuthorName = data.authorName || data.authors || "—";
  const authorName = toTitleCase(rawAuthorName);
  const { titleSize, nameSize } = adaptFontSizes(data.title.length, authorName.length);

  const sigUrl = "/signature.svg";
  const sealUrl = "/seals/seal-06.svg";

  const displayTitle = toTitleCase(data.title);

  // Calculate fixed title box height based on estimated line count
  // This ensures the box height matches what canvas will actually draw
  const estimatedLines = estimateTitleLines(displayTitle, titleSize);
  const lineHeight = titleSize * 1.35;
  const titleBoxContentHeight = estimatedLines * lineHeight;
  const titleBoxPadding = 18 + 22; // top + bottom padding
  const titleBoxTotalHeight = titleBoxContentHeight + titleBoxPadding;

  return `
<div style="
  width: ${PAGE_W}px; height: ${PAGE_H}px;
  font-family: 'EB Garamond', 'Georgia', serif;
  background: #ece6f5;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
">
  <!-- SVG wave background -->
  <svg viewBox="0 0 816 1056" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:816px;height:1056px;z-index:1;">
    <path d="M450,-10 C560,25 680,55 820,15 L820,-10 Z" fill="rgba(160,170,230,0.3)" />
    <path d="M350,5 C500,55 640,100 820,50 L820,5 Z" fill="rgba(145,155,218,0.22)" />
    <path d="M250,25 C430,90 610,145 820,85 L820,25 Z" fill="rgba(155,165,225,0.18)" />
    <path d="M150,55 C380,130 590,175 820,115 L820,55 Z" fill="rgba(148,158,222,0.14)" />
    <path d="M80,80 C320,160 560,200 820,145 L820,80 Z" fill="rgba(155,165,228,0.1)" />
    <path d="M-20,720 C80,680 280,660 480,710 C640,750 750,800 820,780 L820,1060 L-20,1060 Z" fill="rgba(155,165,225,0.22)" />
    <path d="M-20,770 C70,740 240,720 400,755 C560,785 700,840 820,820 L820,1060 L-20,1060 Z" fill="rgba(148,158,220,0.18)" />
    <path d="M-20,820 C90,795 270,780 440,810 C590,835 720,880 820,865 L820,1060 L-20,1060 Z" fill="rgba(160,170,235,0.14)" />
    <path d="M-20,870 C110,850 290,840 460,860 C610,878 730,915 820,905 L820,1060 L-20,1060 Z" fill="rgba(152,162,226,0.1)" />
    <path d="M680,0 C740,90 790,230 820,330 L820,0 Z" fill="rgba(165,175,238,0.08)" />
    <path d="M-20,880 C40,840 130,770 220,740 L-20,740 Z" fill="rgba(165,175,238,0.08)" />
  </svg>

  <div style="
    position: relative; z-index: 10;
    width: ${PAGE_W}px; height: ${PAGE_H}px;
    padding: 40px 80px;
    box-sizing: border-box;
  ">
    <!-- Header -->
    <div style="text-align: center; margin-top: 10px;">
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 30px; font-weight: 900;
        color: #1a2550; letter-spacing: 2px; text-transform: uppercase;
      ">American Impact Review</div>
      <div style="font-size: 14px; color: #555; margin-top: 2px;">A Peer-Reviewed Multidisciplinary Journal</div>
    </div>

    <!-- Certificate section -->
    <div style="text-align: center; width: 100%; margin-top: 40px;">
      <div style="width: 100%; height: 1.5px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent);"></div>
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 17px; font-weight: 700;
        color: #8a6d1b; letter-spacing: 5px; text-transform: uppercase;
        margin: 10px 0 2px;
      ">Certificate of Publication</div>
      <div style="color: #8a7a4a; font-size: 16px; margin-bottom: 8px;">&#9733;</div>
      <div style="width: 100%; height: 1.5px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent);"></div>
    </div>

    <!-- Body -->
    <div style="text-align: center; margin-top: 40px;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 18px; font-style: italic; color: #333; margin-bottom: 14px;
      ">This is to certify that the article entitled</div>
      <div id="cert-title-box" style="margin: 0 auto; max-width: 620px; border-top: 1.5px solid #1a2550; border-bottom: 1.5px solid #1a2550; height: ${titleBoxTotalHeight}px; box-sizing: border-box;">
      </div>
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 16px; font-style: italic; color: #333; margin-top: 18px; margin-bottom: 6px;
      ">authored by</div>
      <div style="
        font-family: 'Cinzel', serif;
        font-size: ${nameSize}px; font-weight: 600; color: #1a2550; line-height: 1.15;
        letter-spacing: 2px;
        margin-top: 8px; margin-bottom: 40px;
      ">${escapeHtml(authorName)}</div>
    </div>

    <!-- Details -->
    <div style="text-align: center; margin-top: 12px;">
      <div style="display: inline-block; text-align: left; font-size: 17px; color: #333; line-height: 1.8;">
        <div><span style="font-weight: 600; color: #1a2550; display: inline-block; width: 90px; text-align: right;">Received:</span> <span style="color: #8a7a4a;">|</span> <span style="font-style: italic;">${escapeHtml(data.receivedDate || "N/A")}</span></div>
        <div><span style="font-weight: 600; color: #1a2550; display: inline-block; width: 90px; text-align: right;">Published:</span> <span style="color: #8a7a4a;">|</span> <span style="font-style: italic;">${escapeHtml(data.publishedDate || "N/A")}</span></div>
        <div><span style="font-weight: 600; color: #1a2550; display: inline-block; width: 90px; text-align: right;">DOI:</span> <span style="color: #8a7a4a;">|</span> <span style="font-style: italic;">${escapeHtml(data.doi || "Pending")}</span></div>
      </div>
    </div>

    <!-- Peer reviewed text -->
    <div style="text-align: center; margin-top: 30px;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 17px; font-style: italic; color: #333; line-height: 1.5;
      ">
        has been peer reviewed and published in<br>
        <span style="font-weight: 700; font-style: italic; color: #1a2550;">American Impact Review</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="position: absolute; bottom: 40px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div style="text-align: left;">
        <img src="${sigUrl}" style="width: 240px; height: auto; display: block; margin-bottom: 2px;" crossorigin="anonymous">
        <div style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 14px; font-style: italic; color: #444;">Editor-in-Chief</div>
        <div style="font-size: 14px; color: #1a2550; font-weight: 600;">American Impact Review</div>
      </div>
      <div style="text-align: center;">
        <img src="${sealUrl}" style="width: 150px; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));" crossorigin="anonymous">
        <div style="font-size: 13px; color: #1a2550; margin-top: 4px; font-weight: 600; letter-spacing: 1px;">ISSN: ${escapeHtml(data.issn || "Pending")}</div>
      </div>
    </div>
  </div>
</div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadFonts(): Promise<void> {
  const fonts = [
    { family: "Playfair Display", url: "/fonts/PlayfairDisplay-SemiBold.ttf", weight: "700" },
    { family: "Amsterdam", url: "/fonts/Amsterdam.ttf", weight: "400" },
  ];

  const googleFontsLink = document.createElement("link");
  googleFontsLink.rel = "stylesheet";
  googleFontsLink.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@600&display=swap";
  document.head.appendChild(googleFontsLink);

  for (const f of fonts) {
    try {
      const face = new FontFace(f.family, `url(${f.url})`, { weight: f.weight });
      const loaded = await face.load();
      document.fonts.add(loaded);
    } catch {
      // Font loading failed, fallback will be used
    }
  }

  await document.fonts.ready;
}

export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  await loadFonts();

  const rawAuthorName = data.authorName || data.authors || "—";
  const authorName = toTitleCase(rawAuthorName);
  const { titleSize } = adaptFontSizes(data.title.length, authorName.length);
  const displayTitle = toTitleCase(data.title);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.innerHTML = buildCertificateHTML(data);
  document.body.appendChild(container);

  const certElement = container.firstElementChild as HTMLElement;

  // Wait for images and fonts to render
  await new Promise((r) => setTimeout(r, 500));

  // Get the title box position before html2canvas (relative to cert element)
  const titleBox = container.querySelector("#cert-title-box") as HTMLElement;
  const certRect = certElement.getBoundingClientRect();
  const titleRect = titleBox.getBoundingClientRect();
  const titleBoxTop = titleRect.top - certRect.top;
  const titleBoxHeight = titleRect.height;

  try {
    const h2cCanvas = await html2canvas(certElement, {
      scale: SCALE,
      width: PAGE_W,
      height: PAGE_H,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ece6f5",
      logging: false,
    });

    // Copy to a new canvas and draw title manually (html2canvas canvas is not drawable)
    const canvas = compositeWithTitle(
      h2cCanvas,
      displayTitle,
      titleSize,
      titleBoxTop,
      titleBoxHeight,
      572, // max text width in CSS px (620 - 24*2 padding)
      PAGE_W / 2, // center X
    );

    const pdfW = (PAGE_W / 96) * 25.4;
    const pdfH = (PAGE_H / 96) * 25.4;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfW, pdfH],
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");

    const pdfBytes = pdf.output("arraybuffer");
    return new Uint8Array(pdfBytes);
  } finally {
    document.body.removeChild(container);
  }
}
