import { NextResponse } from "next/server";
import { sendPeerReviewEmail } from "@/lib/email";

const VALID_YES_NO_NA = ["Yes", "No", "N/A", ""];
const VALID_RATINGS = ["Poor", "Below Average", "Average", "Good", "Excellent", ""];
const VALID_RECOMMENDATIONS = ["Accept", "Minor Revision", "Major Revision", "Reject"];
const MAX_TEXT = 10000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(val: unknown, maxLen = MAX_TEXT): string {
  return String(val || "").trim().slice(0, maxLen);
}

function validateEnum(val: string, allowed: string[]): string {
  return allowed.includes(val) ? val : "";
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const reviewerName = sanitize(body.reviewerName, 200);
    const reviewerEmail = sanitize(body.reviewerEmail, 200);
    const manuscriptId = sanitize(body.manuscriptId, 50);
    const recommendation = validateEnum(sanitize(body.recommendation, 50), VALID_RECOMMENDATIONS);

    if (!reviewerName || !reviewerEmail || !manuscriptId || !recommendation) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(reviewerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const s = (key: string, maxLen = MAX_TEXT) => sanitize(body[key], maxLen);
    const yesNo = (key: string) => validateEnum(sanitize(body[key], 10), VALID_YES_NO_NA);
    const rating = (key: string) => validateEnum(sanitize(body[key], 20), VALID_RATINGS);

    await sendPeerReviewEmail({
      reviewerName,
      reviewerEmail,
      manuscriptId,
      recommendation,
      // Section evaluations
      objectivesClear: yesNo("objectivesClear"),
      literatureAdequate: yesNo("literatureAdequate"),
      introComments: s("introComments"),
      methodsReproducible: yesNo("methodsReproducible"),
      statisticsAppropriate: yesNo("statisticsAppropriate"),
      methodsComments: s("methodsComments"),
      resultsPresentation: yesNo("resultsPresentation"),
      tablesAppropriate: yesNo("tablesAppropriate"),
      resultsComments: s("resultsComments"),
      conclusionsSupported: yesNo("conclusionsSupported"),
      limitationsStated: yesNo("limitationsStated"),
      discussionComments: s("discussionComments"),
      // Overall ratings
      originality: rating("originality"),
      methodology: rating("methodology"),
      clarity: rating("clarity"),
      significance: rating("significance"),
      languageEditing: yesNo("languageEditing"),
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
