import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { sendEditorialDecision } from "@/lib/email";
import type { EditorialDecision } from "@/lib/email";

const VALID_DECISIONS: EditorialDecision[] = ["accept", "minor_revision", "major_revision", "reject"];

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const body = await request.json();
    const submissionId = String(body.submissionId || "").trim();
    const decision = String(body.decision || "").trim() as EditorialDecision;
    const reviewerComments = String(body.reviewerComments || "").trim();
    const editorComments = String(body.editorComments || "").trim();
    const revisionDeadline = String(body.revisionDeadline || "").trim();

    if (!submissionId || !VALID_DECISIONS.includes(decision)) {
      return NextResponse.json({ error: "Invalid decision payload." }, { status: 400 });
    }

    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    // Guard: don't allow reject/revision on published articles
    if (submission.status === "published" && (decision === "reject" || decision === "minor_revision" || decision === "major_revision")) {
      return NextResponse.json({ error: "Cannot reject or request revisions on a published article. Unpublish it first." }, { status: 400 });
    }

    const [author] = await db.select().from(users).where(eq(users.id, submission.userId));
    if (!author) {
      return NextResponse.json({ error: "Author not found." }, { status: 404 });
    }

    await sendEditorialDecision({
      authorName: author.name,
      authorEmail: author.email,
      articleTitle: submission.title,
      articleId: submission.id,
      decision,
      reviewerComments: reviewerComments || undefined,
      editorComments: editorComments || undefined,
      revisionDeadline: revisionDeadline || undefined,
    });

    let status: "submitted" | "under_review" | "accepted" | "rejected" | "revision_requested" = "submitted";
    if (decision === "accept") status = "accepted";
    if (decision === "reject") status = "rejected";
    if (decision === "minor_revision" || decision === "major_revision") status = "revision_requested";

    await db
      .update(submissions)
      .set({ status, pipelineStatus: status, updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    await logLocalAdminEvent({
      action: "decision.sent",
      entityType: "submission",
      entityId: submissionId,
      detail: JSON.stringify({ decision }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
