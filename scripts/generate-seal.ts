import { createCanvas, registerFont, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

const ASSETS = path.join(__dirname, 'certificate-assets');

// Register Cinzel for arc text
registerFont(path.join(ASSETS, 'Cinzel-Bold.ttf'), { family: 'Cinzel', weight: 'bold' });

// Colors
const GOLD = '#B28A3C';
const GOLD_LIGHT = '#D4AF5F';
const GOLD_DARK = '#8B6D30';
const NAVY = '#0B2C4A';
const NAVY_DARK = '#071E33';

/**
 * Universal arc-text renderer.
 * @param centerDeg  angle (degrees) where middle of text sits. 0=right, 90=bottom, -90=top, 180=left
 * @param direction  1 = clockwise (normal for top text), -1 = counter-clockwise (for bottom text, letters flip)
 */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  radius: number,
  centerDeg: number,
  direction: 1 | -1 = 1
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.split('');
  const charAngles: number[] = [];

  // For each char, compute the angular width it subtends
  for (const ch of chars) {
    const w = ctx.measureText(ch).width;
    // angle = arc length / radius
    charAngles.push(w / radius);
  }

  const totalAngle = charAngles.reduce((s, a) => s + a, 0);
  const centerRad = (centerDeg * Math.PI) / 180;

  // Start angle: go back half the total from center
  let angle = centerRad - (direction * totalAngle) / 2;

  for (let i = 0; i < chars.length; i++) {
    // Move to center of this character
    angle += (direction * charAngles[i]) / 2;

    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    ctx.save();
    ctx.translate(x, y);

    if (direction === 1) {
      // Top arc: letter bottoms face center
      ctx.rotate(angle + Math.PI / 2);
    } else {
      // Bottom arc: letter tops face center
      ctx.rotate(angle - Math.PI / 2);
    }

    ctx.fillText(chars[i], 0, 0);
    ctx.restore();

    // Advance past this character
    angle += (direction * charAngles[i]) / 2;
  }

  ctx.restore();
}

function drawStar5(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = cx + Math.cos(outerAngle) * outerR;
    const oy = cy + Math.sin(outerAngle) * outerR;
    const ix = cx + Math.cos(innerAngle) * innerR;
    const iy = cy + Math.sin(innerAngle) * innerR;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}

