import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewers } from "@/lib/db/schema";
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
    const updates: Record<string, string> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.affiliation === "string") updates.affiliation = body.affiliation.trim();
    if (typeof body.expertise === "string") updates.expertise = body.expertise.trim();
    if (typeof body.status === "string") updates.status = body.status.trim();

    await db.update(reviewers).set(updates).where(eq(reviewers.id, params.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin reviewer update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
