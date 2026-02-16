import { NextResponse } from "next/server";
import { sendPeerReviewEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { reviewers, reviewAssignments, reviews, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, logLocalAdminEvent } from "@/lib/local-admin";
import { and, eq } from "drizzle-orm";
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

    // ── Token-based flow ─────────────────────────────────────────────────
    const tokenStr = typeof body.token === "string" ? body.token : "";
    const assignmentIdFromToken = tokenStr ? verifyAssignment(tokenStr) : null;

    if (tokenStr && !assignmentIdFromToken) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    // Determine reviewer info: from token (DB) or from form body
    let reviewerName: string;
    let reviewerEmail: string;
    let manuscriptId: string;

    if (assignmentIdFromToken) {
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

      reviewerName = reviewer?.name || sanitize(body.reviewerName, 200);
      reviewerEmail = reviewer?.email || sanitize(body.reviewerEmail, 200);
      manuscriptId = assignment.submissionId;
    } else {
      // Legacy flow — from form body
      reviewerName = sanitize(body.reviewerName, 200);
      reviewerEmail = sanitize(body.reviewerEmail, 200);
      manuscriptId = sanitize(body.manuscriptId, 50);
    }

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
        s("introComments") ? `Intro comments: ${s("introComments")}` : "",
        s("methodsComments") ? `Methods comments: ${s("methodsComments")}` : "",
        s("resultsComments") ? `Results comments: ${s("resultsComments")}` : "",
        s("discussionComments") ? `Discussion comments: ${s("discussionComments")}` : "",
        s("confidentialComments") ? `Confidential comments: ${s("confidentialComments")}` : "",
      ].filter(Boolean).join("\n");

      if (assignmentIdFromToken) {
        // ── Token path: use assignmentId directly, upsert review ──────
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
        const [assignment] = await db
          .select({ submissionId: reviewAssignments.submissionId })
          .from(reviewAssignments)
          .where(eq(reviewAssignments.id, assignmentIdFromToken))
          .limit(1);
        if (assignment) {
          const allAssignments = await db
            .select({ status: reviewAssignments.status })
            .from(reviewAssignments)
            .where(eq(reviewAssignments.submissionId, assignment.submissionId));
          if (allAssignments.length > 0 && allAssignments.every((row) => row.status === "completed")) {
            await db
              .update(submissions)
              .set({ pipelineStatus: "reviews_completed", updatedAt: new Date() })
              .where(eq(submissions.id, assignment.submissionId));
          }
        }

        await logLocalAdminEvent({
          action: "review.form.submitted",
          entityType: "review",
          entityId: reviewId,
          detail: JSON.stringify({ assignmentId: assignmentIdFromToken, tokenFlow: true }),
        });
      } else {
        // ── Legacy path: match by email + manuscriptId ────────────────
        const reviewerEmailLower = reviewerEmail.toLowerCase();
        let reviewer = await db
          .select()
          .from(reviewers)
          .where(eq(reviewers.email, reviewerEmailLower))
          .limit(1);
        if (reviewer.length === 0) {
          const [createdReviewer] = await db
            .insert(reviewers)
            .values({
              name: reviewerName,
              email: reviewerEmailLower,
              affiliation: null,
              expertise: null,
              status: "active",
              createdAt: new Date(),
            })
            .returning();
          reviewer = createdReviewer ? [createdReviewer] : [];
        }

        const [submission] = await db
          .select()
          .from(submissions)
          .where(eq(submissions.id, manuscriptId))
          .limit(1);

        if (submission && reviewer[0]) {
          const reviewerId = reviewer[0].id;
          let [assignment] = await db
            .select()
            .from(reviewAssignments)
            .where(and(eq(reviewAssignments.submissionId, submission.id), eq(reviewAssignments.reviewerId, reviewerId)))
            .limit(1);

          if (!assignment) {
            const [createdAssignment] = await db
              .insert(reviewAssignments)
              .values({
                submissionId: submission.id,
                reviewerId,
                status: "completed",
                invitedAt: new Date(),
                completedAt: new Date(),
              })
              .returning();
            assignment = createdAssignment;
          } else {
            await db
              .update(reviewAssignments)
              .set({ status: "completed", completedAt: new Date() })
              .where(eq(reviewAssignments.id, assignment.id));
          }

          const [createdReview] = await db
            .insert(reviews)
            .values({
              assignmentId: assignment.id,
              recommendation,
              score: avgScore,
              commentsToAuthor: commentsToAuthor || null,
              commentsToEditor: commentsToEditor || null,
              submittedAt: new Date(),
            })
            .returning();

          const allAssignments = await db
            .select({ status: reviewAssignments.status })
            .from(reviewAssignments)
            .where(eq(reviewAssignments.submissionId, submission.id));
          const allSubmitted = allAssignments.length > 0 && allAssignments.every((row) => row.status === "completed");
          if (allSubmitted) {
            await db
              .update(submissions)
              .set({ pipelineStatus: "reviews_completed", updatedAt: new Date() })
              .where(eq(submissions.id, submission.id));
          }

          await logLocalAdminEvent({
            action: "review.form.submitted",
            entityType: "review",
            entityId: createdReview?.id,
            detail: JSON.stringify({ submissionId: submission.id, reviewerEmail: reviewerEmailLower }),
          });
        } else {
          await logLocalAdminEvent({
            action: "review.form.unlinked",
            entityType: "review",
            entityId: manuscriptId,
            detail: JSON.stringify({ reviewerEmail: reviewerEmail.toLowerCase(), reason: "submission_not_found" }),
          });
        }
      }
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
