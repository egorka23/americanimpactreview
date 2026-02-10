import { NextResponse } from "next/server";
import { sendReviewerApplicationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
