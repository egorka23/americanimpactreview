import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { randomUUID } from "crypto";

const ALLOWED_ARTICLE_TYPES = [
  "Original Research",
  "Review Article",
  "Theoretical Article",
  "Policy Analysis",
  "Case Study",
  "Short Communication",
  "Commentary / Opinion",
  "Meta-Analysis",
];

type IntakeSubmissionPayload = {
  title: string;
  abstract: string;
  category: string;
  subject?: string | null;
  articleType: string;
  keywords: string[];
  manuscriptUrl: string;
  manuscriptName?: string | null;
  primaryAuthor: {
    name: string;
    email?: string | null;
    affiliation?: string | null;
    orcid?: string | null;
  };
  coAuthors?: { name: string; email?: string | null; affiliation?: string | null; orcid?: string | null }[];
  declarations?: {
    ethicsApproval?: string | null;
    fundingStatement?: string | null;
    dataAvailability?: string | null;
    aiDisclosure?: string | null;
    conflictOfInterest?: string | null;
    coverLetter?: string | null;
  };
  policyAgreed?: boolean;
};

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    const body = await request.json();
    const intakeId = body.intakeId as string | undefined;
    const targetStatus = (body.targetStatus as string) || "submitted";
    const payload = body.payload as IntakeSubmissionPayload;

    if (!payload?.title || payload.title.trim().length < 10) {
      return NextResponse.json({ error: "Title is required (min 10 characters)" }, { status: 400 });
    }
    if (!payload.abstract || payload.abstract.trim().split(/\s+/).length < 150) {
      return NextResponse.json({ error: "Abstract must be at least 150 words" }, { status: 400 });
    }
    if (!payload.keywords || payload.keywords.length < 3) {
      return NextResponse.json({ error: "At least 3 keywords are required" }, { status: 400 });
    }
    if (!payload.manuscriptUrl) {
      return NextResponse.json({ error: "Manuscript file is required" }, { status: 400 });
    }
    if (!payload.articleType || !ALLOWED_ARTICLE_TYPES.includes(payload.articleType)) {
      return NextResponse.json({ error: "Invalid article type" }, { status: 400 });
    }
    if (!payload.primaryAuthor?.name?.trim()) {
      return NextResponse.json({ error: "Primary author name is required" }, { status: 400 });
    }
    if (!payload.primaryAuthor?.email?.trim() || !payload.primaryAuthor.email.includes("@")) {
      return NextResponse.json({ error: "Primary author email is required (valid email)" }, { status: 400 });
    }
    if (!payload.category?.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const authorName = payload.primaryAuthor.name.trim();
    const authorEmail = payload.primaryAuthor.email.trim();

    let authorId: string;
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, authorEmail));
    if (existing.length > 0) {
      authorId = existing[0].id;
      await db.update(users).set({
        name: authorName,
        affiliation: payload.primaryAuthor?.affiliation || null,
        orcid: payload.primaryAuthor?.orcid || null,
      }).where(eq(users.id, authorId));
    } else {
      const [created] = await db.insert(users).values({
        id: randomUUID(),
        email: authorEmail,
        password: randomUUID(),
        name: authorName,
        affiliation: payload.primaryAuthor?.affiliation || null,
        orcid: payload.primaryAuthor?.orcid || null,
        role: "author",
        status: "active",
        createdAt: new Date(),
      }).returning({ id: users.id });
      authorId = created.id;
    }

    const coAuthors = Array.isArray(payload.coAuthors) ? payload.coAuthors : [];
    const coAuthorsJson = coAuthors.length ? JSON.stringify(coAuthors) : null;

    const safeStatus = targetStatus === "under_review" ? "under_review" : "submitted";
    const pipelineStatus = targetStatus === "draft" ? "draft" : null;

    const [submission] = await db.insert(submissions).values({
      userId: authorId,
      title: payload.title.trim(),
      abstract: payload.abstract.trim(),
      category: payload.category,
      subject: payload.subject || null,
      articleType: payload.articleType,
      manuscriptUrl: payload.manuscriptUrl,
      manuscriptName: payload.manuscriptName || null,
      keywords: payload.keywords.join(", "),
      coverLetter: payload.declarations?.coverLetter || null,
      conflictOfInterest: payload.declarations?.conflictOfInterest || null,
      coAuthors: coAuthorsJson,
      authorAffiliation: payload.primaryAuthor?.affiliation || null,
      authorOrcid: payload.primaryAuthor?.orcid || null,
      fundingStatement: payload.declarations?.fundingStatement || null,
      ethicsApproval: payload.declarations?.ethicsApproval || null,
      dataAvailability: payload.declarations?.dataAvailability || null,
      aiDisclosure: payload.declarations?.aiDisclosure || null,
      policyAgreed: payload.policyAgreed ? 1 : 0,
      status: safeStatus,
      pipelineStatus,
      source: "admin_ai_intake",
      aiIntakeId: intakeId || null,
      aiAssisted: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: submissions.id });

    await logLocalAdminEvent({
      action: "ai_intake_created",
      entityType: "submission",
      entityId: submission.id,
      detail: intakeId ? `intake:${intakeId}` : "manual",
    });

    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch (error) {
    console.error("AI intake create submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
