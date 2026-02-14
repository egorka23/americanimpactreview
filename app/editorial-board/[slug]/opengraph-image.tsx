import { ImageResponse } from "next/og";
import { allMembers, slugify, findMemberBySlug } from "../data";

export const runtime = "edge";
export const alt = "Editorial Board Member";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allMembers.map((m) => ({ slug: slugify(m.name) }));
}

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const member = findMemberBySlug(params.slug);
  if (!member) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0a1628", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
        Not Found
      </div>,
      { ...size }
    );
  }

  // Use jpg version of photo (webp not supported in next/og)
  const photoSrc = member.photo
    ? `https://americanimpactreview.com${member.photo.replace(".webp", "-og.jpg")}`
    : null;

  const bio = member.bio.length > 160
    ? member.bio.slice(0, 157) + "..."
    : member.bio;

  const statsText = member.stats
    ?.map((s) => `${s.value} ${s.label}`)
    .join("  ·  ") || "";

  const initials = member.name
    .split(" ")
    .filter((p) => !p.includes(".") && !p.includes(","))
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0f1d35 100%)",
          padding: "48px 56px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left: photo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "280px",
            flexShrink: 0,
            marginRight: "48px",
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              width={220}
              height={220}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid rgba(99,102,241,0.5)",
                boxShadow: "0 0 40px rgba(99,102,241,0.3)",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "72px",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Right: info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            {member.role}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "44px",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.15,
              marginBottom: "8px",
            }}
          >
            {member.name}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#94a3b8",
              marginBottom: "20px",
            }}
          >
            {member.affiliation}
          </div>

          {statsText && (
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                color: "#a5b4fc",
                fontWeight: 600,
                marginBottom: "20px",
                letterSpacing: "0.5px",
              }}
            >
              {statsText}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: "17px",
              color: "#cbd5e1",
              lineHeight: 1.5,
            }}
          >
            {bio}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              paddingTop: "24px",
              fontSize: "16px",
              color: "#64748b",
              fontWeight: 600,
              letterSpacing: "1px",
            }}
          >
            AMERICAN IMPACT REVIEW
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
