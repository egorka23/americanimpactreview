const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

  // The user specifically mentioned "[11]https://doi.org/10.1509/jmkr.45.1.48"
  // This DOI belongs to ref-11 (Villanueva et al., 2008)
  // Search for this specific DOI in the content
  const doi = '10.1509/jmkr.45.1.48';
  const idx = content.indexOf(doi);
  if (idx >= 0) {
    console.log("Found DOI at position:", idx);
    console.log("Context:", content.slice(Math.max(0, idx - 300), idx + 100));
  } else {
    console.log("DOI not found in body. Checking references...");
  }

  // The user said the text "[11]https://doi.org/10.1509/jmkr.45.1.48" appears
  // This is the references section content showing inline
  // Check if references display is the issue - look at references rendering code

  // Also look for the specific text pattern with doi after [11]
  const refSection = content.slice(content.search(/<h[12][^>]*>\s*References\s*<\/h[12]>/i));
  const ref11Idx = refSection.indexOf('ref-11');
  if (ref11Idx >= 0) {
    console.log("\nRef 11 content:");
    console.log(refSection.slice(ref11Idx - 10, ref11Idx + 300));
  }
}

main().catch(console.error);
