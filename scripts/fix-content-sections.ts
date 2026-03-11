import { createClient } from "@libsql/client";

const db = createClient({
  url: "libsql://americanimpactreview-egorka23.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzA3Mzg1NTUsImlkIjoiYWVkMDM5ZDYtZjRjOC00NzU1LWFmODQtM2E0ZDg5MmJkZWFlIiwicmlkIjoiMmU5MWNhZWItYTcxNi00Y2Q5LWE4ODgtZGU3ZjNmZDczZGVjIn0.MvIVuKdiWUqqV7fY_3j-kv0ls8EDXslSzkmNXGQgTHWL9f4Wvrd8k8FfWeQYZMHIocYTU4S4ZdN9bVYPuF4IAA",
});

async function main() {
  const r = await db.execute("SELECT content FROM published_articles WHERE slug = 'e2026021'");
  let content = r.rows[0]?.content as string;
  console.log("Before:", content.length);

  // Convert inline bold section names into proper <h2> headings + <p> text
  // Pattern: <p><strong>SectionName.</strong> Rest of paragraph text...</p>
  // Result:  <h2>SectionName</h2><p>Rest of paragraph text...</p>
  const sections = ["Abstract", "Introduction", "Results", "Conclusions"];
  for (const sec of sections) {
    const regex = new RegExp(
      `<p><strong>${sec}\\.?</strong>\\s*([\\s\\S]*?)</p>`,
      "i"
    );
    content = content.replace(regex, (match, rest) => {
      const trimmedRest = rest.trim();
      if (trimmedRest) {
        return `<h2>${sec}</h2><p>${trimmedRest}</p>`;
      }
      return `<h2>${sec}</h2>`;
    });
  }

  // "References" is already standalone: <p><strong>References</strong></p>
  // Convert to <h2>
  content = content.replace(
    /<p><strong>References<\/strong><\/p>/i,
    "<h2>References</h2>"
  );

  // "Keywords:" — convert to standalone <p> with bold (keep as is, it's fine)
  // But actually let's also check if Keywords needs to stay inline
  // Keywords should stay as a paragraph, not a heading

  // Remove the internal subtitle <h2> since the PDF template already shows the article title
  // The internal "Permanent Micropigmentation in the System..." is redundant
  content = content.replace(
    /<h2>Permanent Micropigmentation in the System of Comprehensive Rehabilitation[^<]*<\/h2>/i,
    ""
  );

  console.log("After:", content.length);

  // Verify structure
  const h2s = content.match(/<h2>[^<]+<\/h2>/g) || [];
  console.log("H2 headings found:", h2s);

  // Show first 500 chars
  console.log("\nFirst 500:", content.slice(0, 500));

  await db.execute({
    sql: "UPDATE published_articles SET content = ? WHERE slug = ?",
    args: [content, "e2026021"],
  });
  console.log("\nUpdated!");
}

main().catch(console.error);
