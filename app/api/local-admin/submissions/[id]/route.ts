import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

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
    const status = String(body?.status || "").trim();
    const handlingEditorId = typeof body?.handlingEditorId === "string" ? body.handlingEditorId.trim() : null;
    const categoryUpdate = typeof body?.category === "string" ? body.category.trim() : null;
    const subjectUpdate = typeof body?.subject === "string" ? body.subject.trim() : null;
    const validStatuses = [
      "submitted",
      "desk_check",
      "editor_assigned",
      "reviewer_invited",
      "under_review",
      "reviews_completed",
      "decision_pending",
      "revision_requested",
      "revised_submission_received",
      "accepted",
      "in_production",
      "scheduled",
      "published",
      "rejected",
      "withdrawn",
    ] as const;

    if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateValues: Partial<typeof submissions.$inferInsert> & { updatedAt: Date } = {
      pipelineStatus: status,
      updatedAt: new Date(),
    };
    if (handlingEditorId !== null) {
      updateValues.handlingEditorId = handlingEditorId || null;
    }
    if (categoryUpdate !== null) {
      updateValues.category = categoryUpdate;
    }
    if (subjectUpdate !== null) {
      updateValues.subject = subjectUpdate || null;
    }
    const baseStatuses = ["submitted", "under_review", "accepted", "rejected", "revision_requested"] as const;
    if (baseStatuses.includes(status as (typeof baseStatuses)[number])) {
      updateValues.status = status as (typeof baseStatuses)[number];
    }

    await db.update(submissions).set(updateValues).where(eq(submissions.id, params.id));

    await logLocalAdminEvent({
      action: "submission.updated",
      entityType: "submission",
      entityId: params.id,
      detail: JSON.stringify({ status, handlingEditorId }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
