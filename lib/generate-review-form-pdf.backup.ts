import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

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

// ─── Layout constants (v3 HTML: padding 40px 48px 44px) ───
const PAGE_W = 612;
const PAGE_H = 792;
const ML = 48;
const MR = 48;
const MT = 40;
const MB = 44;
const CW = PAGE_W - ML - MR; // 516

// ─── Colors (v3 HTML — navy primary) ───
const NAVY = rgb(30 / 255, 58 / 255, 95 / 255); // #1e3a5f
const BLACK = rgb(26 / 255, 26 / 255, 26 / 255); // #1a1a1a
const DARK = rgb(34 / 255, 34 / 255, 34 / 255); // #222
const TEXT = rgb(51 / 255, 51 / 255, 51 / 255); // #333
const GRAY_444 = rgb(68 / 255, 68 / 255, 68 / 255); // #444
const GRAY_555 = rgb(85 / 255, 85 / 255, 85 / 255); // #555
const GRAY_666 = rgb(102 / 255, 102 / 255, 102 / 255); // #666
const GRAY_777 = rgb(119 / 255, 119 / 255, 119 / 255); // #777
const BORDER_GRAY = rgb(176 / 255, 189 / 255, 208 / 255); // #b0bdd0
const META_BG = rgb(240 / 255, 243 / 255, 247 / 255); // #f0f3f7
const CHECK_YES_BG = rgb(232 / 255, 237 / 255, 244 / 255); // #e8edf4
const CHECK_NO_BG = rgb(255 / 255, 235 / 255, 238 / 255); // #ffebee
const CHECK_NO_COLOR = rgb(198 / 255, 40 / 255, 40 / 255); // #c62828
const WHITE = rgb(1, 1, 1);
const VER_BG = rgb(240 / 255, 243 / 255, 247 / 255); // same as meta bg

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

