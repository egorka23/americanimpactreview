import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments, reviewers, reviews, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { sendReviewFeedbackEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();
    const body = await request.json();
    const needsWork = Boolean(body.needsWork);
    const editorFeedback = String(body.editorFeedback || "").trim();

    await db
      .update(reviews)
      .set({ needsWork: needsWork ? 1 : 0, editorFeedback: editorFeedback || null })
      .where(eq(reviews.id, params.id));

    if (needsWork && editorFeedback) {
      const [reviewRow] = await db.select().from(reviews).where(eq(reviews.id, params.id));
      if (reviewRow) {
        const [assignment] = await db
          .select()
          .from(reviewAssignments)
          .where(eq(reviewAssignments.id, reviewRow.assignmentId));
        if (assignment) {
          const [reviewer] = await db
            .select()
            .from(reviewers)
            .where(eq(reviewers.id, assignment.reviewerId));
          const [submission] = await db
            .select()
            .from(submissions)
            .where(eq(submissions.id, assignment.submissionId));
          if (reviewer && submission) {
            try {
              await sendReviewFeedbackEmail({
                reviewerName: reviewer.name,
                reviewerEmail: reviewer.email,
                submissionTitle: submission.title,
                editorFeedback,
              });
            } catch (emailError) {
              console.error("Review feedback email failed:", emailError);
            }
          }
        }
      }
    }

    await logLocalAdminEvent({
      action: needsWork ? "review.flagged" : "review.cleared",
      entityType: "review",
      entityId: params.id,
      detail: editorFeedback ? editorFeedback : null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin review update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
