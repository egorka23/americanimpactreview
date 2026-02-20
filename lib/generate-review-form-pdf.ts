import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";

/** Generate a deterministic document ID from review data using SHA-256 */
async function generateDocId(data: ReviewFormPdfData): Promise<string> {
  const payload = [
    data.reviewerEmail,
    data.manuscriptId,
    data.recommendation,
    data.submittedAt || "",
  ].join("|");
  const buf = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `AIR-PRR-${hex.slice(0, 8).toUpperCase()}`;
}

/** Generate full SHA-256 hex for verification display */
async function generateFullHash(data: ReviewFormPdfData): Promise<string> {
  const payload = [
    data.reviewerEmail,
    data.manuscriptId,
    data.recommendation,
    data.submittedAt || "",
    data.reviewerName,
    data.title || "",
  ].join("|");
  const buf = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface ReviewFormPdfData {
  reviewerName: string;
  reviewerEmail: string;
  manuscriptId: string;
  title?: string;
  objectivesClear: string;
  literatureAdequate: string;
  introComments: string;
  methodsReproducible: string;
  statisticsAppropriate: string;
  methodsComments: string;
  resultsPresentation: string;
  tablesAppropriate: string;
  resultsComments: string;
  conclusionsSupported: string;
  limitationsStated: string;
  discussionComments: string;
  originality: string;
  methodology: string;
  clarity: string;
  significance: string;
  languageEditing: string;
  majorIssues: string;
  minorIssues: string;
  commentsToAuthors: string;
  confidentialComments: string;
  recommendation: string;
  submittedAt?: string;
}

// ─── Layout constants ───
const PAGE_W = 612;
const PAGE_H = 792;
const ML = 48; // left margin matching v3 padding
const MR = 48;
const MT = 44;
const MB = 50;
const CW = PAGE_W - ML - MR; // content width
const INDENT = 12; // checklist/comment indent from section heads

// ─── Colors (matching v3 HTML) ───
const NAVY = rgb(30 / 255, 58 / 255, 95 / 255);     // #1e3a5f
const BLACK = rgb(26 / 255, 26 / 255, 26 / 255);     // #1a1a1a
const DARK = rgb(34 / 255, 34 / 255, 34 / 255);      // #222
const TEXT = rgb(51 / 255, 51 / 255, 51 / 255);       // #333
const GRAY = rgb(102 / 255, 102 / 255, 102 / 255);    // #666
const GRAY_MED = rgb(85 / 255, 85 / 255, 85 / 255);   // #555
const GRAY_LIGHT = rgb(119 / 255, 119 / 255, 119 / 255); // #777
const META_BG = rgb(240 / 255, 243 / 255, 247 / 255); // #f0f3f7
const CHECK_YES_BG = rgb(232 / 255, 237 / 255, 244 / 255); // #e8edf4
const CHECK_NO_BG = rgb(255 / 255, 235 / 255, 238 / 255);  // #ffebee
const CHECK_NO_CLR = rgb(198 / 255, 40 / 255, 40 / 255);   // #c62828
const BORDER_CLR = rgb(176 / 255, 189 / 255, 208 / 255);   // #b0bdd0
const WHITE = rgb(1, 1, 1);

function safe(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, " ");
}

