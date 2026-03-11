/**
 * Fix citation formatting for article e2026015.
 * Converts remaining (Author, Year) APA-style citations to [N] bracket citations,
 * handles broken (Author &amp)(CoAuthor, Year) patterns,
 * and removes orphan (Author &amp) fragments.
 */

const { createClient } = require("@libsql/client");

const DB_URL = "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io";
const DB_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA";

async function main() {
  const client = createClient({ url: DB_URL, authToken: DB_TOKEN });

  // 1. Fetch content
  const result = await client.execute(
    "SELECT content FROM published_articles WHERE slug = 'e2026015'"
  );
  if (result.rows.length === 0) {
    console.error("Article e2026015 not found!");
    process.exit(1);
  }
  let content = result.rows[0].content;
  console.log("Fetched article content (" + content.length + " chars)\n");

  // 2. Extract references section
  const refsIdx = content.indexOf("<h2>References</h2>");
  if (refsIdx === -1) {
    console.error("No <h2>References</h2> found!");
    process.exit(1);
  }
  const refsHtml = content.slice(refsIdx);

  // 3. Parse all <li id="ref-N"> entries
  const liPattern = /<li\s+id="ref-(\d+)"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  const refs = [];
  while ((match = liPattern.exec(refsHtml)) !== null) {
    const num = parseInt(match[1]);
    const rawText = match[2].replace(/<[^>]+>/g, "").trim();
    const text = rawText.replace(/&amp;/g, "&");
    refs.push({ num, text });
  }
  console.log("Parsed " + refs.length + " references\n");

  // 4. Build author-year lookup map
  const lookup = new Map(); // key: "lastname|year" => refNum

  for (const ref of refs) {
    const yearMatch = ref.text.match(/\((\d{4})\)/);
    if (!yearMatch) {
      console.log("  [ref-" + ref.num + "] No year found: " + ref.text.slice(0, 80));
      continue;
    }
    const year = yearMatch[1];

    const beforeYear = ref.text.slice(0, ref.text.indexOf("(" + year + ")"));

    // Find all capitalized words that look like last names (3+ chars, not common words)
    const simpleNamePattern = /\b([A-Z][a-z\u00C0-\u024F]{2,}(?:[-'][A-Z][a-z]+)?)\b/g;
    let nm;
    const lastNames = [];
    const skipWords = new Set(["The", "And", "For", "Journal", "Review", "American", "International", "Consumer", "Marketing", "Management", "Science", "Economics", "Research", "Evidence", "Dynamic", "Online", "Quarterly", "Price", "Pricing", "Strategic", "Effects"]);

    while ((nm = simpleNamePattern.exec(beforeYear)) !== null) {
      const candidate = nm[1];
      if (!skipWords.has(candidate) && !lastNames.includes(candidate)) {
        lastNames.push(candidate);
      }
    }

    // Also handle special chars like Dubé, Nijs
    const specialPattern = /\b([A-Z][a-z\u00C0-\u024F]+(?:[-'][A-Z][a-z]+)?)\b/g;
    while ((nm = specialPattern.exec(beforeYear)) !== null) {
      const candidate = nm[1];
      if (!skipWords.has(candidate) && candidate.length > 2 && !lastNames.includes(candidate)) {
        lastNames.push(candidate);
      }
    }

    for (const name of lastNames) {
      const key = name.toLowerCase() + "|" + year;
      if (!lookup.has(key)) {
        lookup.set(key, ref.num);
      }
    }

    console.log("  [ref-" + ref.num + "] Year=" + year + ", Authors: " + lastNames.join(", "));
  }

  console.log("\nLookup map has " + lookup.size + " entries\n");

  // Helper: look up ref number from author name + year
  function findRef(authorLastName, year) {
    const key = authorLastName.toLowerCase() + "|" + year;
    return lookup.get(key) || null;
  }

  // Stats
  let replacements = 0;
  const unmatched = [];

  // 5. Handle broken patterns: (Author &amp)(CoAuthor, Year)[N] or (Author &amp)(CoAuthor, Year)
  const brokenPattern = /\(([A-Z][a-z\u00C0-\u024F]+)\s*&amp;\s*\)\s*\(([A-Z][a-z\u00C0-\u024F]+(?:\s*(?:&amp;|&)\s*[A-Z][a-z]+)*),?\s*(\d{4}[a-z]?)\)(\[\d+\])?/g;

  content = content.replace(brokenPattern, function(full, author1, author2, year, existingBracket) {
    const refNum = findRef(author1, year) || findRef(author2, year);
    if (refNum) {
      if (existingBracket) {
        const existingNum = parseInt(existingBracket.slice(1, -1));
        if (existingNum === refNum) {
          replacements++;
          console.log("  Broken+bracket: \"" + full + "\" -> \"[" + refNum + "]\"");
          return "[" + refNum + "]";
        }
      }
      replacements++;
      console.log("  Broken: \"" + full + "\" -> \"[" + refNum + "]\"");
      return "[" + refNum + "]";
    }
    unmatched.push(full);
    return full;
  });

  // 6. Handle normal APA citations: (Author & Author, Year) or (Author, Year)
  const apaPattern = /\(([A-Z][a-z\u00C0-\u024F]+(?:\s*(?:&amp;|&)\s*[A-Z][a-z\u00C0-\u024F]+)*(?:\s+et\s+al\.?)?),?\s*(\d{4}[a-z]?)\)/g;

  content = content.replace(apaPattern, function(full, authorsStr, year) {
    const namePattern = /([A-Z][a-z\u00C0-\u024F]+)/g;
    let nm;
    const names = [];
    while ((nm = namePattern.exec(authorsStr)) !== null) {
      names.push(nm[1]);
    }

    let refNum = null;
    for (const name of names) {
      refNum = findRef(name, year);
      if (refNum) break;
    }

    if (refNum) {
      replacements++;
      console.log("  APA: \"" + full + "\" -> \"[" + refNum + "]\"");
      return "[" + refNum + "]";
    }
    unmatched.push(full);
    return full;
  });

  // 7. Remove orphan (Author &amp) before bracket citations
  const orphanBeforeBracket = /\(([A-Z][a-z\u00C0-\u024F]+)\s*&amp;\s*\)\s*(?=\[)/g;
  content = content.replace(orphanBeforeBracket, function(full) {
    replacements++;
    console.log("  Orphan before bracket: \"" + full + "\" -> removed");
    return "";
  });

  // Remove remaining standalone orphan (Author &amp) fragments
  const standaloneOrphan = /\(([A-Z][a-z\u00C0-\u024F]+)\s*&amp;\s*\)\s*/g;
  content = content.replace(standaloneOrphan, function(full) {
    replacements++;
    console.log("  Standalone orphan: \"" + full + "\" -> removed");
    return "";
  });

  // 8. Dedup bracket citations like [29][29]
  const dupBracket = /\[(\d+)\]\s*\[\1\]/g;
  content = content.replace(dupBracket, function(full, num) {
    replacements++;
    console.log("  Dedup: \"" + full + "\" -> \"[" + num + "]\"");
    return "[" + num + "]";
  });

  // 9. Print stats
  console.log("\n=== STATS ===");
  console.log("Total replacements: " + replacements);
  if (unmatched.length > 0) {
    console.log("Unmatched citations (" + unmatched.length + "):");
    unmatched.forEach(function(u) { console.log("  " + u); });
  } else {
    console.log("No unmatched citations!");
  }

  // 10. Verify no APA-style citations remain in the body
  const bodyAfter = content.slice(0, content.indexOf("<h2>References</h2>"));
  const remainingApa = bodyAfter.match(
    /\([A-Z][a-z]+(?:\s*(?:&amp;|&)\s*[A-Z][a-z]+)*(?:\s+et\s+al\.?)?,?\s*\d{4}[a-z]?\)/g
  ) || [];
  const remainingOrphans = bodyAfter.match(/\([A-Z][a-z\u00C0-\u024F]+\s*&amp;\s*\)/g) || [];

  if (remainingApa.length > 0) {
    console.log("\nWARNING: " + remainingApa.length + " APA citations still remain:");
    remainingApa.forEach(function(c) { console.log("  " + c); });
  } else {
    console.log("\nNo remaining APA citations in body - clean!");
  }
  if (remainingOrphans.length > 0) {
    console.log("\nWARNING: " + remainingOrphans.length + " orphan fragments still remain:");
    remainingOrphans.forEach(function(c) { console.log("  " + c); });
  } else {
    console.log("No remaining orphan fragments - clean!");
  }

  // 11. Save cleaned content back to database
  console.log("\nSaving cleaned content (" + content.length + " chars) to database...");
  await client.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = 'e2026015'",
    args: [content],
  });
  console.log("Done! Content saved successfully.");
}

main().catch(function(err) {
  console.error("Error:", err);
  process.exit(1);
});
