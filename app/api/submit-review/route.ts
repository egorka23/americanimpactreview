import { NextResponse } from "next/server";
import { sendPeerReviewEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { reviewers, reviewAssignments, reviews, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { verifyAssignment } from "@/lib/review-tokens";

const VALID_YES_NO_NA = ["Yes", "No", "N/A", ""];
const VALID_RATINGS = ["Poor", "Below Average", "Average", "Good", "Excellent", ""];
const VALID_RECOMMENDATIONS = ["Accept", "Minor Revision", "Major Revision", "Reject"];
const MAX_TEXT = 10000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(val: unknown, maxLen = MAX_TEXT): string {
  return String(val || "").trim().slice(0, maxLen);
}

function validateEnum(val: string, allowed: string[]): string {
  return allowed.includes(val) ? val : "";
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const s = (key: string, maxLen = MAX_TEXT) => sanitize(body[key], maxLen);
    const yesNo = (key: string) => validateEnum(sanitize(body[key], 10), VALID_YES_NO_NA);
    const rating = (key: string) => validateEnum(sanitize(body[key], 20), VALID_RATINGS);
    const recommendation = validateEnum(sanitize(body.recommendation, 50), VALID_RECOMMENDATIONS);

    // ── Token is required ────────────────────────────────────────────────
    const tokenStr = typeof body.token === "string" ? body.token : "";
    if (!tokenStr) {
      return NextResponse.json({ error: "Review token is required." }, { status: 401 });
    }

    const assignmentIdFromToken = verifyAssignment(tokenStr);
    if (!assignmentIdFromToken) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    // Token flow — fetch reviewer + submission from assignment
    const [assignment] = await db
      .select({
        id: reviewAssignments.id,
        submissionId: reviewAssignments.submissionId,
        reviewerId: reviewAssignments.reviewerId,
      })
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentIdFromToken))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, assignment.reviewerId))
      .limit(1);

    const reviewerName = reviewer?.name || sanitize(body.reviewerName, 200);
    const reviewerEmail = reviewer?.email || sanitize(body.reviewerEmail, 200);
    const manuscriptId = assignment.submissionId;

    if (!reviewerName || !reviewerEmail || !manuscriptId || !recommendation) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(reviewerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    await sendPeerReviewEmail({
      reviewerName,
      reviewerEmail,
      manuscriptId,
      recommendation,
      objectivesClear: yesNo("objectivesClear"),
      literatureAdequate: yesNo("literatureAdequate"),
      introComments: s("introComments"),
      methodsReproducible: yesNo("methodsReproducible"),
      statisticsAppropriate: yesNo("statisticsAppropriate"),
      methodsComments: s("methodsComments"),
      resultsPresentation: yesNo("resultsPresentation"),
      tablesAppropriate: yesNo("tablesAppropriate"),
      resultsComments: s("resultsComments"),
      conclusionsSupported: yesNo("conclusionsSupported"),
      limitationsStated: yesNo("limitationsStated"),
      discussionComments: s("discussionComments"),
      originality: rating("originality"),
      methodology: rating("methodology"),
      clarity: rating("clarity"),
      significance: rating("significance"),
      languageEditing: yesNo("languageEditing"),
      majorIssues: s("majorIssues"),
      minorIssues: s("minorIssues"),
      commentsToAuthors: s("commentsToAuthors"),
      confidentialComments: s("confidentialComments"),
    });

    // ── Persist to database ──────────────────────────────────────────────
    try {
      await ensureLocalAdminSchema();

      const ratingMap: Record<string, number> = {
        Poor: 1, "Below Average": 2, Average: 3, Good: 4, Excellent: 5,
      };
      const ratingValues = [
        rating("originality"), rating("methodology"),
        rating("clarity"), rating("significance"),
      ].map((val) => ratingMap[val]).filter((val) => typeof val === "number");
      const avgScore = ratingValues.length > 0
        ? Math.round(ratingValues.reduce((sum, val) => sum + (val || 0), 0) / ratingValues.length)
        : null;

      const commentsToAuthor = [s("majorIssues"), s("minorIssues"), s("commentsToAuthors")]
        .filter(Boolean).join("\n\n");
      const commentsToEditor = [
        `Objectives clear: ${yesNo("objectivesClear") || "-"}`,
        `Literature adequate: ${yesNo("literatureAdequate") || "-"}`,
        `Methods reproducible: ${yesNo("methodsReproducible") || "-"}`,
        `Statistics appropriate: ${yesNo("statisticsAppropriate") || "-"}`,
        `Results presented clearly: ${yesNo("resultsPresentation") || "-"}`,
        `Tables/figures appropriate: ${yesNo("tablesAppropriate") || "-"}`,
        `Conclusions supported: ${yesNo("conclusionsSupported") || "-"}`,
        `Limitations stated: ${yesNo("limitationsStated") || "-"}`,
        `Language editing needed: ${yesNo("languageEditing") || "-"}`,
        rating("originality") ? `Originality: ${rating("originality")}` : "",
        rating("methodology") ? `Methodology: ${rating("methodology")}` : "",
        rating("clarity") ? `Clarity: ${rating("clarity")}` : "",
        rating("significance") ? `Significance: ${rating("significance")}` : "",
        s("introComments") ? `Intro comments: ${s("introComments")}` : "",
        s("methodsComments") ? `Methods comments: ${s("methodsComments")}` : "",
        s("resultsComments") ? `Results comments: ${s("resultsComments")}` : "",
        s("discussionComments") ? `Discussion comments: ${s("discussionComments")}` : "",
        s("confidentialComments") ? `Confidential comments: ${s("confidentialComments")}` : "",
      ].filter(Boolean).join("\n");

      // Update assignment status
      await db
        .update(reviewAssignments)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(reviewAssignments.id, assignmentIdFromToken));

      // Upsert: check for existing review on this assignment
      const [existingReview] = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.assignmentId, assignmentIdFromToken))
        .limit(1);

      let reviewId: string | undefined;
      if (existingReview) {
        await db
          .update(reviews)
          .set({
            recommendation,
            score: avgScore,
            commentsToAuthor: commentsToAuthor || null,
            commentsToEditor: commentsToEditor || null,
            submittedAt: new Date(),
          })
          .where(eq(reviews.id, existingReview.id));
        reviewId = existingReview.id;
      } else {
        const [created] = await db
          .insert(reviews)
          .values({
            assignmentId: assignmentIdFromToken,
            recommendation,
            score: avgScore,
            commentsToAuthor: commentsToAuthor || null,
            commentsToEditor: commentsToEditor || null,
            submittedAt: new Date(),
          })
          .returning();
        reviewId = created?.id;
      }

      // Check if all reviews are in for this submission
      const [assignmentForCheck] = await db
        .select({ submissionId: reviewAssignments.submissionId })
        .from(reviewAssignments)
        .where(eq(reviewAssignments.id, assignmentIdFromToken))
        .limit(1);
      if (assignmentForCheck) {
        const allAssignments = await db
          .select({ status: reviewAssignments.status })
          .from(reviewAssignments)
          .where(eq(reviewAssignments.submissionId, assignmentForCheck.submissionId));
        if (allAssignments.length > 0 && allAssignments.every((row) => row.status === "completed")) {
          await db
            .update(submissions)
            .set({ pipelineStatus: "reviews_completed", updatedAt: new Date() })
            .where(eq(submissions.id, assignmentForCheck.submissionId));
        }
      }

      await logLocalAdminEvent({
        action: "review.form.submitted",
        entityType: "review",
        entityId: reviewId,
        detail: JSON.stringify({ assignmentId: assignmentIdFromToken, tokenFlow: true }),
      });
    } catch (dbError) {
      console.error("Review persistence error:", dbError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
