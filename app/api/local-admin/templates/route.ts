import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplates } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const data = await db.select().from(emailTemplates).orderBy(emailTemplates.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin templates error:", error);
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
    const name = String(body.name || "").trim();
    const subject = String(body.subject || "").trim();
    const bodyHtml = String(body.bodyHtml || "").trim();
    const description = String(body.description || "").trim();

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json({ error: "Name, subject, and body are required." }, { status: 400 });
    }

    const [created] = await db
      .insert(emailTemplates)
      .values({
        name,
        subject,
        bodyHtml,
        description: description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logLocalAdminEvent({
      action: "template.created",
      entityType: "email_template",
      entityId: created?.id,
      detail: JSON.stringify({ name }),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Local admin template create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
