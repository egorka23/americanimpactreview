const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

  // Check if content starts with <
  console.log("Starts with '<':", content.trimStart().startsWith('<'));
  console.log("First 200 chars:", content.slice(0, 200));
  console.log();

  // Check references parsing - find the section
  const refIdx = content.search(/<h[12][^>]*>\s*References\s*<\/h[12]>/i);
  console.log("References heading at:", refIdx);

  if (refIdx >= 0) {
    const afterRef = content.slice(refIdx);
    // Find where next heading starts (or end)
    const nextH = afterRef.slice(1).search(/<h[12][^>]*>/i);
    const refsHtml = nextH >= 0 ? afterRef.slice(0, nextH + 1) : afterRef;

    // Extract the body (after </h2>)
    const closeTag = refsHtml.match(/<\/h[12]>/i);
    const bodyStart = closeTag ? closeTag.index + closeTag[0].length : 0;
    const refsBody = refsHtml.slice(bodyStart).trim();

    // Count <li> items
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    const refs = [];
    while ((liMatch = liRegex.exec(refsBody)) !== null) {
      refs.push(liMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    console.log("Ref count from <li>:", refs.length);
    if (refs.length > 0) {
      console.log("Ref 1:", refs[0].slice(0, 120));
      console.log("Ref 11:", refs[10] ? refs[10].slice(0, 120) : "N/A");
    }
  }

  // Now simulate processHtml regex on first paragraph with [1]
  const testText = content.slice(0, 5000);
  const citeRegex = /(?<=>|\s)\[((\d{1,3})([\s,\-–\u2013]+\d{1,3})*)\](?=[\s,.\);:<]|$)/g;
  let m;
  let found = 0;
  while ((m = citeRegex.exec(testText)) !== null) {
    console.log("Regex matched:", m[0], "at", m.index);
    found++;
  }
  console.log("Total regex matches in first 5000 chars:", found);

  // Check what happens with [1](McKee...
  const sample = 'customers [1](McKee et al., 2023). Pioneered';
  const matches = sample.match(citeRegex);
  console.log("\nTest '[1](McKee...)' match:", matches);

  // The ( after ] is NOT in the lookahead!
  const sample2 = 'strain [3].</p>';
  console.log("Test '[3].</p>' match:", sample2.match(citeRegex));
}

main().catch(console.error);
