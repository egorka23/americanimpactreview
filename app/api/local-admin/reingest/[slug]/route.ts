import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest } from "@/lib/local-admin";
import { put } from "@vercel/blob";
import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";

function stripHtmlAttributes(html: string): string {
  return html
    .replace(/\s(style|class|id|lang|width|height|border|cellpadding|cellspacing|align|valign|data-[^=]+)=(\"[^\"]*\"|'[^']*')/gi, "")
    .replace(/\saria-[^=]+=(\"[^\"]*\"|'[^']*')/gi, "")
    .replace(/\srole=(\"[^\"]*\"|'[^']*')/gi, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDocxHtml(html: string, opts?: { title?: string }): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  cleaned = stripHtmlAttributes(cleaned);
  cleaned = cleaned.replace(/<\/?span[^>]*>/gi, "");

  cleaned = cleaned.replace(/<p><strong>([^<]{2,120})<\/strong><\/p>/gi, (_match, heading) => {
    const text = String(heading || "").trim();
    if (!text) return "";
    const stripped = text.replace(/^\d+\.\s*/, "");
    if (/^(abstract|introduction|methods?|methodology|results?|discussion|conclusions?|acknowledg?ments?|references|bibliography|appendix|limitations?|future\s+work|background|literature\s+review|materials?\s+and\s+methods?)$/i.test(stripped)) {
      return `<h2>${text}</h2>`;
    }
    if (/^\d+\.\s+\S/.test(text) && text.length <= 100) {
      return `<h2>${text}</h2>`;
    }
    return `<p><strong>${text}</strong></p>`;
  });

  // Promote bold+italic subsection headings into h3 (MDPI: "2.1. Search Strategy")
  cleaned = cleaned.replace(/<p><strong><em>([^<]{2,120})<\/em><\/strong><\/p>/gi, (_match, heading) => {
    const text = String(heading || "").trim();
    if (!text) return "";
    if (/^\d+\.\d+\.?\s+\S/.test(text)) {
      return `<h3>${text}</h3>`;
    }
    return `<p><strong><em>${text}</em></strong></p>`;
  });

  cleaned = sanitizeHtml(cleaned, {
    allowedTags: [
      "h1", "h2", "h3",
      "p", "br",
      "ul", "ol", "li",
      "strong", "em", "b", "i",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption", "img",
      "blockquote", "code", "pre",
      "sup", "sub",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "data"],
    transformTags: {
      h1: "h2",
    },
  });

  if (opts?.title) {
    const t = escapeRegExp(opts.title.trim());
    if (t) {
      const titleRegex = new RegExp(`<h2[^>]*>\\s*${t}\\s*<\\/h2>`, "i");
      cleaned = cleaned.replace(titleRegex, "");
      const titleParaRegex = new RegExp(`<p[^>]*>\\s*(?:<strong>)?\\s*${t}\\s*(?:<\\/strong>)?\\s*<\\/p>`, "i");
      cleaned = cleaned.replace(titleParaRegex, "");
    }
  }

  const headingMatch = cleaned.match(/<(h2|h3)[^>]*>/i);
  const abstractMatch = cleaned.match(/<p[^>]*>\s*<strong>\s*abstract\s*<\/strong>\s*<\/p>/i);
  const anchor = headingMatch?.index ?? abstractMatch?.index;
  if (typeof anchor === "number" && anchor > 0) {
    cleaned = cleaned.slice(anchor);
  }

  cleaned = cleaned
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");

  return cleaned.trim();
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
