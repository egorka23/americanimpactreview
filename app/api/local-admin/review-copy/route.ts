import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, reviewAssignments, reviewers, users } from "@/lib/db/schema";
import { isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

// Map submission title prefixes to article slugs for markdown source
const ARTICLE_SLUG_MAP: Record<string, string> = {
  "Monitoring and Scalability of High-Load Systems": "e2026001",
  "Diagnostic Capabilities of Hardware-Software Systems": "e2026002",
  "Finger Dermatoglyphics as Predictive Markers": "e2026003",
  "Laboratory Assessment of Aerobic and Anaerobic": "e2026004",
  "Genetic Markers for Talent Identification": "e2026005",
  "Longitudinal Physiological Monitoring": "e2026006",
  "Leveraging Artificial Intelligence for Scalable": "e2026007",
};

function getSlug(title: string): string | null {
  for (const [prefix, slug] of Object.entries(ARTICLE_SLUG_MAP)) {
    if (title.startsWith(prefix)) return slug;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const assignmentId = String(body.assignmentId || "").trim();
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
    }

    // Get assignment + reviewer + submission
    const [assignment] = await db
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentId));
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, assignment.submissionId));
    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.id, assignment.reviewerId));

    if (!submission || !reviewer) {
      return NextResponse.json({ error: "Submission or reviewer not found" }, { status: 404 });
    }

    // Get author name from users table
    const [author] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, submission.userId));

    // Find markdown source
    const slug = getSlug(submission.title);
    if (!slug) {
      return NextResponse.json({ error: "No article source found for this submission" }, { status: 404 });
    }

    const projectRoot = process.cwd();
    const mdPath = path.join(projectRoot, "articles", `${slug}.md`);
    if (!fs.existsSync(mdPath)) {
      return NextResponse.json({ error: `Markdown not found: ${slug}.md` }, { status: 404 });
    }

    // Build manuscript ID
    const msId = `AIR-${slug.toUpperCase()}`;

    // Parse co-authors
    let allAuthors = author?.name || "Unknown";
    if (submission.coAuthors) {
      try {
        const coArr = JSON.parse(submission.coAuthors);
        if (Array.isArray(coArr) && coArr.length > 0) {
          allAuthors += ", " + coArr.map((c: { name: string }) => c.name).join(", ");
        }
      } catch { /* ignore */ }
    }

    // Output path
    const outDir = path.join(projectRoot, "public", "manuscripts");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, `${msId}-${assignmentId.slice(0, 8)}.pdf`);
    const publicUrl = `/manuscripts/${msId}-${assignmentId.slice(0, 8)}.pdf`;

    // Run generate-review-copy.ts
    const scriptPath = path.join(projectRoot, "scripts", "generate-review-copy.ts");
    const args = [
      scriptPath,
      "--manuscript", mdPath,
      "--id", msId,
      "--title", submission.title,
      "--authors", allAuthors,
      "--article-type", submission.articleType || "Original Research",
      "--keywords", submission.keywords || "",
      "--category", submission.category,
      "--abstract", submission.abstract || "",
      "--reviewer", reviewer.name,
      "--deadline", assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 10) : "",
      "--received", submission.createdAt ? new Date(submission.createdAt).toISOString().slice(0, 10) : "",
      "--output", outFile,
    ];

    await execFileAsync("npx", ["tsx", ...args], {
      cwd: projectRoot,
      timeout: 60000,
      env: { ...process.env, PATH: process.env.PATH },
    });

    await logLocalAdminEvent({
      action: "review_copy.generated",
      entityType: "review_assignment",
      entityId: assignmentId,
      detail: JSON.stringify({ url: publicUrl, reviewer: reviewer.name }),
    });

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Review copy generation error:", error);
    const msg = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
