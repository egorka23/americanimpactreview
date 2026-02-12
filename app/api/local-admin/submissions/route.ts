import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function isLocalHost(host: string) {
  const value = host.toLowerCase();
  return value.includes("localhost") || value.includes("127.0.0.1");
}

function isLocalAdmin(request: Request) {
  const host = request.headers.get("host") || "";
  if (process.env.NODE_ENV !== "development" || !isLocalHost(host)) {
    return false;
  }
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("air_admin=1");
}

export async function GET(request: Request) {
  try {
    if (!isLocalAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSubmissions = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        abstract: submissions.abstract,
        category: submissions.category,
        manuscriptUrl: submissions.manuscriptUrl,
        manuscriptName: submissions.manuscriptName,
        keywords: submissions.keywords,
        coverLetter: submissions.coverLetter,
        conflictOfInterest: submissions.conflictOfInterest,
        policyAgreed: submissions.policyAgreed,
        status: submissions.status,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        userId: submissions.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .orderBy(submissions.createdAt);

    return NextResponse.json(allSubmissions);
  } catch (error) {
    console.error("Local admin submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
