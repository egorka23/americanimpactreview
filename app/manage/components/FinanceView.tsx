import { useCallback, useEffect, useMemo, useState } from "react";

type FinanceRow = {
  id: string;
  title: string;
  status: string;
  paymentStatus: string | null;
  paymentAmount: number | null;
  paidAt: string | null;
  userName: string | null;
  userEmail: string | null;
  coAuthors: string | null;
  createdAt: string | null;
  publishedSlug: string | null;
};

function formatCurrency(cents: number | null | undefined): string {
  if (!cents || Number.isNaN(cents)) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function paymentBadge(status: string | null) {
  switch (status) {
    case "paid":
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Paid</span>;
    case "pending":
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    default:
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Unpaid</span>;
  }
}

function parseRecipients(row: FinanceRow): { name: string; email: string }[] {
  const list: { name: string; email: string }[] = [];
  if (row.userEmail) {
    list.push({ name: row.userName || "Primary Author", email: row.userEmail });
  }
  if (row.coAuthors) {
    try {
      const parsed = JSON.parse(row.coAuthors);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: string | { name?: string; email?: string }) => {
          if (typeof c === "string") {
            list.push({ name: c, email: "" });
          } else if (c && typeof c === "object" && c.email) {
            list.push({ name: c.name || c.email, email: c.email });
          }
        });
      }
    } catch { /* not JSON */ }
  }
  return list;
}

type BalanceAmount = { amount: number; currency: string };
type StripeData = {
  sessions: { paymentStatus: string; status: string; amountTotal: number }[];
  balance: { available: BalanceAmount[]; pending: BalanceAmount[] } | null;
};

