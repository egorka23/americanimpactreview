const { createClient } = require('@libsql/client');
const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute('SELECT content FROM published_articles WHERE slug = "e2026012"');
  const content = r.rows[0].content;

  // Check what character follows each [N] citation
  const regex = /\[(\d{1,3})\](.)/g;
  let m;
  const afterChars = {};
  while ((m = regex.exec(content)) !== null) {
    const num = m[1];
    const after = m[2];
    if (!afterChars[after]) afterChars[after] = [];
    afterChars[after].push(num);
  }

  console.log("Characters that follow [N] citations:");
  for (const [char, nums] of Object.entries(afterChars)) {
    const charName = char === '(' ? 'OPEN_PAREN' : char === '.' ? 'DOT' : char === '<' ? 'LT' : char === ' ' ? 'SPACE' : char === ',' ? 'COMMA' : char === ')' ? 'CLOSE_PAREN' : char === '[' ? 'OPEN_BRACKET' : JSON.stringify(char);
    console.log(`  ${charName}: ${nums.length} times (refs: ${nums.slice(0, 10).join(', ')}${nums.length > 10 ? '...' : ''})`);
  }

  // Now check references section - find the heading
  const refIdx = content.search(/<h[12][^>]*>\s*References\s*<\/h[12]>/i);
  if (refIdx >= 0) {
    console.log("\n=== REFERENCES section found at", refIdx, "===");
    console.log(content.slice(refIdx, refIdx + 2000));
  } else {
    // Try bold heading
    const boldRefIdx = content.search(/<p><strong>References<\/strong><\/p>/i);
    if (boldRefIdx >= 0) {
      console.log("\n=== REFERENCES (bold heading) found at", boldRefIdx, "===");
      console.log(content.slice(boldRefIdx, boldRefIdx + 2000));
    } else {
      console.log("\n!!! No References section heading found !!!");
      // Search for 'References' anywhere
      const anyRef = content.indexOf('References');
      if (anyRef >= 0) {
        console.log("Found 'References' at", anyRef);
        console.log(content.slice(anyRef - 50, anyRef + 500));
      }
    }
  }
}

main().catch(console.error);
