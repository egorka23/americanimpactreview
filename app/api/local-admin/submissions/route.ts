import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users, publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

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
      .orderBy(submissions.createdAt);

    return NextResponse.json(allSubmissions);
  } catch (error) {
    console.error("Local admin submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
