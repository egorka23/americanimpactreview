import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users, publishedArticles } from "@/lib/db/schema";
import { and, eq, ne, or, isNull, notInArray, desc, sql } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    // Fetch real submissions
    const allSubmissions = await db
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
      .leftJoin(publishedArticles, eq(submissions.id, publishedArticles.submissionId))
      .where(or(isNull(submissions.pipelineStatus), ne(submissions.pipelineStatus, "archived")))
      .orderBy(submissions.createdAt);

    // Also fetch published articles that have no linked submission
    const linkedSubmissionIds = allSubmissions
      .map((s) => s.id)
      .filter(Boolean);

    // Fetch published articles that are NOT already represented via a submission row
    const linkedSubmissionIdSet = new Set(linkedSubmissionIds);

    // Always exclude archived articles
    const notArchived = ne(publishedArticles.status, "archived");

    const unlinkedCondition =
      linkedSubmissionIds.length > 0
        ? or(
            isNull(publishedArticles.submissionId),
            notInArray(publishedArticles.submissionId, linkedSubmissionIds),
          )
        : undefined; // no submissions → all non-archived articles qualify

    const orphanArticles = await db
      .select({
        id: publishedArticles.id,
        title: publishedArticles.title,
        abstract: publishedArticles.abstract,
        category: publishedArticles.category,
        subject: publishedArticles.subject,
        articleType: publishedArticles.articleType,
        authors: publishedArticles.authors,
        affiliations: publishedArticles.affiliations,
        keywords: publishedArticles.keywords,
        slug: publishedArticles.slug,
        visibility: publishedArticles.visibility,
        status: publishedArticles.status,
        publishedAt: publishedArticles.publishedAt,
        receivedAt: publishedArticles.receivedAt,
        acceptedAt: publishedArticles.acceptedAt,
        createdAt: publishedArticles.createdAt,
        submissionId: publishedArticles.submissionId,
      })
      .from(publishedArticles)
      .where(unlinkedCondition ? and(notArchived, unlinkedCondition) : notArchived)
      .orderBy(desc(publishedArticles.publishedAt));

    // Double-check: filter out any that slipped through
    const unlinkedArticles = orphanArticles.filter(
      (a) => !a.submissionId || !linkedSubmissionIdSet.has(a.submissionId)
    );

    // Map published articles to submission-like format
    const articleAsSubmissions = unlinkedArticles.map((a) => ({
      id: a.id,
      title: a.title,
      abstract: a.abstract || "",
      category: a.category || "Research",
      subject: a.subject || null,
      articleType: a.articleType || null,
      coAuthors: null,
      authorAffiliation: a.affiliations || null,
      manuscriptUrl: null,
      manuscriptName: null,
      keywords: a.keywords || null,
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
      userName: a.authors || null,
      userEmail: null,
      publishedSlug: a.slug,
      publishedVisibility: a.visibility,
      paymentStatus: null,
      paymentAmount: null,
      paidAt: null,
    }));

    return NextResponse.json([...allSubmissions, ...articleAsSubmissions]);
  } catch (error) {
    console.error("Local admin submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
