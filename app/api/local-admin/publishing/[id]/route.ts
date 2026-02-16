import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

const STATUS_OPTIONS = ["draft", "scheduled", "published"];

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
    if (body.scheduledAt) {
      updates.scheduledAt = new Date(body.scheduledAt);
    }

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

    await db.delete(publishedArticles).where(eq(publishedArticles.id, params.id));

    await logLocalAdminEvent({
      action: "publishing.deleted",
      entityType: "published_article",
      entityId: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin publishing delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
