const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

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

  // Build author-year index from refs
  // e.g. "Kannan, P. K., & Li, H. (2017)." -> key: "kannan.*li.*2017"
  const refIndex = refs.map((ref, i) => {
    // Extract first author last name and year
    const authorMatch = ref.match(/^([A-Z][a-z]+)/);
    const yearMatch = ref.match(/\((\d{4})\)/);
    const firstAuthor = authorMatch ? authorMatch[1].toLowerCase() : "";
    const year = yearMatch ? yearMatch[1] : "";
    // Also get all author last names
    const allAuthors = [];
    const nameRegex = /([A-Z][a-z]+),\s*[A-Z]\./g;
    let nm;
    while ((nm = nameRegex.exec(ref.split("(")[0])) !== null) {
      allAuthors.push(nm[1].toLowerCase());
    }
    return { num: i + 1, firstAuthor, year, allAuthors, text: ref.slice(0, 80) };
  });

  // Find author-date citations in body text
  const bodyContent = content.slice(0, refIdx);

  // Pattern: (Author & Author, Year) or (Author et al., Year) or multiple with ;
  const citeParen = /\(([A-Z][^)]*\d{4}[^)]*)\)/g;
  let m;
  const replacements = [];

  while ((m = citeParen.exec(bodyContent)) !== null) {
    const inner = m[1];
    // Split by semicolons for multiple cites
    const parts = inner.split(/;\s*/);
    const nums = [];
    let allFound = true;

    for (const part of parts) {
      const yearM = part.match(/(\d{4})/);
      if (!yearM) { allFound = false; break; }
      const year = yearM[1];

      // Extract author names from the citation
      const cleaned = part.replace(/\d{4}/, "").replace(/[,&]/g, " ").trim();
      const words = cleaned.split(/\s+/).filter(w => w.length > 2 && /^[A-Z]/.test(w)).map(w => w.toLowerCase());

      if (!words.length) { allFound = false; break; }

      // Find matching ref
      let found = false;
      for (const ref of refIndex) {
        if (ref.year !== year) continue;
        // Check if first author matches any word in citation
        const matches = words.some(w => ref.allAuthors.includes(w)) ||
                       words.some(w => ref.firstAuthor.startsWith(w.slice(0, 4)));
        if (matches) {
          nums.push(ref.num);
          found = true;
          break;
        }
      }
      if (!found) { allFound = false; break; }
    }

    if (allFound && nums.length > 0) {
      const replacement = nums.map(n => `[${n}]`).join("");
      replacements.push({
        original: m[0],
        replacement,
        position: m.index,
        context: bodyContent.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)
      });
    } else {
      console.log("UNMATCHED:", m[0]);
      // Try to show what we couldn't match
      for (const part of parts) {
        const yearM = part.match(/(\d{4})/);
        const year = yearM ? yearM[1] : "?";
        const cleaned = part.replace(/\d{4}/, "").replace(/[,&]/g, " ").trim();
        const words = cleaned.split(/\s+/).filter(w => w.length > 2 && /^[A-Z]/.test(w)).map(w => w.toLowerCase());
        console.log("  Part:", part.trim(), "-> authors:", words, "year:", year);
      }
    }
  }

  console.log("\n=== REPLACEMENTS ===");
  for (const r of replacements) {
    console.log(`${r.original} -> ${r.replacement}`);
    console.log(`  Context: ...${r.context}...`);
    console.log();
  }
  console.log("Total replacements:", replacements.length);
}

main().catch(console.error);
