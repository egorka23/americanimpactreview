import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";
import { put } from "@vercel/blob";
import mammoth from "mammoth";
import { normalizeDocxHtml } from "@/lib/normalize-docx";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slug = params.slug;

    // Find the article
    const rows = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug));

    const article = rows[0];
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx files are accepted" }, { status: 400 });
    }

    // Upload new docx to Vercel Blob
    const blob = await put(
      `manuscripts/${slug}-${Date.now()}-${file.name}`,
      Buffer.from(await file.arrayBuffer()),
      {
        access: "public",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );

    // Convert docx to HTML via mammoth
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Heading 1'] => h2:fresh",
          "p[style-name='Heading 2'] => h3:fresh",
        ],
        includeDefaultStyleMap: true,
      }
    );

    const content = normalizeDocxHtml(result.value || "", { title: article.title });

    // Update the article in database
    await db
      .update(publishedArticles)
      .set({
        content,
        manuscriptUrl: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(publishedArticles.id, article.id));

    return NextResponse.json({
      success: true,
      slug,
      contentLength: content.length,
      manuscriptUrl: blob.url,
      mammothWarnings: result.messages?.length || 0,
    });
  } catch (error) {
    console.error("Reingest error:", error);
    return NextResponse.json(
      { error: "Reingest failed", detail: String(error) },
      { status: 500 }
    );
  }
}
