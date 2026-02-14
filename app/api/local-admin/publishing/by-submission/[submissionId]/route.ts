import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

/** GET — find published article by submissionId */
export async function GET(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.submissionId, params.submissionId));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Local admin publishing lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH — update published article status by submissionId */
export async function PATCH(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

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

    const result = await db
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
