const path = require("path");
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "talentimpact-media-firebase-adminsdk-fbsvc-01bc9536c6.json"
);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const fakeAuthors = [
  {
    uid: "seed-author-1",
    username: "maya-chen",
    name: "Maya Chen",
    field: "Product Strategy",
    bio: "Product strategist focused on scaling mission-driven teams."
  },
  {
    uid: "seed-author-2",
    username: "jordan-park",
    name: "Jordan Park",
    field: "AI & Data",
    bio: "Data leader building practical AI workflows for modern orgs."
  },
  {
    uid: "seed-author-3",
    username: "selena-rojas",
    name: "Selena Rojas",
    field: "Design Leadership",
    bio: "Design executive passionate about systems and craft."
  },
  {
    uid: "seed-author-4",
    username: "amir-king",
    name: "Amir King",
    field: "Growth Marketing",
    bio: "Growth marketer helping teams turn curiosity into conversion."
  },
  {
    uid: "seed-author-5",
    username: "ravi-singh",
    name: "Ravi Singh",
    field: "Engineering",
    bio: "Engineering manager focused on reliability and culture."
  }
];

const articleList = JSON.parse(
  fs.readFileSync(path.join(__dirname, "uscis-articles.json"), "utf8")
);

function buildArticleContent(title, category, subjectName) {
  return [
    `${subjectName} is a fictional leader in ${category} whose work illustrates sustained technical contribution, cross‑sector collaboration, and measurable public impact. The profile below summarizes educational foundations, deployment history, and the independent recognition that shaped their professional standing.`,
    `The field of ${category} is advancing quickly, yet practical adoption still depends on leaders who combine research excellence with real‑world implementation. ${subjectName} is presented here as a model for how sustained technical work can translate into measurable outcomes across regions and stakeholders.`,
    `${subjectName} completed advanced training in ${category} and began early research focused on scalable, measurable outcomes. Early publications and lab work established a foundation for later deployments and collaborations with international partners, institutions, and community organizations.`,
    `Across multiple multi‑year initiatives, ${subjectName} led programs that emphasized reliability, cost‑effectiveness, and human outcomes. These efforts produced tangible results, including improved access, reduced operational costs, and measurable performance gains in target communities.`,
    `Independent awards and invited conference talks recognized the technical rigor and societal relevance of this work. Coverage in reputable outlets highlighted both the engineering contributions and the long‑term benefits to communities, reinforcing the subject’s influence within the field.`,
    `Independent evaluations reported measurable improvements in quality of service, regional productivity, and long‑term sustainability metrics. The work has since been referenced in professional guidelines and cited in academic and policy settings, indicating broader field influence.`,
    `References (fictional placeholders): ${subjectName}, “Applied Systems in ${category},” Journal of Field Innovation (2023); International ${category} Consortium, “Annual Impact Report” (2024); Global Science Review, “Profiles in ${category} Leadership” (2025).`
  ].join("\n\n");
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "but",
  "not",
  "you",
  "your",
  "about",
  "their",
  "they",
  "them",
  "its",
  "our",
  "over",
  "under",
  "using",
  "use",
  "via",
  "such",
  "also",
  "more",
  "most",
  "less",
  "than",
  "then",
  "these",
  "those",
  "can",
  "will",
  "may",
  "might",
  "should",
  "could",
  "into",
  "across",
  "between",
  "based",
  "within",
  "while",
  "each",
  "other",
  "first",
  "second",
  "third"
]);

function buildKeywords({ title, content, category, author }) {
  const text = `${title} ${category} ${author} ${content}`;
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 20);
}

function createSlug(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function seed() {
  const articlesRef = db.collection("articles");
  const existing = await articlesRef.get();
  if (!existing.empty) {
    const deleteBatch = db.batch();
    existing.docs.forEach((docSnap) => deleteBatch.delete(docSnap.ref));
    await deleteBatch.commit();
  }

  const batch = db.batch();

  fakeAuthors.forEach((author) => {
    const ref = db.collection("users").doc(author.uid);
    batch.set(ref, {
      ...author,
      usernameLower: author.username.toLowerCase(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  articleList.forEach((article, index) => {
    const ref = articlesRef.doc();
    const titleLower = article.title.toLowerCase();
    const authorUsernameLower = article.authorUsername.toLowerCase();
    const categoryLower = article.category.toLowerCase();
    const subjectName = article.title.split(":").slice(-1)[0].trim() || article.title.split(" ").slice(-2).join(" ");
    const content = article.customContent
      ? article.customContent
      : buildArticleContent(article.title, article.category, subjectName);
    const keywords = buildKeywords({
      title: article.title,
      content,
      category: article.category,
      author: article.authorUsername
    });
    const extraImages = [
      `https://picsum.photos/seed/${article.imageSeed}-1/900/700`,
      `https://picsum.photos/seed/${article.imageSeed}-2/900/700`,
      `https://picsum.photos/seed/${article.imageSeed}-3/900/700`
    ];
    batch.set(ref, {
      title: article.title,
      content,
      slug: `${createSlug(article.title)}-${index + 1}`,
      authorId: article.authorId,
      authorUsername: article.authorUsername,
      category: article.category,
      titleLower,
      authorUsernameLower,
      categoryLower,
      imageUrl: `https://picsum.photos/seed/${article.imageSeed}/1200/800`,
      imageUrls: extraImages,
      keywords,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  console.log(`Seed complete: ${articleList.length} articles created.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
