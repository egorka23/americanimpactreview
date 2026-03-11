/**
 * PDF generation endpoint for published articles.
 *
 * Routes to either LaTeX (Docker) or Puppeteer (headless Chrome) based on
 * the PDF_ENGINE environment variable:
 *   - PDF_ENGINE=latex  → LaTeX pipeline (new, requires Docker)
 *   - PDF_ENGINE=puppeteer | unset → Puppeteer pipeline (legacy, default)
 *
 * All other PDF generation (review manuscripts, review reports) is unaffected.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles, articleContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";
import { put } from "@vercel/blob";

export const maxDuration = 60;

function getPdfEngine(request: Request): "latex" | "puppeteer" {
  // Query param ?engine=latex|puppeteer overrides env var
  const url = new URL(request.url);
  const queryEngine = url.searchParams.get("engine");
  if (queryEngine === "latex" || queryEngine === "puppeteer") return queryEngine;
  const envEngine = (process.env.PDF_ENGINE || "puppeteer").toLowerCase().trim();
  return envEngine === "latex" ? "latex" : "puppeteer";
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = params.slug;

    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug));

    const r = rows[0];
    if (!r) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch content from separate table
    if (!r.content) {
      const cRows = await db.select({ content: articleContent.content }).from(articleContent).where(eq(articleContent.articleId, r.id));
      if (cRows[0]) (r as any).content = cRows[0].content;
    }

    const engine = getPdfEngine(request);
    let pdfBuffer: Buffer;
    let pageCount: number;

    if (engine === "latex") {
      const { generatePdfLatex } = await import("@/lib/pdf-gen/latex");

      try {
        const result = await generatePdfLatex(r);
        pdfBuffer = result.pdfBuffer;
        pageCount = result.pageCount;
      } catch (latexErr) {
        // If LaTeX fails and article has no manuscriptUrl, fall back to Puppeteer
        console.error("LaTeX PDF generation failed, falling back to Puppeteer:", latexErr);
        const { generatePdfPuppeteer } = await import("@/lib/pdf-gen/puppeteer");
        const result = await generatePdfPuppeteer(r);
        pdfBuffer = result.pdfBuffer;
        pageCount = result.pageCount;
      }
    } else {
      const { generatePdfPuppeteer } = await import("@/lib/pdf-gen/puppeteer");
      const result = await generatePdfPuppeteer(r);
      pdfBuffer = result.pdfBuffer;
      pageCount = result.pageCount;
    }

    // Upload to Vercel Blob
    const blob = await put(`articles/${slug}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Save the blob URL in published_articles
    await db
      .update(publishedArticles)
      .set({ pdfUrl: blob.url, updatedAt: new Date() })
      .where(eq(publishedArticles.id, r.id));

    return NextResponse.json({
      success: true,
      pdfUrl: blob.url,
      size: pdfBuffer.length,
      pageCount,
      title: r.title,
      slug,
      engine,
    });
  } catch (error) {
    console.error("PDF regeneration error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
