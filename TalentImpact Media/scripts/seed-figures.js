const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "talentimpact-media-firebase-adminsdk-fbsvc-01bc9536c6.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Missing service account JSON:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const dataPath = path.join(__dirname, "figures-data.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));

async function updateCollection(collectionName, title, figures) {
  const snap = await db.collection(collectionName).where("title", "==", title).get();
  if (snap.empty) {
    console.log(`[${collectionName}] Not found: ${title}`);
    return 0;
  }
  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, { figures });
  });
  await batch.commit();
  console.log(`[${collectionName}] Updated ${snap.size} doc(s) for: ${title}`);
  return snap.size;
}

async function run() {
  for (const entry of payload) {
    const { title, figures } = entry;
    await updateCollection("articles", title, figures);
    await updateCollection("submissions", title, figures);
  }
  console.log("Figure seeding complete.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
