import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!adminEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();
    const validStatuses = [
      "submitted",
      "under_review",
      "accepted",
      "rejected",
      "revision_requested",
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
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
