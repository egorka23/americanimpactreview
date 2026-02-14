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

function adaptFontSizes(titleLen: number, nameLen: number) {
  let titleSize: number;
  let nameSize: number;
  if (titleLen <= 60) titleSize = 26;
  else if (titleLen <= 100) titleSize = 22;
  else if (titleLen <= 150) titleSize = 19;
  else if (titleLen <= 200) titleSize = 17;
  else titleSize = 15;

  if (nameLen <= 15) nameSize = 34;
  else if (nameLen <= 25) nameSize = 30;
  else if (nameLen <= 35) nameSize = 26;
  else nameSize = 22;

  return { titleSize, nameSize };
}

function buildCertificateHTML(data: PublicationCertificateData): string {
  const authorName = data.authorName || data.authors || "—";
  const { titleSize, nameSize } = adaptFontSizes(data.title.length, authorName.length);

  // Signature as inline SVG data URI for html2canvas compatibility
  const sigUrl = "/signature.svg";
  // Seal as inline img
  const sealUrl = "/seals/seal-06.svg";

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

  <!-- Content -->
  <div style="
    position: relative; z-index: 10;
    width: ${PAGE_W}px; height: ${PAGE_H}px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-evenly;
    padding: 40px 80px;
    box-sizing: border-box;
  ">
    <!-- Header -->
    <div style="text-align: center;">
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 30px; font-weight: 900;
        color: #1a2550; letter-spacing: 2px; text-transform: uppercase;
      ">American Impact Review</div>
      <div style="font-size: 14px; color: #555; margin-top: 2px;">A Peer-Reviewed Multidisciplinary Journal</div>
    </div>

    <!-- Certificate section -->
    <div style="text-align: center; width: 100%;">
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
    <div style="text-align: center;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 18px; font-style: italic; color: #333; margin-bottom: 14px;
      ">This is to certify that the article entitled</div>
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-weight: 700; color: #1a2550;
        text-align: center; padding: 12px 24px;
        border-top: 1.5px solid #1a2550; border-bottom: 1.5px solid #1a2550;
        max-width: 580px; line-height: 1.35;
        font-size: ${titleSize}px;
        margin: 0 auto;
        word-spacing: normal; letter-spacing: normal;
      ">\u201C${escapeHtml(data.title)}\u201D</div>
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 16px; font-style: italic; color: #333; margin-top: 18px; margin-bottom: 6px;
      ">authored by</div>
      <div style="
        font-family: 'Amsterdam', 'Great Vibes', cursive;
        font-size: ${nameSize}px; color: #1a2550; line-height: 1.15;
        margin-top: 8px; margin-bottom: 24px;
      ">${escapeHtml(authorName)}</div>
    </div>

    <!-- Details -->
    <div style="text-align: center; margin-top: 12px;">
      <div style="display: inline-block; text-align: left; font-size: 17px; color: #333; line-height: 1.8;">
        <div style="display: flex; gap: 8px;">
          <span style="font-weight: 600; text-align: right; min-width: 80px; color: #1a2550;">Received:</span>
          <span style="color: #8a7a4a;">|</span>
          <span style="font-style: italic;">${escapeHtml(data.receivedDate || "N/A")}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="font-weight: 600; text-align: right; min-width: 80px; color: #1a2550;">Published:</span>
          <span style="color: #8a7a4a;">|</span>
          <span style="font-style: italic;">${escapeHtml(data.publishedDate || "N/A")}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <span style="font-weight: 600; text-align: right; min-width: 80px; color: #1a2550;">DOI:</span>
          <span style="color: #8a7a4a;">|</span>
          <span style="font-style: italic;">${escapeHtml(data.doi || "Pending")}</span>
        </div>
      </div>
    </div>

    <!-- Peer reviewed text -->
    <div style="text-align: center;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 17px; font-style: italic; color: #333; line-height: 1.5;
      ">
        has been peer reviewed and published in<br>
        <span style="font-weight: 700; font-style: italic; color: #1a2550;">American Impact Review</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end;">
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
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&display=swap";
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

  // Wait for all fonts to be ready
  await document.fonts.ready;
}

export async function generatePublicationCertificate(
  data: PublicationCertificateData
): Promise<Uint8Array> {
  // Load fonts first
  await loadFonts();

  // Create hidden container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-1";
  container.innerHTML = buildCertificateHTML(data);
  document.body.appendChild(container);

  const certElement = container.firstElementChild as HTMLElement;

  // Wait a bit for images and fonts to render
  await new Promise((r) => setTimeout(r, 500));

  try {
    // Render to canvas at 2x for high quality
    const canvas = await html2canvas(certElement, {
      scale: 2,
      width: PAGE_W,
      height: PAGE_H,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ece6f5",
      logging: false,
    });

    // Create PDF — portrait, custom size in mm
    // 816px / 96dpi * 25.4mm = 215.9mm, 1056px / 96dpi * 25.4mm = 279.4mm (≈ US Letter)
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
