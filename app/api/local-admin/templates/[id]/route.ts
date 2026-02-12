import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
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
    const updates: Partial<typeof emailTemplates.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.subject === "string" && body.subject.trim()) updates.subject = body.subject.trim();
    if (typeof body.bodyHtml === "string" && body.bodyHtml.trim()) updates.bodyHtml = body.bodyHtml.trim();
    if (typeof body.description === "string") updates.description = body.description.trim() || null;

    await db.update(emailTemplates).set(updates).where(eq(emailTemplates.id, params.id));

    await logLocalAdminEvent({
      action: "template.updated",
      entityType: "email_template",
      entityId: params.id,
      detail: JSON.stringify(Object.keys(updates)),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin template update error:", error);
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

    await db.delete(emailTemplates).where(eq(emailTemplates.id, params.id));

    await logLocalAdminEvent({
      action: "template.deleted",
      entityType: "email_template",
      entityId: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin template delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
