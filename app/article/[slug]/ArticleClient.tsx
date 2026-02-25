"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Article } from "@/lib/types";

type SerializedArticle = Omit<Article, "publishedAt" | "createdAt" | "receivedAt" | "acceptedAt"> & {
  publishedAt: string | null;
  createdAt: string | null;
  receivedAt?: string | null;
  acceptedAt?: string | null;
  viewCount?: number;
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

    // Inline figure: ![Figure N. Caption](/path/to/image)
    const figMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (figMatch) {
      closeList();
      closeTable();
      const alt = figMatch[1];
      const src = figMatch[2];
      outputLines.push(
        `<figure class="plos-figure plos-figure--inline" data-src="${src}" data-caption="${alt.replace(/"/g, '&quot;')}">` +
        `<img src="${src}" alt="${alt}" />` +
        (alt ? `<figcaption>${alt.replace(/^(Figure \d+)\./, '<strong>$1.</strong>')}</figcaption>` : '') +
        `</figure>`
      );
      continue;
    }

    // Regular paragraph
    outputLines.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  closeTable();

  return outputLines.join("\n");
}

const EyeIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function ArticleClient({ article: raw }: { article: SerializedArticle }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [citeCopyStatus, setCiteCopyStatus] = useState<"idle" | "copied">("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const [views, setViews] = useState(raw.viewCount ?? 0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Increment view count on mount
  useEffect(() => {
    fetch(`/api/views/${raw.slug}`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => { if (data.views != null) setViews(data.views); })
      .catch(() => {});
  }, [raw.slug]);

  // Scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      document.documentElement.style.setProperty("--scroll-progress", String(progress));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const article = {
    ...raw,
    publishedAt: toDate(raw.publishedAt),
    createdAt: toDate(raw.createdAt),
    receivedAt: toDate(raw.receivedAt),
    acceptedAt: toDate(raw.acceptedAt),
  };

  // Detect if content is HTML (from mammoth docx conversion) vs markdown
  const isHtmlContent = article.content.trimStart().startsWith("<");

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

    // HTML content path (from mammoth docx conversion)
    if (isHtmlContent) {
      const sections: { id: string; title: string; body: string[] }[] = [];
      let abstract = "";
      let references = "";

      // Split HTML by heading tags to extract sections
      const headingRegex = /<h([12])[^>]*>(.*?)<\/h\1>/gi;
      const headings: { level: number; title: string; index: number }[] = [];
      let match;
      while ((match = headingRegex.exec(rawContent)) !== null) {
        headings.push({ level: parseInt(match[1]), title: match[2].replace(/<[^>]+>/g, "").trim(), index: match.index });
      }

      // Fallback: if no <h1>/<h2> found, detect <p><strong>SectionName</strong></p> as headings
      // This handles docx files where authors used bold text instead of Heading styles
      if (!headings.length) {
        const boldHeadingRegex = /<p><strong>([^<]*)<\/strong><\/p>/gi;
        const knownSections = /^(abstract|introduction|methods?|methodology|analytical\s+procedure|materials?\s+and\s+methods?|results?|discussion|conclusions?|limitations?|implications?|recommendations?|acknowledgm?ents?|author\s+contributions?|funding|data\s+availability|conflicts?\s+of\s+interest|disclosure|ethics|references|bibliography|appendix|literature\s+review|theoretical\s+framework|background|objectives?|aim|purpose|study\s+design|participants?|procedure|analysis|findings|future\s+research|significance)/i;
        const titleLower = article.title.toLowerCase();
        let bm;
        while ((bm = boldHeadingRegex.exec(rawContent)) !== null) {
          const text = bm[1].replace(/<[^>]+>/g, "").trim();
          if (!text || text.length > 120) continue;
          // Skip metadata: title, author names, ORCID, email, affiliations
          const textLower = text.toLowerCase();
          if (textLower === titleLower) continue;
          if (/orcid/i.test(text)) continue;
          if (/@/.test(text)) continue;
          if (/^(table|figure|fig\.?)\s+\d/i.test(text)) continue;
          // Accept if it matches a known section name or a numbered heading (e.g. "1. Introduction")
          const stripped = text.replace(/^\d+\.?\s*/, "");
          if (knownSections.test(stripped) || /^\d+\.?\s+\S/.test(text)) {
            headings.push({ level: 1, title: text, index: bm.index });
          }
        }
      }

      // Skip header metadata (title, author info, etc.) — find first real section heading
      const skipTitles = new Set(["abstract", article.title.toLowerCase()]);
      const metaPatterns = [/^original research/i, /^corresponding author/i, /^meret/i];

      if (headings.length) {
        // Strip metadata before first heading
        const firstHeadingIdx = headings[0].index;

        for (let i = 0; i < headings.length; i++) {
          const h = headings[i];
          const nextIdx = i + 1 < headings.length ? headings[i + 1].index : rawContent.length;
          // Get content between this heading and the next
          // Find the end of the heading tag
          const headingTagEnd = rawContent.indexOf(">", rawContent.indexOf("<", h.index));
          const closeTagStr = rawContent.slice(h.index).match(/<\/(?:h[12]|p)>/i);
          const afterTag = closeTagStr ? h.index + (closeTagStr.index || 0) + closeTagStr[0].length : headingTagEnd + 1;
          const bodyHtml = rawContent.slice(afterTag, nextIdx).trim();
          const titleLower = h.title.toLowerCase().replace(/^\d+\.?\s*/, "");

          if (titleLower === "abstract" || titleLower.startsWith("abstract")) {
            abstract = bodyHtml;
          } else if (titleLower === "references" || titleLower.startsWith("references")) {
            references = bodyHtml;
          } else if (skipTitles.has(titleLower) || metaPatterns.some(p => p.test(h.title))) {
            // skip metadata headings
          } else {
            sections.push({
              id: `section-${sections.length + 1}`,
              title: h.title,
              body: [bodyHtml],
            });
          }
        }
      }

      // If no headings found, treat entire content as one section
      if (!sections.length && rawContent.length > 0) {
        sections.push({ id: "section-1", title: "Main text", body: [rawContent] });
      }

      return { abstract, sections, references };
    }

    // Markdown content path (legacy articles from .md files)
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
      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
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
    const urlPart = !article.doi ? ` Retrieved from https://americanimpactreview.com/article/${article.slug}` : "";
    return `${authorLine} (${year}). ${article.title}. American Impact Review.${doiPart}${urlPart}`;
  })();

  // Use parsed.sections directly -- no fake padding
  const displaySections = parsed.sections;

  // Check if figures are inline in the text (skip bottom "Figures" block if so)
  const hasInlineFigures = displaySections.some((s) =>
    s.body.some((p) => /!\[[^\]]*\]\([^)]+\)/.test(p))
  );

  // Format structured abstract: bold labels like "Background:", "Methods:" on new lines (PubMed style)
  const formatStructuredAbstract = (html: string): string => {
    const labels = ["Background", "Objective", "Purpose", "Aim", "Introduction", "Methods", "Materials and Methods", "Design", "Setting", "Participants", "Measurements", "Results", "Findings", "Conclusions", "Conclusion", "Significance", "Implications"];
    // First strip any existing <strong> around labels (from markdown bold **Methods:**)
    const stripPattern = new RegExp(`<strong>(${labels.join("|")})(\\s*:)<\\/strong>`, "gi");
    let formatted = html.replace(stripPattern, '$1$2');
    // Now wrap labels with our styled class
    const pattern = new RegExp(`(${labels.join("|")})(\\s*:)`, "gi");
    formatted = formatted.replace(pattern, '<strong class="abstract-label">$1$2</strong>');
    // Put each label on a new paragraph if it appears mid-paragraph
    formatted = formatted.replace(
      /([.!?])\s*<strong class="abstract-label">/g,
      '$1</p><p><strong class="abstract-label">'
    );
    return formatted;
  };

  // Extract reference list once for use in both processHtml and references rendering
  const refList: string[] = (() => {
    if (!parsed.references) return [];
    const refs: string[] = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(parsed.references)) !== null) {
      refs.push(liMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (!refs.length) {
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let pMatch;
      while ((pMatch = pRegex.exec(parsed.references)) !== null) {
        const text = pMatch[1].replace(/<[^>]+>/g, "").trim();
        if (text) refs.push(text);
      }
    }
    return refs;
  })();

  // Track citation occurrences for back-navigation (first occurrence per ref number)
  const citeOccurrences: Map<number, number> = new Map(); // refNum → occurrence count
  const firstCiteIds: Map<number, string> = new Map(); // refNum → first cite id

  // Post-process HTML content: table captions + citation tooltips + click-to-scroll
  const processHtml = (html: string): string => {
    if (!isHtmlContent) return html;

    // 1. Wrap every <table>...</table> in a horizontal scroll container
    let processed = html.replace(/<table([\s\S]*?)<\/table>/gi,
      '<div class="table-scroll-wrap"><table$1</table></div>'
    );

    // 2. Citation tooltips with click-to-scroll anchors
    if (refList.length) {
      processed = processed.replace(
        /(?<=>|\s|\]|\))\[((\d{1,3})([\s,\-–\u2013]+\d{1,3})*)\](?=[\s,.\)\(;:<\[]|$)/g,
        (match, inner) => {
          const parts = inner.split(/[,\s]+/).filter(Boolean);
          const nums: number[] = [];
          for (const part of parts) {
            const rangeMatch = part.match(/^(\d+)[\-–\u2013](\d+)$/);
            if (rangeMatch) {
              const from = parseInt(rangeMatch[1], 10);
              const to = parseInt(rangeMatch[2], 10);
              for (let n = from; n <= to; n++) nums.push(n);
            } else {
              const n = parseInt(part, 10);
              if (!isNaN(n)) nums.push(n);
            }
          }
          if (!nums.length || nums.some(n => !refList[n - 1])) return match;

          const anchors = nums.map(n => {
            const ref = refList[n - 1]
              .replace(/\s*https?:\/\/(?:doi\.org|dx\.doi\.org)\/\S+/gi, ""); // strip DOI URLs from tooltip
            const escaped = ref.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const occ = (citeOccurrences.get(n) || 0) + 1;
            citeOccurrences.set(n, occ);
            const citeId = `cite-${n}-${occ}`;
            if (!firstCiteIds.has(n)) firstCiteIds.set(n, citeId);
            return `<a href="#ref-${n}" class="cite-ref" id="${citeId}" data-ref="${n}">[${n}]<span class="cite-tooltip">${escaped}</span></a>`;
          });
          return ` ${anchors.join("")}`;
        }
      );
    }

    // 3. Auto-link bare DOI URLs in text, but skip inside cite-tooltip spans
    //    (nested <a> inside <a class="cite-ref"> is invalid HTML and breaks tooltip hiding)
    processed = processed.replace(
      /(<span class="cite-tooltip">[\s\S]*?<\/span>)|((?<!href=["'])(https?:\/\/(?:doi\.org|dx\.doi\.org)\/[^\s<)"]+))/gi,
      (match, tooltip, _full, url) => {
        if (tooltip) return tooltip; // preserve cite-tooltip content as-is
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }
    );

    return processed;
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: article.title, url: window.location.href });
        return;
      } catch { /* cancelled */ }
    }
    setShareOpen((v) => !v);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
      setShareOpen(false);
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      setCopyStatus("idle");
    }
  };

  // Close share popup on outside click
  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".share-popup-wrap")) setShareOpen(false);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [shareOpen]);

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCiteCopyStatus("copied");
      window.setTimeout(() => setCiteCopyStatus("idle"), 1500);
    } catch {
      setCiteCopyStatus("idle");
    }
  };

  const pdfUrl = (raw as any).pdfUrl || `/articles/${article.slug}.pdf`;

  // Google Scholar search URLs for indexed articles
  const scholarUrls: Record<string, string> = {
    "e2026001": "https://scholar.google.com/scholar?q=%22Monitoring+and+Scalability+of+High-Load+Systems%22",
    "e2026002": "https://scholar.google.com/scholar?q=%22Diagnostic+Capabilities+of+Hardware-Software+Systems+in+Sports+Medicine%22",
    "e2026003": "https://scholar.google.com/scholar?q=%22Finger+Dermatoglyphics+as+Predictive+Markers+of+Physical+Abilities%22",
    "e2026004": "https://scholar.google.com/scholar?q=%22Laboratory+Assessment+of+Aerobic+and+Anaerobic+Performance+in+Elite+Greco-Roman+Wrestlers%22",
    "e2026005": "https://scholar.google.com/scholar?q=%22Genetic+Markers+for+Talent+Identification+and+Training+Individualization%22",
    "e2026006": "https://scholar.google.com/scholar?q=%22Longitudinal+Physiological+Monitoring+and+Evidence-Based+Training+Periodization%22",
    "e2026007": "https://scholar.google.com/scholar?q=%22Leveraging+Artificial+Intelligence+for+Scalable+Customer+Success+in+Mobile+Marketing+Technology%22",
    "e2026008": "https://scholar.google.com/scholar?q=%22Effects+of+Low-Level+Laser+Therapy+on+HSP70+Dynamics%22",
    "e2026009": "https://scholar.google.com/scholar?q=%22Syndromic+Analysis+of+the+Comorbidity+of+Reading+Disorders%22",
  };
  const scholarUrl = scholarUrls[article.slug];

  return (
    <section className="article-page plos-article">
      <div className="scroll-progress" />
      <header className="plos-hero">
        <div className="plos-hero__main">
          {/* ── Top ribbon: badges + published date + DOI ── */}
          <div className="plos-hero-top">
            <span className="plos-kicker">{article.category || "Article"}</span>
            {article.articleType ? <span className="plos-pill plos-pill--type">{article.articleType}</span> : null}
            {article.openAccess ? <span className="plos-pill">Open Access</span> : null}
            {article.license ? <span className="plos-pill">{article.license}</span> : null}
            {raw.visibility === "private" ? (
              <span className="plos-pill plos-pill--private">Private Preview</span>
            ) : null}
            <span className="plos-hero-divider" />
            <span className="plos-hero-date">
              Published{" "}
              {article.publishedAt
                ? article.publishedAt.toLocaleDateString()
                : article.createdAt
                ? article.createdAt.toLocaleDateString()
                : "Pending"}
              {" "}&middot;{" "}
              <span className="view-count" data-tip={`${views} total article views`}><EyeIcon size={13} /> {views} views</span>
            </span>
            <span className="plos-hero-doi">DOI: {article.doi || "Pending"}</span>
          </div>

          {/* ── Title ── */}
          <h1>{article.title}</h1>

          {/* ── Authors — one per line, affiliation inline ── */}
          <div className="plos-authors-list">
            {(article.authors && article.authors.length
              ? article.authors
              : [article.authorUsername]
            ).map((name, i) => {
              const rawOrcid = article.orcids?.[i];
              const orcid = rawOrcid && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(rawOrcid) ? rawOrcid : null;
              const affil = article.affiliations?.[i];
              return (
                <div key={i} className="plos-author-line">
                  <span className="plos-author-name">{name}</span>
                  {orcid ? (
                    <a
                      href={`https://orcid.org/${orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`ORCID: ${orcid}`}
                      className="plos-orcid-icon"
                    >
                      <svg width="16" height="16" viewBox="0 0 256 256">
                        <circle cx="128" cy="128" r="128" fill="#A6CE39" />
                        <path d="M86.3 186.2H70.9V79.1h15.4v107.1zM78.6 47.2c-5.7 0-10.3 4.6-10.3 10.3s4.6 10.3 10.3 10.3 10.3-4.6 10.3-10.3-4.6-10.3-10.3-10.3z" fill="#fff" />
                        <path d="M108.9 79.1h41.6c39.6 0 57.1 30.3 57.1 53.6 0 27.3-21.3 53.6-56.5 53.6h-42.2V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z" fill="#fff" />
                      </svg>
                    </a>
                  ) : null}
                  {affil ? <span className="plos-author-affil">{affil}</span> : null}
                </div>
              );
            })}
          </div>
          {article.correspondingAuthorName ? (
            <div className="plos-corresponding">
              Corresponding: {article.correspondingAuthorName}
              {article.correspondingAuthorEmail ? ` · ${article.correspondingAuthorEmail}` : ""}
            </div>
          ) : null}

          {/* ── Dates + Keywords row ── */}
          <div className="plos-meta-row">
            <div className="plos-dates-inline">
              <span>Received {article.receivedAt ? article.receivedAt.toLocaleDateString() : "-"}</span>
              <span>Accepted {article.acceptedAt ? article.acceptedAt.toLocaleDateString() : "-"}</span>
            </div>
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

          {/* ── Actions ── */}
          <div className="plos-hero-actions">
            <div className="share-popup-wrap" style={{ position: "relative" }}>
              <button type="button" className="hero-action-btn hero-action-btn--share" onClick={handleShare}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Share</span>
              </button>
              {shareOpen ? (
                <div className="share-popup">
                  <div className="share-popup__title">Share article</div>
                  <div className="share-popup__socials">
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer" className="share-popup__item" onClick={() => setShareOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      <span>LinkedIn</span>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="share-popup__item" onClick={() => setShareOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>X</span>
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer" className="share-popup__item" onClick={() => setShareOpen(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span>Facebook</span>
                    </a>
                  </div>
                  <button className="share-popup__copy" onClick={handleCopyLink}>
                    {copyStatus === "copied" ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Copied!</span></>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy link</span></>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
            <a
              href={pdfUrl}
              download
              className="hero-action-btn hero-action-btn--pdf"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Download PDF</span>
            </a>
            {scholarUrl ? (
              <a
                href={scholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-action-btn hero-action-btn--scholar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 100 14 7 7 0 000-14z"/>
                </svg>
                <span>Google Scholar</span>
              </a>
            ) : null}
          </div>
        </div>
        {article.imageUrl && !article.imageUrl.endsWith(".svg") ? (
          <div className="plos-hero__image">
            <img src={article.imageUrl} alt={article.title} />
          </div>
        ) : null}
      </header>

      {raw.visibility === "private" ? (
        <div className="private-preview-banner">
          Private Preview — visible only to admins
        </div>
      ) : null}

      {effectiveAbstract ? (
        <section className="plos-abstract">
          <h2>Abstract</h2>
          <div dangerouslySetInnerHTML={{ __html: formatStructuredAbstract(isHtmlContent ? effectiveAbstract : renderMarkdown(effectiveAbstract)) }} />
        </section>
      ) : null}

      <div className="plos-article-grid">
        <aside className="plos-aside plos-aside--left">
          <div className="plos-card plos-toc-card">
            <h3>Sections</h3>
            <ol className="plos-toc">
              {displaySections.filter((s) => s.body.length > 0).map((section, idx) => {
                const numMatch = section.title.match(/^(\d+(?:\.\d+)?)\.\s*/);
                const num = numMatch ? numMatch[1] : String(idx + 1);
                const title = numMatch ? section.title.replace(/^\d+(?:\.\d+)?\.\s*/, "") : section.title;
                const isSub = /^\d+\.\d+/.test(section.title);
                return (
                  <li key={section.id} className={isSub ? "plos-toc__sub" : ""}>
                    <a href={`#${section.id}`}>
                      <span className="plos-toc__num">{num}</span>
                      <span>{title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <section className="plos-body" onClick={(e) => {
          const target = e.target as HTMLElement;

          // Click-to-scroll for citation refs
          const citeLink = target.closest('a.cite-ref') as HTMLAnchorElement | null;
          if (citeLink) {
            e.preventDefault();
            const refId = citeLink.getAttribute('href')?.replace('#', '');
            if (refId) {
              const refEl = document.getElementById(refId);
              if (refEl) {
                refEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Briefly highlight the target reference
                refEl.classList.add('cite-target-highlight');
                setTimeout(() => refEl.classList.remove('cite-target-highlight'), 2000);
              }
            }
            return;
          }

          // Lightbox for markdown figures
          const fig = target.closest('.plos-figure--inline');
          if (fig) {
            const src = fig.getAttribute('data-src');
            const caption = fig.getAttribute('data-caption');
            if (src) setLightbox({ src, caption: caption || '' });
            return;
          }
          // Lightbox for mammoth HTML images (click any img in article body)
          if (target.tagName === 'IMG') {
            const src = target.getAttribute('src');
            const alt = target.getAttribute('alt') || '';
            if (src) setLightbox({ src, caption: alt });
          }
        }}>
          {displaySections.filter((s) => s.body.length > 0).map((section, idx, arr) => {
            // Detect sub-sections by numbering pattern: "2.1 ..." is a sub-section, "2. ..." is a main section
            const isSubSection = /^\d+\.\d+/.test(section.title);
            // Check if this is a parent section followed by a sub-section (e.g. "2. Methods" then "2.1 Participants")
            const nextSection = arr[idx + 1];
            const isParentOfNext = !isSubSection && nextSection && /^\d+\.\d+/.test(nextSection.title);
            const HeadingTag = isSubSection ? "h3" : "h2";
            const className = `plos-section${isSubSection ? " plos-section--sub" : ""}${isParentOfNext ? " plos-section--parent" : ""}`;
            return (
            <article key={section.id} id={section.id} className={className}>
              <HeadingTag>{section.title}</HeadingTag>
              {section.body.filter(p => p.trim()).map((paragraph, index) => (
                <div
                  key={`${section.id}-p-${index}`}
                  className="plos-body-content"
                  dangerouslySetInnerHTML={{ __html: isHtmlContent ? processHtml(paragraph) : renderMarkdown(paragraph) }}
                />
              ))}
            </article>
            );
          })}
        </section>

        {(!hasInlineFigures && article.imageUrls && article.imageUrls.length) ? (
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

        <div className="plos-post-sections">
          <section className="plos-references">
            <h2>How to Cite</h2>
            <div className="how-to-cite">
              <div className="how-to-cite__header">
                <h3>APA</h3>
                <button
                  type="button"
                  className={`how-to-cite__copy${citeCopyStatus === "copied" ? " how-to-cite__copy--copied" : ""}`}
                  onClick={handleCopyCitation}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  {citeCopyStatus === "copied" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="how-to-cite__text">{citationText}</p>
            </div>
          </section>

          {parsed.references ? (
            <section className="plos-references" onClick={(e) => {
              // Handle back-navigation click on ↑ links
              const target = e.target as HTMLElement;
              const backLink = target.closest('a.cite-backref') as HTMLAnchorElement | null;
              if (backLink) {
                e.preventDefault();
                const citeId = backLink.getAttribute('href')?.replace('#', '');
                if (citeId) {
                  const citeEl = document.getElementById(citeId);
                  if (citeEl) {
                    citeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    citeEl.classList.add('cite-target-highlight');
                    setTimeout(() => citeEl.classList.remove('cite-target-highlight'), 2000);
                  }
                }
              }
            }}>
              <h2>References</h2>
              {isHtmlContent ? (() => {
                // Check if references already have <li id="ref-N"> (from APA converter)
                const hasRefIds = /<li\s+id="ref-\d+"/.test(parsed.references);
                if (hasRefIds) {
                  // References already structured by converter — add backref links
                  let refsWithBackrefs = parsed.references.replace(
                    /<li\s+id="ref-(\d+)">/g,
                    (_m: string, num: string) => {
                      const n = parseInt(num, 10);
                      const firstCiteId = firstCiteIds.get(n);
                      const backref = firstCiteId
                        ? `<a href="#${firstCiteId}" class="cite-backref" title="Back to citation">\u2191</a>`
                        : '';
                      return `<li id="ref-${n}">${backref}`;
                    }
                  );
                  // Auto-link DOI URLs
                  refsWithBackrefs = refsWithBackrefs.replace(
                    /(?<!href=["'])(https?:\/\/(?:doi\.org|dx\.doi\.org)\/[^\s<)"]+)/gi,
                    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">$1</a>'
                  );
                  return <div className="plos-body-content" dangerouslySetInnerHTML={{ __html: refsWithBackrefs }} />;
                }

                // Legacy numbered references — extract and add IDs + backrefs
                const legacyRefs: string[] = [];
                const liRx = /<li[^>]*>([\s\S]*?)<\/li>/gi;
                let lm;
                while ((lm = liRx.exec(parsed.references)) !== null) {
                  legacyRefs.push(lm[1].trim());
                }

                if (legacyRefs.length) {
                  const items = legacyRefs.map((refHtml, idx) => {
                    const n = idx + 1;
                    const firstCiteId = firstCiteIds.get(n);
                    const backref = firstCiteId
                      ? `<a href="#${firstCiteId}" class="cite-backref" title="Back to citation">\u2191</a>`
                      : '';
                    let linked = refHtml.replace(
                      /(?<!href=["'])(https?:\/\/(?:doi\.org|dx\.doi\.org)\/[^\s<)"]+)/gi,
                      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">$1</a>'
                    );
                    // Also linkify doi:10.xxxx patterns
                    linked = linked.replace(
                      /(?<!href=["'][^"']*)\b(doi|DOI)\s*:\s*(10\.\d{4,9}\/[^\s<)"',;]+)/gi,
                      (_m: string, prefix: string, doi: string) => {
                        const clean = doi.replace(/[.,;:)]+$/, "");
                        return `<a href="https://doi.org/${clean}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">${prefix}:${clean}</a>`;
                      }
                    );
                    return `<li id="ref-${n}">${backref}${linked}</li>`;
                  });
                  return <div className="plos-body-content" dangerouslySetInnerHTML={{ __html: `<ol>${items.join("")}</ol>` }} />;
                }

                // Try <p> references (e.g. "[1] Robbins..." as separate paragraphs)
                const pRefs: string[] = [];
                const pRx = /<p[^>]*>([\s\S]*?)<\/p>/gi;
                let pm;
                while ((pm = pRx.exec(parsed.references)) !== null) {
                  const text = pm[1].trim();
                  if (text) pRefs.push(text);
                }

                if (pRefs.length) {
                  const items = pRefs.map((refHtml, idx) => {
                    // Extract ref number from "[N]" prefix if present
                    const numMatch = refHtml.match(/^\[(\d+)\]/);
                    const n = numMatch ? parseInt(numMatch[1], 10) : idx + 1;
                    const firstCiteId = firstCiteIds.get(n);
                    const backref = firstCiteId
                      ? `<a href="#${firstCiteId}" class="cite-backref" title="Back to citation">\u2191</a>`
                      : '';
                    let linked = refHtml.replace(
                      /(?<!href=["'])(https?:\/\/(?:doi\.org|dx\.doi\.org)\/[^\s<)"]+)/gi,
                      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">$1</a>'
                    );
                    linked = linked.replace(
                      /(?<!href=["'][^"']*)\b(doi|DOI)\s*:\s*(10\.\d{4,9}\/[^\s<)"',;]+)/gi,
                      (_m: string, prefix: string, doi: string) => {
                        const clean = doi.replace(/[.,;:)]+$/, "");
                        return `<a href="https://doi.org/${clean}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">${prefix}:${clean}</a>`;
                      }
                    );
                    return `<li id="ref-${n}">${backref}${linked}</li>`;
                  });
                  return <div className="plos-body-content" dangerouslySetInnerHTML={{ __html: `<ol>${items.join("")}</ol>` }} />;
                }

                // Fallback: plain HTML refs (no structure found)
                let fallbackRefs = parsed.references.replace(
                  /(?<!href=["'])(https?:\/\/(?:doi\.org|dx\.doi\.org)\/[^\s<)"]+)/gi,
                  '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;word-break:break-all">$1</a>'
                );
                return <div className="plos-body-content" dangerouslySetInnerHTML={{ __html: fallbackRefs }} />;
              })() : (
                <ol className="references">
                  {parsed.references
                    .split(/\n/)
                    .map((ref) => ref.trim())
                    .filter(Boolean)
                    .map((ref, index) => {
                      const cleaned = ref.replace(/^\d+\.\s*/, "");
                      const n = index + 1;
                      const firstCiteId = firstCiteIds.get(n);
                      const doiMatch = cleaned.match(/(https?:\/\/doi\.org\/\S+)/);
                      if (doiMatch) {
                        const parts = cleaned.split(doiMatch[1]);
                        return (
                          <li key={`ref-${index}`} id={`ref-${n}`}>
                            {firstCiteId ? <a href={`#${firstCiteId}`} className="cite-backref" title="Back to citation">{"\u2191"}</a> : null}
                            {parts[0]}
                            <a href={doiMatch[1]} target="_blank" rel="noopener noreferrer">{doiMatch[1]}</a>
                            {parts[1] || ""}
                          </li>
                        );
                      }
                      return (
                        <li key={`ref-${index}`} id={`ref-${n}`}>
                          {firstCiteId ? <a href={`#${firstCiteId}`} className="cite-backref" title="Back to citation">{"\u2191"}</a> : null}
                          {cleaned}
                        </li>
                      );
                    })}
                </ol>
              )}
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
        </div>
      </div>

      {lightbox ? (
        <div className="figure-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt={lightbox.caption} />
          <figcaption>{lightbox.caption}</figcaption>
        </div>
      ) : null}
    </section>
  );
}
