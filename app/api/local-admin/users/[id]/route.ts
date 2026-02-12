import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

const ROLE_OPTIONS = [
  "super_admin",
  "managing_editor",
  "section_editor",
  "editor",
  "reviewer",
  "author",
  "production",
];

const STATUS_OPTIONS = ["active", "suspended", "invited"];

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
    const updates: Partial<typeof users.$inferInsert> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.affiliation === "string") {
      updates.affiliation = body.affiliation.trim() || null;
    }
    if (typeof body.orcid === "string") {
      updates.orcid = body.orcid.trim() || null;
    }
    if (typeof body.role === "string") {
      const role = body.role.trim();
      if (!ROLE_OPTIONS.includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }
      updates.role = role;
    }
    if (typeof body.status === "string") {
      const status = body.status.trim();
      if (!STATUS_OPTIONS.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = status;
    }
    if (typeof body.password === "string" && body.password.trim()) {
      updates.password = await hash(body.password.trim(), 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
    }

    await db.update(users).set(updates).where(eq(users.id, params.id));

    await logLocalAdminEvent({
      action: "user.updated",
      entityType: "user",
      entityId: params.id,
      detail: JSON.stringify(Object.keys(updates)),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin user update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
