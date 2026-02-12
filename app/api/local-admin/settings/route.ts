import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journalSettings } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const data = await db.select().from(journalSettings).orderBy(journalSettings.key);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin settings error:", error);
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
    const key = String(body.key || "").trim();
    const value = String(body.value || "").trim();

    if (!key) {
      return NextResponse.json({ error: "Key is required." }, { status: 400 });
    }

    const existing = await db.select().from(journalSettings).where(eq(journalSettings.key, key));
    if (existing.length > 0) {
      await db
        .update(journalSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(journalSettings.key, key));
    } else {
      await db
        .insert(journalSettings)
        .values({ key, value, updatedAt: new Date() });
    }

    await logLocalAdminEvent({
      action: "settings.updated",
      entityType: "journal_setting",
      entityId: key,
      detail: value,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
