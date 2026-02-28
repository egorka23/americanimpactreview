import { useMemo, useState } from "react";
import type { Submission } from "./SubmissionsTable";

function formatCurrency(amount: number | null | undefined): string {
  if (!amount || Number.isNaN(amount)) return "—";
  return `$${(amount / 100).toFixed(2)}`;
}

function formatDate(dateStr?: string | null): string {
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

type CoAuthor = { name: string; email?: string; affiliation?: string; orcid?: string };

function parseCoAuthors(raw: string | null | undefined): CoAuthor[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FinanceView({ submissions }: { submissions: Submission[] }) {
  const paid = submissions.filter((s) => s.paymentStatus === "paid");
  const pending = submissions.filter((s) => s.paymentStatus === "pending");
  const unpaid = submissions.filter((s) => !s.paymentStatus || s.paymentStatus === "unpaid" || s.paymentStatus === "failed");

  const paidTotal = paid.reduce((sum, s) => sum + (s.paymentAmount || 0), 0);
  const pendingTotal = pending.reduce((sum, s) => sum + (s.paymentAmount || 0), 0);

  const [selected, setSelected] = useState<Submission | null>(null);
  const [amount, setAmount] = useState("800");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");

  const defaultAmount = useMemo(() => {
    if (!selected?.paymentAmount) return "800";
    return (selected.paymentAmount / 100).toFixed(2);
  }, [selected]);

  const recipientOptions = useMemo(() => {
    if (!selected) return [];
    const coAuthors = parseCoAuthors(selected.coAuthors);
    const list = [
      {
        label: `${selected.userName || "Author"} (primary)`,
        name: selected.userName || "Author",
        email: selected.userEmail || "",
      },
      ...coAuthors.map((c) => ({
        label: `${c.name}${c.email ? "" : " — no email"}`,
        name: c.name,
        email: c.email || "",
      })),
    ];
    return list;
  }, [selected]);

  const openPaymentPanel = (submission: Submission) => {
    setSelected(submission);
    setAmount(submission.paymentAmount ? (submission.paymentAmount / 100).toFixed(2) : "800");
    setError(null);
    setSentMessage(null);
    const primaryEmail = submission.userEmail || "";
    setRecipientEmail(primaryEmail);
    setRecipientName(submission.userName || "Author");
  };

  const handleSendPayment = async () => {
    if (!selected) return;
    setError(null);
    setSentMessage(null);

    const dollars = parseFloat(amount);
    if (!dollars || dollars < 1) {
      setError("Amount must be at least $1.00");
      return;
    }
    if (!recipientEmail) {
      setError("Recipient email is required.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/local-admin/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selected.id,
          amount: Math.round(dollars * 100),
          recipientEmail,
          recipientName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send payment link");
      }

      setSentMessage("Payment link sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send payment link");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Finance</h2>
        <span className="text-xs text-gray-500">All amounts in USD</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Paid revenue</p>
          <p className="text-3xl font-bold text-emerald-900 mt-1">{formatCurrency(paidTotal)}</p>
          <p className="text-xs text-emerald-700 mt-2">{paid.length} paid submission{paid.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Pending revenue</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">{formatCurrency(pendingTotal)}</p>
          <p className="text-xs text-amber-700 mt-2">{pending.length} awaiting payment</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">Unpaid / failed</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{unpaid.length}</p>
          <p className="text-xs text-slate-500 mt-2">Needs follow-up</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          Payment activity
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white border-b border-gray-100">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Submission</th>
                <th className="text-left px-4 py-3">Author</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Paid at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  className={`cursor-pointer transition-colors admin-row ${selected?.id === s.id ? "admin-row-selected" : ""}`}
                  onClick={() => openPaymentPanel(s)}
                >
                  <td className="px-4 py-3 text-gray-900">{s.title}</td>
                  <td className="px-4 py-3 text-gray-600">{s.userName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      s.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.paymentStatus === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {s.paymentStatus === "paid" ? "Paid" : s.paymentStatus === "pending" ? "Pending" : s.paymentStatus === "failed" ? "Failed" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(s.paymentAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {selected ? (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto shrink-0">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Finance Details</h3>
            <button
              className="admin-btn admin-btn-outline"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Submission</p>
            <p className="font-semibold text-gray-900">{selected.title}</p>
            <p className="text-sm text-gray-600 mt-2">{selected.userName || "Author"} &lt;{selected.userEmail || "NO EMAIL"}&gt;</p>
            <p className="text-xs text-gray-400 mt-2">Submitted {formatDate(selected.createdAt)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Payment Status</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selected.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : selected.paymentStatus === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {selected.paymentStatus === "paid" ? "Paid" : selected.paymentStatus === "pending" ? "Pending" : selected.paymentStatus === "failed" ? "Failed" : "Unpaid"}
              </span>
              <span className="text-sm text-gray-600">{formatCurrency(selected.paymentAmount)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Paid at: {formatDate(selected.paidAt)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Send Payment Link</p>
            <label className="text-sm text-gray-600">Recipient</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
              value={recipientEmail}
              onChange={(e) => {
                const email = e.target.value;
                setRecipientEmail(email);
                const match = recipientOptions.find((r) => r.email === email);
                if (match) setRecipientName(match.name);
              }}
            >
              {recipientOptions.map((r) => (
                <option key={`${r.email}-${r.name}`} value={r.email} disabled={!r.email}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="text-sm text-gray-600">Amount (USD)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            />
            <div className="flex gap-2 flex-wrap mb-3">
              {[200, 400, 800, 1200].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setAmount(v.toString())}
                >
                  ${v}
                </button>
              ))}
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setAmount(defaultAmount)}
              >
                Use saved
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-2">
                {error}
              </div>
            )}
            {sentMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm mb-2">
                {sentMessage}
              </div>
            )}

            <button className="admin-btn admin-btn-green w-full" onClick={handleSendPayment} disabled={sending}>
              {sending ? "Sending..." : "Send Payment Link"}
            </button>
          </div>
        </aside>
      ) : (
        <aside className="w-[380px] border-l border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          <p className="text-sm text-gray-400">Select a submission to view finance details</p>
        </aside>
      )}
    </div>
  );
}
