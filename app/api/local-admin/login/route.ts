import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { adminAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateAdminToken } from "@/lib/local-admin";

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // 1. Try DB admin accounts first
    let accountId: string | null = null;
    let displayName: string | null = null;
    try {
      const [dbAccount] = await db
        .select()
        .from(adminAccounts)
        .where(eq(adminAccounts.username, username))
        .limit(1);

      if (dbAccount) {
        const match = await compare(password, dbAccount.password);
        if (match) {
          accountId = dbAccount.id;
          displayName = dbAccount.displayName;
        } else {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
      }
    } catch {
      // Table might not exist yet, fall through to env check
    }

    // 2. Fallback: env-based credentials
    if (!accountId) {
      const expectedUser = process.env.ADMIN_USERNAME;
      const expectedPass = process.env.ADMIN_PASSWORD;

      if (!expectedUser || !expectedPass) {
        return NextResponse.json({ error: "Admin credentials not configured" }, { status: 500 });
      }

      if (!safeCompare(username, expectedUser) || !safeCompare(password, expectedPass)) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      displayName = "Admin";
    }

    const response = NextResponse.json({ ok: true, accountId, displayName });
    response.cookies.set("air_admin", generateAdminToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    if (accountId) {
      response.cookies.set("air_admin_id", accountId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
