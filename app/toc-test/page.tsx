"use client";

export default function TocTest() {
  const sections = [
    "1. Introduction",
    "2. Critical Metrics",
    "3. Architecture of an Effective Monitoring System",
    "4. Proactive and Predictive Monitoring",
    "5. Anomaly Detection",
    "6. Evidence-Based Approach",
    "7. Matrix Assessment of SLA Capabilities",
    "8. Development Trends in HLS Monitoring",
    "9. Mathematical Model of System Throughput",
    "10. Conclusion",
  ];

  return (
    <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "repeat(5, 240px)", gap: "2rem", background: "#f0f0f0", minHeight: "100vh" }}>

      {/* Variant 1: Compact numbered pills */}
      <div className="plos-card" style={{ height: "fit-content" }}>
        <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700, marginBottom: "0.6rem" }}>Variant 1 - Numbered pills</h3>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {sections.map((s, i) => {
            const num = s.match(/^\d+/)?.[0] || "";
            const title = s.replace(/^\d+\.\s*/, "");
            return (
              <li key={i}>
                <a href="#" style={{
                  display: "flex", alignItems: "baseline", gap: "0.4rem",
                  fontSize: "0.72rem", color: "#475569", textDecoration: "none",
                  padding: "0.25rem 0", lineHeight: 1.3, fontWeight: 500
                }}>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8",
                    minWidth: "1.1rem", textAlign: "right", flexShrink: 0
                  }}>{num}</span>
                  <span>{title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Variant 2: Left-border accent */}
      <div className="plos-card" style={{ height: "fit-content" }}>
        <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700, marginBottom: "0.6rem" }}>Variant 2 - Left border</h3>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0" }}>
          {sections.map((s, i) => {
            const title = s.replace(/^\d+\.\s*/, "");
            return (
              <li key={i}>
                <a href="#" style={{
                  display: "block",
                  fontSize: "0.7rem", color: "#475569", textDecoration: "none",
                  padding: "0.35rem 0 0.35rem 0.65rem",
                  lineHeight: 1.3, fontWeight: 500,
                  borderLeft: "2px solid #e2e8f0",
                  transition: "border-color 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget.style.borderLeftColor = "#1B2A4A")}
                onMouseLeave={e => (e.currentTarget.style.borderLeftColor = "#e2e8f0")}
                >
                  {title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Variant 3: Dot timeline */}
      <div className="plos-card" style={{ height: "fit-content" }}>
        <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700, marginBottom: "0.6rem" }}>Variant 3 - Dot timeline</h3>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0" }}>
          {sections.map((s, i) => {
            const title = s.replace(/^\d+\.\s*/, "");
            return (
              <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  paddingTop: "0.45rem", flexShrink: 0
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#cbd5e1", flexShrink: 0
                  }} />
                  {i < sections.length - 1 && (
                    <div style={{ width: 1, flexGrow: 1, minHeight: "0.8rem", background: "#e2e8f0" }} />
                  )}
                </div>
                <a href="#" style={{
                  display: "block",
                  fontSize: "0.7rem", color: "#475569", textDecoration: "none",
                  padding: "0.3rem 0", lineHeight: 1.3, fontWeight: 500
                }}>
                  {title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Variant 4: Minimal with thin dividers */}
      <div className="plos-card" style={{ height: "fit-content" }}>
        <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700, marginBottom: "0.6rem" }}>Variant 4 - Minimal dividers</h3>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0" }}>
          {sections.map((s, i) => {
            const num = s.match(/^\d+/)?.[0] || "";
            const title = s.replace(/^\d+\.\s*/, "");
            return (
              <li key={i}>
                <a href="#" style={{
                  display: "flex", alignItems: "baseline", gap: "0.35rem",
                  fontSize: "0.68rem", color: "#475569", textDecoration: "none",
                  padding: "0.32rem 0", lineHeight: 1.25, fontWeight: 500,
                  borderBottom: i < sections.length - 1 ? "1px solid rgba(10,22,40,0.05)" : "none"
                }}>
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 700, color: "#1B2A4A",
                    opacity: 0.35, minWidth: "1rem", textAlign: "right", flexShrink: 0
                  }}>{num.padStart(2, "0")}</span>
                  <span>{title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Variant 5: Badge numbers */}
      <div className="plos-card" style={{ height: "fit-content" }}>
        <h3 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", fontWeight: 700, marginBottom: "0.6rem" }}>Variant 5 - Badge numbers</h3>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {sections.map((s, i) => {
            const num = s.match(/^\d+/)?.[0] || "";
            const title = s.replace(/^\d+\.\s*/, "");
            return (
              <li key={i}>
                <a href="#" style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  fontSize: "0.68rem", color: "#475569", textDecoration: "none",
                  padding: "0.2rem 0", lineHeight: 1.3, fontWeight: 500
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "1.3rem", height: "1.3rem", borderRadius: "50%",
                    background: "rgba(10,22,40,0.06)", color: "#1B2A4A",
                    fontSize: "0.55rem", fontWeight: 700, flexShrink: 0
                  }}>{num}</span>
                  <span>{title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

    </div>
  );
}
