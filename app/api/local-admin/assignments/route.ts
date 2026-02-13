import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewers, submissions, users } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { sendReviewInvitation } from "@/lib/email";
import { generateReviewCopyPdf } from "@/lib/generate-review-pdf";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();
    const data = await db
      .select({
        id: reviewAssignments.id,
        submissionId: reviewAssignments.submissionId,
        reviewerId: reviewAssignments.reviewerId,
        status: reviewAssignments.status,
        invitedAt: reviewAssignments.invitedAt,
        dueAt: reviewAssignments.dueAt,
        completedAt: reviewAssignments.completedAt,
        notes: reviewAssignments.notes,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        submissionTitle: submissions.title,
      })
      .from(reviewAssignments)
      .leftJoin(reviewers, eq(reviewAssignments.reviewerId, reviewers.id))
      .leftJoin(submissions, eq(reviewAssignments.submissionId, submissions.id))
      .orderBy(reviewAssignments.invitedAt);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();
    const body = await request.json();
    const submissionId = String(body.submissionId || "").trim();
    const reviewerId = String(body.reviewerId || "").trim();
    const dueAtRaw = String(body.dueAt || "").trim();
    if (!submissionId || !reviewerId) {
      return NextResponse.json({ error: "Submission and reviewer are required." }, { status: 400 });
    }

    const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
    const [assignment] = await db
      .insert(reviewAssignments)
      .values({
        submissionId,
        reviewerId,
        status: "invited",
        invitedAt: new Date(),
        dueAt: dueAt ? dueAt : null,
      })
      .returning();

    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    const [reviewer] = await db.select().from(reviewers).where(eq(reviewers.id, reviewerId));

    if (submission && reviewer) {
      // ── Generate review copy PDF ──────────────────────────────────────
      let reviewCopyUrl: string | undefined;
      try {
        reviewCopyUrl = await generateAndStoreReviewCopy(
          assignment.id,
          submission,
          reviewer,
          dueAt,
        );
      } catch (pdfError) {
        console.error("Review copy PDF generation failed (non-fatal):", pdfError);
      }

      // ── Send email with PDF link ──────────────────────────────────────
      try {
        await sendReviewInvitation({
          reviewerName: reviewer.name,
          reviewerEmail: reviewer.email,
          articleId: submission.id,
          articleTitle: submission.title,
          abstract: submission.abstract,
          deadline: dueAt ? dueAt.toISOString().slice(0, 10) : "",
          manuscriptUrl: reviewCopyUrl,
        });
      } catch (emailError) {
        console.error("Reviewer invite email failed:", emailError);
      }

      // ── Update pipeline status ────────────────────────────────────────
      const currentStage = submission.pipelineStatus;
      const earlierStages = [null, "submitted", "desk_check", "editor_assigned"];
      if (!currentStage || earlierStages.includes(currentStage)) {
        await db
          .update(submissions)
          .set({ pipelineStatus: "reviewer_invited", updatedAt: new Date() })
          .where(eq(submissions.id, submission.id));
      }
    }

    await logLocalAdminEvent({
      action: "assignment.created",
      entityType: "review_assignment",
      entityId: assignment?.id,
      detail: JSON.stringify({ submissionId, reviewerId }),
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Local admin assignment create error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Generate review copy and store it ───────────────────────────────────────

async function generateAndStoreReviewCopy(
  assignmentId: string,
  submission: {
    id: string;
    title: string;
    abstract: string;
    category: string;
    manuscriptUrl: string | null;
    keywords: string | null;
    articleType: string | null;
    coAuthors: string | null;
    userId: string;
    createdAt: Date | null;
  },
  reviewer: { name: string },
  dueAt: Date | null,
): Promise<string> {
  // Get author name
  const [author] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, submission.userId));

  let allAuthors = author?.name || "Unknown";
  if (submission.coAuthors) {
    try {
      const coArr = JSON.parse(submission.coAuthors);
      if (Array.isArray(coArr) && coArr.length > 0) {
        allAuthors += ", " + coArr.map((c: { name: string }) => c.name).join(", ");
      }
    } catch { /* ignore */ }
  }

  // Get manuscript content
  let docxBuffer: Buffer | undefined;
  let textContent: string | undefined;

  if (submission.manuscriptUrl) {
    const msUrl = submission.manuscriptUrl;
    if (msUrl.startsWith("http")) {
      const res = await fetch(msUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const isDocx = msUrl.endsWith(".docx") || msUrl.endsWith(".doc");
        if (isDocx) {
          docxBuffer = Buffer.from(arrayBuf);
        }
      }
    } else if (msUrl.startsWith("/")) {
      const localPath = path.join(process.cwd(), "public", msUrl);
      if (fs.existsSync(localPath) && (msUrl.endsWith(".docx") || msUrl.endsWith(".doc"))) {
        docxBuffer = fs.readFileSync(localPath);
      }
    }
  }

  // Fallback: markdown articles
  if (!docxBuffer && !textContent) {
    const slug = getSlugFromTitle(submission.title);
    if (slug) {
      const mdPath = path.join(process.cwd(), "articles", `${slug}.md`);
      if (fs.existsSync(mdPath)) {
        textContent = fs.readFileSync(mdPath, "utf-8");
      }
    }
  }

  if (!docxBuffer && !textContent) {
    textContent = submission.abstract || "(No manuscript content available)";
  }

  const slug = getSlugFromTitle(submission.title);
  const msId = slug ? `AIR-${slug.toUpperCase()}` : `AIR-${submission.id.slice(0, 8).toUpperCase()}`;

  const pdfBytes = await generateReviewCopyPdf({
    docxBuffer,
    textContent,
    manuscriptId: msId,
    title: submission.title,
    authors: allAuthors,
    articleType: submission.articleType || "Original Research",
    keywords: submission.keywords || "",
    category: submission.category,
    abstract: submission.abstract || "",
    reviewerName: reviewer.name,
    deadline: dueAt ? dueAt.toISOString().slice(0, 10) : "",
    receivedDate: submission.createdAt ? new Date(submission.createdAt).toISOString().slice(0, 10) : "",
  });

  const pdfFilename = `${msId}-${assignmentId.slice(0, 8)}.pdf`;

  // Store: Vercel Blob if available, otherwise local
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`review-copies/${pdfFilename}`, Buffer.from(pdfBytes), {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  // Local fallback
  const outDir = path.join(process.cwd(), "public", "manuscripts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, pdfFilename), Buffer.from(pdfBytes));
  return `https://americanimpactreview.com/manuscripts/${pdfFilename}`;
}

const ARTICLE_SLUG_MAP: Record<string, string> = {
  "Monitoring and Scalability of High-Load Systems": "e2026001",
  "Diagnostic Capabilities of Hardware-Software Systems": "e2026002",
  "Finger Dermatoglyphics as Predictive Markers": "e2026003",
  "Laboratory Assessment of Aerobic and Anaerobic": "e2026004",
  "Genetic Markers for Talent Identification": "e2026005",
  "Longitudinal Physiological Monitoring": "e2026006",
  "Leveraging Artificial Intelligence for Scalable": "e2026007",
};

function getSlugFromTitle(title: string): string | null {
  for (const [prefix, slug] of Object.entries(ARTICLE_SLUG_MAP)) {
    if (title.startsWith(prefix)) return slug;
  }
  return null;
}
