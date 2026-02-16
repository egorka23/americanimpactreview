import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles, submissions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import mammoth from "mammoth";

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return raw.split(",").map((s: string) => s.trim()).filter(Boolean); }
}

/** Generate next slug in e2026XXX format */
async function nextSlug(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `e${year}`;

  const rows = await db
    .select({ slug: publishedArticles.slug })
    .from(publishedArticles)
    .where(sql`${publishedArticles.slug} LIKE ${prefix + "%"}`)
    .orderBy(desc(publishedArticles.slug))
    .limit(1);

  if (rows.length === 0) return `${prefix}001`;

  const lastSlug = rows[0].slug;
  const numPart = parseInt(lastSlug.replace(prefix, ""), 10);
  const next = String(numPart + 1).padStart(3, "0");
  return `${prefix}${next}`;
}

/** Extract HTML content from a docx file URL */
async function extractDocxContent(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch manuscript: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const result = await mammoth.convertToHtml({ buffer });
  return result.value || "";
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureLocalAdminSchema();

    const submissionId = params.id;

    // Check if already published
    const existing = await db
      .select({ id: publishedArticles.id })
      .from(publishedArticles)
      .where(eq(publishedArticles.submissionId, submissionId));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This submission is already published.", existingId: existing[0].id },
        { status: 409 }
      );
    }

    // Load submission
    const subs = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    const sub = subs[0];
    if (!sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Extract content from manuscript if available
    let content = "";
    if (sub.manuscriptUrl) {
      try {
        content = await extractDocxContent(sub.manuscriptUrl);
      } catch (e) {
        console.error("Failed to extract manuscript content:", e);
      }
    }

    // Build authors list
    const authorNames: string[] = [];
    const authorOrcids: string[] = [];
    const authorAffils: string[] = [];

    // Lead author from users table
    const users = await db
      .select({ name: sql<string>`name`, orcid: sql<string>`orcid`, affiliation: sql<string>`affiliation` })
      .from(sql`users`)
      .where(sql`id = ${sub.userId}`);

    const user = users[0];
    authorNames.push(user?.name || "Unknown Author");
    authorOrcids.push(sub.authorOrcid || user?.orcid || "");
    authorAffils.push(sub.authorAffiliation || user?.affiliation || "");

    // Co-authors
    if (sub.coAuthors) {
      try {
        const cas = JSON.parse(sub.coAuthors);
        if (Array.isArray(cas)) {
          for (const ca of cas) {
            if (ca.name) authorNames.push(ca.name);
            authorOrcids.push(ca.orcid || "");
            authorAffils.push(ca.affiliation || "");
          }
        }
      } catch {}
    }

    const slug = await nextSlug();

    const [created] = await db
      .insert(publishedArticles)
      .values({
        submissionId,
        title: sub.title,
        slug,
        abstract: sub.abstract || null,
        content: content || null,
        category: sub.category || null,
        subject: sub.subject || null,
        authors: JSON.stringify(authorNames),
        affiliations: JSON.stringify(authorAffils.filter(Boolean)),
        orcids: JSON.stringify(authorOrcids),
        keywords: sub.keywords || null,
        manuscriptUrl: sub.manuscriptUrl || null,
        authorUsername: user?.name || null,
        articleType: sub.articleType || null,
        year: new Date().getFullYear(),
        status: "published",
        publishedAt: new Date(),
        receivedAt: sub.createdAt || new Date(),
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update submission status
    await db
      .update(submissions)
      .set({ status: "published", pipelineStatus: "published", updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    await logLocalAdminEvent({
      action: "publishing.created",
      entityType: "published_article",
      entityId: created?.id,
      detail: JSON.stringify({ title: sub.title, slug, contentLength: content.length }),
    });

    return NextResponse.json({
      success: true,
      slug,
      id: created?.id,
      contentLength: content.length,
    });
  } catch (error) {
    console.error("Publish submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
