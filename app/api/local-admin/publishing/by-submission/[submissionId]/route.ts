import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq, inArray } from "drizzle-orm";

/** Deduplicate: if multiple records exist for the same submissionId, delete all but the latest */
async function deduplicateBySubmission(submissionId: string) {
  const rows = await db
    .select({ id: publishedArticles.id, createdAt: publishedArticles.createdAt })
    .from(publishedArticles)
    .where(eq(publishedArticles.submissionId, submissionId));

  if (rows.length <= 1) return rows[0] || null;

  // Sort by createdAt descending, keep the latest
  rows.sort((a, b) => {
    const ta = a.createdAt ? a.createdAt.getTime() : 0;
    const tb = b.createdAt ? b.createdAt.getTime() : 0;
    return tb - ta;
  });

  const keep = rows[0];
  const removeIds = rows.slice(1).map((r) => r.id);

  if (removeIds.length > 0) {
    await db.delete(publishedArticles).where(inArray(publishedArticles.id, removeIds));
  }

  return keep;
}

/** GET — find published article by submissionId (auto-deduplicates) */
export async function GET(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    // Auto-deduplicate if needed
    const kept = await deduplicateBySubmission(params.submissionId);
    if (!kept) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return the full record
    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.id, kept.id));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Local admin publishing lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH — update published article status by submissionId (auto-deduplicates first) */
export async function PATCH(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    // Auto-deduplicate first
    await deduplicateBySubmission(params.submissionId);

    const body = await request.json();
    const status = String(body.status || "").trim();

    if (!["draft", "scheduled", "published"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Partial<typeof publishedArticles.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "published") {
      updates.publishedAt = new Date();
    }

    await db
      .update(publishedArticles)
      .set(updates)
      .where(eq(publishedArticles.submissionId, params.submissionId));

    await logLocalAdminEvent({
      action: status === "published" ? "publishing.republished" : "publishing.unpublished",
      entityType: "published_article",
      entityId: params.submissionId,
      detail: JSON.stringify({ status }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin publishing update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
