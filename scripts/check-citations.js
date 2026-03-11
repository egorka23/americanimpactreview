const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

  // Find all citation-like patterns [N] and surrounding text
  const regex = /\[(\d{1,3})\]/g;
  let m;
  let count = 0;
  while ((m = regex.exec(content)) !== null) {
    const start = Math.max(0, m.index - 80);
    const end = Math.min(content.length, m.index + 200);
    const context = content.slice(start, end);
    // Only show ones that look broken (have URL right after)
    if (context.match(/\[\d+\](<a |https?:\/\/)/)) {
      console.log(`=== BROKEN CITE [${m[1]}] at pos ${m.index} ===`);
      console.log(context);
      console.log();
      count++;
      if (count > 10) break;
    }
  }

  if (count === 0) {
    console.log("No broken citations found with URLs. Let me check general format...");
    regex.lastIndex = 0;
    count = 0;
    while ((m = regex.exec(content)) !== null) {
      const start = Math.max(0, m.index - 50);
      const end = Math.min(content.length, m.index + 150);
      console.log(`=== CITE [${m[1]}] ===`);
      console.log(content.slice(start, end));
      console.log();
      count++;
      if (count > 15) break;
    }
  }
}

main().catch(console.error);
