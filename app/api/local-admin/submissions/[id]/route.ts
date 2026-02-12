import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = [
      "submitted",
      "desk_check",
      "editor_assigned",
      "reviewer_invited",
      "under_review",
      "reviews_completed",
      "decision_pending",
      "revision_requested",
      "revised_submission_received",
      "accepted",
      "in_production",
      "scheduled",
      "published",
      "rejected",
      "withdrawn",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db
      .update(submissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(submissions.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
