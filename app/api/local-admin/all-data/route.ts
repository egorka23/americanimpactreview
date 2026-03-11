import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  submissions,
  users,
  publishedArticles,
  reviewAssignments,
  reviewers,
  reviews,
} from "@/lib/db/schema";
import { and, eq, ne, or, isNull, notInArray, desc, sql } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";

function parseJsonArray(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.join("; ");
  } catch {
    /* not JSON */
  }
  return raw;
}

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const t0 = Date.now();
    await ensureLocalAdminSchema();
    console.log(`[all-data] schema: ${Date.now() - t0}ms`);

    // Kick off Stripe in parallel
    const sk = process.env.STRIPE_SECRET_KEY;
    const stripePromise = sk
      ? fetch("https://api.stripe.com/v1/checkout/sessions?limit=100", {
          headers: { Authorization: `Bearer ${sk}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    // Run all DB queries in parallel
    const t1 = Date.now();
    const [allSubmissions, allAssignments, allReviews, allReviewers] =
      await Promise.all([
        db
          .select({
            id: submissions.id,
            title: submissions.title,
            abstract: submissions.abstract,
            category: submissions.category,
            subject: submissions.subject,
            articleType: submissions.articleType,
            coAuthors: submissions.coAuthors,
            authorAffiliation: submissions.authorAffiliation,
            manuscriptUrl: submissions.manuscriptUrl,
            manuscriptName: submissions.manuscriptName,
            keywords: submissions.keywords,
            coverLetter: submissions.coverLetter,
            conflictOfInterest: submissions.conflictOfInterest,
            policyAgreed: submissions.policyAgreed,
            status: submissions.status,
            pipelineStatus: submissions.pipelineStatus,
            handlingEditorId: submissions.handlingEditorId,
            receivedAt: submissions.receivedAt,
            acceptedAt: submissions.acceptedAt,
            articlePublishedAt: submissions.articlePublishedAt,
            createdAt: submissions.createdAt,
            updatedAt: submissions.updatedAt,
            userId: submissions.userId,
            userName: users.name,
            userEmail: users.email,
            publishedSlug: publishedArticles.slug,
            publishedVisibility: publishedArticles.visibility,
            paymentStatus: submissions.paymentStatus,
            paymentAmount: submissions.paymentAmount,
            paidAt: submissions.paidAt,
          })
          .from(submissions)
          .leftJoin(users, eq(submissions.userId, users.id))
          .leftJoin(
            publishedArticles,
            eq(submissions.id, publishedArticles.submissionId)
          )
          .where(
            or(
              isNull(submissions.pipelineStatus),
              ne(submissions.pipelineStatus, "archived")
            )
          )
          .orderBy(desc(submissions.createdAt)),

        db
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
          .leftJoin(
            reviewers,
            eq(reviewAssignments.reviewerId, reviewers.id)
          )
          .leftJoin(
            submissions,
            eq(reviewAssignments.submissionId, submissions.id)
          )
          .orderBy(reviewAssignments.invitedAt),

        db
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
          .leftJoin(
            reviewAssignments,
            eq(reviews.assignmentId, reviewAssignments.id)
          )
          .leftJoin(
            reviewers,
            eq(reviewAssignments.reviewerId, reviewers.id)
          )
          .leftJoin(
            submissions,
            eq(reviewAssignments.submissionId, submissions.id)
          )
          .orderBy(reviews.submittedAt),

        db.select().from(reviewers).orderBy(reviewers.createdAt),
      ]);
    console.log(`[all-data] queries: ${Date.now() - t1}ms`);

    // Orphan articles query
    const t2 = Date.now();
    const linkedSubmissionIds = allSubmissions
      .map((s) => s.id)
      .filter(Boolean);
    const linkedSubmissionIdSet = new Set(linkedSubmissionIds);
    const notArchived = ne(publishedArticles.status, "archived");
    const unlinkedCondition =
      linkedSubmissionIds.length > 0
        ? or(
            isNull(publishedArticles.submissionId),
            notInArray(
              publishedArticles.submissionId,
              linkedSubmissionIds
            )
          )
        : undefined;

    // Use raw SQL to avoid reading the huge `content` column
    // (drizzle select() still causes SQLite to scan full rows via Turso HTTP)
    const orphanResult = await db.all<{
      id: string;
      title: string;
      abstract: string | null;
      category: string | null;
      subject: string | null;
      article_type: string | null;
      authors: string | null;
      affiliations: string | null;
      keywords: string | null;
      slug: string;
      visibility: string | null;
      status: string;
      published_at: number | null;
      received_at: number | null;
      accepted_at: number | null;
      created_at: number | null;
      submission_id: string | null;
    }>(sql`
      SELECT id, title, abstract, category, subject, article_type,
             authors, affiliations, keywords, slug, visibility, status,
             published_at, received_at, accepted_at, created_at, submission_id
      FROM published_articles
      WHERE status != 'archived'
      ORDER BY published_at DESC
    `);
    const orphanArticles = orphanResult.map((r) => ({
      id: r.id,
      title: r.title,
      abstract: r.abstract,
      category: r.category,
      subject: r.subject,
      articleType: r.article_type,
      authors: r.authors,
      affiliations: r.affiliations,
      keywords: r.keywords,
      slug: r.slug,
      visibility: r.visibility,
      status: r.status,
      publishedAt: r.published_at ? new Date(r.published_at * 1000) : null,
      receivedAt: r.received_at ? new Date(r.received_at * 1000) : null,
      acceptedAt: r.accepted_at ? new Date(r.accepted_at * 1000) : null,
      createdAt: r.created_at ? new Date(r.created_at * 1000) : null,
      submissionId: r.submission_id,
    }));
    console.log(`[all-data] orphan: ${Date.now() - t2}ms`);

    const unlinkedArticles = orphanArticles.filter(
      (a) => !a.submissionId || !linkedSubmissionIdSet.has(a.submissionId)
    );

    // Stripe enrichment
    const stripePaymentMap = new Map<
      string,
      { status: string; amount: number; paidAt: number }
    >();
    const stripeData = await stripePromise;
    if (stripeData) {
      for (const s of stripeData.data || []) {
        const subId = s.metadata?.submissionId;
        if (subId && s.payment_status === "paid") {
          stripePaymentMap.set(subId, {
            status: "paid",
            amount: s.amount_total || 0,
            paidAt: s.created || 0,
          });
        } else if (subId && s.status === "open") {
          if (!stripePaymentMap.has(subId)) {
            stripePaymentMap.set(subId, {
              status: "pending",
              amount: s.amount_total || 0,
              paidAt: 0,
            });
          }
        }
      }
    }

    const articleAsSubmissions = unlinkedArticles.map((a) => {
      let firstAuthor: string | null = null;
      let coAuthors: string | null = null;
      if (a.authors) {
        try {
          const parsed = JSON.parse(a.authors);
          if (Array.isArray(parsed) && parsed.length > 0) {
            firstAuthor = parsed[0];
            if (parsed.length > 1) {
              coAuthors = JSON.stringify(parsed.slice(1));
            }
          } else {
            firstAuthor = a.authors;
          }
        } catch {
          firstAuthor = a.authors;
        }
      }
      const stripe = a.submissionId
        ? stripePaymentMap.get(a.submissionId)
        : undefined;
      return {
        id: a.id,
        title: a.title,
        abstract: a.abstract || "",
        category: a.category || "Research",
        subject: a.subject || null,
        articleType: a.articleType || null,
        coAuthors,
        authorAffiliation: parseJsonArray(a.affiliations),
        manuscriptUrl: null,
        manuscriptName: null,
        keywords: parseJsonArray(a.keywords),
        coverLetter: null,
        conflictOfInterest: null,
        policyAgreed: null,
        status: a.status === "published" ? "published" : a.status,
        pipelineStatus: null,
        handlingEditorId: null,
        receivedAt: a.receivedAt,
        acceptedAt: a.acceptedAt,
        articlePublishedAt: a.publishedAt,
        createdAt: a.createdAt,
        updatedAt: null,
        userId: "",
        userName: firstAuthor,
        userEmail: null,
        publishedSlug: a.slug,
        publishedVisibility: a.visibility,
        paymentStatus: stripe?.status || null,
        paymentAmount: stripe?.amount || null,
        paidAt: stripe?.paidAt
          ? new Date(stripe.paidAt * 1000).toISOString()
          : null,
      };
    });

    const total = Date.now() - t0;
    console.log(`[all-data] TOTAL: ${total}ms`);

    return NextResponse.json({
      submissions: [...allSubmissions, ...articleAsSubmissions],
      assignments: allAssignments,
      reviews: allReviews,
      reviewers: allReviewers,
    }, {
      headers: {
        "Server-Timing": `total;dur=${total}`,
      },
    });
  } catch (error) {
    console.error("Local admin all-data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
