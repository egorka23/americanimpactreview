import { useEffect, useMemo, useState } from "react";

type StripeSession = {
  id: string;
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  status: "complete" | "expired" | "open";
  amountTotal: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  submissionId: string | null;
  created: number;
  paymentIntentId: string | null;
};

type BalanceAmount = { amount: number; currency: string };

function formatCurrency(cents: number | null | undefined): string {
  if (!cents || Number.isNaN(cents)) return "$0.00";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FinanceView() {
  const [sessions, setSessions] = useState<StripeSession[]>([]);
  const [balance, setBalance] = useState<{ available: BalanceAmount[]; pending: BalanceAmount[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StripeSession | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/local-admin/stripe-payments")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load Stripe data");
        return res.json();
      })
      .then((data) => {
        setSessions(data.sessions || []);
        setBalance(data.balance || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const paid = useMemo(() => sessions.filter((s) => s.paymentStatus === "paid"), [sessions]);
  const pending = useMemo(() => sessions.filter((s) => s.status === "open"), [sessions]);
  const expired = useMemo(() => sessions.filter((s) => s.status === "expired"), [sessions]);

  const paidTotal = paid.reduce((sum, s) => sum + (s.amountTotal || 0), 0);
  const pendingTotal = pending.reduce((sum, s) => sum + (s.amountTotal || 0), 0);

  const balanceAvailable = balance?.available?.find((b) => b.currency === "usd")?.amount || 0;
  const balancePending = balance?.pending?.find((b) => b.currency === "usd")?.amount || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading Stripe data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Finance</h2>
          <span className="text-xs text-gray-500">Live from Stripe {process.env.NODE_ENV === "development" ? "(test mode)" : ""}</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-700">Paid revenue</p>
            <p className="text-3xl font-bold text-emerald-900 mt-1">{formatCurrency(paidTotal)}</p>
            <p className="text-xs text-emerald-700 mt-2">{paid.length} paid session{paid.length === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-700">Pending checkout</p>
            <p className="text-3xl font-bold text-amber-900 mt-1">{formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-amber-700 mt-2">{pending.length} open session{pending.length === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm text-blue-700">Stripe balance</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{formatCurrency(balanceAvailable)}</p>
            <p className="text-xs text-blue-700 mt-2">{formatCurrency(balancePending)} pending</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Expired / abandoned</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{expired.length}</p>
            <p className="text-xs text-slate-500 mt-2">Checkout not completed</p>
          </div>
        </div>

        {/* Payment activity table */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            Payment activity ({sessions.length} total)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-xs uppercase tracking-wider text-gray-500">
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No Stripe checkout sessions found
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr
                      key={s.id}
                      className={`cursor-pointer transition-colors admin-row ${selected?.id === s.id ? "admin-row-selected" : ""}`}
                      onClick={() => setSelected(s)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{s.customerName || s.customerEmail || "Anonymous"}</div>
                        {s.customerName && s.customerEmail && (
                          <div className="text-xs text-gray-500">{s.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          s.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.status === "open"
                            ? "bg-amber-100 text-amber-700"
                            : s.status === "expired"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {s.paymentStatus === "paid" ? "Paid" : s.status === "open" ? "Open" : s.status === "expired" ? "Expired" : s.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency(s.amountTotal)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.created)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto shrink-0">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Customer</p>
            <p className="font-semibold text-gray-900">{selected.customerName || "No name"}</p>
            <p className="text-sm text-gray-600 mt-1">{selected.customerEmail || "No email"}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment</p>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selected.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : selected.status === "open"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-600"
              }`}>
                {selected.paymentStatus === "paid" ? "Paid" : selected.status === "open" ? "Open" : "Expired"}
              </span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(selected.amountTotal)}</span>
            </div>
            <p className="text-xs text-gray-400">{formatDateTime(selected.created)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Stripe IDs</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                <span className="text-gray-400">Session:</span>{" "}
                <span className="font-mono">{selected.id.slice(0, 28)}...</span>
              </p>
              {selected.paymentIntentId && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Payment Intent:</span>{" "}
                  <span className="font-mono">{(selected.paymentIntentId as string).slice(0, 24)}...</span>
                </p>
              )}
              {selected.submissionId && (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Submission:</span>{" "}
                  <span className="font-mono">{selected.submissionId.slice(0, 16)}...</span>
                </p>
              )}
            </div>
          </div>

          <a
            href={`https://dashboard.stripe.com/test/payments/${selected.paymentIntentId || ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-outline w-full text-center block"
          >
            View in Stripe Dashboard
          </a>
        </aside>
      ) : (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <p className="text-sm text-gray-400">Select a payment to view details</p>
        </aside>
      )}
    </div>
  );
}
