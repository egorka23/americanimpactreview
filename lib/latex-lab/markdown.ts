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
  let out = escapeLatex(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "\\\\textbf{$1}");
  out = out.replace(/\*([^*]+)\*/g, "\\\\textit{$1}");
  out = out.replace(/`([^`]+)`/g, "\\\\texttt{$1}");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "\\\\href{$2}{$1}");
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

function renderFigure(alt: string, path: string): string {
  const caption = alt ? `\\caption{${formatInline(alt)}}` : "";
  return [
    "\\begin{figure}[h]",
    "\\centering",
    `\\includegraphics[width=0.9\\linewidth]{${path}}`,
    caption,
    "\\end{figure}",
  ].filter(Boolean).join("\n");
}

export function markdownToLatex(md: string): string {
  const lines = md.split(/\r?\n/);
  const output: string[] = [];
  let inCodeBlock = false;
  let inItemize = false;
  let inEnumerate = false;

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (!inCodeBlock) {
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
      closeLists();
      output.push("");
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      closeLists();
      output.push(renderFigure(imageMatch[1], imageMatch[2]));
      continue;
    }

    if (isTableLine(trimmed) && i + 1 < lines.length && /\|[-\s:]+\|/.test(lines[i + 1])) {
      closeLists();
      const { rows, nextIndex } = parseTable(lines, i);
      output.push(renderTable(rows));
      i = nextIndex - 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      const content = formatInline(headingMatch[2]);
      if (level === 1) output.push(`\\section{${content}}`);
      if (level === 2) output.push(`\\subsection{${content}}`);
      if (level === 3) output.push(`\\subsubsection{${content}}`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inItemize) {
        closeLists();
        output.push("\\begin{itemize}");
        inItemize = true;
      }
      output.push(`\\item ${formatInline(trimmed.replace(/^[-*+]\s+/, ""))}`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inEnumerate) {
        closeLists();
        output.push("\\begin{enumerate}");
        inEnumerate = true;
      }
      output.push(`\\item ${formatInline(trimmed.replace(/^\d+\.\s+/, ""))}`);
      continue;
    }

    closeLists();
    output.push(formatInline(trimmed));
  }

  closeLists();
  if (inCodeBlock) {
    output.push("\\end{verbatim}");
  }

  return output.join("\n");
}
