type View = "dashboard" | "submissions" | "users" | "settings" | "editorial_board" | "finance";

const NAV_ITEMS: { id: View | "reviewers"; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "submissions", label: "Submissions", icon: "📄" },
  { id: "reviewers", label: "Reviewers", icon: "👥" },
  { id: "editorial_board", label: "Editorial Board", icon: "🎓" },
  { id: "finance", label: "Finance", icon: "💳" },
  { id: "users", label: "Users", icon: "👤" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({
  active,
  onNavigate,
  onIntake,
  onLogout,
}: {
  active: string;
  onNavigate: (view: string) => void;
  onIntake: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-[220px] h-screen flex flex-col shrink-0 overflow-y-auto" style={{ background: "#0a1628", color: "#ffffff" }}>
      <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="text-sm font-bold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.9)" }}>AIR Admin</div>
        <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Editorial Dashboard</div>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              role="button"
              className="px-5 py-2.5 text-sm flex items-center gap-3 cursor-pointer"
              style={{
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
                height: "auto",
                textTransform: "none" as const,
                letterSpacing: "normal",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.label}
            </div>
          );
        })}

        <div
          onClick={onIntake}
          role="button"
          className="px-5 py-2.5 text-sm flex items-center gap-3 cursor-pointer"
          style={{
            color: "rgba(255,255,255,0.8)",
            background: "transparent",
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
            height: "auto",
            textTransform: "none" as const,
            letterSpacing: "normal",
          }}
        >
          <span style={{ fontSize: "1rem" }}>📤</span>
          Upload Article
        </div>
      </nav>

      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          onClick={onLogout}
          role="button"
          className="px-3 py-2 text-sm cursor-pointer"
          style={{
            color: "rgba(255,255,255,0.4)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            height: "auto",
            textTransform: "none" as const,
          }}
        >
          Logout
        </div>
      </div>
    </aside>
  );
}
