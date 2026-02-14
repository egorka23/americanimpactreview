"use client";

import { useCallback, useEffect, useState } from "react";

type AdminAccount = {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: string | null;
};

export default function SettingsView({ loggedInAccountId }: { loggedInAccountId: string | null }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: "", password: "", displayName: "" });

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ username: "", password: "", displayName: "" });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local-admin/accounts");
      if (!res.ok) throw new Error("Failed to load accounts");
      setAccounts(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = async () => {
    setError(null);
    try {
      const res = await fetch("/api/local-admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create account");
      }
      setAddForm({ username: "", password: "", displayName: "" });
      setShowAdd(false);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setError(null);
    try {
      const payload: Record<string, string> = { id: editId };
      if (editForm.username) payload.username = editForm.username;
      if (editForm.password) payload.password = editForm.password;
      if (editForm.displayName !== undefined) payload.displayName = editForm.displayName;

      const res = await fetch("/api/local-admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update account");
      }
      setEditId(null);
      setEditForm({ username: "", password: "", displayName: "" });
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admin account?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/local-admin/accounts?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete account");
      }
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Settings
          {loading && <span className="ml-2 text-sm text-gray-400 font-normal">Loading…</span>}
        </h2>
      </div>

      <div className="p-6 max-w-2xl">
        {/* Admin Accounts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Admin Accounts</h3>
              <p className="text-sm text-gray-500 mt-0.5">Manage login credentials for the admin panel.</p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="admin-btn"
              style={{
                background: "#0a1628",
                color: "#fff",
                borderRadius: "0.5rem",
                padding: "0.4rem 0.8rem",
                fontSize: "0.8rem",
              }}
            >
              {showAdd ? "Cancel" : "+ Add admin"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* Add new account form */}
          {showAdd && (
            <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">New admin account</h4>
              <div className="grid gap-2">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="Username"
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Password (min 6 characters)"
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                  placeholder="Display name (optional)"
                />
                <button
                  onClick={handleCreate}
                  disabled={!addForm.username || !addForm.password || addForm.password.length < 6}
                  className="admin-btn mt-1"
                  style={{
                    background: !addForm.username || !addForm.password || addForm.password.length < 6 ? "#d1d5db" : "#0a1628",
                    color: "#fff",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.8rem",
                    cursor: !addForm.username || !addForm.password || addForm.password.length < 6 ? "not-allowed" : "pointer",
                  }}
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* Accounts list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-medium">Username</th>
                  <th className="px-4 py-2.5 font-medium">Display Name</th>
                  <th className="px-4 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No admin accounts yet.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acct) => (
                    <tr key={acct.id} className="hover:bg-gray-50">
                      {editId === acct.id ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={editForm.username}
                              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={editForm.displayName}
                              onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                              placeholder="Display name"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              type="password"
                              value={editForm.password}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              placeholder="New password (leave empty to keep)"
                            />
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button
                              onClick={handleUpdate}
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "#fff",
                                background: "#16a34a",
                                border: "none",
                                borderRadius: "0.375rem",
                                padding: "0.3rem 0.75rem",
                                cursor: "pointer",
                                marginRight: "0.4rem",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditId(null); setEditForm({ username: "", password: "", displayName: "" }); }}
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "#6b7280",
                                background: "transparent",
                                border: "1px solid #d1d5db",
                                borderRadius: "0.375rem",
                                padding: "0.3rem 0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {acct.username}
                            {acct.id === loggedInAccountId && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">you</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{acct.displayName || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {acct.createdAt ? new Date(acct.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditId(acct.id);
                                setEditForm({ username: acct.username, password: "", displayName: acct.displayName || "" });
                              }}
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "#fff",
                                background: "#0a1628",
                                border: "none",
                                borderRadius: "0.375rem",
                                padding: "0.3rem 0.75rem",
                                cursor: "pointer",
                                marginRight: "0.4rem",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(acct.id)}
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "#dc2626",
                                background: "transparent",
                                border: "1px solid #fecaca",
                                borderRadius: "0.375rem",
                                padding: "0.3rem 0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
