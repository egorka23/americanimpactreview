import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewers, reviews, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { sendReviewSubmissionEmail } from "@/lib/email";
import { logLocalAdminEvent } from "@/lib/local-admin";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();
    const data = await db
      .select({
        id: reviews.id,
        assignmentId: reviews.assignmentId,
        recommendation: reviews.recommendation,
        score: reviews.score,
        commentsToAuthor: reviews.commentsToAuthor,
        commentsToEditor: reviews.commentsToEditor,
        needsWork: reviews.needsWork,
        editorFeedback: reviews.editorFeedback,
        submittedAt: reviews.submittedAt,
        reviewerName: reviewers.name,
        reviewerEmail: reviewers.email,
        submissionTitle: submissions.title,
        submissionId: submissions.id,
      })
      .from(reviews)
      .leftJoin(reviewAssignments, eq(reviews.assignmentId, reviewAssignments.id))
      .leftJoin(reviewers, eq(reviewAssignments.reviewerId, reviewers.id))
      .leftJoin(submissions, eq(reviewAssignments.submissionId, submissions.id))
      .orderBy(reviews.submittedAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin reviews error:", error);
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
    const assignmentId = String(body.assignmentId || "").trim();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment is required." }, { status: 400 });
    }

    const recommendation = String(body.recommendation || "").trim();
    const commentsToAuthor = String(body.commentsToAuthor || "").trim();
    const commentsToEditor = String(body.commentsToEditor || "").trim();
    const score = body.score ? Number(body.score) : null;

    const [created] = await db
      .insert(reviews)
      .values({
        assignmentId,
        recommendation: recommendation || null,
        commentsToAuthor: commentsToAuthor || null,
        commentsToEditor: commentsToEditor || null,
        score: Number.isFinite(score) ? score : null,
        submittedAt: new Date(),
      })
      .returning();

    await db
      .update(reviewAssignments)
      .set({ status: "submitted", completedAt: new Date() })
      .where(eq(reviewAssignments.id, assignmentId));

    const [assignment] = await db
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentId));
    if (assignment) {
      const [reviewer] = await db.select().from(reviewers).where(eq(reviewers.id, assignment.reviewerId));
      const [submission] = await db.select().from(submissions).where(eq(submissions.id, assignment.submissionId));

      if (reviewer && submission) {
        try {
          await sendReviewSubmissionEmail({
            reviewerName: reviewer.name,
            reviewerEmail: reviewer.email,
            submissionTitle: submission.title,
            submissionId: submission.id,
            recommendation,
            score: Number.isFinite(score) ? score : null,
            commentsToAuthor: commentsToAuthor || null,
            commentsToEditor: commentsToEditor || null,
          });
        } catch (emailError) {
          console.error("Review submission email failed:", emailError);
        }

        const allAssignments = await db
          .select({ status: reviewAssignments.status })
          .from(reviewAssignments)
          .where(eq(reviewAssignments.submissionId, submission.id));
        const allSubmitted = allAssignments.length > 0 && allAssignments.every((row) => row.status === "submitted");
        if (allSubmitted) {
          await db
            .update(submissions)
            .set({ pipelineStatus: "reviews_completed", updatedAt: new Date() })
            .where(eq(submissions.id, submission.id));
        }
      }
    }

    await logLocalAdminEvent({
      action: "review.submitted",
      entityType: "review",
      entityId: created?.id,
      detail: JSON.stringify({ assignmentId }),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Local admin review create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
