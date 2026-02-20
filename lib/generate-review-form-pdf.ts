import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
  // Format: AIR-PRR-XXXXXXXX (first 8 hex chars, uppercase)
  return `AIR-PRR-${hex.slice(0, 8).toUpperCase()}`;
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

const PAGE_W = 612;
const PAGE_H = 792;
const ML = 54;
const MR = 54;
const MT = 54;
const MB = 54;
const CW = PAGE_W - ML - MR;

const NAVY = rgb(30 / 255, 58 / 255, 95 / 255);
const NAVY_LIGHT = rgb(240 / 255, 244 / 255, 249 / 255);
const DARK = rgb(15 / 255, 23 / 255, 42 / 255);
const GRAY = rgb(100 / 255, 116 / 255, 139 / 255);
const LINE_CLR = rgb(226 / 255, 232 / 255, 240 / 255);
const ACCENT = rgb(181 / 255, 67 / 255, 42 / 255);
const GREEN = rgb(5 / 255, 150 / 255, 105 / 255);
const RED = rgb(220 / 255, 38 / 255, 38 / 255);
const AMBER = rgb(217 / 255, 119 / 255, 6 / 255);
const ORANGE = rgb(234 / 255, 88 / 255, 12 / 255);

function safe(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, " ");
}

export async function generateReviewFormPdf(data: ReviewFormPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const hv = await doc.embedFont(StandardFonts.Helvetica);
  const hvB = await doc.embedFont(StandardFonts.HelveticaBold);
  const hvO = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MT;

  function np() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MT;
  }

  function need(h: number) {
    if (y - h < MB) np();
  }

  function text(s: string, opts: {
    x?: number; sz?: number; font?: typeof hv; color?: typeof NAVY; mw?: number;
  } = {}) {
    const { x = ML, sz = 9.5, font = hv, color = DARK, mw = CW } = opts;
    const words = safe(s).split(/\s+/);
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, sz) > mw && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    for (const ln of lines) {
      need(sz + 3);
      page.drawText(ln, { x, y: y - sz, size: sz, font, color });
      y -= sz + 3;
    }
  }

  function multiline(s: string, opts: Parameters<typeof text>[1] = {}) {
    if (!s.trim()) return;
    for (const p of s.split(/\n/)) {
      if (p.trim()) text(p.trim(), opts);
      else y -= 6;
    }
  }

  /** Section heading with numbered circle */
  function section(num: number, title: string) {
    need(30);
    y -= 14;
    const cx = ML + 8, cy = y - 2;
    page.drawCircle({ x: cx, y: cy, size: 8, color: NAVY });
    page.drawText(String(num), { x: cx - (num >= 10 ? 5 : 3), y: cy - 4, size: 9, font: hvB, color: rgb(1, 1, 1) });
    page.drawText(title, { x: ML + 24, y: cy - 4, size: 12, font: hvB, color: NAVY });
    y -= 22;
  }

  function field(label: string, value: string) {
    if (!value) return;
    need(20);
    text(label, { sz: 8, font: hvB, color: GRAY });
    y -= 1;
    text(value, { sz: 9.5, color: DARK });
    y -= 4;
  }

  function toggle(label: string, value: string, inverted = false) {
    if (!value) return;
    need(14);
    const lw = hv.widthOfTextAtSize(label, 9);
    page.drawText(safe(label), { x: ML, y: y - 9, size: 9, font: hv, color: DARK });
    const c = inverted
      ? (value === "No" ? GREEN : value === "Yes" ? RED : GRAY)
      : (value === "Yes" ? GREEN : value === "No" ? RED : GRAY);
    page.drawText(safe(value), { x: ML + lw + 10, y: y - 9, size: 9, font: hvB, color: c });
    y -= 14;
  }

  function rating(label: string, value: string) {
    if (!value) return;
    need(14);
    const lw = hv.widthOfTextAtSize(label + ": ", 9);
    page.drawText(safe(label + ": "), { x: ML + 12, y: y - 9, size: 9, font: hv, color: DARK });
    page.drawText(safe(value), { x: ML + 12 + lw, y: y - 9, size: 9, font: hvB, color: NAVY });
    y -= 14;
  }

  // ─── Header ───
  // Navy bar at top
  page.drawRectangle({ x: ML, y: y, width: CW, height: 2.5, color: NAVY });
  y -= 14;
  page.drawText("AMERICAN IMPACT REVIEW", { x: ML, y: y - 14, size: 14, font: hvB, color: NAVY });
  const urlText = "americanimpactreview.com";
  const urlW = hv.widthOfTextAtSize(urlText, 8);
  page.drawText(urlText, { x: PAGE_W - MR - urlW, y: y - 12, size: 8, font: hv, color: GRAY });
  y -= 18;
  page.drawText("Peer Review Record", { x: ML, y: y - 11, size: 11, font: hv, color: ACCENT });
  const pubText = "Global Talent Foundation 501(c)(3)";
  const pubW = hv.widthOfTextAtSize(pubText, 7);
  page.drawText(pubText, { x: PAGE_W - MR - pubW, y: y - 9, size: 7, font: hv, color: GRAY });
  y -= 18;
  // Thin accent line under header
  page.drawRectangle({ x: ML, y: y, width: CW, height: 0.75, color: ACCENT });
  y -= 10;

  // ─── Preamble ───
  text(`This document confirms that ${data.reviewerName} served as an independent peer reviewer for American Impact Review, a peer-reviewed multidisciplinary journal published by Global Talent Foundation 501(c)(3).`, { sz: 9.5, color: DARK });
  y -= 6;

  // Manuscript details box
  need(70);
  const boxTop = y;
  const boxH = 62 + (data.title ? 14 : 0);
  page.drawRectangle({
    x: ML, y: boxTop - boxH, width: CW, height: boxH,
    color: rgb(248 / 255, 250 / 255, 252 / 255),
    borderColor: LINE_CLR, borderWidth: 0.5,
  });
  let bx = boxTop - 14;
  const bLabel = (l: string, v: string) => {
    const lw = hvB.widthOfTextAtSize(l, 8.5);
    page.drawText(safe(l), { x: ML + 12, y: bx, size: 8.5, font: hvB, color: GRAY });
    page.drawText(safe(v), { x: ML + 12 + lw + 6, y: bx, size: 9, font: hv, color: DARK });
    bx -= 15;
  };
  bLabel("Manuscript:", data.manuscriptId);
  if (data.title) bLabel("Title:", data.title);
  bLabel("Review type:", "Single-blind peer review");
  bLabel("Date of review:", data.submittedAt || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  y = boxTop - boxH - 6;

  text("The reviewer evaluated the manuscript across multiple criteria as part of the journal's structured peer review process. The full evaluation is detailed below.", { sz: 9, font: hvO, color: GRAY });
  y -= 8;

  // ─── 1. Reviewer Information — styled card ───
  need(100);
  const riTop = y;
  const riFields: [string, string][] = [
    ["Reviewer", data.reviewerName],
    ["Email", data.reviewerEmail],
    ["Manuscript ID", data.manuscriptId],
  ];
  if (data.title) riFields.push(["Manuscript Title", data.title]);
  if (data.submittedAt) riFields.push(["Submitted", data.submittedAt]);
  const riH = 28 + riFields.length * 16;

  // Navy background box
  page.drawRectangle({
    x: ML, y: riTop - riH, width: CW, height: riH,
    color: NAVY,
  });

  // Section title inside the box
  let ry = riTop - 16;
  page.drawText("1", { x: ML + 10, y: ry - 3, size: 8, font: hvB, color: ACCENT });
  page.drawText("REVIEWER INFORMATION", { x: ML + 24, y: ry - 3, size: 9, font: hvB, color: rgb(1, 1, 1) });
  ry -= 18;

  // Fields as two-column: label in muted white, value in bright white
  for (const [label, value] of riFields) {
    const lw = hv.widthOfTextAtSize(label + ":", 8);
    page.drawText(safe(label + ":"), { x: ML + 14, y: ry, size: 8, font: hv, color: rgb(180 / 255, 200 / 255, 220 / 255) });
    page.drawText(safe(value), { x: ML + 14 + lw + 8, y: ry, size: 9, font: hvB, color: rgb(1, 1, 1) });
    ry -= 16;
  }

  y = riTop - riH - 12;

  // 2
  section(2, "Introduction");
  toggle("Objectives clearly stated?", data.objectivesClear);
  toggle("Literature review adequate?", data.literatureAdequate);
  if (data.introComments.trim()) {
    y -= 4;
    text("Comments:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.introComments, { sz: 9 });
  }
  y -= 6;

  // 3
  section(3, "Methods");
  toggle("Methods reproducible?", data.methodsReproducible);
  toggle("Statistics appropriate?", data.statisticsAppropriate);
  if (data.methodsComments.trim()) {
    y -= 4;
    text("Comments:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.methodsComments, { sz: 9 });
  }
  y -= 6;

  // 4
  section(4, "Results");
  toggle("Results presented clearly?", data.resultsPresentation);
  toggle("Tables/figures appropriate?", data.tablesAppropriate);
  if (data.resultsComments.trim()) {
    y -= 4;
    text("Comments:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.resultsComments, { sz: 9 });
  }
  y -= 6;

  // 5
  section(5, "Discussion & Conclusions");
  toggle("Conclusions supported by data?", data.conclusionsSupported);
  toggle("Limitations clearly stated?", data.limitationsStated);
  if (data.discussionComments.trim()) {
    y -= 4;
    text("Comments:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.discussionComments, { sz: 9 });
  }
  y -= 6;

  // 6
  section(6, "Overall Assessment");
  rating("Originality", data.originality);
  rating("Methodology", data.methodology);
  rating("Clarity of Writing", data.clarity);
  rating("Significance", data.significance);
  toggle("Language editing needed?", data.languageEditing, true);
  y -= 6;

  // 7
  section(7, "Detailed Feedback");
  if (data.majorIssues.trim()) {
    text("Major Issues:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.majorIssues, { sz: 9 });
    y -= 6;
  }
  if (data.minorIssues.trim()) {
    text("Minor Issues:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.minorIssues, { sz: 9 });
    y -= 6;
  }
  if (data.commentsToAuthors.trim()) {
    text("Comments to Authors:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.commentsToAuthors, { sz: 9 });
    y -= 6;
  }
  if (data.confidentialComments.trim()) {
    text("Confidential Comments to Editor:", { sz: 8, font: hvB, color: GRAY });
    multiline(data.confidentialComments, { sz: 9 });
    y -= 6;
  }
  y -= 4;

  // 8 — Final Recommendation with accent background
  need(50);
  y -= 10;
  const recH = 40;
  const recTop = y;
  const rc = data.recommendation === "Accept" ? GREEN :
    data.recommendation === "Reject" ? RED :
    data.recommendation.includes("Minor") ? AMBER : ORANGE;

  // Light background tinted by recommendation color
  page.drawRectangle({
    x: ML, y: recTop - recH, width: CW, height: recH,
    color: NAVY_LIGHT,
  });
  // Left accent bar in recommendation color
  page.drawRectangle({
    x: ML, y: recTop - recH, width: 3.5, height: recH,
    color: rc,
  });

  const cx = ML + 8 + 6, cy = recTop - recH / 2;
  page.drawCircle({ x: cx, y: cy, size: 8, color: NAVY });
  page.drawText("8", { x: cx - 3, y: cy - 4, size: 9, font: hvB, color: rgb(1, 1, 1) });
  page.drawText("Final Recommendation", { x: ML + 30, y: cy + 2, size: 10, font: hvB, color: NAVY });
  page.drawText(safe(data.recommendation || "—"), { x: ML + 30, y: cy - 12, size: 13, font: hvB, color: rc });
  y = recTop - recH - 10;

  // ─── Verification & Authenticity Block ───
  const docId = await generateDocId(data);
  const issueDate = data.submittedAt || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  need(120);
  y -= 4;

  // Outer box with navy left accent
  const vBoxH = 95;
  const vBoxTop = y;
  page.drawRectangle({
    x: ML, y: vBoxTop - vBoxH, width: CW, height: vBoxH,
    color: rgb(248 / 255, 250 / 255, 252 / 255),
    borderColor: LINE_CLR, borderWidth: 0.5,
  });
  page.drawRectangle({
    x: ML, y: vBoxTop - vBoxH, width: 3, height: vBoxH,
    color: NAVY,
  });

  let vy = vBoxTop - 13;
  const vx = ML + 14;
  page.drawText("DOCUMENT VERIFICATION", { x: vx, y: vy, size: 7.5, font: hvB, color: NAVY });
  vy -= 14;

  const vRow = (label: string, value: string) => {
    const lw = hvB.widthOfTextAtSize(label, 7.5);
    page.drawText(safe(label), { x: vx, y: vy, size: 7.5, font: hvB, color: GRAY });
    page.drawText(safe(value), { x: vx + lw + 5, y: vy, size: 7.5, font: hv, color: DARK });
    vy -= 12;
  };

  vRow("Document ID:", docId);
  vRow("Publisher:", "Global Talent Foundation 501(c)(3)");
  vRow("Journal:", "American Impact Review  |  americanimpactreview.com");
  vRow("Review Type:", "Single-blind peer review (COPE-compliant)");
  vRow("Issued:", issueDate);

  y = vBoxTop - vBoxH - 6;

  text("This document was generated by the American Impact Review editorial system. The Document ID above is a cryptographic hash derived from the review data and submission timestamp. Any alteration to this document will invalidate the Document ID.", { sz: 6.5, font: hvO, color: GRAY });
  y -= 4;

  // ─── Footers ───
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    // Navy bar at bottom
    p.drawRectangle({ x: ML, y: 42, width: CW, height: 0.5, color: NAVY });
    const ft = `American Impact Review  |  ${docId}  |  Page ${i + 1} of ${pages.length}`;
    const fw = hv.widthOfTextAtSize(ft, 7);
    p.drawText(ft, { x: (PAGE_W - fw) / 2, y: 30, size: 7, font: hv, color: GRAY });
  }

  // ─── Full PDF Metadata ───
  const now = new Date();
  doc.setTitle(`Peer Review Record — ${data.manuscriptId}`);
  doc.setAuthor(data.reviewerName);
  doc.setSubject(`Peer review of manuscript ${data.manuscriptId} for American Impact Review`);
  doc.setKeywords([
    "peer review", "American Impact Review", "Global Talent Foundation",
    "501(c)(3)", data.manuscriptId, data.reviewerName,
    "academic journal", "peer-reviewed", "COPE",
    docId,
  ]);
  doc.setProducer("American Impact Review Editorial System (americanimpactreview.com)");
  doc.setCreator("American Impact Review — Global Talent Foundation 501(c)(3)");
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  return doc.save();
}
