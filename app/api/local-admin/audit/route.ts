import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const data = await db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(200);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
