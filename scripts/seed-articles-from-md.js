const fs = require("fs");
const path = require("path");
const { initializeApp, getApps } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc
} = require("firebase/firestore");

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  });
  return env;
}

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
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = loadEnv(envPath);

  const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  if (!firebaseConfig.projectId) {
    console.error("Missing Firebase config. Populate .env.local first.");
    process.exit(1);
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const articlesRef = collection(db, "articles");
  const usersRef = collection(db, "users");

  const existing = await getDocs(query(articlesRef, limit(1)));
  if (!existing.empty) {
    console.log("Seed skipped: articles already exist.");
    return;
  }

  const articlesDir = path.join(__dirname, "..", "articles");
  const files = fs
    .readdirSync(articlesDir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort();

  const authorDoc = doc(usersRef, "author-serafim");
  await setDoc(
    authorDoc,
    {
      uid: "author-serafim",
      username: "serafim",
      name: "Serafim A.",
      field: "Editorial",
      bio: "Founder of American Impact Review.",
      usernameLower: "serafim",
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  for (const file of files) {
    const article = parseArticle(path.join(articlesDir, file));
    const publishedAt = article.publicationDateRaw
      ? new Date(article.publicationDateRaw)
      : null;

    await setDoc(doc(articlesRef, article.slug), {
      title: article.title,
      content: article.content,
      slug: article.slug,
      authorId: "author-serafim",
      authorUsername: article.authorUsername,
      category: article.category,
      titleLower: article.title.toLowerCase(),
      authorUsernameLower: article.authorUsername.toLowerCase(),
      categoryLower: article.category.toLowerCase(),
      imageUrl: `https://picsum.photos/seed/${article.slug}/1200/800`,
      publishedAt: publishedAt instanceof Date && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      createdAt: serverTimestamp()
    });
  }

  console.log(`Seed complete: ${files.length} articles created.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
