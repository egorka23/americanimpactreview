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
  console.log("Total refs:", refs.length);

  // Build comprehensive lookup: any author last name + year -> ref number
  // Store ALL author last names for each ref
  const refEntries = [];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const yearMatch = ref.match(/\((\d{4})\)/);
    if (!yearMatch) continue;
    const year = yearMatch[1];
    const authorPart = ref.split("(" + year)[0];

    // Extract all capitalized words that look like last names
    const lastNames = new Set();
    // Pattern: "LastName, I." or "LastName, I. I."
    const nameRegex = /([A-Z][a-z]+),\s*[A-Z]\./g;
    let nm;
    while ((nm = nameRegex.exec(authorPart)) !== null) {
      lastNames.add(nm[1].toLowerCase());
    }
    // Also try: words at start of ref or after "&"
    const wordRegex = /(?:^|\b)([A-Z][a-z]{2,})\b/g;
    while ((nm = wordRegex.exec(authorPart)) !== null) {
      const w = nm[1].toLowerCase();
      if (!["the", "and", "for", "with", "from", "journal", "review", "article", "research"].includes(w)) {
        lastNames.add(w);
      }
    }

    refEntries.push({
      num: i + 1,
      year,
      lastNames: [...lastNames],
      text: ref.slice(0, 60)
    });
  }

  // Function to find ref number for an author-date citation
  function findRefNum(citeText) {
    // Normalize
    const clean = citeText.replace(/&amp;/g, "&").replace(/et\s+al\.?/gi, "").trim();
    const yearM = clean.match(/(\d{4})/);
    if (!yearM) return null;
    const year = yearM[1];

    const authorPart = clean.replace(/,?\s*\d{4}.*$/, "").trim();
    const words = authorPart.split(/[\s&,;.]+/)
      .filter(w => w.length > 1 && /^[A-Za-z]/.test(w))
      .map(w => w.toLowerCase())
      .filter(w => !["de", "du", "van", "von", "et", "al"].includes(w));

    if (!words.length) return null;

    // Find best match: ref with same year where any author last name matches any word
    let bestMatch = null;
    let bestScore = 0;
    for (const entry of refEntries) {
      if (entry.year !== year) continue;
      let score = 0;
      for (const w of words) {
        for (const name of entry.lastNames) {
          if (name === w || name.startsWith(w) || w.startsWith(name)) {
            score++;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    return bestMatch ? bestMatch.num : null;
  }

  const bodyContent = content.slice(0, refIdx);
  const allReplacements = [];

  // 1. Handle broken pattern: (Author &amp)(Author, Year)
  const brokenRegex = /\(([A-Z][a-z]+)\s*&amp;\s*\)\s*\(([A-Z][a-z]+(?:[^)]*?)?,\s*\d{4})\)/g;
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

  // 2. Handle normal author-date citations: (Author & Author, Year)
  // Also handles (Author et al., Year) and (multi; multi)
  // Must handle &amp; as &, and semicolons for multiple
  const normalRegex = /\(([A-Z][a-z][\w\s.,;&]+?\d{4}(?:\s*;\s*[A-Z][a-z][\w\s.,;&]+?\d{4})*)\)/g;
  let nm2;
  while ((nm2 = normalRegex.exec(bodyContent)) !== null) {
    // Skip if overlaps with broken pattern replacement
    if (allReplacements.some(r => nm2.index >= r.position && nm2.index < r.position + r.original.length)) continue;

    const inner = nm2[1];
    // Split by semicolons
    const parts = inner.split(/;\s*(?=[A-Z])/);
    const nums = [];
    let allFound = true;

    for (const part of parts) {
      const num = findRefNum(part.trim());
      if (num) {
        nums.push(num);
      } else {
        // Skip non-citation parens like "(January 2023 through June 2024)"
        if (/january|february|march|april|may|june|july|august|september|october|november|december/i.test(part)) {
          allFound = false;
          break;
        }
        allFound = false;
        console.log("UNMATCHED:", part.trim());
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

  // Sort by position descending for replacement
  allReplacements.sort((a, b) => b.position - a.position);

  // Remove duplicates
  const seen = new Set();
  const unique = allReplacements.filter(r => {
    if (seen.has(r.position)) return false;
    seen.add(r.position);
    return true;
  });

  console.log("\n=== ALL REPLACEMENTS ===");
  for (const r of unique.slice().reverse()) {
    const ctx = bodyContent.slice(Math.max(0, r.position - 30), r.position + r.original.length + 30);
    console.log(`${r.original}  ->  ${r.replacement}`);
    console.log(`  ...${ctx}...`);
    console.log();
  }
  console.log("Total:", unique.length);

  // Apply
  let newContent = content;
  for (const r of unique) {
    newContent = newContent.slice(0, r.position) + r.replacement + newContent.slice(r.position + r.original.length);
  }

  console.log(`\nLength: ${content.length} -> ${newContent.length} (diff: ${content.length - newContent.length})`);

  // Save
  if (unique.length > 0) {
    await db.execute({
      sql: 'UPDATE published_articles SET content = ? WHERE slug = "e2026012"',
      args: [newContent]
    });
    console.log("\n>>> SAVED to DB <<<");
  }
}

main().catch(console.error);
