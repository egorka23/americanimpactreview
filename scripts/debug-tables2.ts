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
      const text = cm[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return "";
  const colCount = Math.max(...rows.map((r) => r.length));
  const normalized = rows.map((r) => { while (r.length < colCount) r.push(""); return r; });
  const header = "| " + normalized[0].join(" | ") + " |";
  const separator = "| " + normalized[0].map(() => "---").join(" | ") + " |";
  const body = normalized.slice(1).map((r) => "| " + r.join(" | ") + " |").join("\n");
  return [header, separator, body].join("\n");
}

// NEW fixed version
function spliceTablesIntoMarkdown(md: string, tables: string[]): string {
  if (tables.length === 0) return md;
  const lines = md.split("\n");
  const result: string[] = [];
  let tableIdx = 0;
  const tableHeaders: string[] = tables.map((t) => {
    const fp = t.indexOf("|"); const sp = t.indexOf("|", fp + 1);
    return (fp >= 0 && sp > fp) ? t.slice(fp + 1, sp).trim().toLowerCase() : "";
  });
  const cleanLine = (s: string) => s.trim().replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1").replace(/^[_*]+|[_*]+$/g, "").trim().toLowerCase();
  const isTableCaptionLine = (s: string) => /Table\s+\d+\./i.test(s.replace(/\\([\\`*_{}\[\]()#+\-.!&%~^])/g, "$1").replace(/[_*]/g, ""));

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (tableIdx < tables.length && tableHeaders[tableIdx]) {
      const headerText = tableHeaders[tableIdx];
      const lineText = cleanLine(trimmed);
      if (lineText === headerText || lineText.startsWith(headerText)) {
        let j = i; let foundNote = false;
        while (j < lines.length) {
          const lt = lines[j].trim();
          if (lt === "") { j++; continue; }
          if (/^#{1,6}\s/.test(lt)) break;
          // Stop at NEXT table caption
          if (j > i + 2 && isTableCaptionLine(lt)) break;
          // Stop at NEXT table header
          if (j > i && tableIdx + 1 < tables.length && tableHeaders[tableIdx + 1]) {
            const cl = cleanLine(lt);
            if (cl === tableHeaders[tableIdx + 1] || cl.startsWith(tableHeaders[tableIdx + 1])) break;
          }
          if (/^Note\b/i.test(lt.replace(/^[_*]+/, ""))) {
            result.push(tables[tableIdx]); result.push("");
            for (let k = j; k < lines.length; k++) { const nt = lines[k].trim(); if (nt === "" && k > j) break; result.push(lines[k]); j = k + 1; }
            foundNote = true; break;
          }
          j++;
        }
        if (!foundNote) { result.push(tables[tableIdx]); result.push(""); }
        tableIdx++; i = j; continue;
      }
    }
    result.push(lines[i]); i++;
  }
  return result.join("\n");
}

async function main() {
  const buffer = fs.readFileSync(DOCX_PATH);
  const htmlResult = await (mammoth as any).convertToHtml({ buffer });
  const html: string = htmlResult.value || "";
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const htmlTables: string[] = [];
  let m;
  while ((m = tableRegex.exec(html)) !== null) { htmlTables.push(htmlTableToMarkdown(m[0])); }

  const mdResult = await (mammoth as any).convertToMarkdown({ buffer });
  const mdContent: string = mdResult.value || "";

  const spliced = spliceTablesIntoMarkdown(mdContent, htmlTables);
  const lines = spliced.split("\n");

  let tableRegions = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^\|(.+)\|$/.test(trimmed) && i + 1 < lines.length && /\|[-\s:]+\|/.test(lines[i + 1])) {
      tableRegions++;
      console.log(`\n=== PIPE TABLE ${tableRegions} at line ${i} ===`);
      for (let k = Math.max(0, i - 3); k < i; k++) console.log(`  [${k}] ${lines[k].substring(0, 100)}`);
      let j = i;
      while (j < lines.length && /^\|(.+)\|$/.test(lines[j].trim())) { console.log(`  [${j}] ${lines[j].substring(0, 120)}`); j++; }
      for (let k = j; k < Math.min(lines.length, j + 2); k++) console.log(`  [${k}] ${lines[k].substring(0, 100)}`);
    }
  }

  console.log(`\nTotal pipe table regions: ${tableRegions} (expected: ${htmlTables.length})`);
}

main().catch(console.error);
