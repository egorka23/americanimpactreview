import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";

export const runtime = "nodejs";

type AiReviewPayload = {
  submissionId: string;
  depth?: number;
};

type AiReviewResult = {
  readiness: "ready" | "needs_revision" | "not_ready";
  confidence: "low" | "medium" | "high";
  summary: string;
  details?: string[];
};

function extractJson(text: string): AiReviewResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Partial<AiReviewPayload>;
    if (!body.submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }
    const depthRaw = typeof body.depth === "number" ? body.depth : Number(body.depth);
    const depth = Number.isFinite(depthRaw) ? Math.max(1, Math.min(3, depthRaw)) : 2;

    const [submission] = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        abstract: submissions.abstract,
        category: submissions.category,
        subject: submissions.subject,
        articleType: submissions.articleType,
        keywords: submissions.keywords,
        coverLetter: submissions.coverLetter,
        conflictOfInterest: submissions.conflictOfInterest,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(eq(submissions.id, body.submissionId));

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_REVIEW_MODEL || "gpt-4o-mini";
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set" },
        { status: 400 }
      );
    }

    const context = [
      `Title: ${submission.title}`,
      `Abstract: ${submission.abstract}`,
      `Category: ${submission.category}`,
      submission.subject ? `Subject: ${submission.subject}` : null,
      submission.articleType ? `Article type: ${submission.articleType}` : null,
      submission.keywords ? `Keywords: ${submission.keywords}` : null,
      submission.coverLetter ? `Cover letter: ${submission.coverLetter}` : null,
      submission.conflictOfInterest ? `Conflict of interest: ${submission.conflictOfInterest}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemBase = [
      "You are a senior journal reviewer.",
      "Return a concise readiness verdict for publication based only on the provided metadata.",
      "Use a human tone and do not be overly strict. If evidence is insufficient, say so.",
      "Return JSON ONLY with fields: readiness, confidence, summary, details.",
      "readiness must be one of: ready, needs_revision, not_ready.",
      "confidence must be one of: low, medium, high.",
      "summary must be 2-3 sentences, mention the key reason(s) for the verdict.",
      "details must be 3-5 short bullet-style strings explaining why the grade was given.",
    ];
    const systemDepth = depth >= 3
      ? [
          "Write in a more natural, human editorial voice.",
          "Slightly slower, more thoughtful reasoning is preferred.",
          "Avoid robotic or list-like phrasing.",
        ]
      : depth === 1
        ? [
            "Be very brief and direct.",
            "Avoid hedging or extra qualifiers.",
          ]
        : [
            "Be balanced and moderately detailed.",
          ];
    const system = [...systemBase, ...systemDepth].join(" ");

    const payload = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: context },
      ],
      temperature: depth >= 3 ? 0.6 : depth === 1 ? 0.2 : 0.35,
      max_tokens: depth >= 3 ? 320 : depth === 1 ? 160 : 220,
    };

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const json = await aiRes.json();
    const content = json?.choices?.[0]?.message?.content || "";
    const parsed = extractJson(content);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: content },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
