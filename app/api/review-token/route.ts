import { NextResponse } from "next/server";
import { verifyAssignment } from "@/lib/review-tokens";
import { db } from "@/lib/db";
import { reviewAssignments, reviewers, reviews, submissions, publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    const assignmentId = verifyAssignment(token);
    if (!assignmentId) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const [assignment] = await db
      .select({
        id: reviewAssignments.id,
        submissionId: reviewAssignments.submissionId,
        reviewerId: reviewAssignments.reviewerId,
        status: reviewAssignments.status,
        dueAt: reviewAssignments.dueAt,
      })
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, assignment.reviewerId))
      .limit(1);

    const [submission] = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        articleType: submissions.articleType,
      })
      .from(submissions)
      .where(eq(submissions.id, assignment.submissionId))
      .limit(1);

    // Check if a review already exists for this assignment
    const existingReviews = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.assignmentId, assignmentId))
      .limit(1);

    // Try to find a published article slug for a cleaner manuscript ID
    let msId = submission?.id || "";
    if (submission?.id) {
      const [pub] = await db
        .select({ slug: publishedArticles.slug })
        .from(publishedArticles)
        .where(eq(publishedArticles.submissionId, submission.id))
        .limit(1);
      if (pub?.slug) {
        msId = pub.slug.toUpperCase();
      } else {
        msId = `AIR-${submission.id.slice(0, 8).toUpperCase()}`;
      }
    }

    return NextResponse.json({
      reviewerName: reviewer?.name || "",
      reviewerEmail: reviewer?.email || "",
      manuscriptId: msId,
      title: submission?.title || "",
      articleType: submission?.articleType || "",
      deadline: assignment.dueAt
        ? new Date(assignment.dueAt).toISOString().slice(0, 10)
        : "",
      alreadySubmitted: existingReviews.length > 0,
    });
  } catch (error) {
    console.error("Review token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