export async function generateSeal(outputPath?: string): Promise<Buffer> {
  const size = 800;
  const cx = size / 2;
  const cy = size / 2;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  const outerR = 380;
  const toothR = 395;

  // ── Serrated outer edge ──
  ctx.save();
  const teeth = 56;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const x1 = cx + Math.cos(a1) * toothR;
    const y1 = cy + Math.sin(a1) * toothR;
    const x2 = cx + Math.cos(a2) * (outerR - 5);
    const y2 = cy + Math.sin(a2) * (outerR - 5);
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();

  // Gold gradient fill for outer ring
  const grad = ctx.createRadialGradient(cx, cy, outerR - 60, cx, cy, toothR);
  grad.addColorStop(0, GOLD_LIGHT);
  grad.addColorStop(0.5, GOLD);
  grad.addColorStop(1, GOLD_DARK);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // ── Inner gold ring ──
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 20, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD_DARK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── Dark navy circle (text band background) ──
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 25, 0, Math.PI * 2);
  ctx.fillStyle = NAVY_DARK;
  ctx.fill();

  // ── Inner gold border of text band ──
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 25, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Arc text: "AMERICAN IMPACT REVIEW" (top) ──
  ctx.font = 'bold 28px Cinzel';
  ctx.fillStyle = GOLD_LIGHT;
  drawArcText(ctx, 'AMERICAN  IMPACT  REVIEW', cx, cy, outerR - 52, -90, 1);

  // ── Arc text: "SCHOLARLY EXCELLENCE" (bottom) ──
  ctx.font = 'bold 26px Cinzel';
  drawArcText(ctx, 'SCHOLARLY  EXCELLENCE', cx, cy, outerR - 52, 90, -1);

  // ── Star separators (left and right between texts) ──
  const starSepR = outerR - 55;
  // Left star
  const leftAngle = Math.PI * 0.78;
  ctx.fillStyle = GOLD_LIGHT;
  drawStar5(ctx, cx + Math.cos(leftAngle) * starSepR, cy + Math.sin(leftAngle) * starSepR, 10, 4);
  // Right star
  const rightAngle = Math.PI * 0.22;
  drawStar5(ctx, cx + Math.cos(rightAngle) * starSepR, cy + Math.sin(rightAngle) * starSepR, 10, 4);
  // Bottom-left star
  const blAngle = Math.PI * 1.22;
  drawStar5(ctx, cx + Math.cos(blAngle) * starSepR, cy + Math.sin(blAngle) * starSepR, 10, 4);
  // Bottom-right star
  const brAngle = Math.PI * 1.78;
  drawStar5(ctx, cx + Math.cos(brAngle) * starSepR, cy + Math.sin(brAngle) * starSepR, 10, 4);

  // ── Inner circle (image area) ──
  const innerR = outerR - 90;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── Stars ring inside inner circle ──
  const starsR = innerR - 15;
  const starCount = 13;
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(angle) * starsR;
    const sy = cy + Math.sin(angle) * starsR;
    drawStar5(ctx, sx, sy, 8, 3.5);
  }

  // ── American flag (simplified) ──
  const flagW = 100;
  const flagH = 55;
  const flagX = cx - flagW / 2;
  const flagY = cy - innerR + 45;

  // Red and white stripes
  const stripeH = flagH / 13;
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#FFFFFF';
    ctx.fillRect(flagX, flagY + i * stripeH, flagW, stripeH);
  }
  // Blue canton
  const cantonW = flagW * 0.4;
  const cantonH = stripeH * 7;
  ctx.fillStyle = '#3C3B6E';
  ctx.fillRect(flagX, flagY, cantonW, cantonH);
  // Small stars in canton
  ctx.fillStyle = '#FFFFFF';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const sx = flagX + 6 + col * (cantonW - 12) / 3;
      const sy = flagY + 5 + row * (cantonH - 10) / 3;
      drawStar5(ctx, sx, sy, 3.5, 1.5);
    }
  }
  // Flag border
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(flagX, flagY, flagW, flagH);

  // ── Open book ──
  const bookCY = cy + 35;
  const bookW = 110;
  const bookH = 70;

  // Book pages (cream colored)
  ctx.fillStyle = '#F5F0E1';
  // Left page
  ctx.beginPath();
  ctx.moveTo(cx, bookCY - bookH / 2 + 5);
  ctx.quadraticCurveTo(cx - bookW / 2 - 10, bookCY - bookH / 2, cx - bookW / 2, bookCY);
  ctx.lineTo(cx - bookW / 2, bookCY + bookH / 2);
  ctx.lineTo(cx, bookCY + bookH / 2 - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right page
  ctx.beginPath();
  ctx.moveTo(cx, bookCY - bookH / 2 + 5);
  ctx.quadraticCurveTo(cx + bookW / 2 + 10, bookCY - bookH / 2, cx + bookW / 2, bookCY);
  ctx.lineTo(cx + bookW / 2, bookCY + bookH / 2);
  ctx.lineTo(cx, bookCY + bookH / 2 - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Text lines on pages
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    const ly = bookCY - bookH / 4 + i * 12;
    // Left page lines
    ctx.beginPath();
    ctx.moveTo(cx - bookW / 2 + 12, ly);
    ctx.lineTo(cx - 8, ly);
    ctx.stroke();
    // Right page lines
    ctx.beginPath();
    ctx.moveTo(cx + 8, ly);
    ctx.lineTo(cx + bookW / 2 - 12, ly);
    ctx.stroke();
  }

  // Book spine
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, bookCY - bookH / 2 + 5);
  ctx.lineTo(cx, bookCY + bookH / 2 - 5);
  ctx.stroke();

  // ── Export ──
  const buffer = canvas.toBuffer('image/png');
  const out = outputPath || path.join(ASSETS, 'seal.png');
  fs.writeFileSync(out, buffer);
  console.log(`Seal generated: ${out} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer;
}

// Run directly
if (require.main === module) {
  generateSeal();
}
