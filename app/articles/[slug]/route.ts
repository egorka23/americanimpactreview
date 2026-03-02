import { NextRequest, NextResponse } from "next/server";
import { getPublishedArticleBySlug } from "@/lib/articles";

export const dynamic = "force-dynamic";

/**
 * Handles requests to /articles/e2026XXX.pdf
 * Redirects to the Vercel Blob Storage URL if available,
 * otherwise serves the static file from /public/articles/.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Strip .pdf extension to get the article slug
  const slug = params.slug.replace(/\.pdf$/i, "");

  try {
    const article = await getPublishedArticleBySlug(slug);
    const pdfUrl = (article as any).pdfUrl;

    if (pdfUrl) {
      return NextResponse.redirect(pdfUrl, 301);
    }
  } catch {
    // Article not found in DB — fall through
  }

  // No blob URL found — return 404
  return new NextResponse("PDF not found", { status: 404 });
}
