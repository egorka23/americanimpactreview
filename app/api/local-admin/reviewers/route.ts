import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewers } from "@/lib/db/schema";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();
    const data = await db.select().from(reviewers).orderBy(reviewers.createdAt);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin reviewers error:", error);
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
    const email = String(body.email || "").trim().toLowerCase();
    const affiliation = String(body.affiliation || "").trim();
    const expertise = String(body.expertise || "").trim();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    const [existing] = await db.select().from(reviewers).where(eq(reviewers.email, email));
    if (existing) {
      return NextResponse.json({ error: "Reviewer already exists." }, { status: 400 });
    }
    const [created] = await db
      .insert(reviewers)
      .values({ name, email, affiliation, expertise })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Local admin reviewer create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
