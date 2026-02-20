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
        const allRes = await fetch("/api/local-admin/reviewers");
        const all = await allRes.json();
        const existing = all.find((r: { email: string }) => r.email.toLowerCase() === email.trim().toLowerCase());
        if (!existing) throw new Error("Failed to create reviewer");
        reviewerId = existing.id;

        if (existing.name !== name.trim()) {
          await fetch(`/api/local-admin/reviewers/${reviewerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
          });
        }
      }

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
    <>
      <style>{`
        .srm-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: srm-fadeIn 0.2s ease;
        }
        @keyframes srm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .srm-card {
          background: #fff;
          border-radius: 16px;
          width: 100%; max-width: 440px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25), 0 8px 24px rgba(15, 23, 42, 0.1);
          overflow: hidden;
          position: relative;
          animation: srm-slideUp 0.25s ease;
        }
        @keyframes srm-slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .srm-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
          padding: 20px 24px;
          display: flex; align-items: center; gap: 14px;
        }
        .srm-header-icon {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.15);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .srm-header-icon svg { width: 20px; height: 20px; color: #fff; }
        .srm-header-text h3 {
          margin: 0; font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.01em;
        }
        .srm-header-text p {
          margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 400;
        }
        .srm-close {
          position: absolute; top: 16px; right: 16px;
          width: 28px; height: 28px; border-radius: 6px;
          border: none; background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .srm-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .srm-close:disabled { opacity: 0; pointer-events: none; }
        .srm-body { padding: 24px; }
        .srm-field { margin-bottom: 18px; }
        .srm-field:last-of-type { margin-bottom: 0; }
        .srm-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .srm-label svg { width: 14px; height: 14px; color: #94a3b8; }
        .srm-input {
          width: 100%; padding: 10px 14px;
          font-size: 14px; color: #1e293b;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          transition: all 0.2s;
          outline: none;
          font-family: inherit;
        }
        .srm-input::placeholder { color: #94a3b8; }
        .srm-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .srm-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .srm-error {
          margin-top: 14px; padding: 10px 14px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; font-size: 13px; color: #dc2626;
          display: flex; align-items: center; gap: 8px;
        }
        .srm-footer {
          padding: 0 24px 24px;
          display: flex; gap: 10px;
        }
        .srm-btn {
          flex: 1; padding: 11px 16px;
          font-size: 14px; font-weight: 600;
          border-radius: 10px; border: none;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .srm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .srm-btn-cancel {
          background: #f1f5f9; color: #475569;
        }
        .srm-btn-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .srm-btn-send {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3);
        }
        .srm-btn-send:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(30, 58, 95, 0.4);
          transform: translateY(-1px);
        }
        .srm-btn-send:active:not(:disabled) { transform: translateY(0); }

        /* Sending overlay */
        .srm-overlay {
          position: absolute; inset: 0;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(3px);
          border-radius: 16px; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          animation: srm-fadeIn 0.2s ease;
        }
        .srm-spinner {
          width: 40px; height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #1e3a5f;
          border-radius: 50%;
          animation: srm-spin 0.7s linear infinite;
        }
        @keyframes srm-spin { to { transform: rotate(360deg); } }
        .srm-overlay-title { font-size: 15px; font-weight: 600; color: #1e293b; }
        .srm-overlay-sub { font-size: 12px; color: #94a3b8; margin-top: -8px; }
      `}</style>

      <div className="srm-backdrop" onClick={sending ? undefined : onClose}>
        <div className="srm-card" onClick={(e) => e.stopPropagation()}>
          {sending && (
            <div className="srm-overlay">
              <div className="srm-spinner" />
              <div className="srm-overlay-title">Sending invitation...</div>
              <div className="srm-overlay-sub">Creating reviewer &amp; delivering email</div>
            </div>
          )}

          <div className="srm-header">
            <div className="srm-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="srm-header-text">
              <h3>Send to Reviewer</h3>
              <p>Invite a peer reviewer for this manuscript</p>
            </div>
            <button className="srm-close" onClick={onClose} disabled={sending} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="srm-body">
              <div className="srm-field">
                <label className="srm-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Reviewer Name
                </label>
                <input
                  type="text"
                  className="srm-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. John Smith"
                  required
                  disabled={sending}
                />
              </div>

              <div className="srm-field">
                <label className="srm-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Reviewer Email
                </label>
                <input
                  type="email"
                  className="srm-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@university.edu"
                  required
                  disabled={sending}
                />
              </div>

              <div className="srm-field">
                <label className="srm-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Review Deadline
                </label>
                <input
                  type="date"
                  className="srm-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={sending}
                />
              </div>

              {error && (
                <div className="srm-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <div className="srm-footer">
              <button type="button" className="srm-btn srm-btn-cancel" onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button type="submit" className="srm-btn srm-btn-send" disabled={sending || !name.trim() || !email.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
