const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

  // Find DOI URLs that appear in the body text (not in references section)
  const refIdx = content.search(/<h[12][^>]*>\s*References\s*<\/h[12]>/i);
  const bodyContent = refIdx >= 0 ? content.slice(0, refIdx) : content;

  // Look for https://doi.org patterns in body
  const doiRegex = /https?:\/\/doi\.org\/[^\s<"')]+/g;
  let m;
  while ((m = doiRegex.exec(bodyContent)) !== null) {
    const start = Math.max(0, m.index - 200);
    const end = Math.min(bodyContent.length, m.index + 100);
    console.log("=== DOI URL in body text ===");
    console.log(bodyContent.slice(start, end));
    console.log();
  }

  // Also check for any <a href= links in the body that look like citation links
  const linkRegex = /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
  let linkCount = 0;
  while ((m = linkRegex.exec(bodyContent)) !== null) {
    if (m[1].includes('doi.org') || m[2].includes('doi.org') || m[2].includes('https://')) {
      console.log("=== Link with DOI in body ===");
      const start = Math.max(0, m.index - 100);
      const end = Math.min(bodyContent.length, m.index + m[0].length + 50);
      console.log(bodyContent.slice(start, end));
      console.log();
      linkCount++;
      if (linkCount > 10) break;
    }
  }

  if (!linkCount) {
    console.log("No DOI links found in body. Looking for any URLs...");
    const urlRegex = /https?:\/\/[^\s<"']+/g;
    let urlCount = 0;
    while ((m = urlRegex.exec(bodyContent)) !== null) {
      const start = Math.max(0, m.index - 100);
      const end = Math.min(bodyContent.length, m.index + 100);
      console.log("=== URL in body ===");
      console.log(bodyContent.slice(start, end));
      console.log();
      urlCount++;
      if (urlCount > 5) break;
    }
  }
}

main().catch(console.error);
