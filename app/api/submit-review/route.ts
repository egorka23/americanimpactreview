import { NextResponse } from "next/server";
import { sendPeerReviewEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviewerName = String(body.reviewerName || "").trim();
    const reviewerEmail = String(body.reviewerEmail || "").trim();
    const manuscriptId = String(body.manuscriptId || "").trim();
    const recommendation = String(body.recommendation || "").trim();

    if (!reviewerName || !reviewerEmail || !manuscriptId || !recommendation) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    await sendPeerReviewEmail({
      reviewerName,
      reviewerEmail,
      manuscriptId,
      recommendation,
      originality: String(body.originality || "").trim(),
      methodology: String(body.methodology || "").trim(),
      clarity: String(body.clarity || "").trim(),
      significance: String(body.significance || "").trim(),
      majorIssues: String(body.majorIssues || "").trim(),
      minorIssues: String(body.minorIssues || "").trim(),
      commentsToAuthors: String(body.commentsToAuthors || "").trim(),
      confidentialComments: String(body.confidentialComments || "").trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
