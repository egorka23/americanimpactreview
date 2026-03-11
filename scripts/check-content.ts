import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA'
});

async function main() {
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  const content = r.rows[0]?.content as string | null;
  if (content) {
    console.log('Content length:', content.length);
    console.log('First 500 chars:', content.slice(0, 500));
  } else {
    console.log('Content is NULL');
  }
}

main().catch(console.error);
