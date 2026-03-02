import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Explore Articles — American Impact Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "8px",
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%)",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "48px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "3px",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            Research Library
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.15,
              marginBottom: "28px",
            }}
          >
            Explore Articles
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "26px",
              color: "#94a3b8",
              lineHeight: 1.5,
            }}
          >
            Browse peer-reviewed research across Computer Science, Health, AI, Sports Science, and more
          </div>
        </div>

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
