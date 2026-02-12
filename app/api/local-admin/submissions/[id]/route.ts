import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";

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
    const baseStatuses = ["submitted", "under_review", "accepted", "rejected", "revision_requested"] as const;
    if (baseStatuses.includes(status as (typeof baseStatuses)[number])) {
      updateValues.status = status as (typeof baseStatuses)[number];
    }

    await db.update(submissions).set(updateValues).where(eq(submissions.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
