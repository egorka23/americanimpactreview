/**
 * Client-side article PDF generation using html2canvas + jsPDF.
 * Renders a PLOS-style HTML template of the article and converts it to PDF.
 */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ArticlePdfData {
  title: string;
  slug: string;
  authors: string[];
  affiliations: string[];
  abstract: string;
  keywords: string[];
  content: string;
  category: string;
  articleType?: string;
  doi?: string;
  receivedAt?: string | null;
  acceptedAt?: string | null;
  publishedAt?: string | null;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>'
    );
}

function renderMarkdownBlock(text: string): string {
  const lines = text.split("\n");
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;

  const closeList = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
    if (inOl) { output.push("</ol>"); inOl = false; }
  };
  const closeTable = () => {
    if (inTable) { output.push("</tbody></table>"); inTable = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^---+$/.test(trimmed)) { closeList(); closeTable(); continue; }

    // Inline figure
    const figMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (figMatch) {
      closeList(); closeTable();
      const alt = figMatch[1];
      const src = figMatch[2];
      output.push(
        `<figure style="margin:14px 0;page-break-inside:avoid;">` +
        `<img src="${src}" alt="${alt}" style="max-width:100%;max-height:400px;display:block;margin:0 auto;" />` +
        (alt ? `<figcaption style="font-size:9pt;color:#333;margin-top:6px;">${alt.replace(/^(Figure \d+)\./, "<strong>$1.</strong>")}</figcaption>` : "") +
        `</figure>`
      );
      continue;
    }

    // Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList();
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s\-:|]/g, "")) continue;
      if (!inTable) {
        inTable = true;
        output.push('<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:8.5pt;"><thead><tr>');
        const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
        cells.forEach(c => output.push(`<th style="background:#eef1f5;color:#1a1a1a;font-weight:700;padding:6px 8px;text-align:left;border-top:2px solid #333;border-bottom:1px solid #333;">${inlineFormat(c)}</th>`));
        output.push("</tr></thead><tbody>");
        continue;
      }
      const cells = trimmed.split("|").filter(Boolean).map(c => c.trim());
      output.push("<tr>");
      cells.forEach(c => output.push(`<td style="padding:5px 8px;border-bottom:1px solid #ddd;vertical-align:top;">${inlineFormat(c)}</td>`));
      output.push("</tr>");
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      closeTable();
      if (inOl) { output.push("</ol>"); inOl = false; }
      if (!inUl) { output.push('<ul style="margin:6px 0 6px 24px;font-size:10pt;">'); inUl = true; }
      output.push(`<li style="margin-bottom:3px;">${inlineFormat(trimmed.replace(/^[-*+]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (inUl) { output.push("</ul>"); inUl = false; }
      if (!inOl) { output.push('<ol style="margin:6px 0 6px 24px;font-size:10pt;">'); inOl = true; }
      output.push(`<li style="margin-bottom:3px;">${inlineFormat(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    if (inUl || inOl) closeList();
    if (!trimmed) continue;

    // Formula
    if (/^\[Formula:\s*/.test(trimmed)) {
      closeList(); closeTable();
      const f = trimmed.replace(/^\[Formula:\s*/, "").replace(/\]$/, "");
      output.push(`<div style="text-align:center;font-style:italic;margin:10px 0;padding:6px;background:#fafafa;">${inlineFormat(f)}</div>`);
      continue;
    }

    output.push(`<p style="margin-bottom:8px;text-align:justify;">${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  closeTable();
  return output.join("\n");
}

function parseSections(content: string, articleTitle?: string): { heading: string; level: number; body: string }[] {
  const isHtml = content.trimStart().startsWith("<");

  // HTML content path: extract sections from <h1>/<h2> tags or bold paragraph fallback
  if (isHtml) {
    const sections: { heading: string; level: number; body: string }[] = [];
    const headingRegex = /<h([12])[^>]*>(.*?)<\/h\1>/gi;
    const headings: { level: number; title: string; index: number; endTag: number }[] = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const endTag = match.index + match[0].length;
      headings.push({ level: parseInt(match[1]), title: match[2].replace(/<[^>]+>/g, "").trim(), index: match.index, endTag });
    }

    // Fallback: detect <p><strong>SectionName</strong></p> as headings
    if (!headings.length) {
      const boldHeadingRegex = /<p><strong>([^<]*)<\/strong><\/p>/gi;
      const knownSections = /^(abstract|introduction|methods?|methodology|analytical\s+procedure|materials?\s+and\s+methods?|results?|discussion|conclusions?|limitations?|implications?|recommendations?|acknowledgm?ents?|author\s+contributions?|funding|data\s+availability|conflicts?\s+of\s+interest|disclosure|ethics|references|bibliography|appendix|literature\s+review|theoretical\s+framework|background|objectives?|aim|purpose|study\s+design|participants?|procedure|analysis|findings|future\s+research|significance)/i;
      const titleLower = (articleTitle || "").toLowerCase();
      let bm;
      while ((bm = boldHeadingRegex.exec(content)) !== null) {
        const text = bm[1].replace(/<[^>]+>/g, "").trim();
        if (!text || text.length > 120) continue;
        if (text.toLowerCase() === titleLower) continue;
        if (/orcid/i.test(text) || /@/.test(text)) continue;
        if (/^(table|figure|fig\.?)\s+\d/i.test(text)) continue;
        const stripped = text.replace(/^\d+\.?\s*/, "");
        if (knownSections.test(stripped) || /^\d+\.?\s+\S/.test(text)) {
          const endTag = bm.index + bm[0].length;
          headings.push({ level: 1, title: text, index: bm.index, endTag });
        }
      }
    }

    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const nextIdx = i + 1 < headings.length ? headings[i + 1].index : content.length;
      const bodyHtml = content.slice(h.endTag, nextIdx).trim();
      sections.push({ heading: h.title, level: h.level, body: bodyHtml });
    }
    return sections;
  }

  // Markdown content path
  const lines = content.split(/\r?\n/);
  const sections: { heading: string; level: number; body: string }[] = [];
  let currentHeading = "";
  let currentLevel = 2;
  let currentBody: string[] = [];

  // Find start of body (first numbered heading)
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,4}\s+\d+\.?\s+/.test(lines[i].trim())) {
      bodyStart = i;
      break;
    }
  }

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (currentHeading && body) {
      sections.push({ heading: currentHeading, level: currentLevel, body });
    }
    currentBody = [];
  };

  for (let i = bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      flush();
      currentLevel = headingMatch[1].length;
      currentHeading = headingMatch[2].trim();
    } else {
      currentBody.push(lines[i]);
    }
  }
  flush();

  return sections;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

function buildArticleHtml(data: ArticlePdfData): string {
  const authorsHtml = data.authors.map((name, i) => {
    const sup = data.affiliations.length > 1 ? `<sup>${i + 1}</sup>` : "";
    return `${name}${sup}`;
  }).join(", ");

  const affiliationsHtml = data.affiliations.map((a, i) => {
    const num = data.affiliations.length > 1 ? `<strong>${i + 1}</strong> ` : "";
    return `${num}${a}`;
  }).join("<br/>");

  const year = data.publishedAt ? new Date(data.publishedAt).getFullYear() : new Date().getFullYear();
  const citationAuthors = data.authors.length > 3
    ? `${data.authors[0]} et al.`
    : data.authors.join(", ");
  const citationText = `${citationAuthors} (${year}) ${data.title}. American Impact Review. ${data.slug.toUpperCase()}. https://americanimpactreview.com/article/${data.slug}`;

  const sections = parseSections(data.content, data.title);
  let bodyHtml = "";
  let refsHtml = "";

  for (const section of sections) {
    const normalized = section.heading.toLowerCase();
    if (normalized === "references" || normalized.startsWith("references")) {
      const refs = section.body.split("\n").map(l => l.trim()).filter(Boolean);
      refsHtml = `<h2 style="font-size:13pt;font-weight:700;color:#1a1a1a;margin-top:18px;margin-bottom:6px;">References</h2>
        <ol style="font-size:9pt;line-height:1.5;color:#000;padding-left:24px;list-style-type:decimal;">
          ${refs.map(r => `<li style="margin-bottom:4px;text-align:left;">${r.replace(/^\d+\.\s*/, "")}</li>`).join("\n")}
        </ol>`;
      continue;
    }

    const tag = section.level === 2 ? "h2" : section.level === 3 ? "h3" : "h4";
    const sizes: Record<string, string> = { h2: "13pt", h3: "11pt", h4: "10pt" };
    bodyHtml += `<${tag} style="font-size:${sizes[tag]};font-weight:700;color:#1a1a1a;margin-top:18px;margin-bottom:6px;">${section.heading}</${tag}>\n`;
    bodyHtml += renderMarkdownBlock(section.body) + "\n";
  }

  return `
<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;color:#1a1a1a;width:816px;padding:48px 56px;">
  <!-- Logo -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
    <img src="/android-chrome-512x512.png" alt="AIR" style="height:48px;" crossorigin="anonymous" />
    <span style="font-size:22pt;font-weight:700;color:#1e3a5f;letter-spacing:0.3px;">American Impact Review</span>
  </div>

  <!-- Kicker -->
  <div style="font-size:9pt;font-weight:600;color:#333;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;margin-top:16px;">${data.articleType || "Research Article"}</div>

  <!-- Title -->
  <div style="font-size:18pt;font-weight:700;color:#111;line-height:1.25;margin-bottom:12px;">${data.title}</div>

  <!-- Authors -->
  <div style="font-size:12pt;color:#000;margin-bottom:6px;">${authorsHtml}</div>

  <!-- Affiliations -->
  <div style="font-size:9.5pt;color:#000;line-height:1.5;margin-bottom:6px;">${affiliationsHtml}</div>

  <!-- Corresponding author -->
  <div style="font-size:9.5pt;color:#000;margin-bottom:16px;">* Corresponding author</div>

  <!-- Two-column: sidebar + abstract -->
  <div style="display:flex;gap:24px;margin-bottom:14px;">
    <div style="width:220px;flex-shrink:0;font-size:9.5pt;color:#000;line-height:1.5;border-top:1px solid #ddd;padding-top:10px;overflow-wrap:break-word;word-break:break-all;">
      <div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">OPEN ACCESS</div></div>
      <div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">Citation:</div><div>${citationText}</div></div>
      ${data.receivedAt ? `<div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">Received:</div><div>${formatDate(data.receivedAt)}</div></div>` : ""}
      ${data.acceptedAt ? `<div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">Accepted:</div><div>${formatDate(data.acceptedAt)}</div></div>` : ""}
      ${data.publishedAt ? `<div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">Published:</div><div>${formatDate(data.publishedAt)}</div></div>` : ""}
      <div style="margin-bottom:10px;"><div style="font-weight:700;color:#333;">Copyright:</div><div>&copy; ${year} ${data.authors[0] || "Authors"}. CC BY 4.0.</div></div>
    </div>
    <div style="flex:1;min-width:0;">
      ${data.abstract ? `
        <div style="font-size:14pt;font-weight:700;color:#1e3a5f;margin-bottom:8px;border-top:1px solid #ddd;padding-top:10px;">Abstract</div>
        <div style="font-size:9.5pt;line-height:1.55;color:#333;margin-bottom:10px;text-align:justify;">${inlineFormat(data.abstract)}</div>
      ` : ""}
    </div>
  </div>

  <!-- Body -->
  ${bodyHtml}

  <!-- References -->
  ${refsHtml}
</div>`;
}

export async function generateArticlePdf(data: ArticlePdfData): Promise<Blob> {
  // Create a hidden container for rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.background = "white";
  document.body.appendChild(container);

  container.innerHTML = buildArticleHtml(data);

  // Wait for images to load
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  // Small delay for rendering
  await new Promise((r) => setTimeout(r, 300));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    width: 816,
    windowWidth: 816,
    backgroundColor: "#ffffff",
  });

  document.body.removeChild(container);

  // Letter size: 8.5 x 11 inches = 612 x 792 points
  const pageWidth = 612;
  const pageHeight = 792;
  const footerReserve = 30; // space reserved for footer
  const usableHeight = pageHeight - footerReserve;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  // Scale factor: canvas pixels per PDF point
  const pxPerPt = canvas.width / pageWidth;

  /**
   * Smart page break: scan the canvas for a white/empty horizontal gap
   * near the nominal page boundary. This prevents splitting tables,
   * figures, or headings across pages.
   *
   * We look within a search zone (±searchRange around the nominal cut)
   * and prefer cutting at the nearest blank row to the nominal boundary.
   * A row is "blank" when all its pixels are near-white (R,G,B ≥ 245).
   */
  function findSafeBreak(nominalCutPt: number): number {
    const searchRangePt = 60; // look ±60pt around nominal cut
    const nominalCutPx = Math.round(nominalCutPt * pxPerPt);
    const searchRangePx = Math.round(searchRangePt * pxPerPt);
    const startPx = Math.max(0, nominalCutPx - searchRangePx);
    const endPx = Math.min(canvas.height - 1, nominalCutPx + searchRangePx);

    // Sample a horizontal stripe of pixels per row (check every 4th pixel for speed)
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, startPx, canvas.width, endPx - startPx + 1);
    const { data: pixels, width: imgW } = imgData;

    // Find blank rows (all sampled pixels are near-white)
    const blankRows: number[] = [];
    for (let localY = 0; localY <= endPx - startPx; localY++) {
      let isBlank = true;
      for (let x = 0; x < imgW; x += 4) {
        const idx = (localY * imgW + x) * 4;
        if (pixels[idx] < 245 || pixels[idx + 1] < 245 || pixels[idx + 2] < 245) {
          isBlank = false;
          break;
        }
      }
      if (isBlank) blankRows.push(startPx + localY);
    }

    if (blankRows.length === 0) {
      // No blank row found — fall back to nominal cut
      return nominalCutPt;
    }

    // Pick the blank row closest to nominal cut
    let bestPx = blankRows[0];
    let bestDist = Math.abs(bestPx - nominalCutPx);
    for (const px of blankRows) {
      const dist = Math.abs(px - nominalCutPx);
      if (dist < bestDist) {
        bestPx = px;
        bestDist = dist;
      }
    }

    return bestPx / pxPerPt;
  }

  // Compute page break points
  const breaks: number[] = [0]; // start of each page in PDF pt
  let cursor = 0;
  while (cursor + usableHeight < imgHeight) {
    const nominalEnd = cursor + usableHeight;
    const safeCut = findSafeBreak(nominalEnd);
    breaks.push(safeCut);
    cursor = safeCut;
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const imgDataUrl = canvas.toDataURL("image/jpeg", 0.95);

  for (let pageNum = 0; pageNum < breaks.length; pageNum++) {
    if (pageNum > 0) pdf.addPage();
    const pageStart = breaks[pageNum];

    pdf.addImage(
      imgDataUrl,
      "JPEG",
      0,
      -pageStart,
      imgWidth,
      imgHeight
    );

    // Mask content below this page's cut point with a white rectangle
    const pageEnd = pageNum + 1 < breaks.length ? breaks[pageNum + 1] : imgHeight;
    const visibleHeight = pageEnd - pageStart;
    if (visibleHeight < pageHeight) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, visibleHeight, pageWidth, pageHeight - visibleHeight, "F");
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const footerY = pageHeight - 12;
    pdf.text(`American Impact Review | americanimpactreview.com/article/${data.slug}`, 40, footerY);
    pdf.text(`${pageNum + 1}`, pageWidth - 40, footerY, { align: "right" });
  }

  // Set metadata
  pdf.setProperties({
    title: data.title,
    author: data.authors.join(", "),
    subject: data.abstract?.slice(0, 500) || "",
    keywords: data.keywords.join(", "),
    creator: "American Impact Review",
  });

  return pdf.output("blob");
}
