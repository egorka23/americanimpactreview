import { useRef, useState, useEffect, useCallback } from "react";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; hint: string }> = {
  submitted: {
    label: "Submitted",
    bg: "bg-blue-100",
    text: "text-blue-700",
    hint: "Manuscript received and awaiting editorial desk check.",
  },
  under_review: {
    label: "In Review",
    bg: "bg-amber-100",
    text: "text-amber-700",
    hint: "Sent to peer reviewers. Awaiting evaluation reports.",
  },
  revision_requested: {
    label: "Revisions",
    bg: "bg-orange-100",
    text: "text-orange-700",
    hint: "Author asked to revise the manuscript based on reviewer feedback.",
  },
  accepted: {
    label: "Accepted",
    bg: "bg-green-100",
    text: "text-green-700",
    hint: "Manuscript accepted for publication. Pending final formatting.",
  },
  published: {
    label: "Published",
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    hint: "Article published and available on the journal website.",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-100",
    text: "text-red-700",
    hint: "Manuscript declined. Author notified with editorial decision.",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "bg-gray-100",
    text: "text-gray-600",
    hint: "Author withdrew the submission from consideration.",
  },
};

export default function StatusBadge({ status, showInfo = false }: { status: string; showInfo?: boolean }) {
  const [showHint, setShowHint] = useState(false);
  const [above, setAbove] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);

  const checkPosition = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    // If less than 120px to bottom of viewport, show tooltip above
    setAbove(window.innerHeight - rect.bottom < 120);
  }, []);

  useEffect(() => {
    if (showHint) checkPosition();
  }, [showHint, checkPosition]);

  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
    hint: "",
  };

  if (!showInfo) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.bg} ${cfg.text}`}
      >
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
