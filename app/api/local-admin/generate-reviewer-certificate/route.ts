import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

export const maxDuration = 60;

interface ReviewerCertificateRequest {
  reviewerName: string;
  expertise: string;
  reviewCount: number;
  periodFrom: string;
  periodTo: string;
  issuedDate?: string;
}

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

const PAGE_W = 1056;
const PAGE_H = 816;

function buildCertificateHTML(data: ReviewerCertificateRequest): string {
  const nameSize = adaptNameSize(data.reviewerName.length);

  const issued = data.issuedDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reviewWord = data.reviewCount === 1 ? "review" : "reviews";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
  @page { size: ${PAGE_W}px ${PAGE_H}px; margin: 0; }
  body { margin: 0; padding: 0; }
</style>
</head>
<body>
<div style="
  width: ${PAGE_W}px; height: ${PAGE_H}px;
  font-family: 'EB Garamond', 'Georgia', serif;
  background: linear-gradient(160deg, #f5edda 0%, #e8dcc0 30%, #ddd0b0 60%, #d4c7a5 100%);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
">
  <!-- Navy top accent bar -->
  <div style="
    position: absolute; top: 0; left: 0; right: 0; height: 10px;
    background: linear-gradient(90deg, #0d1a3a 0%, #1a2550 40%, #2a3a6a 70%, #1a2550 100%);
    z-index: 20;
  "></div>

  <!-- Subtle vignette overlay -->
  <div style="
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(26,37,80,0.15) 100%);
    z-index: 1;
  "></div>

  <!-- Gold wave road -->
  <svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:${PAGE_W}px;height:${PAGE_H}px;z-index:5;">
    <defs>
      <linearGradient id="waveGold" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#b08a22" stop-opacity="0"/>
        <stop offset="20%" stop-color="#b08a22" stop-opacity="0.15"/>
        <stop offset="50%" stop-color="#b08a22" stop-opacity="0.40"/>
        <stop offset="75%" stop-color="#b08a22" stop-opacity="0.70"/>
        <stop offset="100%" stop-color="#b08a22" stop-opacity="1.0"/>
      </linearGradient>
    </defs>
    <path d="
      M${PAGE_W / 2},700
      C${PAGE_W / 2 + 52},695 ${PAGE_W / 2 + 112},680 ${PAGE_W / 2 + 172},690
      C${PAGE_W / 2 + 232},700 ${PAGE_W / 2 + 292},678 ${PAGE_W / 2 + 352},688
      C${PAGE_W / 2 + 412},698 ${PAGE_W / 2 + 472},676 ${PAGE_W},682
      L${PAGE_W},740
      C${PAGE_W / 2 + 472},726 ${PAGE_W / 2 + 412},760 ${PAGE_W / 2 + 352},742
      C${PAGE_W / 2 + 292},724 ${PAGE_W / 2 + 232},758 ${PAGE_W / 2 + 172},740
      C${PAGE_W / 2 + 112},722 ${PAGE_W / 2 + 52},745 ${PAGE_W / 2},704
      Z
    " fill="url(#waveGold)"/>
  </svg>

  <!-- Corner brackets -->
  <svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:${PAGE_W}px;height:${PAGE_H}px;z-index:1;">
    <path d="M40,40 L40,75" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M40,40 L75,40" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},40 L${PAGE_W - 40},75" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},40 L${PAGE_W - 75},40" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M40,${PAGE_H - 40} L40,${PAGE_H - 75}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M40,${PAGE_H - 40} L75,${PAGE_H - 40}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},${PAGE_H - 40} L${PAGE_W - 40},${PAGE_H - 75}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
    <path d="M${PAGE_W - 40},${PAGE_H - 40} L${PAGE_W - 75},${PAGE_H - 40}" stroke="#a07a18" stroke-width="2.5" fill="none"/>
  </svg>

  <!-- Gold border with diamond breaks -->
  <svg viewBox="0 0 ${PAGE_W} ${PAGE_H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:${PAGE_W}px;height:${PAGE_H}px;z-index:2;">
    <line x1="22" y1="22" x2="${PAGE_W - 22}" y2="22" stroke="#b08a22" stroke-width="2.5"/>
    <line x1="22" y1="${PAGE_H - 22}" x2="${PAGE_W / 2 - 14}" y2="${PAGE_H - 22}" stroke="#b08a22" stroke-width="2.5"/>
    <line x1="${PAGE_W / 2 + 14}" y1="${PAGE_H - 22}" x2="${PAGE_W - 22}" y2="${PAGE_H - 22}" stroke="#b08a22" stroke-width="2.5"/>
    <polygon points="${PAGE_W / 2},${PAGE_H - 34} ${PAGE_W / 2 + 12},${PAGE_H - 22} ${PAGE_W / 2},${PAGE_H - 10} ${PAGE_W / 2 - 12},${PAGE_H - 22}" fill="#b08a22"/>
    <line x1="22" y1="22" x2="22" y2="${PAGE_H / 2 - 14}" stroke="#b08a22" stroke-width="2.5"/>
    <line x1="22" y1="${PAGE_H / 2 + 14}" x2="22" y2="${PAGE_H - 22}" stroke="#b08a22" stroke-width="2.5"/>
    <polygon points="22,${PAGE_H / 2 - 12} 34,${PAGE_H / 2} 22,${PAGE_H / 2 + 12} 10,${PAGE_H / 2}" fill="#b08a22"/>
    <line x1="${PAGE_W - 22}" y1="22" x2="${PAGE_W - 22}" y2="${PAGE_H / 2 - 14}" stroke="#b08a22" stroke-width="2.5"/>
    <line x1="${PAGE_W - 22}" y1="${PAGE_H / 2 + 14}" x2="${PAGE_W - 22}" y2="${PAGE_H - 22}" stroke="#b08a22" stroke-width="2.5"/>
    <polygon points="${PAGE_W - 22},${PAGE_H / 2 - 12} ${PAGE_W - 10},${PAGE_H / 2} ${PAGE_W - 22},${PAGE_H / 2 + 12} ${PAGE_W - 34},${PAGE_H / 2}" fill="#b08a22"/>
  </svg>

  <!-- Main content -->
  <div style="
    position: relative; z-index: 10;
    width: ${PAGE_W}px; height: ${PAGE_H}px;
    display: flex; flex-direction: column;
    align-items: center;
    padding: 38px 80px 0;
    box-sizing: border-box;
  ">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 4px; margin-top: 4px;">
      <img src="https://americanimpactreview.com/logo-transparent.svg" style="width: 44px; height: 44px;">
      <div>
        <div style="
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 22px; font-weight: 900;
          color: #1a2550; letter-spacing: 1.5px; text-transform: uppercase;
          line-height: 1.1;
        ">American Impact Review</div>
        <div style="font-size: 13.5px; color: #555; letter-spacing: 0.5px; margin-top: 6px;">A Peer-Reviewed Multidisciplinary Journal</div>
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
    <div style="text-align: center; max-width: 780px; margin-top: 10px;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 19px; color: #333; line-height: 1.5; margin-bottom: 8px;
      ">We are pleased to confirm that</div>

      <!-- Reviewer name -->
      <div style="
        font-family: 'Great Vibes', cursive;
        font-size: ${nameSize}px; color: #1a2550; line-height: 1.2;
        margin-bottom: 0; position: relative; z-index: 2;
      ">${escapeHtml(data.reviewerName)}</div>

      <!-- Thin line under name -->
      <div style="width: 280px; height: 1px; background: #b08a22; margin: 10px auto 10px; position: relative; z-index: 1;"></div>

      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 18px; color: #222; line-height: 1.7;
      ">
        has completed <strong style="color: #1a2550;"><span style="font-size: 34px; font-weight: 700;">${data.reviewCount}</span> manuscript ${reviewWord}</strong> in the field of<br>
        <span style="
          font-family: 'Playfair Display', 'Georgia', serif;
          font-weight: 700; color: #1a2550; font-size: 20px;
        ">${escapeHtml(data.expertise || "Multidisciplinary Research")}</span><br>
        for <strong style="color: #1a2550;">American Impact Review</strong>${data.periodFrom && data.periodTo ? ` between <em>${escapeHtml(data.periodFrom)}</em> and <em>${escapeHtml(data.periodTo)}</em>` : ""}
      </div>
    </div>

    <!-- Recognition text -->
    <div style="
      text-align: center; max-width: 680px; margin-bottom: 0; margin-top: auto;
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 18px; font-style: italic; color: #333; line-height: 1.6;
    ">
      The reviewer\u2019s contributions have upheld the standards of academic rigor<br>
      and scholarly excellence expected by the journal.
    </div>

    <!-- Issued date -->
    <div style="text-align: center; font-size: 14px; color: #555; margin-bottom: 4px;">
      Issued: ${escapeHtml(issued)}
    </div>

    <!-- Signature + Seal row -->
    <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 16px; margin-bottom: 20px;">
      <div style="text-align: left;">
        <img src="https://americanimpactreview.com/signature.svg" style="width: 230px; height: auto; display: block; margin-bottom: 2px;">
        <div style="width: 230px; height: 1px; background: #666; margin-bottom: 4px;"></div>
        <div style="font-size: 16px; color: #1a2550; font-weight: 600;">Egor Akimov</div>
        <div style="font-family: 'Cormorant Garamond', serif; font-size: 15px; font-style: italic; color: #333;">Editor-in-Chief</div>
      </div>
      <div style="text-align: right;">
        <img src="https://americanimpactreview.com/seals/seal-06.svg" style="width: 115px; height: auto; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));">
      </div>
    </div>

    <!-- Navy footer -->
    <div style="
      width: calc(100% + 160px); margin: 0 -80px;
      background: linear-gradient(135deg, #1a2550 0%, #0d1a3a 100%);
      padding: 16px 56px 14px;
      box-sizing: border-box;
      flex: 0 0 auto;
    ">
      <div style="display: inline-block; vertical-align: middle; width: 38px; height: 38px; margin-right: 20px;">
        <img src="https://americanimpactreview.com/logo-transparent.svg" style="width: 38px; height: 38px; display: block;">
      </div><div style="display: inline-block; vertical-align: middle; width: calc(100% - 62px);
        font-family: 'EB Garamond', 'Georgia', serif;
        font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.45;
        margin: 0; padding: 0;
      ">American Impact Review is a peer-reviewed, open access, multidisciplinary academic journal published by Global Talent Foundation, a 501(c)(3) nonprofit organization. The journal relies on active researchers qualified in their field to provide review reports and support the editorial process. Reviewer selection criteria include: holding a doctoral degree or equivalent research experience, a national or international reputation in the relevant field, and a significant contribution evidenced by peer-reviewed publications.</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as ReviewerCertificateRequest;
  if (!body.reviewerName) {
    return NextResponse.json({ error: "reviewerName required" }, { status: 400 });
  }

  const html = buildCertificateHTML(body);

  const puppeteer = (await import("puppeteer-core")).default;
  const isVercel = !!process.env.VERCEL;

  let execPath: string;
  let launchArgs: string[];

  if (isVercel) {
    const chromiumMod = await import("@sparticuz/chromium-min");
    const Chromium = chromiumMod.default;
    const chromiumPack =
      "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";
    execPath = await Chromium.executablePath(chromiumPack);
    launchArgs = Chromium.args;
  } else {
    execPath = process.env.PUPPETEER_EXECUTABLE_PATH
      || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    launchArgs = ["--no-sandbox", "--disable-setuid-sandbox"];
  }

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath: execPath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: PAGE_W, height: PAGE_H, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: `${PAGE_W}px`,
      height: `${PAGE_H}px`,
      printBackground: true,
      landscape: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="reviewer-certificate.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
