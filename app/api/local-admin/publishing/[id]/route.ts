import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles, submissions, reviewAssignments, reviews } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq, inArray } from "drizzle-orm";

const STATUS_OPTIONS = ["draft", "scheduled", "published", "archived"];
const VISIBILITY_OPTIONS = ["public", "private"];

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
    const updates: Partial<typeof publishedArticles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if (typeof body.slug === "string" && body.slug.trim()) updates.slug = body.slug.trim();
    if (typeof body.volume === "string") updates.volume = body.volume.trim() || null;
    if (typeof body.issue === "string") updates.issue = body.issue.trim() || null;
    if (body.year) updates.year = Number(body.year);
    if (typeof body.doi === "string") updates.doi = body.doi.trim() || null;
    if (typeof body.status === "string") {
      const status = body.status.trim();
      if (!STATUS_OPTIONS.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = status;
      if (status === "published") {
        updates.publishedAt = new Date();
      }
    }
    if (typeof body.visibility === "string") {
      const visibility = body.visibility.trim();
      if (!VISIBILITY_OPTIONS.includes(visibility)) {
        return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
      }
      updates.visibility = visibility;
    }
    if (body.scheduledAt) {
      updates.scheduledAt = new Date(body.scheduledAt);
    }
    if (typeof body.orcids === "string") updates.orcids = body.orcids;
    if (typeof body.authors === "string") updates.authors = body.authors;
    if (typeof body.affiliations === "string") updates.affiliations = body.affiliations;
    if (typeof body.keywords === "string") updates.keywords = body.keywords;

    await db.update(publishedArticles).set(updates).where(eq(publishedArticles.id, params.id));

    await logLocalAdminEvent({
      action: "publishing.updated",
      entityType: "published_article",
      entityId: params.id,
      detail: JSON.stringify(Object.keys(updates)),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin publishing update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    // Fetch the article to find linked submission
    const [article] = await db
      .select({ id: publishedArticles.id, submissionId: publishedArticles.submissionId, title: publishedArticles.title })
      .from(publishedArticles)
      .where(eq(publishedArticles.id, params.id));

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Archive the published article (soft delete)
    await db.update(publishedArticles)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(publishedArticles.id, params.id));

    // Archive linked submission and its review assignments
    if (article.submissionId) {
      await db.update(submissions)
        .set({ status: "rejected", pipelineStatus: "archived", updatedAt: new Date() })
        .where(eq(submissions.id, article.submissionId));

      // Get assignment IDs for cascading
      const assignments = await db.select({ id: reviewAssignments.id })
        .from(reviewAssignments)
        .where(eq(reviewAssignments.submissionId, article.submissionId));

      if (assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        // Delete reviews linked to those assignments
        await db.delete(reviews).where(inArray(reviews.assignmentId, assignmentIds));
        // Delete the assignments themselves
        await db.delete(reviewAssignments).where(eq(reviewAssignments.submissionId, article.submissionId));
      }
    }

    await logLocalAdminEvent({
      action: "publishing.archived",
      entityType: "published_article",
      entityId: params.id,
      detail: JSON.stringify({ title: article.title, submissionId: article.submissionId }),
    });

    return NextResponse.json({ ok: true, archived: true });
  } catch (error) {
    console.error("Local admin publishing archive error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
