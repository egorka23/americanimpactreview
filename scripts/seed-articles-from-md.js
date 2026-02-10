const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const SERVICE_ACCOUNT_PATH = path.join(
  require("os").homedir(),
  "Downloads",
  "american-impact-review-firebase-adminsdk-fbsvc-9b08d23f21.json"
);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function inferCategory(title) {
  const text = title.toLowerCase();
  if (
    text.includes("solar") ||
    text.includes("wind") ||
    text.includes("energy") ||
    text.includes("power") ||
    text.includes("transit") ||
    text.includes("grid")
  ) {
    return "Energy & Climate";
  }
  if (
    text.includes("ai") ||
    text.includes("algorithm") ||
    text.includes("learning") ||
    text.includes("intelligence") ||
    text.includes("bias")
  ) {
    return "AI & Data";
  }
  if (
    text.includes("health") ||
    text.includes("immuno") ||
    text.includes("vaccine") ||
    text.includes("genomic") ||
    text.includes("diagnostic")
  ) {
    return "Health & Biotech";
  }
  if (
    text.includes("robot") ||
    text.includes("autonomous") ||
    text.includes("automation") ||
    text.includes("inspection") ||
    text.includes("exoskeleton") ||
    text.includes("swarm")
  ) {
    return "Robotics & Automation";
  }
  if (
    text.includes("sleep") ||
    text.includes("cognitive") ||
    text.includes("biomechanics") ||
    text.includes("altitude") ||
    text.includes("performance")
  ) {
    return "Human Performance";
  }
  return "Impact Profile";
}

function parseArticle(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split(/\r?\n/);
  const titleLine = lines.find((line) => line.trim().startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "Untitled Article";
  const authorLine = lines.find((line) => line.toLowerCase().includes("**author:**"));
  const authorRaw = authorLine
    ? authorLine.replace(/\*\*/g, "").replace(/author:\s*/i, "").trim()
    : "Serafim A.";
  const authorName = authorRaw.split(",")[0].trim() || "Serafim A.";

  const publicationLine = lines.find((line) =>
    line.toLowerCase().includes("**publication date:**")
  );
  const publicationDateRaw = publicationLine
    ? publicationLine.replace(/\*\*/g, "").replace(/publication date:\s*/i, "").trim()
    : "";

  const slugFromFile = path.basename(filePath, ".md");
  return {
    title,
    content: raw,
    slug: slugFromFile || slugify(title),
    authorName,
    authorUsername: "serafim",
    category: inferCategory(title),
    publicationDateRaw
  };
}

async function seed() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error("Service account key not found at:", SERVICE_ACCOUNT_PATH);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
  });

  const db = admin.firestore();

  const existing = await db.collection("articles").limit(1).get();
  if (!existing.empty) {
    console.log("Seed skipped: articles already exist.");
    process.exit(0);
  }

  const articlesDir = path.join(__dirname, "..", "articles");
  const files = fs
    .readdirSync(articlesDir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort();

  // Create seed author
  await db.collection("users").doc("seed-serafim").set({
    uid: "seed-serafim",
    username: "serafim",
    name: "Serafim A.",
    field: "Editorial",
    bio: "Founder of American Impact Review.",
    usernameLower: "serafim",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created seed author: serafim");

  for (const file of files) {
    const article = parseArticle(path.join(articlesDir, file));
    const publishedAt = article.publicationDateRaw
      ? new Date(article.publicationDateRaw)
      : null;

    await db.collection("articles").doc(article.slug).set({
      title: article.title,
      content: article.content,
      slug: article.slug,
      authorId: "seed-serafim",
      authorUsername: article.authorUsername,
      category: article.category,
      titleLower: article.title.toLowerCase(),
      authorUsernameLower: article.authorUsername.toLowerCase(),
      categoryLower: article.category.toLowerCase(),
      imageUrl: `https://picsum.photos/seed/${article.slug}/1200/800`,
      imageUrls: [],
      publishedAt:
        publishedAt instanceof Date && !Number.isNaN(publishedAt.getTime())
          ? publishedAt
          : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  + ${article.slug}`);
  }

  console.log(`\nSeed complete: ${files.length} articles created.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
