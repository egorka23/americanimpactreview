import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type ReviewerCertificateData = {
  reviewerName: string;
  expertise: string;
  reviewCount: number;
  periodFrom: string;
  periodTo: string;
  issuedDate?: string;
};

// Landscape: 11 × 8.5 inches at 96 dpi
const PAGE_W = 1056;
const PAGE_H = 816;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adaptNameSize(nameLen: number): number {
  if (nameLen <= 15) return 56;
  if (nameLen <= 25) return 48;
  if (nameLen <= 35) return 40;
  return 34;
}

function buildCertificateHTML(data: ReviewerCertificateData): string {
  const nameSize = adaptNameSize(data.reviewerName.length);
  const sigUrl = "/signature.svg";
  const sealUrl = "/seals/seal-06.svg";

  const issued = data.issuedDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reviewWord = data.reviewCount === 1 ? "review" : "reviews";

  return `
<div style="
  width: ${PAGE_W}px; height: ${PAGE_H}px;
  font-family: 'EB Garamond', 'Georgia', serif;
  background: radial-gradient(ellipse at 50% 40%, #faf7ef 0%, #f0eadb 40%, #e2d9c5 100%);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
">
  <!-- Navy top accent bar -->
  <div style="
    position: absolute; top: 0; left: 0; right: 0; height: 6px;
    background: linear-gradient(90deg, #0d1a3a 0%, #1a2550 40%, #2a3a6a 70%, #1a2550 100%);
    z-index: 20;
  "></div>

  <!-- Subtle vignette overlay for depth -->
  <div style="
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(26,37,80,0.08) 100%);
    z-index: 1;
  "></div>

  <!-- Background SVG: corner brackets only -->
  <svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:${PAGE_W}px;height:${PAGE_H}px;z-index:1;">
    <!-- Corner ornamental brackets -->
    <!-- Top-left -->
    <path d="M40,40 L40,75" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M40,40 L75,40" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <!-- Top-right -->
    <path d="M${PAGE_W - 40},40 L${PAGE_W - 40},75" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},40 L${PAGE_W - 75},40" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <!-- Bottom-left -->
    <path d="M40,${PAGE_H - 40} L40,${PAGE_H - 75}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M40,${PAGE_H - 40} L75,${PAGE_H - 40}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <!-- Bottom-right -->
    <path d="M${PAGE_W - 40},${PAGE_H - 40} L${PAGE_W - 40},${PAGE_H - 75}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},${PAGE_H - 40} L${PAGE_W - 75},${PAGE_H - 40}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
  </svg>

  <!-- Thin border frame -->
  <div style="
    position: absolute; top: 22px; left: 22px; right: 22px; bottom: 22px;
    border: 2.5px solid #b08a22;
    z-index: 2;
    box-sizing: border-box;
  "></div>

  <!-- Main content -->
  <div style="
    position: relative; z-index: 10;
    width: ${PAGE_W}px; height: ${PAGE_H}px;
    display: flex; flex-direction: column;
    align-items: center;
    padding: 38px 80px 0;
    box-sizing: border-box;
  ">
    <!-- Header: logo + journal name -->
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 4px; margin-top: 4px;">
      <img src="/logo.png" style="width: 44px; height: 44px; border-radius: 50%;" crossorigin="anonymous">
      <div>
        <div style="
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 22px; font-weight: 900;
          color: #1a2550; letter-spacing: 1.5px; text-transform: uppercase;
          line-height: 1.1;
        ">American Impact Review</div>
        <div style="font-size: 11.5px; color: #555; letter-spacing: 0.5px;">A Peer-Reviewed Multidisciplinary Journal &nbsp;\u2022&nbsp; Published by Global Talent Foundation</div>
      </div>
    </div>

    <!-- Gold ornamental divider -->
    <div style="display: flex; align-items: center; gap: 12px; margin: 12px 0 8px; width: 70%;">
      <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #a07a18);"></div>
      <div style="color: #a07a18; font-size: 10px; letter-spacing: 4px;">\u2726 \u2726 \u2726</div>
      <div style="flex: 1; height: 1px; background: linear-gradient(90deg, #a07a18, transparent);"></div>
    </div>

    <!-- Certificate title -->
    <div style="text-align: center; margin: 4px 0 2px;">
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 30px; font-weight: 700;
        color: #1a2550; letter-spacing: 7px; text-transform: uppercase;
      ">Reviewer Certificate</div>
    </div>

    <!-- Small gold divider -->
    <div style="width: 120px; height: 1px; background: linear-gradient(90deg, transparent, #a07a18, transparent); margin: 8px 0 16px;"></div>

    <!-- Body text -->
    <div style="text-align: center; max-width: 780px;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 17px; color: #333; line-height: 1.5; margin-bottom: 8px;
      ">We are pleased to confirm that</div>

      <!-- Reviewer name -->
      <div style="
        font-family: 'Great Vibes', cursive;
        font-size: ${nameSize}px; color: #1a2550; line-height: 1.2;
        margin-bottom: 0;
      ">${escapeHtml(data.reviewerName)}</div>

      <!-- Thin line under name -->
      <div style="width: 280px; height: 1px; background: #b08a22; margin: 14px auto 14px;"></div>

      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 16px; color: #222; line-height: 1.7;
      ">
        has completed <strong style="color: #1a2550;">${data.reviewCount} manuscript ${reviewWord}</strong> in the field of<br>
        <span style="
          font-family: 'Playfair Display', 'Georgia', serif;
          font-weight: 700; color: #1a2550; font-size: 18px;
        ">${escapeHtml(data.expertise || "Multidisciplinary Research")}</span><br>
        for <strong style="color: #1a2550;">American Impact Review</strong>${data.periodFrom && data.periodTo ? ` between <em>${escapeHtml(data.periodFrom)}</em> and <em>${escapeHtml(data.periodTo)}</em>` : ""}
      </div>
    </div>

    <!-- Spacer -->
    <div style="flex: 1;"></div>

    <!-- Recognition text -->
    <div style="
      text-align: center; max-width: 680px; margin-bottom: 16px;
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 16px; font-style: italic; color: #333; line-height: 1.6;
    ">
      The reviewer\u2019s contributions have upheld the standards of academic rigor<br>
      and scholarly excellence expected by the journal.
    </div>

    <!-- Issued date (centered, under recognition text) -->
    <div style="text-align: center; font-size: 12px; color: #555; margin-bottom: 14px;">
      Issued: ${escapeHtml(issued)}
    </div>

    <!-- Signature + Seal row -->
    <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 16px; margin-bottom: 8px;">
      <!-- Signature block -->
      <div style="text-align: left;">
        <img src="${sigUrl}" style="width: 190px; height: auto; display: block; margin-bottom: 2px;" crossorigin="anonymous">
        <div style="width: 190px; height: 1px; background: #666; margin-bottom: 4px;"></div>
        <div style="font-size: 13px; color: #1a2550; font-weight: 600;">Egor Akimov</div>
        <div style="font-family: 'Cormorant Garamond', serif; font-size: 13px; font-style: italic; color: #333;">Editor-in-Chief</div>
        <div style="font-size: 12.5px; color: #1a2550; font-weight: 600;">American Impact Review</div>
      </div>

      <!-- Seal -->
      <div style="text-align: right;">
        <img src="${sealUrl}" style="width: 115px; height: auto; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));" crossorigin="anonymous">
      </div>
    </div>

    <!-- Navy footer band with reviewer qualifications (like MDPI) -->
    <div style="
      width: calc(100% + 160px); margin: 0 -80px;
      background: linear-gradient(135deg, #1a2550 0%, #0d1a3a 100%);
      padding: 11px 56px;
      display: flex; align-items: center; gap: 20px;
      box-sizing: border-box;
    ">
      <img src="/logo.png" style="width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; opacity: 0.85;" crossorigin="anonymous">
      <div style="
        font-family: 'EB Garamond', 'Georgia', serif;
        font-size: 10.5px; color: rgba(255,255,255,0.85); line-height: 1.5;
      ">
        American Impact Review is a peer-reviewed, open access, multidisciplinary academic journal published by Global Talent Foundation, a 501(c)(3) nonprofit organization.
        The journal relies on active researchers qualified in their field to provide review reports and support the editorial process.
        Reviewer selection criteria include: holding a doctoral degree or equivalent research experience, a national or international reputation in the relevant field, and
        a significant contribution evidenced by peer-reviewed publications.
      </div>
    </div>
  </div>
</div>`;
}

async function loadFonts(): Promise<void> {
  const fonts = [
    { family: "Playfair Display", url: "/fonts/PlayfairDisplay-SemiBold.ttf", weight: "700" },
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

  await document.fonts.ready;
}

export async function generateReviewerCertificate(
  data: ReviewerCertificateData
): Promise<Uint8Array> {
  await loadFonts();

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

  try {
    const canvas = await html2canvas(certElement, {
      scale: 2,
      width: PAGE_W,
      height: PAGE_H,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#f3efe5",
      logging: false,
    });

    const pdfW = (PAGE_W / 96) * 25.4;
    const pdfH = (PAGE_H / 96) * 25.4;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [pdfH, pdfW],
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");

    const pdfBytes = pdf.output("arraybuffer");
    return new Uint8Array(pdfBytes);
  } finally {
    document.body.removeChild(container);
  }
}
