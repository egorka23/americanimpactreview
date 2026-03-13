import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/articles";
import { getAllPublishedArticles } from "@/lib/articles";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const alt = "Article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const articles = await getAllPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getPublishedArticleBySlug(params.slug);

  if (!article) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "#0a1628",
            color: "#fff",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          Article Not Found
        </div>
      ),
      { ...size },
    );
  }

  const authors =
    article.authors && article.authors.length
      ? article.authors
      : [article.authorUsername];

  const authorsText =
    authors.length > 3
      ? authors.slice(0, 3).join(", ") + ` et al.`
      : authors.join(", ");

  // Adaptive title font size
  const titleLen = article.title.length;
  const titleSize = titleLen > 120 ? 32 : titleLen > 80 ? 36 : titleLen > 50 ? 40 : 44;

  // Try to read cover image
  let coverDataUri: string | null = null;
  try {
    const coverPath = path.join(process.cwd(), "public", "article-covers", "covers", `${params.slug}-cover.webp`);
    const pngPath = path.join(process.cwd(), "public", "article-covers", "covers", `${params.slug}-cover.png`);
    // Prefer PNG (better compatibility with ImageResponse), fall back to webp
    const filePath = fs.existsSync(pngPath) ? pngPath : fs.existsSync(coverPath) ? coverPath : null;
    if (filePath) {
      const buf = fs.readFileSync(filePath);
      const mime = filePath.endsWith(".png") ? "image/png" : "image/webp";
      coverDataUri = `data:${mime};base64,${buf.toString("base64")}`;
    }
  } catch {
    // ignore — will render without cover
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #0a1628 0%, #162040 40%, #1a2744 70%, #0f1d35 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "0",
        }}
      >
        {/* Left: cover image — show full cover with padding */}
        {coverDataUri && (
          <div
            style={{
              display: "flex",
              width: "330px",
              height: "100%",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <img
              src={coverDataUri}
              width={290}
              height={400}
              style={{
                objectFit: "contain",
                borderRadius: "6px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        )}

        {/* Right: text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "0",
          }}
        >
          {/* Accent bar */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "6px",
              background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%)",
              flexShrink: 0,
            }}
          />

          {/* Title + authors */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
              padding: "40px 48px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: `${titleSize}px`,
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.25,
                marginBottom: "24px",
              }}
            >
              {article.title}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "22px",
                color: "#94a3b8",
                lineHeight: 1.4,
              }}
            >
              {authorsText}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "18px 48px",
              borderTop: "2px solid rgba(99, 102, 241, 0.3)",
              background: "rgba(10, 22, 40, 0.6)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 800,
                color: "#fff",
                marginRight: "12px",
                flexShrink: 0,
              }}
            >
              A
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "20px",
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "0.5px",
              }}
            >
              American Impact Review
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
