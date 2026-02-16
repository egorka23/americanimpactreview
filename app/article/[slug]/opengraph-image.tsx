import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/articles";
import { getAllPublishedArticles } from "@/lib/articles";

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

  const publishedDate = article.publishedAt ?? article.createdAt;
  const dateStr = publishedDate
    ? publishedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "2026";

  // Adaptive title font size based on length
  const titleLen = article.title.length;
  const titleSize = titleLen > 120 ? 32 : titleLen > 80 ? 36 : titleLen > 50 ? 40 : 44;

  const category = article.articleType || article.category || "Research Article";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #0a1628 0%, #162040 40%, #1a2744 70%, #0f1d35 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative accent line at top */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "5px",
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%)",
          }}
        />

        {/* Main content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "44px 56px 0",
          }}
        >
          {/* Top bar: category + date */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "15px",
                color: "#a5b4fc",
                textTransform: "uppercase",
                letterSpacing: "2.5px",
                fontWeight: 700,
                background: "rgba(99, 102, 241, 0.15)",
                padding: "6px 16px",
                borderRadius: "4px",
              }}
            >
              {category}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "15px",
                color: "#64748b",
                letterSpacing: "1px",
              }}
            >
              {dateStr}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              fontSize: `${titleSize}px`,
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.25,
              marginBottom: "24px",
              maxHeight: "220px",
              overflow: "hidden",
            }}
          >
            {article.title}
          </div>

          {/* Authors */}
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#94a3b8",
              lineHeight: 1.4,
              marginBottom: "16px",
            }}
          >
            {authorsText}
          </div>

          {/* Keywords (show first 3) */}
          {article.keywords && article.keywords.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {article.keywords.slice(0, 4).map((kw) => (
                <div
                  key={kw}
                  style={{
                    display: "flex",
                    fontSize: "13px",
                    color: "#818cf8",
                    border: "1px solid rgba(129, 140, 248, 0.3)",
                    padding: "3px 12px",
                    borderRadius: "12px",
                  }}
                >
                  {kw}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar: journal branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 56px",
            borderTop: "1px solid rgba(99, 102, 241, 0.2)",
            background: "rgba(10, 22, 40, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Simple logo circle */}
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
              }}
            >
              A
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  letterSpacing: "0.5px",
                }}
              >
                American Impact Review
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Peer-Reviewed · Open Access
              </div>
            </div>
          </div>

          {article.doi && (
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              {article.doi}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
