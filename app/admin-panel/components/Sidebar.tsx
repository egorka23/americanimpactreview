type View = "dashboard" | "submissions";

const NAV_ITEMS: { id: View | "reviewers" | "settings"; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "submissions", label: "Submissions", icon: "📄" },
  { id: "reviewers", label: "Reviewers", icon: "👥" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({
  active,
  onNavigate,
  onLogout,
}: {
  active: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-[220px] min-h-screen bg-[#0a1628] text-white flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-sm font-bold tracking-wide uppercase text-white/90">AIR Admin</h1>
        <p className="text-[11px] text-white/40 mt-0.5">Editorial Dashboard</p>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-5 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
