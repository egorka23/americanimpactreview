const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  under_review: { label: "Under Review", bg: "bg-amber-100", text: "text-amber-700" },
  revision_requested: { label: "Revisions", bg: "bg-orange-100", text: "text-orange-700" },
  accepted: { label: "Accepted", bg: "bg-green-100", text: "text-green-700" },
  published: { label: "Published", bg: "bg-emerald-100", text: "text-emerald-800" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  withdrawn: { label: "Withdrawn", bg: "bg-gray-100", text: "text-gray-600" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
