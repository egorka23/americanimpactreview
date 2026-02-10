"use client";

import { useState } from "react";
import Link from "next/link";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Article } from "@/lib/types";

type SerializedArticle = Omit<Article, "publishedAt" | "createdAt" | "receivedAt" | "acceptedAt"> & {
  publishedAt: string | null;
  createdAt: string | null;
  receivedAt?: string | null;
  acceptedAt?: string | null;
};

function toDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Convert inline markdown to HTML. Handles bold, italic, code, links,
 * unordered/ordered lists, formula blocks, markdown tables, and horizontal rules.
 */
function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const outputLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableHeaderDone = false;

  const closeList = () => {
    if (inUl) {
      outputLines.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      outputLines.push("</ol>");
      inOl = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      outputLines.push("</tbody></table></div>");
      inTable = false;
      tableHeaderDone = false;
    }
  };

  const inlineFormat = (line: string): string => {
    return line
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip horizontal rules
    if (/^---+$/.test(trimmed)) {
      closeList();
      closeTable();
      continue;
    }

    // Formula blocks: [Formula: ...]
    if (/^\[Formula:\s*/.test(trimmed)) {
      closeList();
      closeTable();
      const formulaText = trimmed.replace(/^\[Formula:\s*/, "").replace(/\]$/, "");
      outputLines.push(`<div class="formula-block">${inlineFormat(formulaText)}</div>`);
      continue;
    }

    // Markdown table rows (lines starting with |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      closeList();

      // Check if this is a separator row (|---|---|)
      if (/^\|[\s\-:]+\|/.test(trimmed) && !trimmed.replace(/[\s\-:|]/g, "")) {
        // This is the separator line - skip it but mark header done
        tableHeaderDone = true;
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderDone = false;
        outputLines.push('<div class="article-table-wrap"><table class="article-table">');
        // This first row is the header
        const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
        outputLines.push("<thead><tr>");
        cells.forEach((cell) => {
          outputLines.push(`<th>${inlineFormat(cell)}</th>`);
        });
        outputLines.push("</tr></thead><tbody>");
        continue;
      }

      // Regular table row
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
      outputLines.push("<tr>");
      cells.forEach((cell) => {
        outputLines.push(`<td>${inlineFormat(cell)}</td>`);
      });
      outputLines.push("</tr>");
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Unordered list items
    if (/^[-*+]\s+/.test(trimmed)) {
      closeTable();
      if (inOl) {
        outputLines.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        outputLines.push("<ul>");
        inUl = true;
      }
      const content = trimmed.replace(/^[-*+]\s+/, "");
      outputLines.push(`<li>${inlineFormat(content)}</li>`);
      continue;
    }

    // Ordered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      closeTable();
      if (inUl) {
        outputLines.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        outputLines.push("<ol>");
        inOl = true;
      }
      const content = trimmed.replace(/^\d+\.\s+/, "");
      outputLines.push(`<li>${inlineFormat(content)}</li>`);
      continue;
    }

    // Close any open list if we hit a non-list line
    if (inUl || inOl) {
      closeList();
    }

    // Empty lines - skip
    if (!trimmed) continue;

    // Regular paragraph
    outputLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  closeTable();

  return outputLines.join("\n");
}

