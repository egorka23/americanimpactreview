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

export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        affiliation: users.affiliation,
        orcid: users.orcid,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Local admin users error:", error);
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
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "").trim();
    const affiliation = String(body.affiliation || "").trim();
    const orcid = String(body.orcid || "").trim();
    const role = String(body.role || "author").trim();
    const status = String(body.status || "active").trim();

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (!ROLE_OPTIONS.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (!STATUS_OPTIONS.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    const hashed = await hash(password, 12);
    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashed,
        affiliation: affiliation || null,
        orcid: orcid || null,
        role,
        status,
        createdAt: new Date(),
      })
      .returning();

    await logLocalAdminEvent({
      action: "user.created",
      entityType: "user",
      entityId: created?.id,
      detail: JSON.stringify({ email, role, status }),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Local admin user create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
