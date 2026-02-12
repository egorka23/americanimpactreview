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

    const s = (key: string) => String(body[key] || "").trim();

    await sendPeerReviewEmail({
      reviewerName,
      reviewerEmail,
      manuscriptId,
      recommendation,
      // Section evaluations
      objectivesClear: s("objectivesClear"),
      literatureAdequate: s("literatureAdequate"),
      introComments: s("introComments"),
      methodsReproducible: s("methodsReproducible"),
      statisticsAppropriate: s("statisticsAppropriate"),
      methodsComments: s("methodsComments"),
      resultsPresentation: s("resultsPresentation"),
      tablesAppropriate: s("tablesAppropriate"),
      resultsComments: s("resultsComments"),
      conclusionsSupported: s("conclusionsSupported"),
      limitationsStated: s("limitationsStated"),
      discussionComments: s("discussionComments"),
      // Overall ratings
      originality: s("originality"),
      methodology: s("methodology"),
      clarity: s("clarity"),
      significance: s("significance"),
      languageEditing: s("languageEditing"),
      // Feedback
      majorIssues: s("majorIssues"),
      minorIssues: s("minorIssues"),
      commentsToAuthors: s("commentsToAuthors"),
      confidentialComments: s("confidentialComments"),
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
