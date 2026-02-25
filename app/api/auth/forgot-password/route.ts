import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MSG = "If an account with that email exists, we've sent a password reset link.";

// Rate limiting: 3 requests per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ message: GENERIC_MSG }, { status: 429 });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
    }

    const emailLower = email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, emailLower))
      .limit(1);

    if (user) {
      // Invalidate all previous unused tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ usedAt: Date.now() })
        .where(eq(passwordResetTokens.userId, user.id));

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const resetUrl = `https://americanimpactreview.com/reset-password?token=${token}`;

      // Fire-and-forget to avoid timing attack
      sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetUrl,
      }).catch((err) => console.error("Failed to send reset email:", err));
    }

    // Always return the same response
    return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
  }
}
