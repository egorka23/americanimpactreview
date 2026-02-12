import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewers, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { sendReviewerInviteEmail } from "@/lib/email";

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
      try {
        await sendReviewerInviteEmail({
          reviewerName: reviewer.name,
          reviewerEmail: reviewer.email,
          submissionId: submission.id,
          title: submission.title,
          abstract: submission.abstract,
          category: submission.category,
          dueAt: dueAt ? dueAt.toDateString() : null,
        });
      } catch (emailError) {
        console.error("Reviewer invite email failed:", emailError);
      }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
