import StatusBadge from "./StatusBadge";

export type Submission = {
  id: string;
  title: string;
  abstract: string;
  category: string;
  subject?: string | null;
  manuscriptUrl: string | null;
  manuscriptName: string | null;
  keywords: string | null;
  coverLetter: string | null;
  conflictOfInterest: string | null;
  policyAgreed: number | null;
  status: string;
  pipelineStatus?: string | null;
  handlingEditorId?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  articleType?: string | null;
  coAuthors?: string | null;
  authorAffiliation?: string | null;
  authorOrcid?: string | null;
  fundingStatement?: string | null;
  ethicsApproval?: string | null;
  dataAvailability?: string | null;
  aiDisclosure?: string | null;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

type CoAuthor = { name: string; email?: string; affiliation?: string };

function parseCoAuthors(raw: string | null | undefined): CoAuthor[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** "Stepanov et al." or just "Stepanov" */
function authorShort(userName: string | null, coAuthorsRaw: string | null | undefined): string {
  const first = userName || "Unknown";
  // Extract last name
  const parts = first.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const coCount = parseCoAuthors(coAuthorsRaw).length;
  if (coCount === 0) return lastName;
  return `${lastName} et al.`;
}

export default function SubmissionsTable({
  submissions,
  selectedId,
  onSelect,
}: {
  submissions: Submission[];
  selectedId: string | null;
  onSelect: (s: Submission) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No submissions yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Author</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {submissions.map((s, idx) => {
            const isSelected = s.id === selectedId;
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className={`cursor-pointer transition-colors admin-row ${isSelected ? "admin-row-selected" : ""}`}
              >
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium" style={{ color: isSelected ? "#166534" : "#111827" }}>{truncate(s.title, 60)}</td>
                <td className="px-4 py-3 text-gray-600">{authorShort(s.userName, s.coAuthors)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
