import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { isLocalAdminRequest } from "@/lib/local-admin";

// GET — list all admin accounts (without passwords)
export async function GET(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db
      .select({
        id: adminAccounts.id,
        username: adminAccounts.username,
        displayName: adminAccounts.displayName,
        createdAt: adminAccounts.createdAt,
      })
      .from(adminAccounts)
      .orderBy(adminAccounts.createdAt);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Admin accounts list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create new admin account
export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();
    const displayName = String(body.displayName || "").trim() || null;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check if username already exists
    const existing = await db.select({ id: adminAccounts.id }).from(adminAccounts).where(eq(adminAccounts.username, username));
    if (existing.length > 0) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const [created] = await db
      .insert(adminAccounts)
      .values({ username, password: hashedPassword, displayName })
      .returning({ id: adminAccounts.id, username: adminAccounts.username });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Admin account create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — update own password (or displayName)
export async function PATCH(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body.id || "").trim();
    const newPassword = body.password ? String(body.password).trim() : null;
    const newDisplayName = body.displayName !== undefined ? String(body.displayName || "").trim() : null;
    const newUsername = body.username ? String(body.username).trim() : null;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      updates.password = await hash(newPassword, 12);
    }

    if (newDisplayName !== null) {
      updates.displayName = newDisplayName || null;
    }

    if (newUsername) {
      // Check uniqueness
      const existing = await db.select({ id: adminAccounts.id }).from(adminAccounts).where(eq(adminAccounts.username, newUsername));
      if (existing.length > 0 && existing[0].id !== id) {
        return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
      }
      updates.username = newUsername;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await db.update(adminAccounts).set(updates).where(eq(adminAccounts.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin account update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove admin account
export async function DELETE(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }

    await db.delete(adminAccounts).where(eq(adminAccounts.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin account delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