export async function generateReviewFormPdf(
  data: ReviewFormPdfData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Fonts: TimesRoman ~ Lora substitute, Helvetica ~ Roboto substitute
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const sansO = await doc.embedFont(StandardFonts.HelveticaOblique);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifI = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const zapf = await doc.embedFont(StandardFonts.ZapfDingbats);

  const docId = await generateDocId(data);
  const fullHash = await generateFullHash(data);
  const issueDate =
    data.submittedAt ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const cleanDate = issueDate
    .replace(/\s+at\s*$/, "")
    .replace(/\s+at\s+\d.*$/, "");
  // Short date for meta box: "Feb 19, 2026"
  const shortDate =
    data.submittedAt
      ? new Date(data.submittedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

  const displayId =
    data.manuscriptId.length > 20
      ? data.manuscriptId.slice(0, 8) + "..."
      : data.manuscriptId;

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MT;

  function newPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MT;
    // Draw 5px navy top border on new pages
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 5,
      width: PAGE_W,
      height: 5,
      color: NAVY,
    });
    y -= 5;
  }

  function need(h: number) {
    if (y - h < MB + 24) {
      newPage();
    }
  }

  // ─── Word-wrap helper ───
  function wrapText(
    s: string,
    font: PDFFont,
    sz: number,
    maxW: number
  ): string[] {
    const words = safe(s).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, sz) > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ─── Draw multiline text with word wrap ───
  function drawText(
    s: string,
    opts: {
      x?: number;
      sz?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      mw?: number;
      lineH?: number;
    } = {}
  ): number {
    const {
      x = ML,
      sz = 9.5,
      font = serif,
      color = BLACK,
      mw = CW,
      lineH = sz * 1.6,
    } = opts;
    const lines = wrapText(s, font, sz, mw);
    let count = 0;
    for (const ln of lines) {
      need(lineH);
      page.drawText(ln, { x, y: y - sz, size: sz, font, color });
      y -= lineH;
      count++;
    }
    return count;
  }

  // =====================================================================
  // PAGE 1: 5px navy top border
  // =====================================================================
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 5,
    width: PAGE_W,
    height: 5,
    color: NAVY,
  });
  y = PAGE_H - 5 - MT;

  // =====================================================================
  // HEADER: flex — left logo + right badge
  // =====================================================================
  {
    // Left: "AMERICAN IMPACT REVIEW" + tagline
    const logoText = "AMERICAN IMPACT REVIEW";
    const logoSz = 11;
    page.drawText(logoText, {
      x: ML,
      y: y - logoSz,
      size: logoSz,
      font: sansB,
      color: NAVY,
    });
    const tagText = "Published by Global Talent Foundation 501(c)(3)";
    const tagSz = 7;
    page.drawText(tagText, {
      x: ML,
      y: y - logoSz - tagSz - 1,
      size: tagSz,
      font: sans,
      color: GRAY_666,
    });

    // Right: "PEER REVIEW RECORD" black badge + doc ID below
    const badgeText = "PEER REVIEW RECORD";
    const badgeSz = 7.5;
    const badgeTW = sansB.widthOfTextAtSize(badgeText, badgeSz);
    const badgePadH = 10;
    const badgeW = badgeTW + badgePadH * 2;
    const badgeH = badgeSz + 6;
    const badgeX = ML + CW - badgeW;
    const badgeY = y - badgeH + 2;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      color: BLACK,
    });
    page.drawText(badgeText, {
      x: badgeX + badgePadH,
      y: badgeY + 3,
      size: badgeSz,
      font: sansB,
      color: WHITE,
    });

    // Doc ID below badge
    const idText = docId;
    const idSz = 7;
    const idW = sans.widthOfTextAtSize(idText, idSz);
    page.drawText(idText, {
      x: ML + CW - idW,
      y: badgeY - idSz - 2,
      size: idSz,
      font: sans,
      color: GRAY_666,
    });

    y -= logoSz + tagSz + 1 + 12; // 12px margin-bottom from h-flex
  }

  // ─── Navy divider (1.5px) ───
  page.drawRectangle({
    x: ML,
    y: y,
    width: CW,
    height: 1.5,
    color: NAVY,
  });
  y -= 1.5 + 8;

  // =====================================================================
  // CENTERED TITLE BLOCK
  // =====================================================================
  // "Peer Review Record"
  {
    const titleText = "Peer Review Record";
    const titleSz = 15;
    const titleW = serifB.widthOfTextAtSize(titleText, titleSz);
    page.drawText(titleText, {
      x: (PAGE_W - titleW) / 2,
      y: y - titleSz,
      size: titleSz,
      font: serifB,
      color: BLACK,
    });
    y -= titleSz + 4;
  }

  // Manuscript title (italic, centered, wrapped)
  if (data.title) {
    const titleSz = 12;
    const titleFont = serifI;
    const maxW = CW - 40;
    const lineH = titleSz * 1.4;
    const lines = wrapText(data.title, titleFont, titleSz, maxW);
    for (const ln of lines) {
      const lw = titleFont.widthOfTextAtSize(ln, titleSz);
      need(lineH);
      page.drawText(ln, {
        x: (PAGE_W - lw) / 2,
        y: y - titleSz,
        size: titleSz,
        font: titleFont,
        color: GRAY_444,
      });
      y -= lineH;
    }
    y -= 5;
  }

  // Meta line: "Manuscript AIR-XXX · Single-blind Review · February 19, 2026"
  {
    const metaText = `Manuscript ${displayId}  ·  Single-blind Review  ·  ${cleanDate}`;
    const metaSz = 9;
    let finalSz = metaSz;
    let metaW = sans.widthOfTextAtSize(metaText, finalSz);
    if (metaW > CW) {
      finalSz = 7.5;
      metaW = sans.widthOfTextAtSize(metaText, finalSz);
    }
    page.drawText(metaText, {
      x: (PAGE_W - metaW) / 2,
      y: y - finalSz,
      size: finalSz,
      font: sans,
      color: GRAY_666,
    });
    y -= finalSz + 12;
  }

  // =====================================================================
  // REVIEWER NAME (prominent, centered)
  // =====================================================================
  need(42);
  {
    const labelText = "REVIEWED BY";
    const labelSz = 7;
    const labelW = sansB.widthOfTextAtSize(labelText, labelSz);
    page.drawText(labelText, {
      x: (PAGE_W - labelW) / 2,
      y: y - labelSz,
      size: labelSz,
      font: sansB,
      color: NAVY,
    });
    y -= labelSz + 3;

    const nameText = safe(data.reviewerName);
    const nameSz = 16;
    const nameW = serifB.widthOfTextAtSize(nameText, nameSz);
    page.drawText(nameText, {
      x: (PAGE_W - nameW) / 2,
      y: y - nameSz,
      size: nameSz,
      font: serifB,
      color: BLACK,
    });
    y -= nameSz + 2;

    const emailText = safe(data.reviewerEmail);
    const emailSz = 8.5;
    const emailW = sans.widthOfTextAtSize(emailText, emailSz);
    page.drawText(emailText, {
      x: (PAGE_W - emailW) / 2,
      y: y - emailSz,
      size: emailSz,
      font: sans,
      color: GRAY_555,
    });
    y -= emailSz + 14;
  }

  // =====================================================================
  // TWO-COLUMN META BOXES (navy left border + #f0f3f7 bg)
  // =====================================================================
  need(80);
  {
    const colGap = 12;
    const colW = (CW - colGap) / 2;
    const leftX = ML;
    const rightX = ML + colW + colGap;
    const boxH = 68; // taller to fit 3 data rows + title comfortably
    const borderW = 3;
    const padX = 12;
    const padTop = 8;
    const metaLblSz = 8;
    const metaValSz = 9;
    const metaRowH = 14;
    // Label column width: enough for "Email" label + gap
    const lblColW = 36;

    // ── Left column: "Reviewer" ──
    page.drawRectangle({
      x: leftX,
      y: y - boxH,
      width: colW,
      height: boxH,
      color: META_BG,
    });
    page.drawRectangle({
      x: leftX,
      y: y - boxH,
      width: borderW,
      height: boxH,
      color: NAVY,
    });

    let ly = y - padTop;
    page.drawText("REVIEWER", {
      x: leftX + padX,
      y: ly - 9,
      size: 9,
      font: sansB,
      color: NAVY,
    });
    ly -= 9 + 6;

    // Name row
    page.drawText("Name", {
      x: leftX + padX,
      y: ly - metaLblSz,
      size: metaLblSz,
      font: sans,
      color: GRAY_666,
    });
    const nameVal = safe(data.reviewerName);
    const nameMaxValW = colW - padX - lblColW - padX;
    let nameValSz = metaValSz;
    if (sansB.widthOfTextAtSize(nameVal, nameValSz) > nameMaxValW) nameValSz = 7.5;
    if (sansB.widthOfTextAtSize(nameVal, nameValSz) > nameMaxValW) nameValSz = 7;
    const nameW = sansB.widthOfTextAtSize(nameVal, nameValSz);
    page.drawText(nameVal, {
      x: leftX + colW - padX - nameW,
      y: ly - nameValSz,
      size: nameValSz,
      font: sansB,
      color: DARK,
    });
    ly -= metaRowH;

    // Email row
    page.drawText("Email", {
      x: leftX + padX,
      y: ly - metaLblSz,
      size: metaLblSz,
      font: sans,
      color: GRAY_666,
    });
    const emailVal = safe(data.reviewerEmail);
    let emailValSz = metaValSz;
    if (sansB.widthOfTextAtSize(emailVal, emailValSz) > nameMaxValW) emailValSz = 7.5;
    if (sansB.widthOfTextAtSize(emailVal, emailValSz) > nameMaxValW) emailValSz = 7;
    if (sansB.widthOfTextAtSize(emailVal, emailValSz) > nameMaxValW) emailValSz = 6.5;
    const emailW = sansB.widthOfTextAtSize(emailVal, emailValSz);
    page.drawText(emailVal, {
      x: leftX + colW - padX - emailW,
      y: ly - emailValSz,
      size: emailValSz,
      font: sansB,
      color: DARK,
    });

    // ── Right column: "Manuscript" ──
    page.drawRectangle({
      x: rightX,
      y: y - boxH,
      width: colW,
      height: boxH,
      color: META_BG,
    });
    page.drawRectangle({
      x: rightX,
      y: y - boxH,
      width: borderW,
      height: boxH,
      color: NAVY,
    });

    let ry = y - padTop;
    page.drawText("MANUSCRIPT", {
      x: rightX + padX,
      y: ry - 9,
      size: 9,
      font: sansB,
      color: NAVY,
    });
    ry -= 9 + 6;

    const rightRows: [string, string][] = [
      ["ID", displayId],
      ["Date", shortDate],
      ["Type", "Single-blind"],
    ];
    for (const [lbl, val] of rightRows) {
      page.drawText(lbl, {
        x: rightX + padX,
        y: ry - metaLblSz,
        size: metaLblSz,
        font: sans,
        color: GRAY_666,
      });
      const valText = safe(val);
      let vSz = metaValSz;
      const maxVW = colW - padX - lblColW - padX;
      if (sansB.widthOfTextAtSize(valText, vSz) > maxVW) vSz = 7.5;
      const vW = sansB.widthOfTextAtSize(valText, vSz);
      page.drawText(valText, {
        x: rightX + colW - padX - vW,
        y: ry - vSz,
        size: vSz,
        font: sansB,
        color: DARK,
      });
      ry -= metaRowH;
    }

    y -= boxH + 14;
  }

  // =====================================================================
  // SECTION HELPERS
  // =====================================================================

  function sectionHead(title: string) {
    need(26);
    y -= 6;
    const titleText = safe(title.toUpperCase());
    const titleSz = 13;
    page.drawText(titleText, {
      x: ML,
      y: y - titleSz,
      size: titleSz,
      font: sansB,
      color: NAVY,
    });
    y -= titleSz + 10;
  }

  // ─── Checklist item with styled icon box (v3 style) ───
  // ZapfDingbats ✓ (U+2713) and ✗ (U+2717) — exact match to HTML v3
  function checkItem(label: string, value: string) {
    need(20);
    const isYes = value === "Yes";
    const labelText = safe(label);
    const itemSz = 9.5;
    const iconBoxSize = 18;
    const iconX = ML + 12;
    const textX = iconX + iconBoxSize + 6;

    // Icon box background
    const boxBg = isYes ? CHECK_YES_BG : CHECK_NO_BG;
    const boxY = y - iconBoxSize + 2;
    page.drawRectangle({
      x: iconX,
      y: boxY,
      width: iconBoxSize,
      height: iconBoxSize,
      color: boxBg,
    });

    // ZapfDingbats icon — manually centered in box
    // The glyphs have uneven metrics, so we apply per-symbol offsets
    const iconChar = isYes ? "\u2713" : "\u2717";
    const iconColor = isYes ? NAVY : CHECK_NO_COLOR;
    const iconSz = 13;
    const iconW = zapf.widthOfTextAtSize(iconChar, iconSz);
    // Horizontal: center by glyph width
    const ix = iconX + (iconBoxSize - iconW) / 2;
    // Vertical: ZapfDingbats glyphs render from baseline, visually bottom-heavy
    // Need extra upward offset to appear centered in the box
    const iy = boxY + (iconBoxSize - iconSz) / 2 + 3;
    page.drawText(iconChar, {
      x: ix,
      y: iy,
      size: iconSz,
      font: zapf,
      color: iconColor,
    });

    // Label text — vertically centered with icon box
    const cy = boxY + iconBoxSize / 2;
    page.drawText(labelText, {
      x: textX,
      y: cy - itemSz / 2 + 1,
      size: itemSz,
      font: serif,
      color: TEXT,
    });

    y -= iconBoxSize + 4;
  }

  // ─── Comment label (gray uppercase) ───
  function commentLabel(label: string) {
    need(16);
    y -= 8;
    page.drawText(safe(label.toUpperCase()), {
      x: ML + 12,
      y: y - 9,
      size: 9,
      font: sansB,
      color: GRAY_555,
    });
    y -= 9 + 4;
  }

  // ─── Comment text (plain text with padding-left 12px) ───
  function commentText(text: string) {
    if (!text.trim()) return;
    const textSz = 9.5;
    const lineH = textSz * 1.6;
    const textX = ML + 12;
    const maxW = CW - 12;

    for (const paragraph of text.split(/\n/)) {
      if (paragraph.trim()) {
        const lines = wrapText(paragraph.trim(), serif, textSz, maxW);
        for (const ln of lines) {
          need(lineH);
          page.drawText(ln, {
            x: textX,
            y: y - textSz,
            size: textSz,
            font: serif,
            color: DARK,
          });
          y -= lineH;
        }
      } else {
        y -= 6;
      }
    }
    y -= 12;
  }

  // ─── Numbered issue list (Major/Minor Issues with indented numbers) ───
  function numberedIssueBlock(label: string, text: string) {
    if (!text.trim()) return;
    need(24);

    // Label — larger font (11px bold)
    const lblSz = 11;
    page.drawText(safe(label.toUpperCase()), {
      x: ML + 12,
      y: y - lblSz,
      size: lblSz,
      font: sansB,
      color: GRAY_555,
    });
    y -= lblSz + 6;

    // Parse numbered items: "1. xxx\n2. yyy" or plain text
    const textSz = 9.5;
    const lineH = textSz * 1.6;
    const listIndent = 24; // indent list items from label
    const textX = ML + 12 + listIndent;
    const numIndent = 16; // extra indent for text after number
    const maxW = CW - 12 - listIndent - numIndent;

    // Split into items: try to detect "1." / "2." pattern
    const rawLines = text.split(/\n/).filter((l) => l.trim());
    const numberPattern = /^(\d+)\.\s*(.*)/;

    for (const rawLine of rawLines) {
      const match = rawLine.trim().match(numberPattern);
      if (match) {
        const num = match[1];
        const content = match[2];
        need(lineH);

        // Draw number
        const numText = `${num}.`;
        page.drawText(numText, {
          x: textX,
          y: y - textSz,
          size: textSz,
          font: sansB,
          color: NAVY,
        });

        // Draw content with indent, wrapped
        const lines = wrapText(content, serif, textSz, maxW);
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) need(lineH);
          page.drawText(lines[i], {
            x: textX + numIndent,
            y: y - textSz,
            size: textSz,
            font: serif,
            color: DARK,
          });
          y -= lineH;
        }
      } else {
        // Plain text line (same indent as numbered items)
        const lines = wrapText(rawLine.trim(), serif, textSz, CW - 12 - listIndent);
        for (const ln of lines) {
          need(lineH);
          page.drawText(ln, {
            x: textX,
            y: y - textSz,
            size: textSz,
            font: serif,
            color: DARK,
          });
          y -= lineH;
        }
      }
    }
    y -= 8;
  }

  // =====================================================================
  // SECTION: INTRODUCTION
  // =====================================================================
  sectionHead("Introduction");
  checkItem("Objectives clearly stated", data.objectivesClear);
  checkItem("Literature review adequate", data.literatureAdequate);
  if (data.introComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.introComments);
  }

  // =====================================================================
  // SECTION: METHODS
  // =====================================================================
  sectionHead("Methods");
  checkItem("Methods reproducible", data.methodsReproducible);
  checkItem("Statistics appropriate", data.statisticsAppropriate);
  if (data.methodsComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.methodsComments);
  }

  // =====================================================================
  // SECTION: RESULTS
  // =====================================================================
  sectionHead("Results");
  checkItem("Results presented clearly", data.resultsPresentation);
  checkItem("Tables/figures appropriate", data.tablesAppropriate);
  if (data.resultsComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.resultsComments);
  }

  // =====================================================================
  // SECTION: DISCUSSION & CONCLUSIONS
  // =====================================================================
  sectionHead("Discussion & Conclusions");
  checkItem("Conclusions supported by data", data.conclusionsSupported);
  checkItem("Limitations clearly stated", data.limitationsStated);
  if (data.discussionComments.trim()) {
    commentLabel("Reviewer Comments");
    commentText(data.discussionComments);
  }

  // =====================================================================
  // SECTION: OVERALL ASSESSMENT — horizontal ratings bar
  // =====================================================================
  sectionHead("Overall Assessment");

  const ratings: [string, string][] = [
    ["Originality", data.originality],
    ["Methods", data.methodology],
    ["Clarity", data.clarity],
    ["Significance", data.significance],
    ["Lang. Edit", data.languageEditing],
  ];

  need(36);
  {
    const barH = 32;
    const itemCount = ratings.length;
    const itemW = CW / itemCount;

    // Outer border
    page.drawRectangle({
      x: ML,
      y: y - barH,
      width: CW,
      height: barH,
      borderColor: BORDER_GRAY,
      borderWidth: 1,
      color: WHITE,
    });

    for (let i = 0; i < itemCount; i++) {
      const [label, value] = ratings[i];
      const cellX = ML + i * itemW;

      // Vertical divider (except first)
      if (i > 0) {
        page.drawRectangle({
          x: cellX,
          y: y - barH,
          width: 1,
          height: barH,
          color: BORDER_GRAY,
        });
      }

      // Label (top, small, gray)
      const lblText = safe(label.toUpperCase());
      const lblSz = 7;
      const lblW = sans.widthOfTextAtSize(lblText, lblSz);
      page.drawText(lblText, {
        x: cellX + (itemW - lblW) / 2,
        y: y - 10,
        size: lblSz,
        font: sans,
        color: GRAY_666,
      });

      // Value (bottom, bold, navy)
      const valText = safe(value || "-");
      const valSz = 10;
      const valW = sansB.widthOfTextAtSize(valText, valSz);
      page.drawText(valText, {
        x: cellX + (itemW - valW) / 2,
        y: y - barH + 7,
        size: valSz,
        font: sansB,
        color: NAVY,
      });
    }

    y -= barH + 8;
  }

  // =====================================================================
  // SECTION: DETAILED FEEDBACK
  // =====================================================================
  sectionHead("Detailed Feedback");
  numberedIssueBlock("Major Issues", data.majorIssues);
  numberedIssueBlock("Minor Issues", data.minorIssues);
  if (data.commentsToAuthors.trim()) {
    commentLabel("Comments to Authors");
    commentText(data.commentsToAuthors);
  }
  if (data.confidentialComments.trim()) {
    commentLabel("Confidential to Editor");
    commentText(data.confidentialComments);
  }

  // =====================================================================
  // RECOMMENDATION CARD (navy background, flex layout)
  // =====================================================================
  need(42);
  {
    const cardH = 42;
    const cardPadX = 20;

    // Navy background with rounded corners (approximate with rectangle)
    page.drawRectangle({
      x: ML,
      y: y - cardH,
      width: CW,
      height: cardH,
      color: NAVY,
    });

    // Left: "FINAL RECOMMENDATION" label (white, larger)
    const recLabel = "FINAL RECOMMENDATION";
    const recLblSz = 10;
    page.drawText(recLabel, {
      x: ML + cardPadX,
      y: y - cardH / 2 - recLblSz / 2 + 1,
      size: recLblSz,
      font: sansB,
      color: WHITE,
    });

    // Right: recommendation value (large bold white)
    const recVal = safe(data.recommendation || "-");
    const recValSz = 16;
    const recValW = sansB.widthOfTextAtSize(recVal, recValSz);
    page.drawText(recVal, {
      x: ML + CW - cardPadX - recValW,
      y: y - cardH / 2 - recValSz / 2 + 1,
      size: recValSz,
      font: sansB,
      color: WHITE,
    });

    y -= cardH + 14;
  }

  // =====================================================================
  // VERIFICATION BOX (border #b0bdd0, navy title, navy "VERIFIED" badge)
  // =====================================================================
  {
    const vPadX = 14;
    const vPadTop = 10;
    const vHeaderH = 18;
    const vRowH = 12;

    const vRows: [string, string][] = [
      ["Document ID:", docId],
      ["Integrity (SHA-256):", `${fullHash.slice(0, 16)}... (cryptographic hash)`],
      ["Publisher:", "Global Talent Foundation 501(c)(3) · EIN 93-3926624"],
      ["Journal:", "American Impact Review · americanimpactreview.com"],
      ["Review Protocol:", "COPE Ethical Guidelines for Peer Reviewers"],
      ["Generated:", new Date().toISOString().replace(/\.\d+Z$/, "Z")],
    ];

    const vBoxH = vPadTop + vHeaderH + vRows.length * vRowH + 10;
    need(vBoxH + 10);

    const vBoxY = y - vBoxH;

    // Border
    page.drawRectangle({
      x: ML,
      y: vBoxY,
      width: CW,
      height: vBoxH,
      borderColor: BORDER_GRAY,
      borderWidth: 1,
      color: WHITE,
    });

    let vy = y - vPadTop;

    // Title: "DOCUMENT VERIFICATION" (navy, bold)
    page.drawText("DOCUMENT VERIFICATION", {
      x: ML + vPadX,
      y: vy - 9,
      size: 9,
      font: sansB,
      color: NAVY,
    });

    // "VERIFIED" double-border stamp (passport/notary style)
    const vBadgeText = "VERIFIED";
    const vSubText = "AIR Editorial System";
    const vBadgeSz = 9;
    const vSubSz = 6;
    const vBadgeTW = sansB.widthOfTextAtSize(vBadgeText, vBadgeSz);
    const vSubTW = sans.widthOfTextAtSize(vSubText, vSubSz);
    const innerW = Math.max(vBadgeTW, vSubTW) + 20;
    const innerH = vBadgeSz + vSubSz + 10;
    const outerPad = 3; // gap between outer and inner border
    const outerW = innerW + outerPad * 2;
    const outerH = innerH + outerPad * 2;
    const stampX = ML + CW - vPadX - outerW;
    const stampY = vy - outerH + 4;

    // Outer border
    page.drawRectangle({
      x: stampX,
      y: stampY,
      width: outerW,
      height: outerH,
      borderColor: NAVY,
      borderWidth: 2,
      color: WHITE,
    });
    // Inner border
    page.drawRectangle({
      x: stampX + outerPad,
      y: stampY + outerPad,
      width: innerW,
      height: innerH,
      borderColor: NAVY,
      borderWidth: 1,
      color: WHITE,
    });
    // "VERIFIED" text centered
    page.drawText(vBadgeText, {
      x: stampX + (outerW - vBadgeTW) / 2,
      y: stampY + outerPad + innerH / 2,
      size: vBadgeSz,
      font: sansB,
      color: NAVY,
    });
    // "AIR Editorial System" sub-text centered
    page.drawText(vSubText, {
      x: stampX + (outerW - vSubTW) / 2,
      y: stampY + outerPad + 4,
      size: vSubSz,
      font: sans,
      color: GRAY_555,
    });

    vy -= vHeaderH;

    // Data rows (grid: label + value)
    const vLabelSz = 7.5;
    const vValSz = 7.5;
    for (const [label, value] of vRows) {
      page.drawText(safe(label), {
        x: ML + vPadX,
        y: vy - vLabelSz,
        size: vLabelSz,
        font: sansB,
        color: GRAY_666,
      });
      const lblW = sansB.widthOfTextAtSize(safe(label), vLabelSz);
      let valStr = safe(value);
      const maxValW = CW - vPadX * 2 - lblW - 10;
      while (
        sans.widthOfTextAtSize(valStr, vValSz) > maxValW &&
        valStr.length > 10
      ) {
        valStr = valStr.slice(0, -1);
      }
      page.drawText(valStr, {
        x: ML + vPadX + lblW + 10,
        y: vy - vValSz,
        size: vValSz,
        font: sans,
        color: TEXT,
      });
      vy -= vRowH;
    }

    y = vBoxY - 8;
  }

  // =====================================================================
  // DISCLAIMER
  // =====================================================================
  need(30);
  {
    const disclaimerText =
      "This peer review record was generated by the American Impact Review editorial system. The Document ID is derived from a SHA-256 cryptographic hash of the review content. Modification of any field invalidates this record. Retain for professional records and credential verification.";
    const dSz = 8;
    const dFont = sansO;
    const dColor = GRAY_777;
    const dLineH = 11;

    const lines = wrapText(disclaimerText, dFont, dSz, CW);
    for (const ln of lines) {
      need(dLineH);
      page.drawText(ln, {
        x: ML,
        y: y - dSz,
        size: dSz,
        font: dFont,
        color: dColor,
      });
      y -= dLineH;
    }
    y -= 10;
  }

  // =====================================================================
  // FOOTER ON ALL PAGES: single navy line + centered text
  // =====================================================================
  const pages = doc.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];

    // Single 1.5px navy line
    const footLineY = MB + 14;
    p.drawRectangle({
      x: ML,
      y: footLineY,
      width: CW,
      height: 1.5,
      color: NAVY,
    });

    // Footer text
    const ftText = `American Impact Review  ·  Global Talent Foundation  ·  ${docId}  ·  Page ${i + 1} of ${totalPages}`;
    const ftSz = 7;
    const ftW = sans.widthOfTextAtSize(ftText, ftSz);
    p.drawText(ftText, {
      x: (PAGE_W - ftW) / 2,
      y: MB + 2,
      size: ftSz,
      font: sans,
      color: GRAY_777,
    });
  }

  // ─── PDF Metadata ───
  const now = new Date();
  doc.setTitle(`Peer Review Record - ${data.manuscriptId}`);
  doc.setAuthor(data.reviewerName);
  doc.setSubject(
    `Peer review of manuscript ${data.manuscriptId} for American Impact Review`
  );
  doc.setKeywords([
    "peer review",
    "American Impact Review",
    "Global Talent Foundation",
    "501(c)(3)",
    data.manuscriptId,
    data.reviewerName,
    "academic journal",
    "peer-reviewed",
    "COPE",
    docId,
  ]);
  doc.setProducer(
    "American Impact Review Editorial System (americanimpactreview.com)"
  );
  doc.setCreator(
    "American Impact Review - Global Talent Foundation 501(c)(3)"
  );
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  return doc.save();
}