export async function generateReviewFormPdf(data: ReviewFormPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Fonts: Helvetica family = sans-serif (Roboto substitute), TimesRoman = serif (Lora substitute)
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const sansO = await doc.embedFont(StandardFonts.HelveticaOblique);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifI = await doc.embedFont(StandardFonts.TimesRomanItalic);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MT;

  const docId = await generateDocId(data);
  const fullHash = await generateFullHash(data);
  const issueDate = data.submittedAt || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ─── Helpers ───
  function np() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MT;
    // Draw navy top border on new page
    page.drawRectangle({ x: 0, y: PAGE_H - 5, width: PAGE_W, height: 5, color: NAVY });
    y -= 5;
  }

  function need(h: number) {
    if (y - h < MB) np();
  }

  /** Word-wrap text and draw it, returns number of lines drawn */
  function drawText(s: string, opts: {
    x?: number; sz?: number; font?: PDFFont; color?: typeof NAVY; mw?: number; lineH?: number;
  } = {}): number {
    const { x = ML, sz = 9.5, font = serif, color = DARK, mw = CW, lineH = sz * 1.6 } = opts;
    const words = safe(s).split(/\s+/).filter(Boolean);
    if (!words.length) return 0;
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, sz) > mw && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    let count = 0;
    for (const ln of lines) {
      need(lineH);
      page.drawText(ln, { x, y: y - sz, size: sz, font, color });
      y -= lineH;
      count++;
    }
    return count;
  }

  /** Draw multiline text (splits on \n first) */
  function drawMultiline(s: string, opts: Parameters<typeof drawText>[1] = {}) {
    if (!s.trim()) return;
    for (const p of s.split(/\n/)) {
      if (p.trim()) drawText(p.trim(), opts);
      else y -= 6;
    }
  }

  /** Draw centered text */
  function drawCentered(s: string, opts: {
    sz?: number; font?: PDFFont; color?: typeof NAVY;
  } = {}) {
    const { sz = 15, font = serifB, color = BLACK } = opts;
    const txt = safe(s);
    const w = font.widthOfTextAtSize(txt, sz);
    need(sz + 4);
    page.drawText(txt, { x: (PAGE_W - w) / 2, y: y - sz, size: sz, font, color });
    y -= sz + 4;
  }

  // ─── NAVY TOP BORDER ───
  page.drawRectangle({ x: 0, y: PAGE_H - 5, width: PAGE_W, height: 5, color: NAVY });
  y -= 5;

  // ─── HEADER: left logo + right badge ───
  y -= 2;
  // Left: AMERICAN IMPACT REVIEW
  page.drawText("AMERICAN IMPACT REVIEW", { x: ML, y: y - 11, size: 11, font: sansB, color: NAVY });
  // Below: tagline
  page.drawText("Published by Global Talent Foundation 501(c)(3)", { x: ML, y: y - 20, size: 7, font: sans, color: GRAY });

  // Right: black badge "PEER REVIEW RECORD"
  const badgeText = "PEER REVIEW RECORD";
  const badgeFontSz = 7.5;
  const badgeW = sansB.widthOfTextAtSize(badgeText, badgeFontSz) + 20;
  const badgeH = 14;
  const badgeX = PAGE_W - MR - badgeW;
  const badgeY = y - 14;
  page.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: badgeH, color: BLACK });
  page.drawText(badgeText, { x: badgeX + 10, y: badgeY + 3.5, size: badgeFontSz, font: sansB, color: WHITE });

  // Doc ID below badge
  const idText = docId;
  const idW = sans.widthOfTextAtSize(idText, 7);
  page.drawText(idText, { x: PAGE_W - MR - idW, y: badgeY - 10, size: 7, font: sans, color: GRAY });

  y -= 30;

  // ─── Navy divider line ───
  page.drawRectangle({ x: ML, y: y, width: CW, height: 1.5, color: NAVY });
  y -= 12;

  // ─── PEER REVIEW RECORD (centered title) ───
  drawCentered("Peer Review Record", { sz: 15, font: serifB, color: BLACK });
  y -= 1;

  // ─── Manuscript title (centered, italic) ───
  if (data.title) {
    const titleText = safe(data.title);
    const titleSz = 12;
    const titleFont = serifI;
    const maxTitleW = CW - 40;
    // Word-wrap centered
    const words = titleText.split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (titleFont.widthOfTextAtSize(t, titleSz) > maxTitleW && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    for (const ln of lines) {
      const lw = titleFont.widthOfTextAtSize(ln, titleSz);
      need(titleSz + 4);
      page.drawText(ln, { x: (PAGE_W - lw) / 2, y: y - titleSz, size: titleSz, font: titleFont, color: rgb(68/255, 68/255, 68/255) });
      y -= titleSz + 4;
    }
    y -= 1;
  }

  // ─── Manuscript subtitle line ───
  const subtitleId = data.manuscriptId.length > 20
    ? data.manuscriptId.slice(0, 8) + "..."
    : data.manuscriptId;
  const subtitleDate = issueDate.replace(/\s+at\s*$/, "").replace(/\s+at\s+\d.*$/, "");
  const subtitleParts = [
    `Manuscript ${subtitleId}`,
    "Single-blind Review",
    subtitleDate,
  ];
  const subtitleText = subtitleParts.join("  ·  ");
  let stSz = 9;
  let stW = sans.widthOfTextAtSize(subtitleText, stSz);
  if (stW > CW) { stSz = 7.5; stW = sans.widthOfTextAtSize(subtitleText, stSz); }
  need(14);
  page.drawText(subtitleText, { x: (PAGE_W - stW) / 2, y: y - stSz, size: stSz, font: sans, color: GRAY });
  y -= 18;

  // ─── REVIEWED BY (prominent) ───
  need(40);
  const rbLabel = "REVIEWED BY";
  const rbLabelW = sansB.widthOfTextAtSize(rbLabel, 7);
  page.drawText(rbLabel, { x: (PAGE_W - rbLabelW) / 2, y: y - 7, size: 7, font: sansB, color: NAVY });
  y -= 14;

  const nameText = safe(data.reviewerName);
  const nameW = serifB.widthOfTextAtSize(nameText, 16);
  page.drawText(nameText, { x: (PAGE_W - nameW) / 2, y: y - 16, size: 16, font: serifB, color: BLACK });
  y -= 20;

  const emailText = safe(data.reviewerEmail);
  const emailW = sans.widthOfTextAtSize(emailText, 8.5);
  page.drawText(emailText, { x: (PAGE_W - emailW) / 2, y: y - 8.5, size: 8.5, font: sans, color: GRAY_MED });
  y -= 16;

  // ─── TWO-COL META BOXES ───
  need(60);
  const metaBoxH = 50;
  const metaGap = 12;
  const metaColW = (CW - metaGap) / 2;

  // Left meta col: Reviewer
  const metaLX = ML;
  const metaLY = y - metaBoxH;
  page.drawRectangle({ x: metaLX, y: metaLY, width: metaColW, height: metaBoxH, color: META_BG });
  page.drawRectangle({ x: metaLX, y: metaLY, width: 3, height: metaBoxH, color: NAVY });

  let my = y - 14;
  page.drawText("REVIEWER", { x: metaLX + 12, y: my, size: 9, font: sansB, color: NAVY });
  my -= 14;
  page.drawText("Name", { x: metaLX + 12, y: my, size: 8, font: sans, color: GRAY });
  const nameVal = safe(data.reviewerName);
  const lblNameW = sans.widthOfTextAtSize("Name", 8);
  const maxNameW = metaColW - 24 - lblNameW - 10;
  let nameSz = 9;
  if (sansB.widthOfTextAtSize(nameVal, nameSz) > maxNameW) nameSz = 7.5;
  const nameValW = sansB.widthOfTextAtSize(nameVal, nameSz);
  page.drawText(nameVal, { x: metaLX + metaColW - 12 - nameValW, y: my, size: nameSz, font: sansB, color: DARK });
  my -= 12;
  page.drawText("Email", { x: metaLX + 12, y: my, size: 8, font: sans, color: GRAY });
  const emailVal = safe(data.reviewerEmail);
  const lblEmailW = sans.widthOfTextAtSize("Email", 8);
  const maxEmailW = metaColW - 24 - lblEmailW - 10;
  let emailSz = 9;
  if (sansB.widthOfTextAtSize(emailVal, emailSz) > maxEmailW) emailSz = 7.5;
  if (sansB.widthOfTextAtSize(emailVal, emailSz) > maxEmailW) emailSz = 6.5;
  const emailValW = sansB.widthOfTextAtSize(emailVal, emailSz);
  page.drawText(emailVal, { x: metaLX + metaColW - 12 - emailValW, y: my, size: emailSz, font: sansB, color: DARK });

  // Right meta col: Manuscript
  const metaRX = ML + metaColW + metaGap;
  const metaRY = y - metaBoxH;
  page.drawRectangle({ x: metaRX, y: metaRY, width: metaColW, height: metaBoxH, color: META_BG });
  page.drawRectangle({ x: metaRX, y: metaRY, width: 3, height: metaBoxH, color: NAVY });

  my = y - 14;
  page.drawText("MANUSCRIPT", { x: metaRX + 12, y: my, size: 9, font: sansB, color: NAVY });
  my -= 14;

  // Truncate manuscript ID for display (UUIDs are too long for the meta box)
  const displayId = data.manuscriptId.length > 18
    ? data.manuscriptId.slice(0, 8) + "..."
    : data.manuscriptId;
  // Clean date: remove " at" suffix and extra time info
  const displayDate = issueDate.replace(/\s+at\s*$/, "").replace(/\s+at\s+\d.*$/, "");

  const metaRows: [string, string][] = [
    ["ID", displayId],
    ["Date", displayDate],
    ["Type", "Single-blind"],
  ];
  for (const [lbl, val] of metaRows) {
    page.drawText(lbl, { x: metaRX + 12, y: my, size: 8, font: sans, color: GRAY });
    const vStr = safe(val);
    // Use smaller font if value is still too wide
    let vSz = 9;
    const maxVW = metaColW - 24 - sans.widthOfTextAtSize(lbl, 8) - 10;
    if (sansB.widthOfTextAtSize(vStr, vSz) > maxVW) vSz = 7.5;
    const vW = sansB.widthOfTextAtSize(vStr, vSz);
    page.drawText(vStr, { x: metaRX + metaColW - 12 - vW, y: my, size: vSz, font: sansB, color: DARK });
    my -= 12;
  }

  y = metaLY - 16;

  // ─── SECTION HELPERS ───
  function sectionHead(title: string) {
    need(34);
    y -= 14; // gap above section heading
    page.drawText(safe(title.toUpperCase()), { x: ML, y: y - 13, size: 13, font: sansB, color: NAVY });
    y -= 24;
  }

  function checkItem(label: string, value: string) {
    need(20);
    const isYes = value === "Yes";
    const boxSize = 18;
    const boxX = ML + INDENT;
    const boxY = y - boxSize;

    // Rounded rect background
    page.drawRectangle({
      x: boxX, y: boxY, width: boxSize, height: boxSize,
      color: isYes ? CHECK_YES_BG : CHECK_NO_BG,
    });

    // Checkmark or X drawn as vector paths (not text characters)
    const symColor = isYes ? NAVY : CHECK_NO_CLR;
    const cx = boxX + boxSize / 2;
    const cy = boxY + boxSize / 2;
    if (isYes) {
      // Draw checkmark: two lines forming a "V" shape
      // Stroke from (cx-4, cy) to (cx-1, cy-4) to (cx+5, cy+4)
      const lw = 2;
      page.drawLine({ start: { x: cx - 4.5, y: cy + 0.5 }, end: { x: cx - 1, y: cy - 3 }, thickness: lw, color: symColor });
      page.drawLine({ start: { x: cx - 1, y: cy - 3 }, end: { x: cx + 5, y: cy + 4 }, thickness: lw, color: symColor });
    } else {
      // Draw X: two diagonal lines
      const r = 3.5;
      const lw = 1.8;
      page.drawLine({ start: { x: cx - r, y: cy + r }, end: { x: cx + r, y: cy - r }, thickness: lw, color: symColor });
      page.drawLine({ start: { x: cx - r, y: cy - r }, end: { x: cx + r, y: cy + r }, thickness: lw, color: symColor });
    }

    // Label text
    page.drawText(safe(label), {
      x: boxX + boxSize + 6,
      y: boxY + 4,
      size: 9.5, font: serif, color: TEXT,
    });

    y -= boxSize + 4;
  }

  function commentLabel(label: string) {
    need(16);
    page.drawText(safe(label.toUpperCase()), {
      x: ML + INDENT, y: y - 9, size: 9, font: sansB, color: GRAY_MED,
    });
    y -= 16;
  }

  function commentText(s: string) {
    if (!s.trim()) return;
    drawMultiline(s, {
      x: ML + INDENT, sz: 9.5, font: serif, color: DARK,
      mw: CW - INDENT, lineH: 15,
    });
    y -= 8;
  }

  // ─── INTRODUCTION ───
  sectionHead("Introduction");
  checkItem("Objectives clearly stated", data.objectivesClear);
  checkItem("Literature review adequate", data.literatureAdequate);
  if (data.introComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.introComments);
  }

  // ─── METHODS ───
  sectionHead("Methods");
  checkItem("Methods reproducible", data.methodsReproducible);
  checkItem("Statistics appropriate", data.statisticsAppropriate);
  if (data.methodsComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.methodsComments);
  }

  // ─── RESULTS ───
  sectionHead("Results");
  checkItem("Results presented clearly", data.resultsPresentation);
  checkItem("Tables/figures appropriate", data.tablesAppropriate);
  if (data.resultsComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.resultsComments);
  }

  // ─── DISCUSSION & CONCLUSIONS ───
  sectionHead("Discussion & Conclusions");
  checkItem("Conclusions supported by data", data.conclusionsSupported);
  checkItem("Limitations clearly stated", data.limitationsStated);
  if (data.discussionComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.discussionComments);
  }

  // ─── OVERALL ASSESSMENT (ratings bar) ───
  sectionHead("Overall Assessment");
  need(36);
  const ratings: [string, string][] = [
    ["Originality", data.originality],
    ["Methods", data.methodology],
    ["Clarity", data.clarity],
    ["Significance", data.significance],
    ["Lang. Edit", data.languageEditing],
  ];
  const rBarH = 30;
  const rItemW = CW / ratings.length;
  const rBarY = y - rBarH;

  // Outer border
  page.drawRectangle({
    x: ML, y: rBarY, width: CW, height: rBarH,
    borderColor: BORDER_CLR, borderWidth: 1, color: WHITE,
  });

  for (let i = 0; i < ratings.length; i++) {
    const [label, value] = ratings[i];
    const rx = ML + i * rItemW;

    // Vertical separator (except first)
    if (i > 0) {
      page.drawRectangle({ x: rx, y: rBarY, width: 1, height: rBarH, color: BORDER_CLR });
    }

    // Label (top)
    const lblText = label.toUpperCase();
    const lblW = sans.widthOfTextAtSize(lblText, 7);
    page.drawText(lblText, { x: rx + (rItemW - lblW) / 2, y: rBarY + rBarH - 11, size: 7, font: sans, color: GRAY });

    // Value (bottom)
    const valText = safe(value || "-");
    const valW = sansB.widthOfTextAtSize(valText, 10);
    page.drawText(valText, { x: rx + (rItemW - valW) / 2, y: rBarY + 4, size: 10, font: sansB, color: NAVY });
  }

  y = rBarY - 12;

  // ─── DETAILED FEEDBACK ───
  sectionHead("Detailed Feedback");
  if (data.majorIssues.trim()) {
    commentLabel("Major Issues");
    commentText(data.majorIssues);
  }
  if (data.minorIssues.trim()) {
    commentLabel("Minor Issues");
    commentText(data.minorIssues);
  }
  if (data.commentsToAuthors.trim()) {
    commentLabel("Comments to Authors");
    commentText(data.commentsToAuthors);
  }
  if (data.confidentialComments.trim()) {
    commentLabel("Confidential to Editor");
    commentText(data.confidentialComments);
  }

  // ─── RECOMMENDATION CARD (navy background) ───
  need(42);
  const recH = 38;
  const recY = y - recH;
  page.drawRectangle({ x: ML, y: recY, width: CW, height: recH, color: NAVY });

  // Label
  const recLbl = "FINAL RECOMMENDATION";
  page.drawText(recLbl, { x: ML + 20, y: recY + recH / 2 - 3, size: 8.5, font: sans, color: rgb(180/255, 200/255, 220/255) });

  // Value
  const recVal = safe(data.recommendation || "-");
  const recValW = sansB.widthOfTextAtSize(recVal, 16);
  page.drawText(recVal, { x: PAGE_W - MR - 20 - recValW, y: recY + recH / 2 - 6, size: 16, font: sansB, color: WHITE });

  y = recY - 16;

  // ─── VERIFICATION BOX ───
  // Verification rows data
  const vRows: [string, string][] = [
    ["Document ID:", docId],
    ["Integrity (SHA-256):", `${fullHash.slice(0, 16)}... (cryptographic hash)`],
    ["Publisher:", "Global Talent Foundation 501(c)(3) - EIN 93-3926624"],
    ["Journal:", "American Impact Review - americanimpactreview.com"],
    ["Review Protocol:", "COPE Ethical Guidelines for Peer Reviewers"],
    ["Generated:", new Date().toISOString().replace(/\.\d+Z$/, "Z")],
  ];
  const vRowH = 13; // height per row
  const vHeaderH = 22; // header area with badge
  const vPadTop = 12;
  const vPadBot = 10;
  const vBoxH = vPadTop + vHeaderH + vRows.length * vRowH + vPadBot;
  need(vBoxH + 10);
  const vBoxY = y - vBoxH;

  // Border box
  page.drawRectangle({
    x: ML, y: vBoxY, width: CW, height: vBoxH,
    borderColor: BORDER_CLR, borderWidth: 1, color: WHITE,
  });

  // Title row: "DOCUMENT VERIFICATION" + "VERIFIED" badge
  let vy = y - vPadTop - 9;
  page.drawText("DOCUMENT VERIFICATION", { x: ML + 14, y: vy, size: 8.5, font: sansB, color: NAVY });

  const verBadge = "VERIFIED";
  const verBadgeW = sansB.widthOfTextAtSize(verBadge, 7) + 16;
  const verBadgeH = 13;
  const verBadgeX = PAGE_W - MR - 14 - verBadgeW;
  page.drawRectangle({ x: verBadgeX, y: vy - 2.5, width: verBadgeW, height: verBadgeH, color: NAVY });
  page.drawText(verBadge, { x: verBadgeX + 8, y: vy, size: 7, font: sansB, color: WHITE });

  vy -= vHeaderH;

  // Verification rows — use smaller font (8px) to fit everything
  for (const [label, value] of vRows) {
    const lblSz = 8;
    const valSz = 8;
    page.drawText(safe(label), { x: ML + 14, y: vy, size: lblSz, font: sansB, color: GRAY });
    const lw = sansB.widthOfTextAtSize(safe(label), lblSz);
    // Truncate value if too long
    let valStr = safe(value);
    const maxValW = CW - 28 - lw - 8;
    while (sans.widthOfTextAtSize(valStr, valSz) > maxValW && valStr.length > 10) {
      valStr = valStr.slice(0, -1);
    }
    page.drawText(valStr, { x: ML + 14 + lw + 8, y: vy, size: valSz, font: sans, color: TEXT });
    vy -= vRowH;
  }

  y = vBoxY - 10;

  // ─── DISCLAIMER ───
  need(30);
  drawText(
    "This peer review record was generated by the American Impact Review editorial system. The Document ID is derived from a SHA-256 cryptographic hash of the review content. Modification of any field invalidates this record. Retain for professional records and credential verification.",
    { sz: 7, font: sansO, color: GRAY_LIGHT, lineH: 10 }
  );
  y -= 6;

  // ─── FOOTER on every page ───
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    // Navy line
    p.drawRectangle({ x: ML, y: MB - 8, width: CW, height: 1.5, color: NAVY });
    // Footer text centered
    const ftText = `American Impact Review  ·  Global Talent Foundation  ·  ${docId}  ·  Page ${i + 1} of ${pages.length}`;
    const ftW = sans.widthOfTextAtSize(ftText, 7);
    p.drawText(ftText, { x: (PAGE_W - ftW) / 2, y: MB - 20, size: 7, font: sans, color: GRAY_LIGHT });
  }

  // ─── PDF Metadata ───
  const now = new Date();
  doc.setTitle(`Peer Review Record - ${data.manuscriptId}`);
  doc.setAuthor(data.reviewerName);
  doc.setSubject(`Peer review of manuscript ${data.manuscriptId} for American Impact Review`);
  doc.setKeywords([
    "peer review", "American Impact Review", "Global Talent Foundation",
    "501(c)(3)", data.manuscriptId, data.reviewerName,
    "academic journal", "peer-reviewed", "COPE",
    docId,
  ]);
  doc.setProducer("American Impact Review Editorial System (americanimpactreview.com)");
  doc.setCreator("American Impact Review - Global Talent Foundation 501(c)(3)");
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  return doc.save();
}
