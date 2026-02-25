import { NextResponse } from "next/server";
import { sendReviewerApplicationEmail } from "@/lib/email";

// Simple in-memory rate limiter: max 3 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
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
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ ok: true });
    }
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const affiliation = String(body.affiliation || "").trim();
    const discipline = String(body.discipline || "").trim();
    const keywords = String(body.keywords || "").trim();

    if (!fullName || !email || !affiliation || !discipline || !keywords) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    await sendReviewerApplicationEmail({
      fullName,
      email,
      affiliation,
      discipline,
      keywords,
      degree: String(body.degree || "").trim(),
      orcid: String(body.orcid || "").trim(),
      publications: String(body.publications || "").trim(),
      reviewHistory: String(body.reviewHistory || "").trim(),
      manuscriptTypes: String(body.manuscriptTypes || "").trim(),
      conflicts: String(body.conflicts || "").trim(),
      ethics: body.ethics ? "yes" : "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reviewer application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
