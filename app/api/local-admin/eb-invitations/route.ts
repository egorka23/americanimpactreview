import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ebInvitations } from "@/lib/db/schema";
import { desc, ne } from "drizzle-orm";
import { sendEditorialBoardInvitation } from "@/lib/email";
import { isLocalAdminRequest } from "@/lib/local-admin";

export async function GET(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(ebInvitations)
      .where(ne(ebInvitations.status, "archived"))
      .orderBy(desc(ebInvitations.sentAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("EB invitations list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim();
    const title = String(body.title || "").trim();
    const affiliation = String(body.affiliation || "").trim();
    const expertiseArea = String(body.expertiseArea || "").trim();
    const achievements = String(body.achievements || "").trim();

    if (!fullName || !email || !title || !affiliation || !expertiseArea || !achievements) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Create DB record first to get the tracking ID
    const id = crypto.randomUUID();
    await db.insert(ebInvitations).values({
      id,
      fullName,
      email,
      title,
      affiliation,
      expertiseArea,
      achievements,
    });

    // Send email with tracking pixel
    await sendEditorialBoardInvitation({
      fullName,
      email,
      title,
      affiliation,
      expertiseArea,
      achievements,
      trackingId: id,
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("EB invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