export default function FinanceView() {
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [stripe, setStripe] = useState<StripeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FinanceRow | null>(null);

  // Send payment link state
  const [sendingLink, setSendingLink] = useState(false);
  const [linkRecipient, setLinkRecipient] = useState("");
  const [linkAmount, setLinkAmount] = useState("200");
  const [linkResult, setLinkResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [subsRes, stripeRes] = await Promise.all([
        fetch("/api/local-admin/submissions"),
        fetch("/api/local-admin/stripe-payments"),
      ]);
      if (!subsRes.ok) throw new Error("Failed to load submissions");
      const data: FinanceRow[] = await subsRes.json();
      setRows(data);
      if (stripeRes.ok) {
        setStripe(await stripeRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // KPI from Stripe + submissions
  const kpi = useMemo(() => {
    const stripeSessions = stripe?.sessions || [];
    const paid = stripeSessions.filter((s) => s.paymentStatus === "paid");
    const open = stripeSessions.filter((s) => s.status === "open");
    const expired = stripeSessions.filter((s) => s.status === "expired");
    const paidTotal = paid.reduce((sum, s) => sum + (s.amountTotal || 0), 0);
    const pendingTotal = open.reduce((sum, s) => sum + (s.amountTotal || 0), 0);
    const balanceAvailable = stripe?.balance?.available?.find((b) => b.currency === "usd")?.amount || 0;
    const balancePending = stripe?.balance?.pending?.find((b) => b.currency === "usd")?.amount || 0;
    const unpaidCount = rows.filter((r) => !r.paymentStatus || r.paymentStatus === "unpaid").length;
    return { paid: paid.length, paidTotal, open: open.length, pendingTotal, expired: expired.length, balanceAvailable, balancePending, unpaidCount };
  }, [stripe, rows]);

  // Reset link form when selection changes
  useEffect(() => {
    if (selected) {
      const recipients = parseRecipients(selected);
      setLinkRecipient(recipients[0]?.email || "");
      setLinkAmount("200");
      setLinkResult(null);
    }
  }, [selected]);

  const currentSelected = useMemo(() => {
    if (!selected) return null;
    return rows.find((r) => r.id === selected.id) || null;
  }, [rows, selected]);

  const handleSendPaymentLink = async () => {
    if (!currentSelected || !linkRecipient) return;
    setSendingLink(true);
    setLinkResult(null);
    try {
      const amountCents = Math.round(parseFloat(linkAmount) * 100);
      if (isNaN(amountCents) || amountCents < 100) {
        setLinkResult({ ok: false, message: "Amount must be at least $1.00" });
        return;
      }
      const res = await fetch("/api/local-admin/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: currentSelected.id,
          amount: amountCents,
          recipientEmail: linkRecipient,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkResult({ ok: false, message: data.error || "Failed" });
      } else {
        setLinkResult({ ok: true, message: "Payment link sent!" });
        fetchData();
      }
    } catch (err) {
      setLinkResult({ ok: false, message: err instanceof Error ? err.message : "Error" });
    } finally {
      setSendingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading finance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      </div>
    );
  }

  const recipients = currentSelected ? parseRecipients(currentSelected) : [];

  return (
    <div className="flex h-full">
      {/* Table */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Finance</h2>
          <button onClick={fetchData} className="admin-refresh-btn" title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* KPI summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">Paid revenue</p>
              <p className="text-2xl font-bold text-emerald-900 mt-0.5">{formatCurrency(kpi.paidTotal)}</p>
              <p className="text-xs text-emerald-600 mt-1">{kpi.paid} paid</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">Pending</p>
              <p className="text-2xl font-bold text-amber-900 mt-0.5">{formatCurrency(kpi.pendingTotal)}</p>
              <p className="text-xs text-amber-600 mt-1">{kpi.open} open</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700">Stripe balance</p>
              <p className="text-2xl font-bold text-blue-900 mt-0.5">{formatCurrency(kpi.balanceAvailable)}</p>
              <p className="text-xs text-blue-600 mt-1">{formatCurrency(kpi.balancePending)} pending</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-600">Unpaid articles</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.unpaidCount}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.expired} expired link{kpi.expired === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-100 sticky top-0">
                <tr className="text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Author</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No submissions yet</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      className={`cursor-pointer transition-colors admin-row ${currentSelected?.id === r.id ? "admin-row-selected" : ""}`}
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-3 max-w-[300px]">
                        <div className="text-gray-900 truncate">{r.title}</div>
                      </td>
                      <td className="px-4 py-3">{paymentBadge(r.paymentStatus)}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(r.paymentAmount)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.userName || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {currentSelected ? (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto shrink-0">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            <button className="admin-btn admin-btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>

          {/* Article info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Article</p>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{currentSelected.title}</p>
            {currentSelected.publishedSlug && (
              <a
                href={`/article/${currentSelected.publishedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                View article
              </a>
            )}
          </div>

          {/* Payment status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment</p>
            <div className="flex items-center gap-2 mb-2">
              {paymentBadge(currentSelected.paymentStatus)}
              <span className="text-lg font-bold text-gray-900">{formatCurrency(currentSelected.paymentAmount)}</span>
            </div>
            {currentSelected.paidAt && (
              <p className="text-xs text-gray-400">Paid on {formatDate(currentSelected.paidAt)}</p>
            )}
          </div>

          {/* Author info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Author</p>
            <p className="font-semibold text-gray-900">{currentSelected.userName || "Unknown"}</p>
            {currentSelected.userEmail && (
              <p className="text-sm text-gray-600 mt-1">{currentSelected.userEmail}</p>
            )}
          </div>

          {/* Send payment link */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Send Payment Link</p>

            <label className="block text-xs text-gray-500 mb-1">Recipient</label>
            <select
              value={linkRecipient}
              onChange={(e) => setLinkRecipient(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {recipients.length === 0 && <option value="">No email available</option>}
              {recipients.map((r, i) => (
                <option key={i} value={r.email} disabled={!r.email}>
                  {r.name}{r.email ? ` (${r.email})` : " — no email"}
                </option>
              ))}
            </select>

            <label className="block text-xs text-gray-500 mb-1">Amount (USD)</label>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={linkAmount}
                onChange={(e) => setLinkAmount(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSendPaymentLink}
              disabled={sendingLink || !linkRecipient}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: sendingLink ? "#1e3a5f" : "#0a1628" }}
            >
              {sendingLink ? "Sending…" : "Send Payment Link"}
            </button>

            {linkResult && (
              <p className={`text-xs mt-2 ${linkResult.ok ? "text-emerald-600" : "text-red-600"}`}>
                {linkResult.message}
              </p>
            )}
          </div>
        </aside>
      ) : (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <p className="text-sm text-gray-400">Select a submission to view details</p>
        </aside>
      )}
    </div>
  );
}
