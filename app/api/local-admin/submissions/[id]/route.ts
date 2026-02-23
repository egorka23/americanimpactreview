import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users, publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

function toJsonArray(val: unknown): string | null {
  if (!val || typeof val !== "string") return null;
  // Already JSON array?
  try { const a = JSON.parse(val); if (Array.isArray(a)) return val; } catch { /* ignore */ }
  // Comma-separated
  const arr = val.split(",").map(s => s.trim()).filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

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
        receivedAt: submissions.receivedAt,
        acceptedAt: submissions.acceptedAt,
        articlePublishedAt: submissions.articlePublishedAt,
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

    const row = rows[0];

    // Enrich from published_articles if submission fields are empty
    try {
      const [pub] = await db
        .select({
          keywords: publishedArticles.keywords,
          category: publishedArticles.category,
          subject: publishedArticles.subject,
          articleType: publishedArticles.articleType,
          authors: publishedArticles.authors,
          affiliations: publishedArticles.affiliations,
          visibility: publishedArticles.visibility,
        })
        .from(publishedArticles)
        .where(eq(publishedArticles.submissionId, params.id))
        .limit(1);

      if (pub) {
        if (!row.keywords && pub.keywords) row.keywords = pub.keywords;
        if (!row.articleType && pub.articleType) row.articleType = pub.articleType;
        // Pull category + subject together from published article
        if (!row.subject && pub.subject) {
          row.subject = pub.subject;
          if (pub.category) row.category = pub.category;
        }
        if (!row.authorAffiliation && pub.affiliations) {
          try {
            const arr = JSON.parse(pub.affiliations);
            if (Array.isArray(arr) && arr.length) row.authorAffiliation = arr[0];
          } catch { /* ignore */ }
        }
        (row as any).publishedVisibility = pub.visibility || "public";
      }
    } catch { /* published_articles may not exist yet */ }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Local admin GET submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    const [row] = await db.select({ id: submissions.id }).from(submissions).where(eq(submissions.id, params.id)).limit(1);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(submissions).where(eq(submissions.id, params.id));

    await logLocalAdminEvent({
      action: "submission.deleted",
      entityType: "submission",
      entityId: params.id,
      detail: "Deleted from admin panel",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local admin DELETE submission error:", error);
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

      // Update author name in users table if provided
      if (typeof ef.authorName === "string") {
        const [sub] = await db.select({ userId: submissions.userId }).from(submissions).where(eq(submissions.id, params.id)).limit(1);
        if (sub?.userId) {
          await db.update(users).set({ name: ef.authorName.trim() }).where(eq(users.id, sub.userId));
        }
      }

      // Also update published_articles so changes appear on site immediately
      try {
        const pubUpdate: Record<string, unknown> = { updatedAt: new Date() };
        if (ef.title) pubUpdate.title = ef.title;
        if (ef.abstract) {
          pubUpdate.abstract = ef.abstract;
          pubUpdate.excerpt = String(ef.abstract).slice(0, 300);
        }
        if (ef.category) pubUpdate.category = ef.category;
        if (ef.subject !== undefined) pubUpdate.subject = ef.subject || null;
        if (ef.articleType !== undefined) pubUpdate.articleType = ef.articleType || null;
        if (ef.keywords !== undefined) pubUpdate.keywords = toJsonArray(ef.keywords as string);

        // Build authors & affiliations arrays from lead author + co-authors
        const authorName = typeof ef.authorName === "string" ? ef.authorName.trim() : null;
        const authorAffil = typeof ef.authorAffiliation === "string" ? ef.authorAffiliation.trim() : null;
        const coAuthorsRaw = typeof ef.coAuthors === "string" ? ef.coAuthors : null;

        if (authorName !== null || coAuthorsRaw !== null || authorAffil !== null) {
          // Get current values to merge
          const [currentSub] = await db.select({
            userName: users.name,
            authorAffiliation: submissions.authorAffiliation,
            authorOrcid: submissions.authorOrcid,
            coAuthors: submissions.coAuthors,
          }).from(submissions).leftJoin(users, eq(submissions.userId, users.id)).where(eq(submissions.id, params.id)).limit(1);

          const leadName = authorName ?? currentSub?.userName ?? "";
          const leadAffil = (authorAffil ?? currentSub?.authorAffiliation) || "";
          const leadOrcid = currentSub?.authorOrcid || "";
          const coRaw = coAuthorsRaw ?? currentSub?.coAuthors;

          const authorsList: string[] = [leadName];
          const affilList: string[] = [leadAffil];
          const orcidList: string[] = [leadOrcid];

          if (coRaw) {
            try {
              const coArr = JSON.parse(coRaw);
              if (Array.isArray(coArr)) {
                for (const co of coArr) {
                  if (co.name) authorsList.push(co.name);
                  if (co.affiliation) affilList.push(co.affiliation);
                  orcidList.push(co.orcid || "");
                }
              }
            } catch { /* ignore */ }
          }

          pubUpdate.authors = JSON.stringify(authorsList.filter(Boolean));
          pubUpdate.affiliations = JSON.stringify(affilList.filter(Boolean));
          pubUpdate.orcids = JSON.stringify(orcidList);
        }

        await db.update(publishedArticles).set(pubUpdate).where(eq(publishedArticles.submissionId, params.id));
      } catch (pubErr) {
        console.error("Failed to sync published_articles:", pubErr);
        // Don't fail the whole request — submission was already saved
      }

      await logLocalAdminEvent({
        action: "submission.content_edited",
        entityType: "submission",
        entityId: params.id,
        detail: JSON.stringify(Object.keys(ef)),
      });
      return NextResponse.json({ ok: true });
    }

    // Branch: update article dates
    if (body?.articleDates && typeof body.articleDates === "object") {
      const dates = body.articleDates as Record<string, string>;
      // Add T12:00:00 to avoid timezone shift (date-only strings parse as UTC midnight)
      const toNoonDate = (s: string) => new Date(s + "T12:00:00");
      const dateUpdate: Record<string, unknown> = { updatedAt: new Date() };
      if (dates.receivedAt) dateUpdate.receivedAt = toNoonDate(dates.receivedAt);
      if (dates.acceptedAt) dateUpdate.acceptedAt = toNoonDate(dates.acceptedAt);
      if (dates.articlePublishedAt) dateUpdate.articlePublishedAt = toNoonDate(dates.articlePublishedAt);
      await db.update(submissions).set(dateUpdate).where(eq(submissions.id, params.id));

      // Sync to published_articles if exists
      try {
        const pubDateUpdate: Record<string, unknown> = { updatedAt: new Date() };
        if (dates.receivedAt) pubDateUpdate.receivedAt = toNoonDate(dates.receivedAt);
        if (dates.acceptedAt) pubDateUpdate.acceptedAt = toNoonDate(dates.acceptedAt);
        if (dates.articlePublishedAt) pubDateUpdate.publishedAt = toNoonDate(dates.articlePublishedAt);
        await db.update(publishedArticles).set(pubDateUpdate).where(eq(publishedArticles.submissionId, params.id));
      } catch { /* published_articles may not exist yet */ }

      await logLocalAdminEvent({
        action: "submission.dates_updated",
        entityType: "submission",
        entityId: params.id,
        detail: JSON.stringify(dates),
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
