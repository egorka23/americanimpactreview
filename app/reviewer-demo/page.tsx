"use client";
import { useState } from "react";

const reviewers = [
  { name: "Egor Akimov", status: "invited", due: "February 25, 2026", invited: "February 12, 2026" },
  { name: "Serafim Akimov", status: "invited", due: "February 13, 2026", invited: "February 12, 2026" },
  { name: "Piter Hi", status: "submitted", due: "February 25, 2026", invited: "February 12, 2026" },
  { name: "egor 2", status: "invited", due: "February 26, 2026", invited: "February 12, 2026" },
];

const statusStyle = (s: string) =>
  s === "submitted"
    ? { bg: "#ecfdf5", color: "#15803d", border: "#bbf7d0" }
    : s === "declined"
    ? { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" }
    : { bg: "#fffbeb", color: "#a16207", border: "#fde68a" };

function Badge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* ── VARIANT A: Tab/Pill toggle ── */
function VariantA() {
  const [tab, setTab] = useState<"info" | "reviewers">("info");
  return (
    <div>
      {/* Pill toggle */}
      <div style={{ display: "flex", gap: 0, background: "#f3f4f6", borderRadius: 8, padding: 3, marginBottom: 16 }}>
        <button
          onClick={() => setTab("info")}
          style={{
            flex: 1, padding: "7px 0", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600,
            background: tab === "info" ? "#fff" : "transparent",
            color: tab === "info" ? "#111827" : "#9ca3af",
            boxShadow: tab === "info" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            border: "none", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          Info
        </button>
        <button
          onClick={() => setTab("reviewers")}
          style={{
            flex: 1, padding: "7px 0", borderRadius: 6, fontSize: "0.8rem", fontWeight: 600,
            background: tab === "reviewers" ? "#fff" : "transparent",
            color: tab === "reviewers" ? "#111827" : "#9ca3af",
            boxShadow: tab === "reviewers" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            border: "none", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          Reviewers ({reviewers.length})
        </button>
      </div>

      {tab === "info" ? (
        <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.8 }}>
          <p><span style={{ color: "#9ca3af" }}>Author:</span> Jo Po</p>
          <p><span style={{ color: "#9ca3af" }}>Email:</span> dalas310516@gmail.com</p>
          <p><span style={{ color: "#9ca3af" }}>Category:</span> AI & Data</p>
          <p><span style={{ color: "#9ca3af" }}>Submitted:</span> February 10, 2026</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reviewers.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, background: "#fff",
              border: "1px solid #e5e7eb", transition: "box-shadow 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <UserIcon />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.875rem" }}>{r.name}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 1 }}>Due {r.due}</div>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── VARIANT B: Slide-over drawer ── */
function VariantB() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: 260 }}>
      {/* Info content */}
      <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.8 }}>
        <p><span style={{ color: "#9ca3af" }}>Author:</span> Jo Po</p>
        <p><span style={{ color: "#9ca3af" }}>Email:</span> dalas310516@gmail.com</p>
        <p><span style={{ color: "#9ca3af" }}>Category:</span> AI & Data</p>
        <p><span style={{ color: "#9ca3af" }}>Submitted:</span> February 10, 2026</p>
      </div>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "12px 16px", marginTop: 16, borderRadius: 10,
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: "0.875rem", fontWeight: 500, color: "#2563eb",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.18)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        Reviewers ({reviewers.length})
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          style={{
            position: "absolute", inset: 0, background: "#fff", zIndex: 10,
            borderRadius: 12, padding: 20,
            animation: "slideIn 0.2s ease-out",
          }}
        >
          <button
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 16,
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 500, color: "#6b7280",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: 12 }}>
            Reviewers ({reviewers.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewers.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                border: "1px solid #e5e7eb", transition: "box-shadow 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                <UserIcon />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.875rem" }}>{r.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 1 }}>Due {r.due}</div>
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── VARIANT C: Compact pill avatars ── */
function VariantC() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.8 }}>
        <p><span style={{ color: "#9ca3af" }}>Author:</span> Jo Po</p>
        <p><span style={{ color: "#9ca3af" }}>Email:</span> dalas310516@gmail.com</p>
        <p><span style={{ color: "#9ca3af" }}>Category:</span> AI & Data</p>
        <p><span style={{ color: "#9ca3af" }}>Submitted:</span> February 10, 2026</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
          Reviewers
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {reviewers.map((r, i) => {
            const s = statusStyle(r.status);
            const isOpen = expanded === i;
            return (
              <div key={i} style={{ position: "relative" }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700,
                    background: s.bg, color: s.color,
                    border: `2px solid ${isOpen ? s.color : s.border}`,
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: isOpen ? `0 0 0 3px ${s.border}` : "none",
                  }}
                  title={r.name}
                >
                  {r.name[0].toUpperCase()}
                </button>
                {isOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                    padding: "12px 16px", width: 220, zIndex: 20,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  }}>
                    <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.875rem" }}>{r.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>
                      Invited {r.invited}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Due {r.due}
                    </div>
                    <div style={{ marginTop: 8 }}><Badge status={r.status} /></div>
                    <button
                      style={{
                        marginTop: 8, fontSize: "0.75rem", color: "#2563eb", fontWeight: 500,
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                      }}
                    >
                      View Manuscript
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── VARIANT D: Counter button → modal ── */
function VariantD() {
  const [open, setOpen] = useState(false);
  const submitted = reviewers.filter(r => r.status === "submitted").length;
  return (
    <div>
      <div style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.8 }}>
        <p><span style={{ color: "#9ca3af" }}>Author:</span> Jo Po</p>
        <p><span style={{ color: "#9ca3af" }}>Email:</span> dalas310516@gmail.com</p>
        <p><span style={{ color: "#9ca3af" }}>Category:</span> AI & Data</p>
        <p><span style={{ color: "#9ca3af" }}>Submitted:</span> February 10, 2026</p>
      </div>

      {/* Counter button styled like admin-btn-outline */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "12px 16px", marginTop: 12, borderRadius: 10,
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: "0.875rem", fontWeight: 500, color: "#374151",
          textAlign: "left" as const, transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <span>{reviewers.length} Reviewers</span>
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#9ca3af" }}>
          {submitted} of {reviewers.length} submitted
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "24px 28px",
              width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Reviewers ({reviewers.length})</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.25rem" }}>
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reviewers.map((r, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  border: "1px solid #e5e7eb", transition: "box-shadow 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                    background: statusStyle(r.status).bg,
                    color: statusStyle(r.status).color,
                    border: `1.5px solid ${statusStyle(r.status).border}`,
                  }}>
                    {r.name[0].toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.875rem" }}>{r.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 1 }}>
                      Invited {r.invited} · Due {r.due}
                    </div>
                  </div>
                  <Badge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PAGE ── */
export default function ReviewerDemo() {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 8 }}>
        Reviewer UI Variants
      </h1>
      <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.875rem", marginBottom: 40 }}>
        Pick the one that feels right for the detail panel
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* A */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            A — Tab / Pill Toggle
          </h2>
          <VariantA />
        </div>
        {/* B */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            B — Slide-over Drawer
          </h2>
          <VariantB />
        </div>
        {/* C */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            C — Compact Pill Avatars
          </h2>
          <VariantC />
        </div>
        {/* D */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            D — Counter Button → Modal
          </h2>
          <VariantD />
        </div>
      </div>
    </div>
  );
}
