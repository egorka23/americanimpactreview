import { NextResponse } from "next/server";
import { sendPeerReviewEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { reviewers, reviewAssignments, reviews, submissions } from "@/lib/db/schema";
import { ensureLocalAdminSchema, logLocalAdminEvent } from "@/lib/local-admin";
import { and, eq } from "drizzle-orm";

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
    const reviewerName = sanitize(body.reviewerName, 200);
    const reviewerEmail = sanitize(body.reviewerEmail, 200);
    const manuscriptId = sanitize(body.manuscriptId, 50);
    const recommendation = validateEnum(sanitize(body.recommendation, 50), VALID_RECOMMENDATIONS);

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

    const s = (key: string, maxLen = MAX_TEXT) => sanitize(body[key], maxLen);
    const yesNo = (key: string) => validateEnum(sanitize(body[key], 10), VALID_YES_NO_NA);
    const rating = (key: string) => validateEnum(sanitize(body[key], 20), VALID_RATINGS);

    await sendPeerReviewEmail({
      reviewerName,
      reviewerEmail,
      manuscriptId,
      recommendation,
      // Section evaluations
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
      // Overall ratings
      originality: rating("originality"),
      methodology: rating("methodology"),
      clarity: rating("clarity"),
      significance: rating("significance"),
      languageEditing: yesNo("languageEditing"),
      // Feedback
      majorIssues: s("majorIssues"),
      minorIssues: s("minorIssues"),
      commentsToAuthors: s("commentsToAuthors"),
      confidentialComments: s("confidentialComments"),
    });

    try {
      await ensureLocalAdminSchema();
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
              status: "submitted",
              invitedAt: new Date(),
              completedAt: new Date(),
            })
            .returning();
          assignment = createdAssignment;
        } else {
          await db
            .update(reviewAssignments)
            .set({ status: "submitted", completedAt: new Date() })
            .where(eq(reviewAssignments.id, assignment.id));
        }

        const ratingMap: Record<string, number> = {
          Poor: 1,
          "Below Average": 2,
          Average: 3,
          Good: 4,
          Excellent: 5,
        };
        const ratingValues = [
          rating("originality"),
          rating("methodology"),
          rating("clarity"),
          rating("significance"),
        ]
          .map((val) => ratingMap[val])
          .filter((val) => typeof val === "number");
        const avgScore =
          ratingValues.length > 0
            ? Math.round(ratingValues.reduce((sum, val) => sum + (val || 0), 0) / ratingValues.length)
            : null;

        const commentsToAuthorParts = [
          s("majorIssues"),
          s("minorIssues"),
          s("commentsToAuthors"),
        ].filter(Boolean);
        const commentsToAuthor = commentsToAuthorParts.join("\n\n");

        const commentsToEditorParts = [
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
        ].filter(Boolean);
        const commentsToEditor = commentsToEditorParts.join("\n");

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
        const allSubmitted = allAssignments.length > 0 && allAssignments.every((row) => row.status === "submitted");
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
          detail: JSON.stringify({ reviewerEmail: reviewerEmailLower, reason: "submission_not_found" }),
        });
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
