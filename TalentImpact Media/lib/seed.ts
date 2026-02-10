import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createSlug } from "@/lib/slug";

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

const fakeArticles = [
  {
    title: "Narratives that scale: product storytelling for growth teams",
    content:
      "Product stories are the easiest way to align teams without adding meetings. Start with the user tension, explain the before/after state, and keep the narrative anchored in real metrics. Teams that write weekly story briefs move faster because decisions have context, not just data. The most effective stories are short, specific, and tied to one measurable outcome.",
    category: "Product Strategy",
    authorUsername: "maya-chen",
    authorId: "seed-author-1",
    imageSeed: "storytelling"
  },
  {
    title: "From insight to impact: a practical AI adoption playbook",
    content:
      "AI adoption stalls when teams start with tooling instead of outcomes. Define the top three workflows you want to accelerate, build a lightweight data audit, and ship a prototype within 30 days. The goal is not perfection—it is measurable momentum. Teams that iterate weekly see compounding gains.",
    category: "AI & Data",
    authorUsername: "jordan-park",
    authorId: "seed-author-2",
    imageSeed: "ai-playbook"
  },
  {
    title: "Design leadership in high-growth companies",
    content:
      "Design leaders in growth phases must balance quality and speed. Establish a shared design system, invest in cross-functional rituals, and make research more visible. The win is consistency without friction. Great leadership is about focus, not control.",
    category: "Design Leadership",
    authorUsername: "selena-rojas",
    authorId: "seed-author-3",
    imageSeed: "design-leadership"
  },
  {
    title: "Growth loops that compound over time",
    content:
      "Growth loops are the product of small, repeatable actions that stack. Identify the loop trigger, reduce the steps to completion, and measure the cycle time. The goal is not a single spike—it is sustained momentum. The best loops feel natural to users.",
    category: "Growth Marketing",
    authorUsername: "amir-king",
    authorId: "seed-author-4",
    imageSeed: "growth-loops"
  },
  {
    title: "Engineering for reliability without slowing delivery",
    content:
      "Reliability is a product feature. Create a small reliability backlog, establish clear SLOs, and prioritize the top failure modes. High-performing teams build guardrails, not gates. Keep postmortems lightweight and focused on systems.",
    category: "Engineering",
    authorUsername: "ravi-singh",
    authorId: "seed-author-5",
    imageSeed: "reliability"
  },
  {
    title: "Customer journey maps that actually drive decisions",
    content:
      "A good journey map is a decision tool, not a poster. Use real customer quotes, identify the highest friction stage, and define one action per stage. Tie each action to a metric and review it monthly. The map becomes a living product guide.",
    category: "Product Strategy",
    authorUsername: "maya-chen",
    authorId: "seed-author-1",
    imageSeed: "journey"
  },
  {
    title: "Data governance for fast-moving teams",
    content:
      "Governance should enable speed, not limit it. Define critical data sources, document owners, and automate quality checks. Lightweight governance prevents broken dashboards and rebuilds trust across the org.",
    category: "AI & Data",
    authorUsername: "jordan-park",
    authorId: "seed-author-2",
    imageSeed: "governance"
  },
  {
    title: "Scaling design ops with small teams",
    content:
      "Small design teams can scale by standardizing the boring parts. Build a component library, create critique rituals, and align with engineering on shared definitions. The biggest unlock is clarity, not headcount.",
    category: "Design Leadership",
    authorUsername: "selena-rojas",
    authorId: "seed-author-3",
    imageSeed: "design-ops"
  },
  {
    title: "Retention-first marketing strategies",
    content:
      "Retention is a growth multiplier. Start by measuring weekly engagement, design lifecycle campaigns that reward consistency, and simplify reactivation. The best programs feel like service, not spam.",
    category: "Growth Marketing",
    authorUsername: "amir-king",
    authorId: "seed-author-4",
    imageSeed: "retention"
  },
  {
    title: "Building engineering culture across time zones",
    content:
      "Distributed teams need explicit rituals. Use async design docs, rotate meeting times, and invest in shared values. Culture is built through repeated decisions, not slogans.",
    category: "Engineering",
    authorUsername: "ravi-singh",
    authorId: "seed-author-5",
    imageSeed: "culture"
  }
];

export async function seedFakeData() {
  const articlesRef = collection(db, "articles");
  const existing = await getDocs(query(articlesRef, limit(1)));
  if (!existing.empty) return { status: "skipped" };

  await Promise.all(
    fakeAuthors.map((author) =>
      setDoc(doc(db, "users", author.uid), {
        ...author,
        usernameLower: author.username.toLowerCase(),
        createdAt: serverTimestamp()
      })
    )
  );

  await Promise.all(
    fakeArticles.map((article, index) =>
      setDoc(doc(articlesRef), {
        title: article.title,
        content: article.content,
        slug: createSlug(article.title) + "-" + (index + 1),
        authorId: article.authorId,
        authorUsername: article.authorUsername,
        category: article.category,
        titleLower: article.title.toLowerCase(),
        authorUsernameLower: article.authorUsername.toLowerCase(),
        categoryLower: article.category.toLowerCase(),
        imageUrl: `https://picsum.photos/seed/${article.imageSeed}/1200/800`,
        createdAt: serverTimestamp()
      })
    )
  );

  return { status: "seeded" };
}
