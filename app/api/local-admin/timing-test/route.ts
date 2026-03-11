import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, reviewAssignments, reviewers, reviews } from "@/lib/db/schema";
import { eq, ne, or, isNull, desc, sql } from "drizzle-orm";
import { ensureLocalAdminSchema } from "@/lib/local-admin";

export async function GET() {
  const timings: Record<string, number> = {};
  const t0 = Date.now();

  try {
    const tSchema = Date.now();
    await ensureLocalAdminSchema();
    timings.schema = Date.now() - tSchema;

    const tSubs = Date.now();
    const subs = await db
      .select({ id: submissions.id, title: submissions.title })
      .from(submissions)
      .where(or(isNull(submissions.pipelineStatus), ne(submissions.pipelineStatus, "archived")))
      .orderBy(desc(submissions.createdAt));
    timings.submissions = Date.now() - tSubs;

    // Raw SQL — excludes the huge `content` column
    const tPubRaw = Date.now();
    const pubsRaw = await db.all<{ id: string; title: string }>(sql`
      SELECT id, title, slug, status, submission_id
      FROM published_articles
      WHERE status != 'archived'
      ORDER BY published_at DESC
    `);
    timings.publishedArticles_rawSQL = Date.now() - tPubRaw;

    const tAssign = Date.now();
    const assigns = await db
      .select({ id: reviewAssignments.id })
      .from(reviewAssignments)
      .leftJoin(reviewers, eq(reviewAssignments.reviewerId, reviewers.id))
      .leftJoin(submissions, eq(reviewAssignments.submissionId, submissions.id));
    timings.assignments = Date.now() - tAssign;

    const tRev = Date.now();
    const revs = await db
      .select({ id: reviews.id })
      .from(reviews)
      .leftJoin(reviewAssignments, eq(reviews.assignmentId, reviewAssignments.id))
      .leftJoin(reviewers, eq(reviewAssignments.reviewerId, reviewers.id))
      .leftJoin(submissions, eq(reviewAssignments.submissionId, submissions.id));
    timings.reviews = Date.now() - tRev;

    const tRevrs = Date.now();
    const rvrs = await db.select({ id: reviewers.id }).from(reviewers);
    timings.reviewers = Date.now() - tRevrs;

    timings.total = Date.now() - t0;

    return NextResponse.json({
      timings,
      counts: {
        submissions: subs.length,
        publishedArticles: pubsRaw.length,
        assignments: assigns.length,
        reviews: revs.length,
        reviewers: rvrs.length,
      },
    });
  } catch (error) {
    timings.total = Date.now() - t0;
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      timings,
    }, { status: 500 });
  }
}
