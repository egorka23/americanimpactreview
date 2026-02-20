import { useState } from "react";

export default function SendReviewerModal({
  submissionId,
  currentStatus,
  onClose,
  onSent,
}: {
  submissionId: string;
  currentStatus?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSending(true);
    setError(null);

    try {
      // 1. Create reviewer if they don't exist
      const reviewerRes = await fetch("/api/local-admin/reviewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), affiliation: "", expertise: "" }),
      });

      let reviewerId: string;
      if (reviewerRes.ok) {
        const data = await reviewerRes.json();
        reviewerId = data.id;
      } else {
        // Reviewer might already exist — fetch all and find by email
        const allRes = await fetch("/api/local-admin/reviewers");
        const all = await allRes.json();
        const existing = all.find((r: { email: string }) => r.email.toLowerCase() === email.trim().toLowerCase());
        if (!existing) throw new Error("Failed to create reviewer");
        reviewerId = existing.id;

        // Update name if it changed (e.g. user corrected the reviewer name)
        if (existing.name !== name.trim()) {
          await fetch(`/api/local-admin/reviewers/${reviewerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
          });
        }
      }

      // 2. Create assignment (this also sends the invite email)
      const assignRes = await fetch("/api/local-admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          reviewerId,
          dueAt: new Date(dueDate).toISOString(),
        }),
      });

      if (!assignRes.ok) {
        const d = await assignRes.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create assignment");
      }

      // 3. Update submission status to under_review (only if not already published/accepted)
      if (currentStatus !== "published" && currentStatus !== "accepted") {
        await fetch(`/api/local-admin/submissions/${submissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "under_review", pipelineStatus: "reviewer_invited" }),
        });
      }

      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={sending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sending overlay */}
        {sending && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center gap-4">
            <div className="reviewer-spinner" />
            <div className="text-sm font-medium text-gray-700">Sending invitation...</div>
            <div className="text-xs text-gray-400">Creating reviewer &amp; sending email</div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send to Reviewer</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. John Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={sending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reviewer@university.edu"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={sending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Deadline</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="admin-btn admin-btn-outline admin-btn-half"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !name.trim() || !email.trim()}
              className="admin-btn admin-btn-primary admin-btn-half"
            >
              {sending ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>

        <style jsx>{`
          .reviewer-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #e5e7eb;
            border-top-color: #1e3a5f;
            border-radius: 50%;
            animation: rev-spin 0.7s linear infinite;
          }
          @keyframes rev-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