export default function ArticleClient({ article: raw }: { article: SerializedArticle }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [downloading, setDownloading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  const article = {
    ...raw,
    publishedAt: toDate(raw.publishedAt),
    createdAt: toDate(raw.createdAt),
    receivedAt: toDate(raw.receivedAt),
    acceptedAt: toDate(raw.acceptedAt),
  };

  const authorDisplayName = (article.authors && article.authors.length)
    ? article.authors[0]
    : article.authorUsername;

  const cleanedParagraphs = (() => {
    const rawParas = article.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const stripPrefix = (value: string) =>
      value
        .replace(/^#+\s*/, "")
        .replace(/^abstract[:\s]*/i, "")
        .replace(/^author[:\s]*/i, "")
        .replace(/^publication[:\s]*/i, "")
        .replace(/^publication date[:\s]*/i, "")
        .trim();

    const isMeta = (value: string) => {
      const normalized = value.toLowerCase();
      return (
        normalized === article.title.toLowerCase() ||
        normalized.startsWith("author") ||
        normalized.startsWith("publication") ||
        normalized.startsWith("publication date") ||
        normalized === "abstract" ||
        normalized === "introduction"
      );
    };

    const cleaned: string[] = [];
    for (const para of rawParas) {
      const stripped = stripPrefix(para);
      if (!stripped) continue;
      if (isMeta(stripped)) continue;
      cleaned.push(stripped);
    }
    return cleaned.length ? cleaned : rawParas;
  })();

  const parsed = (() => {
    const rawContent = article.content || "";
    const lines = rawContent.split(/\r?\n/);
    const blocks: { type: "heading" | "text"; depth?: number; value: string }[] = [];
    let buffer: string[] = [];

    const flush = () => {
      const text = buffer.join("\n").trim();
      if (text) {
        blocks.push({ type: "text", value: text });
      }
      buffer = [];
    };

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flush();
        blocks.push({
          type: "heading",
          depth: headingMatch[1].length,
          value: headingMatch[2].trim()
        });
      } else {
        buffer.push(line);
      }
    });
    flush();

    if (!blocks.length) {
      return {
        abstract: "",
        sections: cleanedParagraphs.map((p, idx) => ({
          id: `section-${idx + 1}`,
          title: `Section ${idx + 1}`,
          body: p.split(/\n+/)
        })),
        references: ""
      };
    }

    const sections: { id: string; title: string; body: string[] }[] = [];
    let currentTitle = "";
    let currentBody: string[] = [];
    let abstract = "";
    let references = "";

    const pushSection = () => {
      const title = currentTitle.trim();
      const bodyText = currentBody.join("\n").trim();
      if (!title && !bodyText) return;
      const normalized = title.toLowerCase();
      if (normalized === "abstract" || normalized.startsWith("abstract")) {
        abstract = bodyText;
      } else if (normalized === "references" || normalized.startsWith("references")) {
        references = bodyText;
      } else if (normalized === article.title.toLowerCase()) {
        // Skip the title section - its metadata is already shown in the hero
      } else {
        const isMetaParagraph = (p: string) => {
          const low = p.toLowerCase();
          return /^\*\*(authors?|affiliations?|publication|publication date|received|accepted|images|figure captions|keywords?):/i.test(p) ||
            (low.startsWith("- ") && /^- \d+ /.test(p));
        };
        const bodyParas = bodyText
          ? bodyText.split(/\n\n+/).map((p) => p.trim()).filter((p) => p && !isMetaParagraph(p))
          : [];
        if (bodyParas.length) {
          sections.push({
            id: `section-${sections.length + 1}`,
            title: title || `Section ${sections.length + 1}`,
            body: bodyParas
          });
        }
      }
      currentTitle = "";
      currentBody = [];
    };

    blocks.forEach((block) => {
      if (block.type === "heading") {
        pushSection();
        currentTitle = block.value;
      } else {
        currentBody.push(block.value);
      }
    });
    pushSection();

    if (!abstract) {
      const abstractIndex = cleanedParagraphs.findIndex((p) =>
        p.toLowerCase().startsWith("abstract")
      );
      if (abstractIndex >= 0) {
        abstract = cleanedParagraphs[abstractIndex]
          .replace(/^abstract[:\s-]*/i, "")
          .trim();
      }
    }

    if (!sections.length && cleanedParagraphs.length) {
      sections.push({
        id: "section-1",
        title: "Main text",
        body: cleanedParagraphs
      });
    }

    return { abstract, sections, references };
  })();

  const effectiveAbstract = article.abstract || parsed.abstract;
  const citationText = (() => {
    const year = article.publishedAt?.getFullYear() || article.createdAt?.getFullYear() || "n.d.";
    const authorLine =
      article.authors && article.authors.length
        ? article.authors.join(", ")
        : article.authorUsername;
    const doiPart = article.doi ? ` https://doi.org/${article.doi}` : "";
    return `${authorLine} (${year}) ${article.title}. American Impact Review.${doiPart}`;
  })();

  // Use parsed.sections directly -- no fake padding
  const displaySections = parsed.sections;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("idle");
    }
  };

  const normalizePdfText = (text: string) =>
    text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
      .replace(/["\u201C\u201D]/g, "\"")
      .replace(/['\u2018\u2019]/g, "'")
      .replace(/\u00a0/g, " ")
      .replace(/[^\x20-\x7E]/g, " ");

  const wrapText = (
    text: string,
    maxWidth: number,
    font: ReturnType<Awaited<ReturnType<typeof PDFDocument.create>>["embedFont"]> extends Promise<infer T> ? T : never,
    size: number
  ) => {
    const words = normalizePdfText(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(test, size);
      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const pageSize: [number, number] = [612, 792];
      let currentPage = pdfDoc.addPage(pageSize);
      const margin = 54;
      const width = currentPage.getWidth() - margin * 2;
      let cursorY = currentPage.getHeight() - margin;

      const newPage = () => {
        currentPage = pdfDoc.addPage(pageSize);
        cursorY = currentPage.getHeight() - margin;
      };

      const drawText = (text: string, size = 12, bold = false) => {
        const f = bold ? fontBold : font;
        const wrapped = wrapText(text, width, f, size);
        wrapped.forEach((line) => {
          if (cursorY < margin + 40) {
            newPage();
          }
          currentPage.drawText(normalizePdfText(line), { x: margin, y: cursorY, size, font: f });
          cursorY -= size * 1.4;
        });
        cursorY -= size * 0.6;
      };

      drawText("American Impact Review", 11, true);
      drawText(article.title, 18, true);
      drawText(
        `Author: ${article.authors && article.authors.length ? article.authors.join(", ") : authorDisplayName} · ${
          article.affiliations?.join(" · ") || "Independent Researcher"
        }`,
        11
      );
      drawText(
        `${article.doi ? `DOI: ${article.doi} · ` : ""}Published: ${
          article.publishedAt
            ? article.publishedAt.toLocaleDateString()
            : article.createdAt
            ? article.createdAt.toLocaleDateString()
            : "Pending"
        }`,
        10
      );

      if (effectiveAbstract) {
        drawText("Abstract", 13, true);
        drawText(effectiveAbstract, 11);
      }

      displaySections.forEach((section) => {
        drawText(section.title, 12.5, true);
        section.body.forEach((paragraph) => {
          // Strip markdown formatting for PDF plain text
          const plain = paragraph
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/^\[Formula:\s*/, "")
            .replace(/\]$/, "");
          drawText(plain, 11);
        });
      });

      if (parsed.references) {
        drawText("References", 12.5, true);
        parsed.references
          .split(/\n\n+/)
          .filter(Boolean)
          .forEach((ref) => drawText(ref, 10.5));
      }

      if (article.dataAvailability) {
        drawText("Data availability", 12.5, true);
        drawText(article.dataAvailability, 10.5);
      }

      if (article.ethicsStatement) {
        drawText("Ethics statement", 12.5, true);
        drawText(article.ethicsStatement, 10.5);
      }

      if (article.authorContributions) {
        drawText("Author contributions", 12.5, true);
        drawText(article.authorContributions, 10.5);
      }

      if (article.acknowledgments) {
        drawText("Acknowledgments", 12.5, true);
        drawText(article.acknowledgments, 10.5);
      }

      if (article.funding) {
        drawText("Funding", 12.5, true);
        drawText(article.funding, 10.5);
      }

      if (article.competingInterests) {
        drawText("Competing interests", 12.5, true);
        drawText(article.competingInterests, 10.5);
      }

      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        const footer = `American Impact Review · Page ${index + 1} of ${pages.length}`;
        page.drawText(normalizePdfText(footer), {
          x: margin,
          y: margin - 22,
          size: 9,
          font
        });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${article.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="article-page plos-article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: article.title,
            description: effectiveAbstract || "",
            datePublished: article.publishedAt?.toISOString() || article.createdAt?.toISOString() || undefined,
            dateReceived: article.receivedAt?.toISOString() || undefined,
            dateAccepted: article.acceptedAt?.toISOString() || undefined,
            author: (article.authors && article.authors.length
              ? article.authors
              : [article.authorUsername]
            ).map((name) => ({ "@type": "Person", name })),
            publisher: {
              "@type": "Organization",
              name: "Global Talent Foundation"
            },
            isPartOf: {
              "@type": "Periodical",
              name: "American Impact Review"
            },
            volumeNumber: "1",
            issueNumber: "1",
            isAccessibleForFree: article.openAccess ?? true,
            license: article.license || undefined,
            keywords: article.keywords?.join(", ") || undefined,
            ...(article.doi ? { sameAs: `https://doi.org/${article.doi}` } : {}),
            url: `https://americanimpactreview.com/article/${article.slug}`
          })
        }}
      />
      <header className="plos-hero">
        <div className="plos-hero__main">
          <p className="plos-kicker">
            {article.category ? article.category : "Article"}
          </p>
          <h1>{article.title}</h1>
          <div className="plos-badges">
            {article.openAccess ? <span className="plos-pill">Open Access</span> : null}
            {article.license ? <span className="plos-pill">{article.license}</span> : null}
            {article.articleType ? <span className="plos-pill">{article.articleType}</span> : null}
          </div>
          <div className="plos-meta">
            <div>
              <span className="plos-meta__label">Published</span>
              <span>
                {article.publishedAt
                  ? article.publishedAt.toLocaleDateString()
                  : article.createdAt
                  ? article.createdAt.toLocaleDateString()
                  : "Pending"}
              </span>
            </div>
            <div>
              <span className="plos-meta__label">Received</span>
              <span>
                {article.receivedAt ? article.receivedAt.toLocaleDateString() : "-"}
              </span>
            </div>
            <div>
              <span className="plos-meta__label">Accepted</span>
              <span>
                {article.acceptedAt ? article.acceptedAt.toLocaleDateString() : "-"}
              </span>
            </div>
            <div>
              <span className="plos-meta__label">DOI</span>
              <span>{article.doi || "Pending"}</span>
            </div>
          </div>
          <div className="plos-authors">
            <div>
              <span className="plos-meta__label">Authors</span>
              <div className="plos-author">
                <span>
                  {(article.authors && article.authors.length
                    ? article.authors.join(", ")
                    : article.authorUsername)}
                </span>
                <span className="plos-author__affil">
                  {article.affiliations && article.affiliations.length
                    ? article.affiliations.join(" · ")
                    : "Independent Researcher"}
                </span>
              </div>
              {article.correspondingAuthorName ? (
                <div className="plos-corresponding">
                  <span className="plos-meta__label">Corresponding author</span>
                  <div>
                    {article.correspondingAuthorName}
                    {article.correspondingAuthorEmail ? ` · ${article.correspondingAuthorEmail}` : ""}
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <span className="plos-meta__label">Keywords</span>
              <div className="plos-keywords">
                {(article.keywords && article.keywords.length
                  ? article.keywords
                  : [article.category, "professional impact", "peer review"]
                )
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((keyword) => (
                    <span key={keyword} className="plos-pill">
                      {keyword}
                    </span>
                  ))}
              </div>
            </div>
          </div>
          <div className="plos-hero-actions">
            <button type="button" className="plos-share-btn" onClick={handleCopyLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f6d8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {copyStatus === "copied" ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              className="plos-share-btn plos-share-btn--pdf"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
              {downloading ? "Preparing..." : "Download PDF"}
            </button>
          </div>
        </div>
        {article.imageUrl && !article.imageUrl.endsWith(".svg") ? (
          <div className="plos-hero__image">
            <img src={article.imageUrl} alt={article.title} />
          </div>
        ) : null}
      </header>

      {effectiveAbstract ? (
        <section className="plos-abstract">
          <h2>Abstract</h2>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(effectiveAbstract) }} />
        </section>
      ) : null}

      <div className="plos-article-grid">
        <aside className="plos-aside plos-aside--left">
          <div className="plos-card plos-toc-card">
            <h3>Sections</h3>
            <ol className="plos-toc">
              {displaySections.filter((s) => s.body.length > 0).map((section, idx) => {
                const numMatch = section.title.match(/^(\d+)\.\s*/);
                const num = numMatch ? numMatch[1] : String(idx + 1);
                const title = numMatch ? section.title.replace(/^\d+\.\s*/, "") : section.title;
                return (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span className="plos-toc__num">{num.padStart(2, "0")}</span>
                      <span>{title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <section className="plos-body">
          {displaySections.filter((s) => s.body.length > 0).map((section) => (
            <article key={section.id} id={section.id} className="plos-section">
              <h2>{section.title}</h2>
              {section.body.map((paragraph, index) => (
                <div
                  key={`${section.id}-p-${index}`}
                  className="plos-body-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(paragraph) }}
                />
              ))}
            </article>
          ))}
        </section>

        {((article.imageUrls && article.imageUrls.length)) ? (
          <section className="plos-figures">
            <h2>Figures</h2>
            <div className="plos-figures__grid">
              {(article.imageUrls || []).slice(0, 6).map((url, index) => {
                const caption = article.figureCaptions?.[index];
                const fullCaption = `Figure ${index + 1}.${caption ? ` ${caption}` : ""}`;
                return (
                  <figure
                    key={url}
                    className="plos-figure"
                    onClick={() => setLightbox({ src: url, caption: fullCaption })}
                  >
                    <img src={url} alt={caption || `${article.title} figure ${index + 1}`} />
                    <figcaption>
                      <strong>Figure {index + 1}.</strong>{caption ? ` ${caption}` : ""}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {lightbox ? (
        <div className="figure-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt={lightbox.caption} />
          <figcaption>{lightbox.caption}</figcaption>
        </div>
      ) : null}

      {article.doi ? (
        <section className="plos-references">
          <h2>Citation</h2>
          <p>{citationText}</p>
        </section>
      ) : null}

      {parsed.references ? (
        <section className="plos-references">
          <h2>References</h2>
          <ol className="references">
            {parsed.references
              .split(/\n\n+/)
              .map((ref) => ref.trim())
              .filter(Boolean)
              .map((ref, index) => (
                <li key={`ref-${index}`}>
                  {ref.replace(/^\d+\.\s*/, "")}
                </li>
              ))}
          </ol>
        </section>
      ) : null}

      {article.dataAvailability ? (
        <section className="plos-references">
          <h2>Data availability</h2>
          <p>{article.dataAvailability}</p>
        </section>
      ) : null}

      {article.ethicsStatement ? (
        <section className="plos-references">
          <h2>Ethics statement</h2>
          <p>{article.ethicsStatement}</p>
        </section>
      ) : null}

      {article.authorContributions ? (
        <section className="plos-references">
          <h2>Author contributions</h2>
          <p>{article.authorContributions}</p>
        </section>
      ) : null}

      {article.acknowledgments ? (
        <section className="plos-references">
          <h2>Acknowledgments</h2>
          <p>{article.acknowledgments}</p>
        </section>
      ) : null}

      {article.funding ? (
        <section className="plos-references">
          <h2>Funding</h2>
          <p>{article.funding}</p>
        </section>
      ) : null}

      {article.competingInterests ? (
        <section className="plos-references">
          <h2>Competing interests</h2>
          <p>{article.competingInterests}</p>
        </section>
      ) : null}
    </section>
  );
}
