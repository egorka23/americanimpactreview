import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

const STATUS_OPTIONS = ["draft", "scheduled", "published"];
const VISIBILITY_OPTIONS = ["public", "private"];

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const data = await db.select().from(publishedArticles).orderBy(publishedArticles.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin publishing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const body = await request.json();
    const title = String(body.title || "").trim();
    let slug = String(body.slug || "").trim();
    const status = String(body.status || "draft").trim();
    const visibility = String(body.visibility || "public").trim();

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required." }, { status: 400 });
    }
    if (!STATUS_OPTIONS.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    if (!VISIBILITY_OPTIONS.includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
    }

    // Prevent duplicate publish for the same submission
    const submissionId = String(body.submissionId || "").trim() || null;
    if (submissionId) {
      const dup = await db.select({ id: publishedArticles.id, status: publishedArticles.status })
        .from(publishedArticles)
        .where(eq(publishedArticles.submissionId, submissionId));
      if (dup.length > 0) {
        return NextResponse.json(
          { error: "This submission is already published. Use PATCH to update its status.", existingId: dup[0].id },
          { status: 409 }
        );
      }
    }

    // Ensure slug uniqueness
    const existing = await db.select({ id: publishedArticles.id }).from(publishedArticles).where(eq(publishedArticles.slug, slug));
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const publishedAt = status === "published" ? new Date() : null;

    const [created] = await db
      .insert(publishedArticles)
      .values({
        submissionId,
        title,
        slug,
        abstract: String(body.abstract || "").trim() || null,
        category: String(body.category || "").trim() || null,
        subject: String(body.subject || "").trim() || null,
        authors: String(body.authors || "").trim() || null,
        affiliations: String(body.affiliations || "").trim() || null,
        keywords: String(body.keywords || "").trim() || null,
        orcids: String(body.orcids || "").trim() || null,
        manuscriptUrl: String(body.manuscriptUrl || "").trim() || null,
        authorUsername: String(body.authorUsername || "").trim() || null,
        articleType: String(body.articleType || "").trim() || null,
        volume: String(body.volume || "").trim() || null,
        issue: String(body.issue || "").trim() || null,
        year: body.year ? Number(body.year) : null,
        doi: String(body.doi || "").trim() || null,
        status,
        visibility,
        scheduledAt,
        publishedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logLocalAdminEvent({
      action: "publishing.created",
      entityType: "published_article",
      entityId: created?.id,
      detail: JSON.stringify({ title, status }),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Local admin publishing create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
