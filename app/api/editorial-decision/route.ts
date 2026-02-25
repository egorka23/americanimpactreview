import { NextResponse } from "next/server";
import { sendEditorialDecision } from "@/lib/email";
import type { EditorialDecision } from "@/lib/email";
import { isLocalAdminRequest } from "@/lib/local-admin";

const VALID_DECISIONS: EditorialDecision[] = ["accept", "minor_revision", "major_revision", "reject"];

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const authorName = String(body.authorName || "").trim();
    const authorEmail = String(body.authorEmail || "").trim();
    const articleTitle = String(body.articleTitle || "").trim();
    const articleId = String(body.articleId || "").trim();
    const decision = String(body.decision || "").trim() as EditorialDecision;

    if (!authorName || !authorEmail || !articleTitle || !articleId || !VALID_DECISIONS.includes(decision)) {
      return NextResponse.json(
        { error: "Missing required fields or invalid decision." },
        { status: 400 }
      );
    }

    await sendEditorialDecision({
      authorName,
      authorEmail,
      articleTitle,
      articleId,
      decision,
      reviewerComments: String(body.reviewerComments || "").trim() || undefined,
      editorComments: String(body.editorComments || "").trim() || undefined,
      revisionDeadline: String(body.revisionDeadline || "").trim() || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Editorial decision error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
