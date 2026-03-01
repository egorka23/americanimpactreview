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

export function escapeLatex(input: string): string {
  return input.replace(/[\\{}$&#%_^~]/g, (char) => SPECIAL_CHARS[char] || char);
}

function formatInline(text: string): string {
  const linkRanges: Array<{ start: number; end: number }> = [];
  const linkPattern = /\[[^\]]+\]\([^)]+\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(text)) !== null) {
    linkRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  const isInLink = (index: number) =>
    linkRanges.some((range) => index >= range.start && index < range.end);

  const autolinkPattern = /https?:\/\/[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
  let linked = "";
  let lastIndex = 0;
  while ((match = autolinkPattern.exec(text)) !== null) {
    if (isInLink(match.index)) continue;
    linked += text.slice(lastIndex, match.index);
    const raw = match[0];
    if (raw.includes("@") && !raw.startsWith("http")) {
      linked += `[${raw}](mailto:${raw})`;
    } else {
      linked += `[${raw}](${raw})`;
    }
    lastIndex = match.index + raw.length;
  }
  linked += text.slice(lastIndex);

  let out = escapeLatex(linked);
  out = out.replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}");
  out = out.replace(/\*([^*]+)\*/g, "\\textit{$1}");
  out = out.replace(/`([^`]+)`/g, "\\texttt{$1}");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "\\href{$2}{$1}");
  return out;
}

function isTableLine(line: string): boolean {
  return /^\|(.+)\|$/.test(line.trim());
}

function parseTable(lines: string[], startIndex: number) {
  const rows: string[][] = [];
  let idx = startIndex;
  while (idx < lines.length && isTableLine(lines[idx])) {
    const row = lines[idx].trim().slice(1, -1).split("|").map((cell) => cell.trim());
    rows.push(row);
    idx += 1;
  }
  return { rows, nextIndex: idx };
}

function renderTable(rows: string[][]): string {
  if (!rows.length) return "";
  const columnCount = Math.max(...rows.map((row) => row.length));
  const colSpec = Array.from({ length: columnCount }, () => "l").join(" ");
  const header = rows[0].map((cell) => `\\textbf{${formatInline(cell)}}`).join(" & ");
  const body = rows.slice(1).map((row) => row.map((cell) => formatInline(cell)).join(" & ")).join(" \\\\\n");
  return [
    "\\begin{center}",
    `\\begin{tabular}{${colSpec}}`,
    "\\toprule",
    `${header} \\\\`,
    "\\midrule",
    body || "",
    "\\bottomrule",
    "\\end{tabular}",
    "\\end{center}",
  ].filter(Boolean).join("\n");
}

export type MarkdownOptions = {
  imageMaxHeight?: string;
  imageForcePage?: boolean;
  imageFit?: boolean;
};

function renderFigure(alt: string, path: string, options?: MarkdownOptions): string {
  const caption = alt ? `\\caption{${formatInline(alt)}}` : "";
  const maxHeight = options?.imageMaxHeight || "0.85\\textheight";
  const fit = options?.imageFit !== false;
  const include = fit
    ? `\\airimage{${path}}`
    : `\\includegraphics{${path}}`;
  return [
    "\\begin{figure}[htbp]",
    "\\centering",
    include,
    caption,
    "\\end{figure}",
  ].filter(Boolean).join("\n");
}

export function markdownToLatex(md: string, options?: MarkdownOptions): string {
  const normalizedMd = md.replace(/!\[([\s\S]*?)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const cleanAlt = String(alt).replace(/\s+/g, " ").trim();
    return `![${cleanAlt}](${src})`;
  });
  const lines = normalizedMd.split(/\r?\n/);
  const output: string[] = [];
  let inCodeBlock = false;
  let inItemize = false;
  let inEnumerate = false;
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

  const flushParagraph = () => {
    if (!paragraph.length) return;
    if (isLikelyAuthorBlock(paragraph)) {
      const lines = paragraph.map((line) => formatInline(line));
      output.push(lines.join(" \\\\ \n"));
    } else {
      output.push(formatInline(paragraph.join(" ")));
    }
    paragraph = [];
  };

  const isLikelyAuthorBlock = (lines: string[]) => {
    if (lines.length < 2 || lines.length > 12) return false;
    const joined = lines.join(" ");
    if (/@/.test(joined) || /orcid\.org/i.test(joined)) return true;
    const shortLines = lines.filter((line) => line.trim().length <= 80);
    return shortLines.length === lines.length && !/[.!?]$/.test(lines[lines.length - 1].trim());
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
        flushParagraph();
        closeLists();
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

    if (!trimmed) {
      flushParagraph();
      closeLists();
      output.push("");
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      flushParagraph();
      closeLists();
      const figureLines = renderFigure(imageMatch[1], imageMatch[2], options).split("\n");
      for (const figLine of figureLines) {
        const last = output[output.length - 1];
        if (figLine === "\\clearpage" && last === "\\clearpage") continue;
        output.push(figLine);
      }
      continue;
    }

    if (isTableLine(trimmed) && i + 1 < lines.length && /\|[-\s:]+\|/.test(lines[i + 1])) {
      flushParagraph();
      closeLists();
      const { rows, nextIndex } = parseTable(lines, i);
      output.push(renderTable(rows));
      i = nextIndex - 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeLists();
      const level = headingMatch[1].length;
      const content = formatInline(headingMatch[2]);
      if (level === 1) output.push(`\\section{${content}}`);
      if (level === 2) output.push(`\\subsection{${content}}`);
      if (level === 3) output.push(`\\subsubsection{${content}}`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph();
      if (!inItemize) {
        closeLists();
        output.push("\\begin{itemize}");
        inItemize = true;
      }
      output.push(`\\item ${formatInline(trimmed.replace(/^[-*+]\s+/, ""))}`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (!inEnumerate) {
        closeLists();
        output.push("\\begin{enumerate}");
        inEnumerate = true;
      }
      output.push(`\\item ${formatInline(trimmed.replace(/^\d+\.\s+/, ""))}`);
      continue;
    }

    closeLists();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeLists();
  if (inCodeBlock) {
    output.push("\\end{verbatim}");
  }

  return output.join("\n");
}
