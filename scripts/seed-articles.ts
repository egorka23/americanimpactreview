/**
 * Seed the 7 published articles into the submissions table.
 * Run: npx tsx scripts/seed-articles.ts
 */
import { db } from "../lib/db";
import { submissions } from "../lib/db/schema";

const articles = [
  {
    userId: "da19e5a8-16ff-4276-92fd-d7f32f312ad2", // Nikolai Stepanov
    title: "Monitoring and Scalability of High-Load Systems and Improving Customer Service Satisfaction",
    abstract: "High-load systems require monitoring to ensure user satisfaction and service level in real time. This article analyzes proactive and predictive monitoring capabilities, proposes anomaly detection procedures and factor ranking by consumer importance, as well as a mathematical model of system throughput with a test example.",
    category: "AI & Data",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-11"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "adeb63a5-6bf3-4ac0-a3c6-e67bc0821a33", // V.M. Alekseev
    title: "Diagnostic Capabilities of Hardware-Software Systems in Sports Medicine",
    abstract: "This article examines the diagnostic capabilities of hardware-software systems used in sports medicine for comprehensive athlete assessment, injury prevention, and performance optimization.",
    category: "Health & Biotech",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-11"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "77d5e0f4-9a80-4051-b2a3-0cb0871e8ec4", // Tamara F. Abramova
    title: "Finger Dermatoglyphics as Predictive Markers of Physical Abilities: Applications in Athlete Selection and Training",
    abstract: "This study investigates finger dermatoglyphic patterns as predictive markers of physical abilities and their applications in athlete selection and individualized training program development.",
    category: "Sports Science",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-11"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "0afa3d92-b954-4f68-9b04-d9706f27bf4f", // Ivan Timme
    title: "Laboratory Assessment of Aerobic and Anaerobic Performance in Elite Greco-Roman Wrestlers",
    abstract: "This research presents laboratory-based assessment methods for evaluating aerobic and anaerobic performance capabilities in elite Greco-Roman wrestlers, with implications for training optimization.",
    category: "Sports Science",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "75226a51-90b1-47a2-8253-eb30511ef462", // Roman Andreev
    title: "Genetic Markers for Talent Identification and Training Individualization in Elite Combat Sport and Endurance Athletes",
    abstract: "This study examines genetic markers associated with talent identification and training individualization in elite combat sport and endurance athletes, exploring the role of gene polymorphisms in athletic performance.",
    category: "Health & Biotech",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "9e2360e4-c21c-46d0-b3d0-f23c57706a71", // Alex Ver
    title: "Longitudinal Physiological Monitoring and Evidence-Based Training Periodization in Junior Cross-Country Skiers",
    abstract: "This longitudinal study examines physiological monitoring approaches and evidence-based training periodization strategies for junior cross-country skiers over multiple competitive seasons.",
    category: "Sports Science",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-02-10"),
  },
  {
    userId: "ebd7aabc-fa83-4d56-9fe8-558268259809", // Eugene Mishchenko
    title: "Leveraging Artificial Intelligence for Scalable Customer Success in Mobile Marketing Technology",
    abstract: "This article explores how artificial intelligence can be leveraged to scale customer success operations in mobile marketing technology, including predictive analytics, automated engagement, and personalization strategies.",
    category: "AI & Data",
    status: "published" as const,
    pipelineStatus: "published",
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-02-11"),
  },
];

async function seed() {
  console.log("Seeding 7 published articles...");
  for (const article of articles) {
    await db.insert(submissions).values(article);
    console.log(`  ✓ ${article.title.slice(0, 60)}...`);
  }
  console.log("Done! 7 articles seeded.");
}

seed().catch(console.error);
