import { NextResponse } from "next/server";
import { sendReviewInvitation } from "@/lib/email";
import { isLocalAdminRequest } from "@/lib/local-admin";

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const reviewerName = String(body.reviewerName || "").trim();
    const reviewerEmail = String(body.reviewerEmail || "").trim();
    const articleTitle = String(body.articleTitle || "").trim();
    const articleId = String(body.articleId || "").trim();
    const abstract = String(body.abstract || "").trim();
    const deadline = String(body.deadline || "").trim();

    if (!reviewerName || !reviewerEmail || !articleTitle || !articleId || !abstract || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    await sendReviewInvitation({
      reviewerName,
      reviewerEmail,
      articleTitle,
      articleId,
      abstract,
      deadline,
      manuscriptUrl: String(body.manuscriptUrl || "").trim() || undefined,
      editorNote: String(body.editorNote || "").trim() || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Review invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
