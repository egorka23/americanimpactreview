const SPECIAL_CHARS: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "%": "\\%",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

/**
 * Escape special LaTeX characters in a string, preserving math blocks.
 * Inline math `$...$` passes through as-is.
 * Display math `$$...$$` is converted to `\[...\]`.
 */
export function escapeLatex(input: string): string {
  // Split the input around math blocks, preserving them
  // Process display math ($$...$$) first, then inline math ($...$)
  const segments: Array<{ text: string; isMath: boolean; isDisplay: boolean }> = [];
  let remaining = input;

  // Regex: match $$...$$ (display) or $...$ (inline, non-greedy)
  // Display math: must not have $ immediately inside (to avoid $$$)
  const mathPattern = /\$\$([^$]+)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathPattern.exec(remaining)) !== null) {
    // Add the text before this math block
    if (match.index > lastIndex) {
      segments.push({ text: remaining.slice(lastIndex, match.index), isMath: false, isDisplay: false });
    }

    if (match[1] !== undefined) {
      // Display math $$...$$
      segments.push({ text: match[1], isMath: true, isDisplay: true });
    } else if (match[2] !== undefined) {
      // Inline math $...$
      segments.push({ text: match[2], isMath: true, isDisplay: false });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add the remaining text after the last math block
  if (lastIndex < remaining.length) {
    segments.push({ text: remaining.slice(lastIndex), isMath: false, isDisplay: false });
  }

  // If no segments were created, the whole thing is non-math
  if (segments.length === 0) {
    segments.push({ text: remaining, isMath: false, isDisplay: false });
  }

  // Now escape non-math segments and reconstruct
  return segments
    .map((seg) => {
      if (seg.isMath) {
        if (seg.isDisplay) {
          return `\\[${seg.text}\\]`;
        }
        return `$${seg.text}$`;
      }
      return seg.text.replace(/[\\{}$&#%_^~]/g, (char) => SPECIAL_CHARS[char] || char);
    })
    .join("");
}

/**
 * Format inline markdown: links, bold/italic, code, footnote references.
 *
 * Processing order:
 * 1. Extract markdown links into placeholders (so URLs are never escaped)
 * 2. Auto-link bare URLs/emails into placeholders
 * 3. Convert underscore emphasis (_.._, __..__, ___...___) to asterisk form
 * 4. Extract inline code into placeholders
 * 5. Extract footnote references into placeholders
 * 6. Escape LaTeX special chars on the remaining text
 * 7. Process asterisk emphasis (***bold italic***, **bold**, *italic*)
 * 8. Re-insert inline code as \texttt{...}
 * 9. Re-insert footnote references as \footnote{...}
 * 10. Re-insert links as \href{url}{text}
 */
function formatInline(text: string, footnotes?: Map<string, string>): string {
  // --- Step 1: Collect existing markdown links ---
  const linkStore: Array<{ url: string; display: string }> = [];
  const linkPlaceholderPrefix = "\x00LINK";

  // Replace markdown links with placeholders
  let working = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, display, url) => {
    const idx = linkStore.length;
    linkStore.push({ url, display });
    return `${linkPlaceholderPrefix}${idx}\x00`;
  });

  // --- Step 2: Auto-link bare URLs and emails (outside placeholders) ---
  const autolinkPattern = /https?:\/\/[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
  working = working.replace(autolinkPattern, (raw) => {
    // Check if this is inside a placeholder (shouldn't be, but guard)
    if (raw.includes(linkPlaceholderPrefix)) return raw;
    const idx = linkStore.length;
    if (raw.includes("@") && !raw.startsWith("http")) {
      linkStore.push({ url: `mailto:${raw}`, display: raw });
    } else {
      linkStore.push({ url: raw, display: raw });
    }
    return `${linkPlaceholderPrefix}${idx}\x00`;
  });

  // --- Step 3: Convert underscore emphasis to asterisk form BEFORE escaping ---
  // This must happen before escapeLatex because _ is escaped to \_
  working = working.replace(/___([^_]+?)___/g, "***$1***");
  working = working.replace(/__([^_]+?)__/g, "**$1**");
  working = working.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, "*$1*");

  // --- Step 4: Extract inline code BEFORE escaping (backtick content should not be escaped) ---
  const codeStore: string[] = [];
  const codePlaceholderPrefix = "\x00CODE";
  working = working.replace(/`([^`]+)`/g, (_m, code) => {
    const idx = codeStore.length;
    codeStore.push(code);
    return `${codePlaceholderPrefix}${idx}\x00`;
  });

  // --- Step 5: Extract footnote references BEFORE escaping ---
  const footnoteRefStore: string[] = [];
  const footnotePlaceholderPrefix = "\x00FN";
  if (footnotes) {
    working = working.replace(/\[\^(\w+)\]/g, (_m, id) => {
      const noteText = footnotes.get(id);
      const idx = footnoteRefStore.length;
      if (noteText) {
        footnoteRefStore.push(`\\footnote{${escapeLatex(noteText)}}`);
      } else {
        footnoteRefStore.push(`\\footnote{[\\^${id}]}`);
      }
      return `${footnotePlaceholderPrefix}${idx}\x00`;
    });
  }

  // --- Step 6: Escape LaTeX on the remaining text (placeholders are safe — they use \x00) ---
  working = escapeLatex(working);

  // --- Step 7: Emphasis processing (asterisk-based only, underscores already converted) ---
  // Bold+italic: ***...***
  working = working.replace(/\*\*\*([^*]+?)\*\*\*/g, "\\textbf{\\textit{$1}}");
  // Bold: **...**
  working = working.replace(/\*\*([^*]+?)\*\*/g, "\\textbf{$1}");
  // Italic: *...*
  working = working.replace(/\*([^*]+?)\*/g, "\\textit{$1}");

  // --- Step 8: Re-insert inline code placeholders ---
  working = working.replace(
    new RegExp(`${codePlaceholderPrefix.replace(/\x00/g, "\\x00")}(\\d+)\\x00`, "g"),
    (_m, idxStr) => {
      const idx = parseInt(idxStr, 10);
      return `\\texttt{${codeStore[idx] ?? ""}}`;
    }
  );

  // --- Step 9: Re-insert footnote placeholders ---
  working = working.replace(
    new RegExp(`${footnotePlaceholderPrefix.replace(/\x00/g, "\\x00")}(\\d+)\\x00`, "g"),
    (_m, idxStr) => {
      const idx = parseInt(idxStr, 10);
      return footnoteRefStore[idx] ?? "";
    }
  );

  // --- Step 10: Re-insert link placeholders ---
  working = working.replace(
    new RegExp(`${linkPlaceholderPrefix.replace(/\x00/g, "\\x00")}(\\d+)\\x00`, "g"),
    (_m, idxStr) => {
      const idx = parseInt(idxStr, 10);
      const link = linkStore[idx];
      if (!link) return "";
      // URL is NOT escaped (it must remain valid); display text IS escaped
      const escapedDisplay = escapeLatex(link.display);
      return `\\href{${link.url}}{${escapedDisplay}}`;
    }
  );

  return working;
}

function isTableLine(line: string): boolean {
  return /^\|(.+)\|$/.test(line.trim());
}

/**
 * Check if a line is a GFM table separator row (e.g., `| --- | :---: | ---: |`).
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
  const inner = trimmed.slice(1, -1);
  const cells = inner.split("|");
  return cells.every((cell) => /^\s*:?-{1,}:?\s*$/.test(cell));
}

function parseTable(lines: string[], startIndex: number) {
  const rows: string[][] = [];
  let idx = startIndex;
  while (idx < lines.length && isTableLine(lines[idx])) {
    // Skip the separator row
    if (isTableSeparator(lines[idx])) {
      idx += 1;
      continue;
    }
    const row = lines[idx]
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    rows.push(row);
    idx += 1;
  }
  return { rows, nextIndex: idx };
}

function renderTable(rows: string[][], caption?: string): string {
  if (!rows.length) return "";
  const columnCount = Math.max(...rows.map((row) => row.length));

  // Estimate average cell content length per column to allocate proportional widths
  const colAvgLen = Array.from({ length: columnCount }, (_, ci) => {
    const lengths = rows.map((r) => (r[ci] || "").length);
    return lengths.reduce((a, b) => a + b, 0) / lengths.length;
  });
  const totalLen = colAvgLen.reduce((a, b) => a + b, 0) || 1;

  // For tables with many columns or wide content, use p{} columns with word wrap
  const useWrapping = columnCount >= 3 || totalLen > 100;
  // Total available width: 0.90 for 5+ cols, 0.93 for 4, 0.95 for 3
  const totalWidth = columnCount >= 5 ? 0.88 : columnCount >= 4 ? 0.92 : 0.95;
  let colSpec: string;
  if (useWrapping) {
    // Proportional p{} columns — minimum 0.06\textwidth each
    const widths = colAvgLen.map((len) => Math.max(0.06, (len / totalLen) * totalWidth));
    const widthSum = widths.reduce((a, b) => a + b, 0);
    const normalized = widths.map((w) => (w / widthSum) * totalWidth);
    colSpec = normalized.map((w) => `p{${w.toFixed(2)}\\textwidth}`).join(" ");
  } else {
    colSpec = Array.from({ length: columnCount }, () => "l").join(" ");
  }

  const header = rows[0]
    .map((cell) => `\\textbf{${formatInline(cell)}}`)
    .join(" & ");
  const body = rows
    .slice(1)
    .map((row) => row.map((cell) => formatInline(cell)).join(" & "))
    .join(" \\\\\n");
  const bodyWithTrailing = body ? `${body} \\\\` : "";
  const captionLine = caption ? `\\caption{${formatInline(caption)}}` : "";
  // Use \footnotesize for wide tables (4+ columns)
  const fontSize = columnCount >= 4 ? "\\footnotesize" : "\\small";

  // Use longtable for large tables (8+ data rows) — allows page breaks
  const useLongtable = rows.length > 8;

  if (useLongtable) {
    return [
      fontSize,
      `\\begin{longtable}{${colSpec}}`,
      captionLine ? `${captionLine} \\\\` : "",
      "\\toprule",
      `${header} \\\\`,
      "\\midrule",
      "\\endfirsthead",
      // Header repeated on subsequent pages
      captionLine ? `${captionLine} \\textit{(continued)} \\\\` : "",
      "\\toprule",
      `${header} \\\\`,
      "\\midrule",
      "\\endhead",
      "\\midrule",
      `\\multicolumn{${columnCount}}{r}{\\textit{Continued on next page}} \\\\`,
      "\\endfoot",
      "\\bottomrule",
      "\\endlastfoot",
      bodyWithTrailing,
      "\\end{longtable}",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "\\begin{table}[!ht]",
    "\\centering",
    captionLine,
    fontSize,
    `\\begin{tabular}{${colSpec}}`,
    "\\toprule",
    `${header} \\\\`,
    "\\midrule",
    bodyWithTrailing,
    "\\bottomrule",
    "\\end{tabular}",
    "\\end{table}",
  ]
    .filter(Boolean)
    .join("\n");
}

export type MarkdownOptions = {
  imageMaxHeight?: string;
  imageForcePage?: boolean;
  imageFit?: boolean;
};

function renderFigure(
  alt: string,
  path: string,
  options?: MarkdownOptions,
  externalCaption?: string
): string {
  // Use external caption (from following paragraph) if no alt text
  const captionText = alt || externalCaption || "";
  const caption = captionText ? `\\caption{${formatInline(captionText)}}` : "";
  const fit = options?.imageFit !== false;
  const include = fit
    ? `\\airimage{${path}}`
    : `\\includegraphics{${path}}`;
  return [
    "\\begin{figure}[!ht]",
    "\\centering",
    include,
    caption,
    "\\end{figure}",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Strip leading/trailing markdown bold/italic markers and stray asterisks/underscores.
 */
function stripMarkdownEmphasis(text: string): string {
  return text
    .replace(/^[*_]+\s*/, "")
    .replace(/\s*[*_]+$/, "")
    .trim();
}

/**
 * Check if a line is a figure caption: **Figure N.** or __*Figure N.*__ followed by text
 */
function isFigureCaption(line: string): string | null {
  // Match various markdown emphasis patterns around "Figure N"
  const m = line.match(/^[*_]*\s*Figure\s+\d+\.?\s*[*_]*\s*(.*)/i);
  if (!m) return null;
  const rest = stripMarkdownEmphasis(m[1]);
  const labelMatch = line.match(/Figure\s+\d+\.?/i);
  const label = labelMatch ? labelMatch[0] : "";
  return label + (rest ? " " + rest : "");
}

/**
 * Check if a line is a table caption: **Table N.** or similar, followed by text
 */
function isTableCaption(line: string): string | null {
  const m = line.match(/^[*_]*\s*Table\s+\d+\.?\s*[*_]*\s*(.*)/i);
  if (!m) return null;
  const rest = stripMarkdownEmphasis(m[1]);
  const labelMatch = line.match(/Table\s+\d+\.?/i);
  const label = labelMatch ? labelMatch[0] : "";
  return label + (rest ? " " + rest : "");
}

/**
 * Check if a line is a horizontal rule: `---`, `***`, or `___`
 * (three or more of the same character, possibly with spaces).
 */
function isHorizontalRule(line: string): boolean {
  const trimmed = line.trim();
  return /^[-]{3,}$/.test(trimmed) || /^[*]{3,}$/.test(trimmed) || /^[_]{3,}$/.test(trimmed);
}

/**
 * Parse footnote definitions from the document.
 * Format: `[^id]: footnote text`
 * Returns a map from id to text, and the set of line indices that are footnote definitions.
 */
function parseFootnotes(lines: string[]): { footnotes: Map<string, string>; footnoteLines: Set<number> } {
  const footnotes = new Map<string, string>();
  const footnoteLines = new Set<number>();
  const defPattern = /^\[\^(\w+)\]:\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].trim().match(defPattern);
    if (match) {
      footnotes.set(match[1], match[2]);
      footnoteLines.add(i);
    }
  }

  return { footnotes, footnoteLines };
}

export function markdownToLatex(
  md: string,
  options?: MarkdownOptions
): string {
  // Normalize multi-line image alt text into single lines
  const normalizedMd = md.replace(
    /!\[([\s\S]*?)\]\(([^)]+)\)/g,
    (_match, alt, src) => {
      const cleanAlt = String(alt).replace(/\s+/g, " ").trim();
      return `![${cleanAlt}](${src})`;
    }
  );

  const lines = normalizedMd.split(/\r?\n/);

  // Pre-parse footnote definitions
  const { footnotes, footnoteLines } = parseFootnotes(lines);

  const output: string[] = [];
  let inCodeBlock = false;
  let inItemize = false;
  let inEnumerate = false;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let paragraph: string[] = [];

  const closeLists = () => {
    if (inItemize) {
      output.push("\\end{itemize}");
      inItemize = false;
    }
    if (inEnumerate) {
      output.push("\\end{enumerate}");
      inEnumerate = false;
    }
  };

  const flushBlockquote = () => {
    if (!inBlockquote) return;
    const content = blockquoteLines
      .map((line) => formatInline(line, footnotes))
      .join("\n");
    output.push("\\begin{quote}");
    output.push(content);
    output.push("\\end{quote}");
    blockquoteLines = [];
    inBlockquote = false;
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    if (isLikelyAuthorBlock(paragraph)) {
      const formatted = paragraph.map((line) => formatInline(line, footnotes));
      output.push(formatted.join(" \\\\ \n"));
    } else {
      const text = paragraph.join(" ");
      const formatted = formatInline(text, footnotes);
      output.push(formatted);
      // Prevent page break after table/figure captions (keep caption with content)
      if (isTableCaption(text) || isFigureCaption(text)) {
        output.push("\\nopagebreak[4]");
      }
    }
    paragraph = [];
  };

  const isLikelyAuthorBlock = (pLines: string[]) => {
    if (pLines.length < 2 || pLines.length > 12) return false;
    const joined = pLines.join(" ");
    if (/@/.test(joined) || /orcid\.org/i.test(joined)) return true;
    const shortLines = pLines.filter((line) => line.trim().length <= 80);
    return (
      shortLines.length === pLines.length &&
      !/[.!?]$/.test(pLines[pLines.length - 1].trim())
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip footnote definition lines (they are consumed inline)
    if (footnoteLines.has(i)) {
      continue;
    }

    // --- Code blocks ---
    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushBlockquote();
      closeLists();
      if (!inCodeBlock) {
        output.push("\\begin{verbatim}");
        inCodeBlock = true;
      } else {
        output.push("\\end{verbatim}");
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(line);
      continue;
    }

    // --- Blank lines ---
    if (!trimmed) {
      flushParagraph();
      flushBlockquote();
      // Don't close lists if the next non-blank line continues the same list type
      const nextNonBlank = lines.slice(i + 1).find((l) => l.trim() !== "");
      const nextIsOrderedItem = nextNonBlank && /^\d+\.\s+/.test(nextNonBlank.trim());
      const nextIsUnorderedItem = nextNonBlank && /^[-*+]\s+/.test(nextNonBlank.trim());
      if (!(inEnumerate && nextIsOrderedItem) && !(inItemize && nextIsUnorderedItem)) {
        closeLists();
      }
      output.push("");
      continue;
    }

    // --- Blockquotes ---
    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      flushParagraph();
      closeLists();
      inBlockquote = true;
      blockquoteLines.push(blockquoteMatch[1]);
      continue;
    } else if (inBlockquote) {
      // A non-blockquote, non-blank line ends the blockquote
      flushBlockquote();
    }

    // --- Images ---
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      flushParagraph();
      closeLists();
      // Look ahead for a figure caption on the next non-blank line
      let externalCaption: string | undefined;
      let skipLines = 0;
      for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
        const nextTrimmed = lines[j].trim();
        if (nextTrimmed === "") { skipLines++; continue; }
        const cap = isFigureCaption(nextTrimmed);
        if (cap) {
          externalCaption = cap;
          skipLines = j - i;
        }
        break;
      }
      const figureLines = renderFigure(
        imageMatch[1],
        imageMatch[2],
        options,
        externalCaption
      ).split("\n");
      for (const figLine of figureLines) {
        const last = output[output.length - 1];
        if (figLine === "\\clearpage" && last === "\\clearpage") continue;
        output.push(figLine);
      }
      if (externalCaption) i += skipLines; // Skip the absorbed caption line
      continue;
    }

    // --- Tables ---
    if (
      isTableLine(trimmed) &&
      i + 1 < lines.length &&
      /\|[-\s:]+\|/.test(lines[i + 1])
    ) {
      flushParagraph();
      closeLists();
      // Check if the previous output was a table caption and absorb it
      let tableCaption: string | undefined;
      // Look back in original lines for a table caption (skip blank lines)
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const prevTrimmed = lines[j].trim();
        if (prevTrimmed === "") continue;
        const cap = isTableCaption(prevTrimmed);
        if (cap) {
          tableCaption = cap;
          // Remove the caption paragraph that was already flushed to output
          // It would be the last non-empty entry in output
          for (let k = output.length - 1; k >= 0; k--) {
            if (output[k].trim() === "") continue;
            // Check if this output line contains the table caption text
            output.splice(k, 1);
            break;
          }
        }
        break;
      }
      const { rows, nextIndex } = parseTable(lines, i);
      output.push(renderTable(rows, tableCaption));
      i = nextIndex - 1;
      continue;
    }

    // --- Horizontal rules (must be checked before unordered list items with ---) ---
    if (isHorizontalRule(trimmed)) {
      flushParagraph();
      closeLists();
      output.push("\\bigskip\\noindent\\rule{\\textwidth}{0.4pt}\\bigskip");
      continue;
    }

    // --- Headings ---
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeLists();
      const level = headingMatch[1].length;
      const rawContent = headingMatch[2];
      const content = formatInline(rawContent, footnotes);

      // Abstract detection: ## Abstract or # Abstract
      if (/^abstract$/i.test(rawContent.trim())) {
        // Collect all content until the next heading or end of document
        const abstractLines: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextTrimmed = lines[j].trim();
          // Stop at the next heading
          if (/^#{1,6}\s+/.test(nextTrimmed)) break;
          // Skip footnote definition lines
          if (footnoteLines.has(j)) {
            j++;
            continue;
          }
          abstractLines.push(nextTrimmed);
          j++;
        }
        // Trim leading/trailing blank lines from abstract content
        while (abstractLines.length > 0 && abstractLines[0] === "") {
          abstractLines.shift();
        }
        while (
          abstractLines.length > 0 &&
          abstractLines[abstractLines.length - 1] === ""
        ) {
          abstractLines.pop();
        }

        output.push("\\begin{abstract}");
        if (abstractLines.length > 0) {
          output.push(
            formatInline(abstractLines.join(" "), footnotes)
          );
        }
        output.push("\\end{abstract}");
        // Skip past the abstract content lines
        i = j - 1;
        continue;
      }

      // Detect if heading already has a number (e.g. "3.1 Title" or "3.1. Title")
      // If so, use unnumbered variant (\section*) to avoid double numbering
      const hasNumber = /^\d+(\.\d+)*\.?\s/.test(rawContent.trim());

      // Back-matter sections that should never be numbered
      const backMatterSections = /^(declarations?|references?|acknowledgm?ents?|appendix|funding|conflicts?\s+of\s+interest|author\s+contributions?|data\s+availability|supplementary|ethics)$/i;
      const isBackMatter = backMatterSections.test(rawContent.trim());

      if (hasNumber || isBackMatter) {
        if (level === 1) output.push(`\\section*{${content}}`);
        else if (level === 2) output.push(`\\subsection*{${content}}`);
        else if (level === 3) output.push(`\\subsubsection*{${content}}`);
        else if (level >= 4) output.push(`\\paragraph*{${content}}`);
      } else {
        if (level === 1) output.push(`\\section{${content}}`);
        else if (level === 2) output.push(`\\subsection{${content}}`);
        else if (level === 3) output.push(`\\subsubsection{${content}}`);
        else if (level >= 4) output.push(`\\paragraph{${content}}`);
      }
      continue;
    }

    // --- Unordered list items ---
    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph();
      if (!inItemize) {
        closeLists();
        output.push("\\begin{itemize}");
        inItemize = true;
      }
      output.push(
        `\\item ${formatInline(trimmed.replace(/^[-*+]\s+/, ""), footnotes)}`
      );
      continue;
    }

    // --- Ordered list items ---
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (!inEnumerate) {
        closeLists();
        output.push("\\begin{enumerate}");
        inEnumerate = true;
      }
      output.push(
        `\\item ${formatInline(trimmed.replace(/^\d+\.\s+/, ""), footnotes)}`
      );
      continue;
    }

    // --- Regular paragraph text ---
    closeLists();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushBlockquote();
  closeLists();
  if (inCodeBlock) {
    output.push("\\end{verbatim}");
  }

  return output.join("\n");
}
