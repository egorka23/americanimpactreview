const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  let content = r.rows[0].content;

  // Extract references
  const refIdx = content.search(/<h[12][^>]*>\s*References\s*<\/h[12]>/i);
  const afterRef = content.slice(refIdx);
  const nextH = afterRef.slice(1).search(/<h[12][^>]*>/i);
  const refsHtml = nextH >= 0 ? afterRef.slice(0, nextH + 1) : afterRef;
  const closeTagM = refsHtml.match(/<\/h[12]>/i);
  const bodyStart = closeTagM ? closeTagM.index + closeTagM[0].length : 0;
  const refsBody = refsHtml.slice(bodyStart).trim();

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  const refs = [];
  while ((liMatch = liRegex.exec(refsBody)) !== null) {
    refs.push(liMatch[1].replace(/<[^>]+>/g, "").trim());
  }

  // Build: lastName -> year -> refNum
  const authorYearMap = new Map(); // "lastname" -> Map(year -> refNum)
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const yearMatch = ref.match(/\((\d{4})\)/);
    if (!yearMatch) continue;
    const year = yearMatch[1];
    const authorPart = ref.split("(" + year)[0];

    // Get last names
    const nameRegex = /([A-Z][a-z]+),\s*[A-Z]\./g;
    let nm;
    while ((nm = nameRegex.exec(authorPart)) !== null) {
      const name = nm[1].toLowerCase();
      if (!authorYearMap.has(name)) authorYearMap.set(name, new Map());
      authorYearMap.get(name).set(year, i + 1);
    }
    // Also get names like "de Vries" or "du Plessis" or "McKee"
    const capNames = authorPart.match(/\b([A-Z][a-z]+)\b/g) || [];
    for (const cn of capNames) {
      const name = cn.toLowerCase();
      if (["the", "and", "journal", "review"].includes(name)) continue;
      if (!authorYearMap.has(name)) authorYearMap.set(name, new Map());
      if (!authorYearMap.get(name).has(year)) {
        authorYearMap.get(name).set(year, i + 1);
      }
    }
  }

  function findRefNum(citeText) {
    const clean = citeText.replace(/&amp;/g, "&").replace(/et\s+al\.?/gi, "").trim();
    const yearM = clean.match(/(\d{4})/);
    if (!yearM) return null;
    const year = yearM[1];

    const authorPart = clean.replace(/,?\s*\d{4}.*$/, "").trim();
    const words = authorPart.split(/[\s&,;.()]+/)
      .filter(w => w.length > 1 && /^[A-Za-z]/.test(w))
      .map(w => w.toLowerCase())
      .filter(w => !["de", "du", "van", "von", "et", "al", "the", "and"].includes(w));

    for (const w of words) {
      const m = authorYearMap.get(w);
      if (m && m.has(year)) return m.get(year);
    }
    return null;
  }

  let bodyContent = content.slice(0, refIdx);
  const allReplacements = [];

  // Pattern 1: Already-broken (Author &amp)(Author, Year) — should be mostly done but let's catch any remaining
  const brokenRegex = /\(([A-Z][a-z]+)\s*&amp;\s*\)\s*\(([^)]*?\d{4}[^)]*?)\)/g;
  let bm;
  while ((bm = brokenRegex.exec(bodyContent)) !== null) {
    const combined = bm[1] + " & " + bm[2];
    const num = findRefNum(combined);
    if (num) {
      allReplacements.push({ original: bm[0], replacement: `[${num}]`, position: bm.index });
    } else {
      console.log("BROKEN UNMATCHED:", bm[0]);
    }
  }

  // Pattern 2: Normal (Author &amp; Author, Year) — split by ; but respect &amp;
  // First, replace &amp; with a placeholder to avoid confusion with semicolons
  const normalRegex = /\(([A-Z][^)]*?\d{4}(?:[^)]*?\d{4})*)\)/g;
  let nm2;
  while ((nm2 = normalRegex.exec(bodyContent)) !== null) {
    if (allReplacements.some(r => nm2.index >= r.position && nm2.index < r.position + r.original.length)) continue;

    let inner = nm2[1];
    // Skip non-citations
    if (/january|february|march|april|may|june|july|august|september|october|november|december|table|figure|p\s*[<>=]/i.test(inner)) continue;
    if (!/[A-Z][a-z]+/.test(inner)) continue;

    // Replace &amp; with & for processing
    const normalized = inner.replace(/&amp;/g, "&");

    // Split by semicolons (which separate multiple citations)
    const parts = normalized.split(/;\s*(?=[A-Z])/);
    const nums = [];
    let allFound = true;

    for (const part of parts) {
      const num = findRefNum(part.trim());
      if (num) {
        if (!nums.includes(num)) nums.push(num);
      } else {
        allFound = false;
        console.log("UNMATCHED part:", part.trim(), "from:", nm2[0].slice(0, 80));
        break;
      }
    }

    if (allFound && nums.length > 0) {
      allReplacements.push({
        original: nm2[0],
        replacement: nums.map(n => `[${n}]`).join(""),
        position: nm2.index
      });
    }
  }

  // Sort by position descending
  allReplacements.sort((a, b) => b.position - a.position);

  // Remove overlaps
  const final = [];
  let lastStart = Infinity;
  for (const r of allReplacements) {
    if (r.position + r.original.length <= lastStart) {
      final.push(r);
      lastStart = r.position;
    }
  }

  console.log("\n=== REPLACEMENTS ===");
  for (const r of final.slice().reverse()) {
    const ctx = bodyContent.slice(Math.max(0, r.position - 20), Math.min(bodyContent.length, r.position + r.original.length + 20));
    console.log(`${r.original}  ->  ${r.replacement}`);
    console.log(`  ...${ctx}...`);
    console.log();
  }
  console.log("Total:", final.length);

  // Apply
  let newContent = content;
  for (const r of final) {
    newContent = newContent.slice(0, r.position) + r.replacement + newContent.slice(r.position + r.original.length);
  }

  console.log(`Length: ${content.length} -> ${newContent.length} (diff: ${content.length - newContent.length})`);

  if (final.length > 0) {
    await db.execute({
      sql: 'UPDATE published_articles SET content = ? WHERE slug = "e2026012"',
      args: [newContent]
    });
    console.log(">>> SAVED <<<");
  }
}

main().catch(console.error);
