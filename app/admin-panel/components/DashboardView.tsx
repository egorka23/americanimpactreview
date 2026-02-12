type Submission = {
  id: string;
  status: string;
};

const STAT_CARDS = [
  { key: "total", label: "Total Submissions", filter: () => true, color: "bg-slate-50 border-slate-200" },
  { key: "under_review", label: "Under Review", filter: (s: Submission) => s.status === "under_review", color: "bg-amber-50 border-amber-200" },
  { key: "accepted", label: "Accepted", filter: (s: Submission) => s.status === "accepted", color: "bg-green-50 border-green-200" },
  { key: "published", label: "Published", filter: (s: Submission) => s.status === "published", color: "bg-emerald-50 border-emerald-200" },
];

export default function DashboardView({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const count = submissions.filter(card.filter).length;
          return (
            <div key={card.key} className={`rounded-lg border p-5 ${card.color}`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
