import fs from "fs";
import mammoth from "mammoth";

const DOCX_PATH = "/Users/aeb/Desktop/бизнес статьи для AIR/Article_05_SaaS_Freemium_CaseStudy_revised.docx";

function htmlTableToMarkdown(tableHtml: string): string {
  const rows: string[][] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm;
  while ((rm = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let cm;
    while ((cm = cellRegex.exec(rm[1])) !== null) {
      const text = cm[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return "";
  const colCount = Math.max(...rows.map((r) => r.length));
  const normalized = rows.map((r) => {
    while (r.length < colCount) r.push("");
    return r;
  });
  const header = "| " + normalized[0].join(" | ") + " |";
  const separator = "| " + normalized[0].map(() => "---").join(" | ") + " |";
  const body = normalized.slice(1).map((r) => "| " + r.join(" | ") + " |").join("\n");
  return [header, separator, body].join("\n");
}

async function main() {
  const buffer = fs.readFileSync(DOCX_PATH);

  // 1. Get HTML tables
  const htmlResult = await (mammoth as any).convertToHtml({ buffer });
  const html: string = htmlResult.value || "";
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const htmlTables: string[] = [];
  let m;
  while ((m = tableRegex.exec(html)) !== null) {
    htmlTables.push(m[0]);
  }
  console.log(`\n=== HTML Tables found: ${htmlTables.length} ===`);
  htmlTables.forEach((t, i) => {
    const md = htmlTableToMarkdown(t);
    const firstLine = md.split("\n")[0];
    console.log(`\nTable ${i + 1} first header line: ${firstLine}`);
    // Extract first cell for matching
    const fp = firstLine.indexOf("|");
    const sp = firstLine.indexOf("|", fp + 1);
    const headerText = firstLine.slice(fp + 1, sp).trim().toLowerCase();
    console.log(`  → Header match key: "${headerText}"`);
  });

  // 2. Get markdown
  const mdResult = await (mammoth as any).convertToMarkdown({ buffer });
  const mdContent: string = mdResult.value || "";

  // 3. Show markdown lines around where tables should be
  const lines = mdContent.split("\n");
  console.log(`\n=== Markdown total lines: ${lines.length} ===`);

  // Find lines that look like table headers (bold text matching first cells)
  const mdTables = htmlTables.map(t => htmlTableToMarkdown(t));
  mdTables.forEach((t, i) => {
    const fp = t.indexOf("|");
    const sp = t.indexOf("|", fp + 1);
    const headerText = t.slice(fp + 1, sp).trim().toLowerCase();

    console.log(`\n--- Looking for table ${i + 1} header: "${headerText}" ---`);

    lines.forEach((line, lineNum) => {
      const lineText = line.trim()
        .replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1")
        .replace(/^[_*]+|[_*]+$/g, "")
        .trim()
        .toLowerCase();

      if (lineText === headerText || lineText.startsWith(headerText)) {
        console.log(`  MATCH at line ${lineNum}: "${line.trim().substring(0, 80)}"`);
      }
    });

    // Also search for partial match
    lines.forEach((line, lineNum) => {
      if (line.toLowerCase().includes(headerText) && !line.startsWith("|")) {
        console.log(`  PARTIAL at line ${lineNum}: "${line.trim().substring(0, 80)}"`);
      }
    });
  });

  // 4. Run spliceTablesIntoMarkdown and show result
  console.log("\n=== Running spliceTablesIntoMarkdown ===");
  const pipeTablesBefore = (mdContent.match(/^\|.+\|$/gm) || []).length;

  // Inline the function to add logging
  const tables = mdTables;
  const tableHeaders: string[] = tables.map((t) => {
    const firstPipe = t.indexOf("|");
    const secondPipe = t.indexOf("|", firstPipe + 1);
    if (firstPipe >= 0 && secondPipe > firstPipe) {
      return t.slice(firstPipe + 1, secondPipe).trim().toLowerCase();
    }
    return "";
  });
  console.log("Table headers for matching:", tableHeaders);

  let tableIdx = 0;
  let linesProcessed = 0;
  let tablesInserted = 0;

  let ii = 0;
  while (ii < lines.length) {
    const trimmed = lines[ii].trim();
    if (tableIdx < tables.length && tableHeaders[tableIdx]) {
      const headerText = tableHeaders[tableIdx];
      const lineText = trimmed
        .replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1")
        .replace(/^[_*]+|[_*]+$/g, "")
        .trim()
        .toLowerCase();

      if (lineText === headerText || lineText.startsWith(headerText)) {
        console.log(`  → Table ${tableIdx + 1} matched at line ${ii}: "${trimmed.substring(0, 60)}"`);
        tablesInserted++;
        tableIdx++;
      }
    }
    ii++;
    linesProcessed++;
  }

  console.log(`\nLines processed: ${linesProcessed}`);
  console.log(`Tables inserted: ${tablesInserted} / ${tables.length}`);
  console.log(`Pipe table lines in original markdown: ${pipeTablesBefore}`);
}

main().catch(console.error);
