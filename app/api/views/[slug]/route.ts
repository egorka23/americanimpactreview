import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq, sql, and, or, isNull } from "drizzle-orm";

const BOT_RE =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduck|slurp|ia_archiver|ahrefsbot|semrush|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|facebookexternal|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot|pingdom|uptimerobot/i;

function isBot(ua: string | null): boolean {
  if (!ua || ua.length < 10) return true;
  return BOT_RE.test(ua);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const rows = await db
    .select({ viewCount: publishedArticles.viewCount })
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
    return NextResponse.json({ views: 0 }, { status: 404 });
  }

  return NextResponse.json(
    { views: rows[0].viewCount ?? 0 },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const ua = req.headers.get("user-agent");

  if (isBot(ua)) {
    const rows = await db
      .select({ viewCount: publishedArticles.viewCount })
      .from(publishedArticles)
      .where(
        and(
          eq(publishedArticles.slug, params.slug),
          eq(publishedArticles.status, "published"),
          or(eq(publishedArticles.visibility, "public"), isNull(publishedArticles.visibility))
        )
      )
      .limit(1);

    return NextResponse.json({
      views: rows[0]?.viewCount ?? 0,
      counted: false,
    });
  }

  const result = await db
    .update(publishedArticles)
    .set({ viewCount: sql`COALESCE(${publishedArticles.viewCount}, 0) + 1` })
    .where(
      and(
        eq(publishedArticles.slug, params.slug),
        eq(publishedArticles.status, "published"),
        or(eq(publishedArticles.visibility, "public"), isNull(publishedArticles.visibility))
      )
    )
    .returning({ viewCount: publishedArticles.viewCount });

  if (!result.length) {
    return NextResponse.json({ views: 0, counted: false }, { status: 404 });
  }

  return NextResponse.json({ views: result[0].viewCount, counted: true });
}
