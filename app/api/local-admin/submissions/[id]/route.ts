import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        abstract: submissions.abstract,
        category: submissions.category,
        subject: submissions.subject,
        articleType: submissions.articleType,
        keywords: submissions.keywords,
        manuscriptUrl: submissions.manuscriptUrl,
        manuscriptName: submissions.manuscriptName,
        coAuthors: submissions.coAuthors,
        authorAffiliation: submissions.authorAffiliation,
        authorOrcid: submissions.authorOrcid,
        coverLetter: submissions.coverLetter,
        conflictOfInterest: submissions.conflictOfInterest,
        fundingStatement: submissions.fundingStatement,
        ethicsApproval: submissions.ethicsApproval,
        dataAvailability: submissions.dataAvailability,
        aiDisclosure: submissions.aiDisclosure,
        status: submissions.status,
        pipelineStatus: submissions.pipelineStatus,
        createdAt: submissions.createdAt,
        userId: submissions.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.id, params.id))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Local admin GET submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const EDITABLE_FIELDS = [
  "title", "abstract", "category", "subject", "articleType", "keywords",
  "manuscriptUrl", "manuscriptName", "coAuthors", "authorAffiliation",
  "authorOrcid", "coverLetter", "conflictOfInterest", "fundingStatement",
  "ethicsApproval", "dataAvailability", "aiDisclosure",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    const body = await request.json();

    // Branch: content edit via editFields
    if (body?.editFields && typeof body.editFields === "object") {
      const ef = body.editFields as Record<string, unknown>;
      const updateValues: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of EDITABLE_FIELDS) {
        if (key in ef) {
          updateValues[key] = ef[key] ?? null;
        }
      }
      await db.update(submissions).set(updateValues).where(eq(submissions.id, params.id));
      await logLocalAdminEvent({
        action: "submission.content_edited",
        entityType: "submission",
        entityId: params.id,
        detail: JSON.stringify(Object.keys(ef)),
      });
      return NextResponse.json({ ok: true });
    }

    // Original status-update logic
    const status = String(body?.status || "").trim();
    const handlingEditorId = typeof body?.handlingEditorId === "string" ? body.handlingEditorId.trim() : null;
    const categoryUpdate = typeof body?.category === "string" ? body.category.trim() : null;
    const subjectUpdate = typeof body?.subject === "string" ? body.subject.trim() : null;
    const validStatuses = [
      "submitted",
      "desk_check",
      "editor_assigned",
      "reviewer_invited",
      "under_review",
      "reviews_completed",
      "decision_pending",
      "revision_requested",
      "revised_submission_received",
      "accepted",
      "in_production",
      "scheduled",
      "published",
      "rejected",
      "withdrawn",
    ] as const;

    if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateValues: Partial<typeof submissions.$inferInsert> & { updatedAt: Date } = {
      pipelineStatus: status,
      updatedAt: new Date(),
    };
    if (handlingEditorId !== null) {
      updateValues.handlingEditorId = handlingEditorId || null;
    }
    if (categoryUpdate !== null) {
      updateValues.category = categoryUpdate;
    }
    if (subjectUpdate !== null) {
      updateValues.subject = subjectUpdate || null;
    }
    const baseStatuses = ["submitted", "under_review", "accepted", "rejected", "revision_requested", "published"] as const;
    if (baseStatuses.includes(status as (typeof baseStatuses)[number])) {
      updateValues.status = status as (typeof baseStatuses)[number];
    }

    await db.update(submissions).set(updateValues).where(eq(submissions.id, params.id));

    await logLocalAdminEvent({
      action: "submission.updated",
      entityType: "submission",
      entityId: params.id,
      detail: JSON.stringify({ status, handlingEditorId }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
