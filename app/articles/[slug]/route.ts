import { NextRequest, NextResponse } from "next/server";
import { getPublishedArticleBySlug } from "@/lib/articles";

export const dynamic = "force-dynamic";

/**
 * Handles requests to /articles/e2026XXX.pdf
 * Proxies the PDF from Vercel Blob Storage so Google Scholar
 * sees it served from the same domain as the article HTML.
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
      const upstream = await fetch(pdfUrl);
      if (!upstream.ok) {
        return new NextResponse("PDF not available", { status: 502 });
      }

      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${slug}.pdf"`,
          "Cache-Control": "public, max-age=86400, s-maxage=604800",
        },
      });
    }
  } catch {
    // Article not found in DB — fall through
  }

  // No blob URL found — return 404
  return new NextResponse("PDF not found", { status: 404 });
}
