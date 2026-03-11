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
  const closeTag = refsHtml.match(/<\/h[12]>/i);
  const bodyStart = closeTag ? closeTag.index + closeTag[0].length : 0;
  const refsBody = refsHtml.slice(bodyStart).trim();

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  const refs = [];
  while ((liMatch = liRegex.exec(refsBody)) !== null) {
    refs.push(liMatch[1].replace(/<[^>]+>/g, "").trim());
  }

  // Build lookup: normalize ref text -> ref number
  // Key: "firstauthor_year" and "firstauthor_secondauthor_year"
  const refLookup = new Map();
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const yearMatch = ref.match(/\((\d{4})\)/);
    if (!yearMatch) continue;
    const year = yearMatch[1];

    // Get all author last names (before the year parenthetical)
    const authorPart = ref.split("(" + year)[0];
    const names = [];
    const nameRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g;
    let nm;
    while ((nm = nameRegex.exec(authorPart)) !== null) {
      const name = nm[1].toLowerCase();
      // Skip common words
      if (["the", "and", "for", "with", "from"].includes(name)) continue;
      names.push(name);
    }

    if (names.length >= 1) {
      // First author + year
      refLookup.set(`${names[0]}_${year}`, i + 1);
      // First two authors + year
      if (names.length >= 2) {
        refLookup.set(`${names[0]}_${names[1]}_${year}`, i + 1);
      }
      // "et al" style: just first author + year (already done)
    }
  }

  console.log("Ref lookup entries:", refLookup.size);
  for (const [k, v] of [...refLookup.entries()].slice(0, 10)) {
    console.log(`  ${k} -> [${v}]`);
  }

  // Function to find ref number for an author-date citation
  function findRefNum(authorStr, year) {
    // Normalize: decode &amp; , remove punctuation
    const clean = authorStr.replace(/&amp;/g, "&").replace(/[.,]/g, "").trim();
    const words = clean.split(/[\s&]+/).filter(w => w.length > 1 && /^[A-Za-z]/.test(w)).map(w => w.toLowerCase());
    // Remove "et", "al"
    const authors = words.filter(w => !["et", "al", "de", "du", "van", "von"].includes(w));

    if (authors.length === 0) return null;

    // Try two-author key
    if (authors.length >= 2) {
      const key2 = `${authors[0]}_${authors[1]}_${year}`;
      if (refLookup.has(key2)) return refLookup.get(key2);
      // Try reverse
      const key2r = `${authors[1]}_${authors[0]}_${year}`;
      if (refLookup.has(key2r)) return refLookup.get(key2r);
    }

    // Try first author only
    const key1 = `${authors[0]}_${year}`;
    if (refLookup.has(key1)) return refLookup.get(key1);

    // Try each author
    for (const a of authors) {
      const k = `${a}_${year}`;
      if (refLookup.has(k)) return refLookup.get(k);
    }

    return null;
  }

  // Now find ALL author-date patterns in body
  // Handles: (Author & Author, Year), (Author et al., Year), broken (Author &amp)(Author, Year)
  // Also multiple: (Author, Year; Author, Year)
  const bodyContent = content.slice(0, refIdx);

  // Pattern 1: Normal (Author & Author, Year) or (Author et al., Year)
  // Including &amp; variant
  // Pattern 2: Broken (Author &amp)(Author, Year) — two adjacent parens
  // Let's find all parenthetical groups that look like citations

  const allReplacements = [];

  // First handle broken pattern: (Author &amp)(Author, Year)
  // This creates TWO adjacent parens that should be one citation
  const brokenRegex = /\(([A-Z][a-z]+)\s*&amp;\s*\)\s*\(([A-Z][a-z]+(?:\s+[a-z]+\.?)?,\s*\d{4})\)/g;
  let bm;
  while ((bm = brokenRegex.exec(bodyContent)) !== null) {
    const author1 = bm[1];
    const inner2 = bm[2];
    const yearM = inner2.match(/(\d{4})/);
    if (!yearM) continue;
    const year = yearM[1];
    const author2 = inner2.replace(/,\s*\d{4}/, "").trim();

    const num = findRefNum(`${author1} ${author2}`, year);
    if (num) {
      allReplacements.push({
        original: bm[0],
        replacement: `[${num}]`,
        position: bm.index
      });
    } else {
      console.log("BROKEN UNMATCHED:", bm[0], "->", author1, author2, year);
    }
  }

  // Then handle normal (Author & Author, Year) and (multi; multi)
  // Must handle &amp; as &
  const normalRegex = /\(([A-Z][a-z][\w\s.,;&]+?\d{4}(?:\s*;[^)]+)*)\)/g;
  let nm2;
  while ((nm2 = normalRegex.exec(bodyContent)) !== null) {
    // Skip if already covered by broken pattern
    if (allReplacements.some(r => r.position === nm2.index || (nm2.index > r.position && nm2.index < r.position + r.original.length))) continue;

    const inner = nm2[1];
    // Split by semicolons for multiple citations
    const parts = inner.split(/;\s*/);
    const nums = [];
    let allFound = true;

    for (const part of parts) {
      const yearM = part.match(/(\d{4})/);
      if (!yearM) { allFound = false; break; }
      const year = yearM[1];
      const authorStr = part.replace(/,?\s*\d{4}.*$/, "").trim();
      const num = findRefNum(authorStr, year);
      if (num) {
        nums.push(num);
      } else {
        allFound = false;
        console.log("NORMAL UNMATCHED:", part.trim(), "authorStr:", authorStr);
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

  // Sort by position descending (replace from end to preserve positions)
  allReplacements.sort((a, b) => b.position - a.position);

  // Remove duplicates (same position)
  const seen = new Set();
  const uniqueReplacements = allReplacements.filter(r => {
    if (seen.has(r.position)) return false;
    seen.add(r.position);
    return true;
  });

  console.log("\n=== ALL REPLACEMENTS ===");
  for (const r of uniqueReplacements.slice().reverse()) {
    const ctx = bodyContent.slice(Math.max(0, r.position - 30), r.position + r.original.length + 30);
    console.log(`${r.original} -> ${r.replacement}`);
    console.log(`  ...${ctx}...`);
    console.log();
  }
  console.log("Total:", uniqueReplacements.length);

  // Apply replacements to content
  let newContent = content;
  for (const r of uniqueReplacements) {
    newContent = newContent.slice(0, r.position) + r.replacement + newContent.slice(r.position + r.original.length);
  }

  // Also handle the remaining broken (Author &amp)(Author, Year) that aren't proper citations
  // Like (Berman &amp)(Katona, 2013) — already next to [6]

  // Count changes
  const diff = content.length - newContent.length;
  console.log(`\nContent length: ${content.length} -> ${newContent.length} (diff: ${diff})`);

  // DRY RUN - just show, don't save yet
  console.log("\n>>> DRY RUN - not saving to DB <<<");
}

main().catch(console.error);
