"use client";

import { useCallback, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  affiliation: string | null;
  orcid: string | null;
  role: string | null;
  status: string | null;
  createdAt: string | null;
  lastLogin: string | null;
};

const ROLE_OPTIONS = [
  "super_admin",
  "managing_editor",
  "section_editor",
  "editor",
  "reviewer",
  "author",
  "production",
];

const STATUS_OPTIONS = ["active", "suspended", "invited"];

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

function roleBadge(role: string | null) {
  const r = role || "author";
  const colors: Record<string, { bg: string; text: string }> = {
    super_admin: { bg: "#fef2f2", text: "#b91c1c" },
    managing_editor: { bg: "#eff6ff", text: "#1d4ed8" },
    section_editor: { bg: "#f0fdf4", text: "#166534" },
    editor: { bg: "#f0fdf4", text: "#166534" },
    reviewer: { bg: "#fefce8", text: "#854d0e" },
    author: { bg: "#f8fafc", text: "#475569" },
    production: { bg: "#faf5ff", text: "#7c3aed" },
  };
  const c = colors[r] || colors.author;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      textTransform: "capitalize",
    }}>
      {r.replace(/_/g, " ")}
    </span>
  );
}

function statusBadge(status: string | null) {
  const s = status || "active";
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#f0fdf4", text: "#166534" },
    suspended: { bg: "#fef2f2", text: "#b91c1c" },
    invited: { bg: "#fefce8", text: "#854d0e" },
  };
  const c = colors[s] || colors.active;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: 600,
      background: c.bg,
      color: c.text,
      textTransform: "capitalize",
    }}>
      {s}
    </span>
  );
}

export default function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/local-admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleSelect = (u: User) => {
    setSelected(u);
    setEditRole(u.role || "author");
    setEditStatus(u.status || "active");
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/local-admin/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole, status: editStatus }),
      });
      if (res.ok) {
        setSaveMsg("Saved");
        await fetchUsers();
        // Keep selection in sync
        setSelected((prev) =>
          prev ? { ...prev, role: editRole, status: editStatus } : null
        );
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveMsg(d.error || "Error");
      }
    } catch {
      setSaveMsg("Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: table */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 gap-4">
          <h2 className="text-lg font-semibold text-gray-900 shrink-0">
            Users
            {loading && <span className="ml-2 text-sm text-gray-400 font-normal">Loading…</span>}
            <span className="ml-2 text-sm text-gray-400 font-normal">({filtered.length})</span>
          </h2>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ maxWidth: 260, width: "100%" }}
          />
          <button onClick={fetchUsers} className="admin-refresh-btn" title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              {search ? "No users match your search" : "No users yet"}
            </div>
          ) : (
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 48 }}>#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 120 }}>Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 100 }}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 110 }}>Registered</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: 110 }}>Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u, idx) => {
                  const isSelected = selected?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className={`cursor-pointer transition-colors admin-row ${isSelected ? "admin-row-selected" : ""}`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: isSelected ? "#166534" : "#111827" }}>{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">{statusBadge(u.status)}</td>
                      <td className="px-4 py-3 text-gray-500" style={{ whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-500" style={{ whiteSpace: "nowrap" }}>{formatDate(u.lastLogin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected ? (
        <div className="w-[340px] border-l border-gray-200 bg-gray-50 shrink-0 overflow-y-auto p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{selected.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{selected.email}</p>

          <div className="space-y-3 text-sm mb-6">
            <div>
              <span className="text-gray-500">Affiliation:</span>{" "}
              <span className="text-gray-900">{selected.affiliation || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">ORCID:</span>{" "}
              <span className="text-gray-900">{selected.orcid || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Registered:</span>{" "}
              <span className="text-gray-900">{formatDate(selected.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Last login:</span>{" "}
              <span className="text-gray-900">{formatDate(selected.lastLogin)}</span>
            </div>
          </div>

          <hr className="border-gray-200 mb-4" />

          {/* Editable fields */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="admin-btn"
            style={{ background: "#0a1628", color: "#ffffff", borderRadius: "0.5rem", width: "100%" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          {saveMsg && (
            <p className={`text-sm mt-2 ${saveMsg === "Saved" ? "text-green-600" : "text-red-600"}`}>
              {saveMsg}
            </p>
          )}
        </div>
      ) : (
        <div className="w-[340px] border-l border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <p className="text-sm text-gray-400">Select a user to view details</p>
        </div>
      )}
    </div>
  );
}
