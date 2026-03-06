import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Rate limiter: max 5 per IP per 10 min
const rateLimitMap = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const ts = (rateLimitMap.get(ip) || []).filter((t) => now - t < WINDOW);
  rateLimitMap.set(ip, ts);
  if (ts.length >= MAX) return true;
  ts.push(now);
  return false;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      const sub = existing[0];
      if (sub.status === "active") {
        return NextResponse.json({ ok: true, message: "You're already subscribed!" });
      }
      // Re-subscribe
      await db
        .update(newsletterSubscribers)
        .set({ status: "active", unsubscribedAt: null, subscribedAt: new Date() })
        .where(eq(newsletterSubscribers.email, email));
      return NextResponse.json({ ok: true, message: "Welcome back! You've been re-subscribed." });
    }

    await db.insert(newsletterSubscribers).values({ email });

    // Notify admin
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM;
      const notifyTo = process.env.SUBMISSIONS_INBOX;
      if (resendApiKey && resendFrom && notifyTo) {
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.status, "active"));
        const total = totalResult[0]?.count ?? "?";

        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFrom,
          to: notifyTo,
          subject: `New newsletter subscriber: ${email}`,
          html: `<p><strong>${email}</strong> just subscribed to the AIR newsletter.</p><p>Total active subscribers: <strong>${total}</strong></p>`,
        });
      }
    } catch (e) {
      console.error("Newsletter notify email failed:", e);
    }

    return NextResponse.json({ ok: true, message: "Thank you for subscribing!" });
  } catch (error) {
    console.error("Newsletter signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
