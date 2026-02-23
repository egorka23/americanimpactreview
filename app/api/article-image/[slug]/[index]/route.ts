import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Serve inline base64 images from article content as proper binary responses.
 * This allows articles with large embedded images (e.g. charts, figures) to
 * keep their HTML small — the page references `/api/article-image/<slug>/<n>`
 * instead of embedding 300-750KB base64 strings inline.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; index: string } },
) {
  const idx = parseInt(params.index, 10);
  if (isNaN(idx) || idx < 0) {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  const rows = await db
    .select({ content: publishedArticles.content })
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, params.slug))
    .limit(1);

  if (!rows.length || !rows[0].content) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Extract all data:image URIs from the content
  const dataUriRegex = /data:image\/([\w+.-]+);base64,([A-Za-z0-9+/=\s]+)/g;
  const matches: { mimeType: string; base64: string }[] = [];
  let match;
  while ((match = dataUriRegex.exec(rows[0].content)) !== null) {
    matches.push({
      mimeType: match[1].replace("+xml", "+xml"), // preserve svg+xml etc.
      base64: match[2].replace(/\s/g, ""),
    });
  }

  if (idx >= matches.length) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const { mimeType, base64 } = matches[idx];
  const buffer = Buffer.from(base64, "base64");
  const contentType = `image/${mimeType}`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
