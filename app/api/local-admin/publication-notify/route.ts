import { NextResponse } from "next/server";
import { sendPublicationNotification } from "@/lib/email";
import { isLocalAdminRequest } from "@/lib/local-admin";

export async function POST(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const authorName = String(body.authorName || "").trim();
    const authorEmail = String(body.authorEmail || "").trim();
    const articleTitle = String(body.articleTitle || "").trim();
    const articleSlug = String(body.articleSlug || "").trim();
    const pdfUrl = String(body.pdfUrl || "").trim() || undefined;

    if (!authorName || !authorEmail || !articleTitle || !articleSlug) {
      return NextResponse.json(
        { error: "Missing required fields: authorName, authorEmail, articleTitle, articleSlug" },
        { status: 400 }
      );
    }

    await sendPublicationNotification({
      authorName,
      authorEmail,
      articleTitle,
      articleSlug,
      pdfUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Publication notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
