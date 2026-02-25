import sanitizeHtml from "sanitize-html";

function stripHtmlAttributes(html: string): string {
  return html
    .replace(/\s(style|class|id|lang|width|height|border|cellpadding|cellspacing|align|valign|data-[^=]+)=(\"[^\"]*\"|'[^']*')/gi, "")
    .replace(/\saria-[^=]+=(\"[^\"]*\"|'[^']*')/gi, "")
    .replace(/\srole=(\"[^\"]*\"|'[^']*')/gi, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert bare `doi:10.xxxx/...` and `DOI:10.xxxx/...` patterns into clickable links.
 * Already-linked DOIs (inside href="...") are left untouched.
 */
export function linkifyDois(html: string): string {
  // Match doi:/DOI: prefix followed by a DOI (not already inside an href)
  return html.replace(
    /(?<!href=["']|href=["'][^"']*)\b(doi|DOI)\s*:\s*(10\.\d{4,9}\/[^\s<)"',;]+)/gi,
    (_match, prefix, doi) => {
      // Trim trailing punctuation that's likely not part of the DOI
      const cleanDoi = doi.replace(/[.,;:)]+$/, "");
      return `<a href="https://doi.org/${cleanDoi}" target="_blank" rel="noopener noreferrer">${prefix}:${cleanDoi}</a>`;
    }
  );
}

/**
 * Parse a References section and extract structured reference entries.
 */
interface ParsedRef {
  /** Original HTML of the reference entry */
  html: string;
  /** Plain-text version */
  text: string;
  /** First author surname */
  firstAuthor: string;
  /** All author surnames (for "et al." matching) */
  allAuthors: string[];
  /** Publication year */
  year: string;
  /** Original index in the references list (0-based) */
  originalIndex: number;
}

function parseReferencesSection(refsHtml: string): ParsedRef[] {
  const refs: ParsedRef[] = [];

  // Try <li> entries first
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  const entries: string[] = [];
  while ((m = liRegex.exec(refsHtml)) !== null) {
    entries.push(m[1].trim());
  }
  // Fallback to <p> entries
  if (!entries.length) {
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((m = pRegex.exec(refsHtml)) !== null) {
      const text = m[1].trim();
      if (text) entries.push(text);
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const html = entries[i];
    const text = html.replace(/<[^>]+>/g, "").trim();

    // Extract authors and year from APA-style reference
    // Pattern: "Surname, I., Surname2, I. B., & Surname3, I. (2020). Title..."
    // Or: "Surname, I. (2020). Title..."
    const authors: string[] = [];
    let year = "";

    // Try to find year in parentheses: (2020) or (2020a)
    const yearMatch = text.match(/\((\d{4}[a-z]?)\)/);
    if (yearMatch) {
      year = yearMatch[1];
      // Everything before the year parenthetical is the author block
      const authorBlock = text.slice(0, yearMatch.index).trim();
      // Split by comma-space, then pick surnames (entries that don't look like initials)
      // APA: "Smith, J. A., Jones, B., & Williams, C."
      // Simplified: grab "Surname," patterns
      const surnamePattern = /([A-Z][a-z\u00C0-\u024F'-]+(?:\s+[A-Z][a-z\u00C0-\u024F'-]+)*)\s*,/g;
      let sm;
      while ((sm = surnamePattern.exec(authorBlock)) !== null) {
        const name = sm[1].trim();
        // Skip single-letter initials and "Jr", "Sr", etc.
        if (name.length > 1 && !/^(Jr|Sr|III|II|IV)$/i.test(name)) {
          authors.push(name);
        }
      }
    }

    // If no authors found from comma patterns, try the first word as surname
    if (!authors.length && text.length > 0) {
      const firstWord = text.match(/^([A-Z][a-z\u00C0-\u024F'-]+)/);
      if (firstWord) {
        authors.push(firstWord[1]);
      }
    }

    refs.push({
      html,
      text,
      firstAuthor: authors[0] || "",
      allAuthors: authors,
      year,
      originalIndex: i,
    });
  }

  return refs;
}

/**
 * Detect if references are already numbered [N] style vs APA (Author, Year) style.
 */
function isAlreadyNumberedCitations(bodyHtml: string): boolean {
  // Count bracket citations [1], [2], etc. in the body text
  const bracketCites = bodyHtml.match(/\[(\d{1,3})\]/g);
  if (bracketCites && bracketCites.length >= 3) return true;
  return false;
}

/**
 * Convert APA-style (Author, Year) citations to numbered [N] citations.
 * Only runs on new articles. If citations are already numbered, returns html unchanged.
 */
export function convertApaToBracketCitations(html: string): string {
  // Find references section
  const refsHeadingMatch = html.match(/<h2[^>]*>\s*(?:\d+\.\s*)?References\s*<\/h2>/i);
  if (!refsHeadingMatch || refsHeadingMatch.index === undefined) return html;

  const refsStart = refsHeadingMatch.index;
  const bodyHtml = html.slice(0, refsStart);
  const refsHtml = html.slice(refsStart + refsHeadingMatch[0].length);

  const alreadyNumbered = isAlreadyNumberedCitations(bodyHtml);

  // Parse references
  const refs = parseReferencesSection(refsHtml);
  if (!refs.length) {
    // No parseable refs — just linkify DOIs and return
    const linkedRefs = linkifyDois(refsHtml);
    return bodyHtml + refsHeadingMatch[0] + linkedRefs;
  }

  // Build lookup for matching citations
  // Map: "author-year" → ref index (0-based)
  type RefMatch = { refIdx: number; assignedNum: number };
  const assignedNumbers = new Map<number, number>(); // refIdx → citation number
  let nextNum = 1;

  // If already numbered, pre-seed assignedNumbers from existing [N] in references
  // so that (Author, Year) cleanup uses the same numbering
  if (alreadyNumbered) {
    // References already have id="ref-N" — use that numbering
    const idRegex = /<li\s+id="ref-(\d+)">/gi;
    let idMatch;
    let idx = 0;
    while ((idMatch = idRegex.exec(refsHtml)) !== null && idx < refs.length) {
      const num = parseInt(idMatch[1], 10);
      assignedNumbers.set(idx, num);
      if (num >= nextNum) nextNum = num + 1;
      idx++;
    }
    // If no ref-N IDs, assume sequential numbering
    if (!assignedNumbers.size) {
      for (let i = 0; i < refs.length; i++) {
        assignedNumbers.set(i, i + 1);
      }
      nextNum = refs.length + 1;
    }
  }

  function getOrAssign(refIdx: number): number {
    const existing = assignedNumbers.get(refIdx);
    if (existing !== undefined) return existing;
    const num = nextNum++;
    assignedNumbers.set(refIdx, num);
    return num;
  }

  /**
   * Try to match a single citation fragment (e.g. "Smith, 2020" or "Smith & Jones, 2020" or "Smith et al., 2020")
   * Returns refIdx or -1.
   */
  function matchCitation(fragment: string): number {
    const cleaned = fragment.trim()
      .replace(/&amp;/g, "&")
      .replace(/^(?:see\s+|e\.g\.\s*,?\s*|cf\.\s*|also\s+|in\s+)/i, "")
      .trim();

    // Pattern: Author(s), Year
    // "Smith, 2020" | "Smith & Jones, 2020" | "Smith et al., 2020"
    const citePat = /^(.+?)\s*,\s*(\d{4}[a-z]?)$/;
    const m = cleaned.match(citePat);
    if (!m) return -1;

    const authorPart = m[1].trim();
    const year = m[2];

    // Determine author surnames from citation
    const citeSurnames: string[] = [];
    if (/et\s+al\.?$/i.test(authorPart)) {
      // "Smith et al." — match first author only
      const first = authorPart.replace(/\s+et\s+al\.?$/i, "").trim();
      citeSurnames.push(first);
    } else if (/\s*&\s*/.test(authorPart)) {
      // "Smith & Jones" — match both
      authorPart.split(/\s*&\s*/).forEach(s => citeSurnames.push(s.trim()));
    } else {
      citeSurnames.push(authorPart);
    }

    if (!citeSurnames.length) return -1;

    // Find matching reference — check ALL author last names, not just first
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (ref.year !== year && ref.year.replace(/[a-z]$/, "") !== year) continue;

      const refAuthorsLower = ref.allAuthors.map(a => a.toLowerCase());
      if (!refAuthorsLower.length) continue;

      // Check if any cite surname matches any ref author
      const firstCite = citeSurnames[0].toLowerCase();
      const anyMatch = refAuthorsLower.some(ra =>
        ra === firstCite || ra.startsWith(firstCite) || firstCite.startsWith(ra)
      );
      if (!anyMatch) continue;

      // For multi-author citations, verify second author too
      if (citeSurnames.length > 1 && refAuthorsLower.length > 1) {
        const secondCite = citeSurnames[1].toLowerCase();
        const secondMatch = refAuthorsLower.some(ra =>
          ra === secondCite || ra.startsWith(secondCite) || secondCite.startsWith(ra)
        );
        if (!secondMatch) continue;
      }
      return i;
    }
    return -1;
  }

  // Pass 0: Merge broken (Author &amp)(Author, Year) into (Author & Author, Year)
  // mammoth sometimes splits "Author & Author" across two parenthetical groups
  let newBody = bodyHtml.replace(
    /\(([A-Z][a-z\u00C0-\u024F'-]+)\s*&amp;\s*\)\s*\(([^)]*?\d{4}[a-z]?[^)]*?)\)/g,
    (match, author1: string, inner2: string) => `(${author1} &amp; ${inner2})`
  );

  // Pass 1: Replace parenthetical citations (Author, Year)
  newBody = newBody.replace(
    /\(([^)]*\b\d{4}[a-z]?[^)]*)\)/g,
    (match, inner: string) => {
      // Split compound citations by semicolon: (Smith, 2020; Jones, 2021)
      const parts = inner.split(/\s*;\s*/);
      const replacements: string[] = [];
      let anyMatched = false;

      for (const part of parts) {
        const refIdx = matchCitation(part);
        if (refIdx >= 0) {
          const num = getOrAssign(refIdx);
          replacements.push(`[${num}]`);
          anyMatched = true;
        } else {
          // Keep unmatched parts as-is
          replacements.push(`(${part})`);
        }
      }

      if (!anyMatched) return match;
      return replacements.join("");
    }
  );

  // Pass 2: Replace narrative citations: Author (Year) → Author [N]
  // Pattern: "Surname (2020)" or "Surname et al. (2020)" or "Surname and Surname (2020)"
  // When already numbered: strip author name entirely → just [N] (to avoid "Goldfarb [33]" duplication)
  newBody = newBody.replace(
    /\b([A-Z][a-z\u00C0-\u024F'-]+(?:\s+(?:&|and)\s+[A-Z][a-z\u00C0-\u024F'-]+)?(?:\s+et\s+al\.?)?)\s*\((\d{4}[a-z]?)\)/g,
    (match, authorPart: string, year: string) => {
      const fragment = `${authorPart}, ${year}`;
      const refIdx = matchCitation(fragment);
      if (refIdx >= 0) {
        const num = getOrAssign(refIdx);
        // If article already uses [N] style, just emit [N]; otherwise keep "Author [N]"
        return alreadyNumbered ? `[${num}]` : `${authorPart} [${num}]`;
      }
      return match;
    }
  );

  // Pass 3: Remove orphan (Author &amp) fragments left from broken citations
  newBody = newBody.replace(/\([A-Z][a-z\u00C0-\u024F'-]+\s*&amp;\s*\)/g, "");

  // Build new references section: reorder by assigned number, unmatched at end
  const orderedRefs: { num: number; ref: ParsedRef }[] = [];
  for (const [refIdx, num] of assignedNumbers.entries()) {
    orderedRefs.push({ num, ref: refs[refIdx] });
  }
  orderedRefs.sort((a, b) => a.num - b.num);

  // Add unmatched references at the end
  for (let i = 0; i < refs.length; i++) {
    if (!assignedNumbers.has(i)) {
      const num = nextNum++;
      orderedRefs.push({ num, ref: refs[i] });
    }
  }

  // Build ordered reference list with IDs and back-navigation
  const refListItems = orderedRefs.map(({ num, ref }) => {
    const linkedHtml = linkifyDois(ref.html);
    return `<li id="ref-${num}">${linkedHtml}</li>`;
  });

  const newRefs = `<ol>${refListItems.join("")}</ol>`;
  return newBody + refsHeadingMatch[0] + newRefs;
}

export function normalizeDocxHtml(html: string, opts?: { title?: string }): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  cleaned = stripHtmlAttributes(cleaned);

  // Drop spans but keep their contents
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, "");

  // Promote common bold-only headings into h2 tags
  cleaned = cleaned.replace(/<p><strong>([^<]{2,120})<\/strong><\/p>/gi, (_match, heading) => {
    const text = String(heading || "").trim();
    if (!text) return "";
    const stripped = text.replace(/^\d+\.\s*/, "");
    if (/^(abstract|introduction|methods?|methodology|results?|discussion|conclusions?|acknowledg?ments?|references|bibliography|appendix|limitations?|future\s+work|background|literature\s+review|materials?\s+and\s+methods?)$/i.test(stripped)) {
      return `<h2>${text}</h2>`;
    }
    if (/^\d+\.\s+\S/.test(text) && text.length <= 100) {
      return `<h2>${text}</h2>`;
    }
    return `<p><strong>${text}</strong></p>`;
  });

  // Promote bold+italic subsection headings into h3 tags (MDPI style: "2.1. Search Strategy")
  cleaned = cleaned.replace(/<p><strong><em>([^<]{2,120})<\/em><\/strong><\/p>/gi, (_match, heading) => {
    const text = String(heading || "").trim();
    if (!text) return "";
    if (/^\d+\.\d+\.?\s+\S/.test(text)) {
      return `<h3>${text}</h3>`;
    }
    return `<p><strong><em>${text}</em></strong></p>`;
  });

  cleaned = sanitizeHtml(cleaned, {
    allowedTags: [
      "h1", "h2", "h3",
      "p", "br",
      "ul", "ol", "li",
      "strong", "em", "b", "i",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "img",
      "blockquote", "code", "pre",
      "sup", "sub",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      li: ["id"],
      ol: ["id"],
    },
    allowedSchemes: ["http", "https", "data"],
    transformTags: {
      h1: "h2",
    },
  });

  // Remove heading or paragraph that duplicates the article title
  if (opts?.title) {
    const t = escapeRegExp(opts.title.trim());
    if (t) {
      const titleRegex = new RegExp(`<h2[^>]*>\\s*${t}\\s*<\\/h2>`, "i");
      cleaned = cleaned.replace(titleRegex, "");
      const titleParaRegex = new RegExp(`<p[^>]*>\\s*(?:<strong>)?\\s*${t}\\s*(?:<\\/strong>)?\\s*<\\/p>`, "i");
      cleaned = cleaned.replace(titleParaRegex, "");
    }
  }

  // Trim any preface content before the first real section heading
  const headingMatch = cleaned.match(/<(h2|h3)[^>]*>/i);
  const abstractMatch = cleaned.match(/<p[^>]*>\s*<strong>\s*abstract\s*<\/strong>\s*<\/p>/i);
  const anchor = headingMatch?.index ?? abstractMatch?.index;
  if (typeof anchor === "number" && anchor > 0) {
    cleaned = cleaned.slice(anchor);
  }

  // Convert APA citations to numbered [N] format (new articles only)
  cleaned = convertApaToBracketCitations(cleaned);

  // Remove empty paragraphs / breaks
  cleaned = cleaned
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");

  return cleaned.trim();
}
