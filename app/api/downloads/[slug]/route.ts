import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq, sql, and, or, isNull } from "drizzle-orm";

async function ensureDownloadColumn() {
  try {
    await db.run(sql`ALTER TABLE published_articles ADD COLUMN download_count INTEGER DEFAULT 0`);
  } catch {
    // Column already exists
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  await ensureDownloadColumn();

  const rows = await db
    .select({ downloadCount: publishedArticles.downloadCount })
    .from(publishedArticles)
    .where(
      and(
        eq(publishedArticles.slug, params.slug),
        eq(publishedArticles.status, "published"),
        or(eq(publishedArticles.visibility, "public"), isNull(publishedArticles.visibility))
      )
    )
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ downloads: 0 }, { status: 404 });
  }

  return NextResponse.json(
    { downloads: rows[0].downloadCount ?? 0 },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  await ensureDownloadColumn();

  const result = await db
    .update(publishedArticles)
    .set({ downloadCount: sql`COALESCE(${publishedArticles.downloadCount}, 0) + 1` })
    .where(
      and(
        eq(publishedArticles.slug, params.slug),
        eq(publishedArticles.status, "published"),
        or(eq(publishedArticles.visibility, "public"), isNull(publishedArticles.visibility))
      )
    )
    .returning({ downloadCount: publishedArticles.downloadCount });

  if (!result.length) {
    return NextResponse.json({ downloads: 0, counted: false }, { status: 404 });
  }

  return NextResponse.json({ downloads: result[0].downloadCount, counted: true });
}
