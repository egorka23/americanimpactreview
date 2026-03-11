import { createClient } from "@libsql/client";
import * as fs from "fs";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  // Read new figure
  const newImg = fs.readFileSync("/tmp/e2026015_figure1_new.png");
  const newBase64 = "data:image/png;base64," + newImg.toString("base64");

  // Get current content
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026015'");
  let content = r.rows[0]?.content as string;

  // Find first img tag and replace its src
  const firstImgMatch = content.match(/<img src="data:image\/png;base64,[^"]+"/);
  if (!firstImgMatch) {
    console.log("No img found");
    return;
  }

  const oldImgTag = firstImgMatch[0];
  const newImgTag = `<img src="${newBase64}"`;

  content = content.replace(oldImgTag, newImgTag);

  // Update DB
  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [content, "e2026015"],
  });

  console.log("Updated! Old img length:", oldImgTag.length, "→ New:", newImgTag.length);
}

main().catch(console.error);
