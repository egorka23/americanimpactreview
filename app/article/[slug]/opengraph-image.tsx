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

  // Adaptive title font size — must be readable even in small thumbnails
  const titleLen = article.title.length;
  const titleSize = titleLen > 120 ? 42 : titleLen > 80 ? 48 : titleLen > 50 ? 54 : 58;

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
          padding: "0",
        }}
      >
        {/* Thick accent bar at top */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "8px",
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%)",
            flexShrink: 0,
          }}
        />

        {/* Main content — vertically centered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "48px 64px",
          }}
        >
          {/* Title — BIG and bold */}
          <div
            style={{
              display: "flex",
              fontSize: `${titleSize}px`,
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.2,
              marginBottom: "32px",
            }}
          >
            {article.title}
          </div>

          {/* Authors — large enough to read */}
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#94a3b8",
              lineHeight: 1.4,
            }}
          >
            {authorsText}
          </div>
        </div>

        {/* Bottom bar — journal name, large and clear */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "24px 64px",
            borderTop: "2px solid rgba(99, 102, 241, 0.3)",
            background: "rgba(10, 22, 40, 0.6)",
            flexShrink: 0,
          }}
        >
          {/* Logo circle */}
          <div
            style={{
              display: "flex",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 800,
              color: "#fff",
              marginRight: "16px",
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontWeight: 700,
              color: "#e2e8f0",
              letterSpacing: "0.5px",
            }}
          >
            American Impact Review
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
