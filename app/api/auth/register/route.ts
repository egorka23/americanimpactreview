import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email, password, name, affiliation, orcid } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, emailLower))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        email: emailLower,
        password: hashedPassword,
        name: name.trim(),
        affiliation: affiliation?.trim() || null,
        orcid: orcid?.trim() || null,
      })
      .returning({ id: users.id });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
