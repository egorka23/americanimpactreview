import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ebInvitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .update(ebInvitations)
      .set({ status: "archived" })
      .where(eq(ebInvitations.id, params.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("EB invitation DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const status = String(body.status || "").trim();

    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'accepted' or 'declined'." },
        { status: 400 }
      );
    }

    await db
      .update(ebInvitations)
      .set({ status, respondedAt: new Date() })
      .where(eq(ebInvitations.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("EB invitation PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
