import { useRef, useState, useEffect, useCallback } from "react";

/* ── SVG status icons ── */
const STATUS_ICONS: Record<string, (color: string) => React.ReactNode> = {
  submitted: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  under_review: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  revision_requested: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  accepted: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  published: () => (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
      <span style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#22c55e", opacity: 0.4, animation: "pulse-ring 2s ease-out infinite" }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
    </span>
  ),
  rejected: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  withdrawn: (c) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; hint: string; inlineColor: string; shadow: string }> = {
  submitted: {
    label: "Submitted",
    bg: "#fef9c3",
    text: "#854d0e",
    inlineColor: "#854d0e",
    shadow: "0 2px 8px rgba(245,158,11,0.3)",
    hint: "Manuscript received and awaiting editorial desk check.",
  },
  under_review: {
    label: "In Review",
    bg: "#dbeafe",
    text: "#1d4ed8",
    inlineColor: "#1d4ed8",
    shadow: "0 2px 8px rgba(59,130,246,0.3)",
    hint: "Sent to peer reviewers. Awaiting evaluation reports.",
  },
  revision_requested: {
    label: "Revisions",
    bg: "#f3e8ff",
    text: "#7c3aed",
    inlineColor: "#7c3aed",
    shadow: "0 2px 8px rgba(168,85,247,0.3)",
    hint: "Author asked to revise the manuscript based on reviewer feedback.",
  },
  accepted: {
    label: "Accepted",
    bg: "#d1fae5",
    text: "#065f46",
    inlineColor: "#065f46",
    shadow: "0 2px 8px rgba(34,197,94,0.3)",
    hint: "Manuscript accepted for publication. Pending final formatting.",
  },
  published: {
    label: "Published",
    bg: "#1e3a5f",
    text: "#ffffff",
    inlineColor: "#ffffff",
    shadow: "0 2px 8px rgba(30,58,95,0.4)",
    hint: "Article published and available on the journal website.",
  },
  rejected: {
    label: "Rejected",
    bg: "#ffe4e6",
    text: "#be123c",
    inlineColor: "#be123c",
    shadow: "0 2px 8px rgba(239,68,68,0.3)",
    hint: "Manuscript declined. Author notified with editorial decision.",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "#e2e8f0",
    text: "#1e293b",
    inlineColor: "#1e293b",
    shadow: "0 2px 8px rgba(100,116,139,0.25)",
    hint: "Author withdrew the submission from consideration.",
  },
};

export default function StatusBadge({ status, showInfo = false, visibility }: { status: string; showInfo?: boolean; visibility?: "public" | "private" }) {
  const [showHint, setShowHint] = useState(false);
  const [above, setAbove] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);

  const checkPosition = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setAbove(window.innerHeight - rect.bottom < 120);
  }, []);

  useEffect(() => {
    if (showHint) checkPosition();
  }, [showHint, checkPosition]);

  const isPrivatePublished = status === "published" && visibility === "private";

  const cfg = isPrivatePublished
    ? {
        label: "Private",
        bg: "#fef3c7",
        text: "#92400e",
        inlineColor: "#92400e",
        shadow: "0 2px 8px rgba(245,158,11,0.35)",
        hint: "Published but hidden from the public site. Only admins can see it.",
      }
    : STATUS_CONFIG[status] || {
        label: status,
        bg: "#f1f5f9",
        text: "#475569",
        inlineColor: "#475569",
        shadow: "0 2px 8px rgba(100,116,139,0.2)",
        hint: "",
      };

  const icon = isPrivatePublished
    ? (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.inlineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    )
    : STATUS_ICONS[status]?.(cfg.inlineColor);

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "9999px",
    background: cfg.bg,
    color: cfg.text,
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxShadow: cfg.shadow,
  };

  if (!showInfo) {
    return (
      <span style={badgeStyle}>
        {icon}
        {cfg.label}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <span style={badgeStyle}>
        {icon}
        {cfg.label}
        {cfg.hint && (
          <svg
            ref={iconRef}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50 hover:opacity-100 cursor-help shrink-0"
            onMouseEnter={() => setShowHint(true)}
            onMouseLeave={() => setShowHint(false)}
            onClick={(e) => { e.stopPropagation(); setShowHint((v) => !v); }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </span>

      {showHint && cfg.hint && (
        <div
          className={`absolute z-50 right-0 w-64 px-3 py-2.5 rounded-lg text-xs leading-relaxed font-normal text-gray-700 bg-white border border-gray-200 ${
            above ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }}
        >
          {cfg.hint}
        </div>
      )}
    </span>
  );
}
