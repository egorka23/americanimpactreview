import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewAssignments } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

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
    const updates: Record<string, unknown> = {};
    if (typeof body.status === "string") updates.status = body.status;
    if (body.dueAt) updates.dueAt = new Date(body.dueAt);
    if (body.completedAt) updates.completedAt = new Date(body.completedAt);
    if (typeof body.notes === "string") updates.notes = body.notes;

    await db.update(reviewAssignments).set(updates).where(eq(reviewAssignments.id, params.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin assignment update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
