import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

export const maxDuration = 60;

interface CertificateRequest {
  title: string;
  authorName: string;
  receivedDate?: string;
  publishedDate?: string;
  doi?: string;
  issn?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTitleCase(text: string): string {
  const small = new Set(["a","an","the","and","but","or","nor","for","yet","so","in","on","at","to","by","of","up","as","is","if","it","vs"]);
  const words = text.toLowerCase().split(/\s+/);
  return words.map((w, i) => {
    const capitalized = w.replace(/(^|-)(\w)/g, (_m: string, sep: string, ch: string) => sep + ch.toUpperCase());
    if (i === 0 || i === words.length - 1 || !small.has(w)) return capitalized;
    return w;
  }).join(" ");
}

function adaptFontSizes(titleLen: number, nameLen: number) {
  let titleSize: number;
  if (titleLen <= 60) titleSize = 26;
  else if (titleLen <= 100) titleSize = 22;
  else if (titleLen <= 150) titleSize = 19;
  else if (titleLen <= 200) titleSize = 17;
  else titleSize = 15;

  let nameSize: number;
  if (nameLen <= 15) nameSize = 48;
  else if (nameLen <= 25) nameSize = 42;
  else if (nameLen <= 35) nameSize = 36;
  else nameSize = 30;

  return { titleSize, nameSize };
}

function buildCertificateHTML(data: CertificateRequest): string {
  const authorName = toTitleCase(data.authorName);
  const displayTitle = toTitleCase(data.title);
  const { titleSize, nameSize } = adaptFontSizes(displayTitle.length, authorName.length);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cinzel:wght@600&display=swap" rel="stylesheet">
<style>
  @page { size: 816px 1056px; margin: 0; }
  body { margin: 0; padding: 0; }
</style>
</head>
<body>
<div style="
  width: 816px; height: 1056px;
  font-family: 'EB Garamond', 'Georgia', serif;
  background: #ece6f5;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
">
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
    width: 816px; height: 1056px;
    padding: 40px 80px;
    box-sizing: border-box;
  ">
    <!-- Header with logo -->
    <div style="text-align: center; margin-top: 10px;">
      <img src="https://americanimpactreview.com/logo-transparent.svg" style="width: 50px; height: 50px; margin-bottom: 6px;">
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 30px; font-weight: 900;
        color: #1a2550; letter-spacing: 2px; text-transform: uppercase;
      ">American Impact Review</div>
      <div style="font-size: 14px; color: #555; margin-top: 2px;">A Peer-Reviewed Multidisciplinary Journal</div>
    </div>

    <!-- Certificate section -->
    <div style="text-align: center; width: 100%; margin-top: 36px;">
      <div style="width: 50%; height: 1px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent); margin: 0 auto;"></div>
      <div style="
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: 17px; font-weight: 700;
        color: #8a6d1b; letter-spacing: 5px; text-transform: uppercase;
        padding: 12px 0 16px;
      ">Certificate of Publication</div>
      <div style="width: 50%; height: 1px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent); margin: 0 auto;"></div>
    </div>

    <!-- Body -->
    <div style="text-align: center; margin-top: 40px;">
      <div style="
        font-family: 'Cormorant Garamond', 'Georgia', serif;
        font-size: 18px; font-style: italic; color: #333; margin-bottom: 14px;
      ">This is to certify that the article entitled</div>
      <div style="margin: 0 auto; max-width: 620px; padding: 18px 24px 22px;">
        <div style="
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: ${titleSize}px; font-weight: 700; color: #1a2550; line-height: 1.35; text-align: center;
        ">&ldquo;${escapeHtml(displayTitle)}&rdquo;</div>
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
    <div style="margin-top: 12px; font-size: 17px; color: #333; font-style: normal; width: 100%;">
      <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
        <span style="font-weight: 600; color: #1a2550; width: 50%; text-align: right; padding-right: 12px; box-sizing: border-box;">Received:</span>
        <span style="color: #8a7a4a; flex-shrink: 0;">|</span>
        <span style="width: 50%; padding-left: 12px; box-sizing: border-box;">${escapeHtml(data.receivedDate || "N/A")}</span>
      </div>
      <div style="display: flex; align-items: baseline; margin-bottom: 4px;">
        <span style="font-weight: 600; color: #1a2550; width: 50%; text-align: right; padding-right: 12px; box-sizing: border-box;">Published:</span>
        <span style="color: #8a7a4a; flex-shrink: 0;">|</span>
        <span style="width: 50%; padding-left: 12px; box-sizing: border-box;">${escapeHtml(data.publishedDate || "N/A")}</span>
      </div>
      <div style="display: flex; align-items: baseline;">
        <span style="font-weight: 600; color: #1a2550; width: 50%; text-align: right; padding-right: 12px; box-sizing: border-box;">DOI:</span>
        <span style="color: #8a7a4a; flex-shrink: 0;">|</span>
        <span style="width: 50%; padding-left: 12px; box-sizing: border-box; font-size: 15px;">${escapeHtml(data.doi || "Pending")}</span>
      </div>
    </div>

    <div style="width: 40%; height: 1px; background: linear-gradient(90deg, transparent, #8a7a4a, transparent); margin: 24px auto 0;"></div>

    <!-- Peer reviewed text -->
    <div style="text-align: center; margin-top: 20px;">
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
        <img src="https://americanimpactreview.com/signature.svg" style="width: 240px; height: auto; display: block; margin-bottom: 2px;">
        <div style="font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 14px; font-style: italic; color: #444;">Editor-in-Chief</div>
        <div style="font-size: 14px; color: #1a2550; font-weight: 600;">American Impact Review</div>
      </div>
      <div style="text-align: center;">
        <img src="https://americanimpactreview.com/seals/seal-06.svg" style="width: 150px; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));">
        <div style="font-size: 13px; color: #1a2550; margin-top: 4px; font-weight: 600; letter-spacing: 1px;">ISSN: ${escapeHtml(data.issn || "Pending")}</div>
      </div>
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

  const body = (await req.json()) as CertificateRequest;
  if (!body.title || !body.authorName) {
    return NextResponse.json({ error: "title and authorName required" }, { status: 400 });
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
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: "816px",
      height: "1056px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
