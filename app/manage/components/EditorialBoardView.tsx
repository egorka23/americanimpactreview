import { useState, useEffect, useCallback } from "react";

interface EbInvitation {
  id: string;
  full_name: string;
  email: string;
  title: string | null;
  affiliation: string | null;
  expertise_area: string | null;
  achievements: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  responded_at: string | null;
}

function titleCase(name: string) {
  return name.replace(/\b[a-zA-Z]/g, (ch, i, str) => {
    if (i === 0 || /\s/.test(str[i - 1])) return ch.toUpperCase();
    return ch;
  });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtDate(v: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  sent:     { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  opened:   { bg: "#fefce8", text: "#a16207", border: "#fde68a" },
  accepted: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  declined: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

function buildPreviewHtml(p: { fullName: string; title: string; email: string; affiliation: string; expertiseArea: string; achievements: string }) {
  const name = titleCase(p.fullName.trim());
  const today = formatDate();

  return `
<div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 4px 24px rgba(10,22,40,0.06);">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="/logo-email.png" alt="AIR" width="48" height="48" style="display:block;margin:0 auto 12px;width:48px;height:48px;" />
      <div style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.01em;">American Impact Review</div>
      <div style="font-size:11px;color:#8a7e6e;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">A Peer-Reviewed Multidisciplinary Journal</div>
    </div>

    <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Invitation to Join the Editorial Board</h1>
    <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">Formal invitation to serve as a member of the Editorial Board of American Impact Review</p>

    <p style="font-size:13px;color:#94a3b8;text-align:right;margin:0 0 20px;">${today}</p>

    <p style="font-size:14px;color:#334155;line-height:1.7;">Dear ${esc(name)},</p>
    <p style="font-size:14px;color:#334155;line-height:1.7;">On behalf of the editorial leadership of <strong>American Impact Review</strong>, a peer-reviewed, open-access journal operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959), I am writing to formally invite you to serve as a member of the <strong>Editorial Board</strong>.</p>
    <p style="font-size:14px;color:#334155;line-height:1.7;">This invitation is extended in recognition of your distinguished expertise and scholarly contributions in the field of <strong>${esc(p.expertiseArea)}</strong>. Your work, including ${esc(p.achievements)}, reflects the caliber of scholarship and intellectual leadership that our journal seeks to represent on its Editorial Board. Our editorial team identified your profile through a careful review of leading researchers and practitioners whose expertise aligns with the journal's interdisciplinary mission.</p>

    <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Role and responsibilities</h2>
    <p style="font-size:14px;color:#334155;line-height:1.7;">The Editorial Board plays a vital role in upholding the quality, integrity, and scholarly rigor of the journal. As a Board member, your responsibilities would include:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;line-height:1.7;">
      <tr><td style="width:36px;vertical-align:top;padding:0 12px 10px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">1</span></td><td style="vertical-align:top;padding-bottom:10px;">Providing strategic guidance on the journal's editorial direction, scope, and standards within your area of expertise.</td></tr>
      <tr><td style="width:36px;vertical-align:top;padding:0 12px 10px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">2</span></td><td style="vertical-align:top;padding-bottom:10px;">Reviewing and evaluating manuscripts as needed, particularly those that fall within your domain of specialization.</td></tr>
      <tr><td style="width:36px;vertical-align:top;padding:0 12px 10px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">3</span></td><td style="vertical-align:top;padding-bottom:10px;">Advising on the selection and invitation of qualified peer reviewers for submitted manuscripts.</td></tr>
      <tr><td style="width:36px;vertical-align:top;padding:0 12px 10px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">4</span></td><td style="vertical-align:top;padding-bottom:10px;">Contributing to the development of special issues, thematic collections, or editorial initiatives that advance the journal's mission.</td></tr>
      <tr><td style="width:36px;vertical-align:top;padding:0 12px 10px 0;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">5</span></td><td style="vertical-align:top;padding-bottom:10px;">Serving as an ambassador for the journal within your professional and academic networks.</td></tr>
    </table>

    <p style="font-size:14px;color:#334155;line-height:1.7;">We understand the demands on your time and have structured the Editorial Board role to be meaningful without being burdensome. Board members are typically asked to review two to four manuscripts per year and participate in periodic editorial consultations. Your name, affiliation, and biographical summary will be listed on the journal's website.</p>

    <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Appointment details</h2>
    <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;width:140px;vertical-align:top;">Position</td><td style="padding:6px 0;color:#0a1628;font-weight:600;">Editorial Board Member</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Term</td><td style="padding:6px 0;color:#0a1628;">Two years (renewable upon mutual agreement)</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Compensation</td><td style="padding:6px 0;color:#0a1628;">Pro bono (honorary scholarly appointment)</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Affiliation listing</td><td style="padding:6px 0;color:#0a1628;">${esc(name)}, ${esc(p.title)}<br />${esc(p.affiliation)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Date of invitation</td><td style="padding:6px 0;color:#0a1628;">${today}</td></tr>
      </table>
    </div>

    <div style="background:#f8f6f3;border-radius:10px;padding:16px 20px;margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
      <strong style="color:#0a1628;">About American Impact Review</strong><br />
      American Impact Review is a peer-reviewed, open-access multidisciplinary journal publishing original research across 12+ disciplines, operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959). All articles receive DOI assignment and are published under Creative Commons CC BY 4.0 licensing. Our peer review process adheres to the guidelines of the Committee on Publication Ethics (COPE).<br />
      americanimpactreview.com
    </div>

    <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Your response</h2>
    <p style="font-size:14px;color:#334155;line-height:1.7;">If you wish to accept this invitation, please reply to this email confirming your interest, and we will provide you with onboarding materials and access to our editorial management system. If you are unable to serve at this time, we would welcome a recommendation of a colleague with relevant expertise.</p>
    <p style="font-size:14px;color:#334155;line-height:1.7;">We sincerely hope you will consider joining us in shaping a journal committed to rigorous, impactful, and accessible scholarship.</p>

    <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
      Egor Akimov, PhD<br />
      Editor-in-Chief, American Impact Review<br />
      egor@americanimpactreview.com
    </p>
  </div>

  <div style="text-align:center;padding:20px 0;font-size:11px;color:#94a3b8;">
    American Impact Review &middot; 501(c)(3) nonprofit (Global Talent Foundation, EIN: 33-2266959)<br />
    7613 Elmwood Ave, Suite 628241, Middleton, WI 53562, USA
  </div>
</div>`;
}

export default function EditorialBoardView() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("PhD");
  const [affiliation, setAffiliation] = useState("");
  const [expertiseArea, setExpertiseArea] = useState("");
  const [achievements, setAchievements] = useState("");

  // Prepare mode: email + raw text → copy for Claude Code
  const [prepEmail, setPrepEmail] = useState("");
  const [prepText, setPrepText] = useState("");

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  // Invitations list
  const [invitations, setInvitations] = useState<EbInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/local-admin/eb-invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const resetForm = () => {
    setFullName(""); setEmail(""); setTitle("PhD"); setAffiliation("");
    setExpertiseArea(""); setAchievements(""); setError(null); setStep("form");
    setPrepEmail(""); setPrepText(""); setCopied(false);
  };

  const handleCopyForClaude = async () => {
    const instruction = `# EB Invitation Task — American Impact Review

## Что нужно сделать
Проанализировать профиль исследователя и отправить EB (Editorial Board) invitation через API сайта americanimpactreview.com.

## Email получателя
${prepEmail.trim()}

## Текст профиля исследователя (скопирован с сайтов — Google Scholar, ResearchGate, ORCID, университет и т.д.)
---
${prepText.trim()}
---

## Шаги

### 1. Извлечь из текста выше:
- **fullName** — полное имя (например "Jane Smith")
- **title** — учёная степень (например "PhD", "MD, PhD"). Только аббревиатура степени, не "Professor". "Кандидат наук" = "PhD"
- **affiliation** — текущий вуз и кафедра (например "Harvard University, Department of Economics")
- **expertiseArea** — область исследований, lowercase, для фразы "...in the field of [expertiseArea]". Выводить из реальных публикаций и тем исследований, НЕ из названия кафедры
- **achievements** — конкретные достижения, lowercase, для фразы "Your work, including [achievements], reflects...". Упомянуть 2-3 КОНКРЕТНЫХ публикации или вклада из текста. Без точки в конце

### 2. Сгенерировать HTML-превью письма
Сохранить файл на Desktop: /Users/aeb/Desktop/eb-invitation-preview.html
Использовать шаблон письма из файла: /Users/aeb/Desktop/americanimpactreview/app/manage/components/EditorialBoardView.tsx (функция buildPreviewHtml)
Открыть превью: open /Users/aeb/Desktop/eb-invitation-preview.html

### 3. Дождаться подтверждения
Показать мне извлечённые данные и спросить подтверждение перед отправкой.

### 4. После подтверждения — отправить через API
\`\`\`bash
curl -X POST https://americanimpactreview.com/api/local-admin/eb-invitations \\
  -H "Content-Type: application/json" \\
  -d '{"fullName":"...","email":"${prepEmail.trim()}","title":"...","affiliation":"...","expertiseArea":"...","achievements":"..."}'
\`\`\`

Это создаст запись в БД и отправит branded email через Resend с tracking pixel.

## ВАЖНО
- НЕ выдумывать данные — только из предоставленного текста
- Если поле не найдено — спросить у меня
- expertiseArea и achievements — lowercase, без точки в конце
- achievements — максимально конкретно, реальные названия публикаций`;

    try {
      await navigator.clipboard.writeText(instruction);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const formValid = fullName.trim() && email.trim() && affiliation.trim() && expertiseArea.trim() && achievements.trim();

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) return;
    setStep("preview");
  };

  const handleSend = async () => {
    setSending(true); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/local-admin/eb-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(), email: email.trim(), title: title.trim(),
          affiliation: affiliation.trim(), expertiseArea: expertiseArea.trim(),
          achievements: achievements.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to send invitation");
      }
      setSuccess(`Invitation sent to ${fullName.trim()} (${email.trim()})`);
      resetForm(); setShowModal(false);
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, status: "accepted" | "declined") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/local-admin/eb-invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchInvitations();
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <style>{`
        .ebm-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: ebm-fadeIn 0.2s ease;
        }
        @keyframes ebm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ebm-card {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25), 0 8px 24px rgba(15, 23, 42, 0.1);
          position: relative; animation: ebm-slideUp 0.25s ease;
        }
        .ebm-card-wide { max-width: 780px; }
        @keyframes ebm-slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ebm-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
          padding: 20px 24px; display: flex; align-items: center; gap: 14px;
        }
        .ebm-header-icon {
          width: 40px; height: 40px; background: rgba(255,255,255,0.15);
          border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ebm-header-icon svg { width: 20px; height: 20px; color: #fff; }
        .ebm-header-text h3 { margin: 0; font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
        .ebm-header-text p { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 400; }
        .ebm-close {
          position: absolute; top: 16px; right: 16px;
          width: 28px; height: 28px; border-radius: 6px;
          border: none; background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .ebm-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .ebm-close:disabled { opacity: 0; pointer-events: none; }
        .ebm-body { padding: 24px; }
        .ebm-field { margin-bottom: 16px; }
        .ebm-field:last-of-type { margin-bottom: 0; }
        .ebm-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;
        }
        .ebm-label svg { width: 14px; height: 14px; color: #94a3b8; }
        .ebm-input, .ebm-textarea {
          width: 100%; padding: 10px 14px; font-size: 14px; color: #1e293b;
          border: 1.5px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
          transition: all 0.2s; outline: none; font-family: inherit;
        }
        .ebm-textarea { min-height: 72px; resize: vertical; line-height: 1.5; }
        .ebm-input::placeholder, .ebm-textarea::placeholder { color: #94a3b8; }
        .ebm-input:focus, .ebm-textarea:focus {
          border-color: #3b82f6; background: #fff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        .ebm-input:disabled, .ebm-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .ebm-row { display: flex; gap: 12px; }
        .ebm-row .ebm-field { flex: 1; }
        .ebm-error {
          margin-top: 14px; padding: 10px 14px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; font-size: 13px; color: #dc2626;
          display: flex; align-items: center; gap: 8px;
        }
        .ebm-footer {
          padding: 0 24px 24px; display: flex; gap: 10px;
        }
        .ebm-btn {
          flex: 1 !important; padding: 11px 16px !important;
          font-size: 14px !important; font-weight: 600 !important;
          border-radius: 10px !important; border: none !important;
          cursor: pointer !important; transition: all 0.2s !important;
          font-family: inherit !important;
          display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important;
          width: auto !important; text-align: center !important;
        }
        .ebm-btn:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }
        .ebm-btn-cancel { background: #f1f5f9 !important; color: #475569 !important; }
        .ebm-btn-cancel:hover:not(:disabled) { background: #e2e8f0 !important; color: #475569 !important; }
        .ebm-btn-send {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%) !important;
          color: #fff !important; box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3) !important;
        }
        .ebm-btn-send:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(30, 58, 95, 0.4) !important;
          transform: translateY(-1px) !important;
          color: #fff !important;
        }
        .ebm-btn-send:active:not(:disabled) { transform: translateY(0) !important; }
        .ebm-btn-back { background: #f1f5f9 !important; color: #475569 !important; }
        .ebm-btn-back:hover:not(:disabled) { background: #e2e8f0 !important; color: #475569 !important; }
        .ebm-invite-btn {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%) !important;
          color: #fff !important; box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3) !important;
        }
        .ebm-invite-btn:hover {
          background: linear-gradient(135deg, #2d5a8e 0%, #3b6fa8 100%) !important;
          color: #fff !important; box-shadow: 0 4px 16px rgba(30, 58, 95, 0.4) !important;
        }

        .ebm-overlay {
          position: absolute; inset: 0; background: rgba(255,255,255,0.88);
          backdrop-filter: blur(3px); border-radius: 16px; z-index: 10;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
          animation: ebm-fadeIn 0.2s ease;
        }
        .ebm-spinner {
          width: 40px; height: 40px; border: 3px solid #e2e8f0;
          border-top-color: #1e3a5f; border-radius: 50%;
          animation: ebm-spin 0.7s linear infinite;
        }
        @keyframes ebm-spin { to { transform: rotate(360deg); } }
        .ebm-overlay-title { font-size: 15px; font-weight: 600; color: #1e293b; }
        .ebm-overlay-sub { font-size: 12px; color: #94a3b8; margin-top: -8px; }
        .ebm-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }

        .ebm-preview-wrap {
          padding: 24px; background: #f8f6f3; border-radius: 0 0 16px 16px;
          max-height: calc(90vh - 160px); overflow-y: auto;
        }
        .ebm-to-line {
          padding: 12px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 13px; color: #475569;
        }
        .ebm-to-line strong { color: #0a1628; }

        .ebm-status-btn {
          padding: 4px 10px; font-size: 11px; font-weight: 600;
          border-radius: 6px; border: 1px solid #e2e8f0; background: #fff;
          cursor: pointer; transition: all 0.15s; color: #475569;
        }
        .ebm-status-btn:hover { background: #f1f5f9; }
        .ebm-status-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ebm-status-btn-accept { border-color: #bbf7d0; color: #15803d; }
        .ebm-status-btn-accept:hover { background: #f0fdf4; }
        .ebm-status-btn-decline { border-color: #fecaca; color: #dc2626; }
        .ebm-status-btn-decline:hover { background: #fef2f2; }
      `}</style>

      {/* Page header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Editorial Board</h2>
            <p className="text-sm text-gray-500 mt-0.5">Invitations log and tracking</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="ebm-invite-btn px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
          >
            + Invite Member
          </button>
        </div>
      </div>

      {success && (
        <div className="mx-8 mt-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
          {success}
        </div>
      )}

      {/* Invitations table */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="ebm-spinner" style={{ margin: "0 auto 16px", width: 32, height: 32, borderWidth: 2 }} />
            <p className="text-sm">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-4">&#127891;</div>
            <p className="text-sm">No invitations sent yet. Use the <strong>Invite Member</strong> button above.</p>
            <p className="text-xs text-gray-300 mt-2">Each invitation is personalized with the invitee&apos;s expertise and achievements.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Affiliation</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Sent</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const sc = statusColors[inv.status] || statusColors.sent;
                  const isTerminal = inv.status === "accepted" || inv.status === "declined";
                  return (
                    <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{inv.affiliation || "-"}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(inv.sent_at)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!isTerminal && (
                          <div className="flex gap-2">
                            <button
                              className="ebm-status-btn ebm-status-btn-accept"
                              disabled={updatingId === inv.id}
                              onClick={() => updateStatus(inv.id, "accepted")}
                            >
                              Accept
                            </button>
                            <button
                              className="ebm-status-btn ebm-status-btn-decline"
                              disabled={updatingId === inv.id}
                              onClick={() => updateStatus(inv.id, "declined")}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ebm-backdrop">
          <div className={`ebm-card ${step === "preview" ? "ebm-card-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
            {sending && (
              <div className="ebm-overlay">
                <div className="ebm-spinner" />
                <div className="ebm-overlay-title">Sending invitation...</div>
                <div className="ebm-overlay-sub">Delivering branded email</div>
              </div>
            )}
            <div className="ebm-header">
              <div className="ebm-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div className="ebm-header-text">
                <h3>{step === "form" ? "Editorial Board Invitation" : "Preview Email"}</h3>
                <p>{step === "form" ? "Fill in the invitee details" : `To: ${email}`}</p>
              </div>
              <button className="ebm-close" onClick={() => { setShowModal(false); setStep("form"); }} disabled={sending} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {step === "form" ? (
              <div>
                <div className="ebm-body">
                  {error && (
                    <div className="ebm-error" style={{ marginBottom: 16 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}

                  <div className="ebm-field">
                    <label className="ebm-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      Email
                    </label>
                    <input type="email" className="ebm-input" value={prepEmail} onChange={(e) => setPrepEmail(e.target.value)} placeholder="name@university.edu" />
                  </div>

                  <div className="ebm-field">
                    <label className="ebm-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Researcher Profile
                    </label>
                    <textarea
                      className="ebm-textarea"
                      style={{ minHeight: 200, fontSize: 13 }}
                      placeholder={"Paste everything about the researcher here:\n\n- Google Scholar page\n- ResearchGate profile\n- ORCID page\n- University faculty page\n- Publication list\n- Bio / CV\n\nAll together, as much as possible."}
                      value={prepText}
                      onChange={(e) => setPrepText(e.target.value)}
                    />
                    <div className="ebm-hint" style={{ marginTop: 6 }}>
                      After copying, paste into Claude Code. It will analyze the profile, generate an HTML preview of the invitation letter, and send it via the API.
                    </div>
                  </div>
                </div>

                <div className="ebm-footer">
                  <button type="button" className="ebm-btn ebm-btn-cancel" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                  <button
                    type="button"
                    className="ebm-btn ebm-btn-send"
                    disabled={!prepEmail.trim() || !prepText.trim()}
                    onClick={handleCopyForClaude}
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        Copy for Claude Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="ebm-to-line">
                  <strong>To:</strong> {fullName.trim()} &lt;{email}&gt; &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Subject:</strong> Invitation to Join the Editorial Board | American Impact Review
                </div>
                <div className="ebm-preview-wrap" dangerouslySetInnerHTML={{ __html: buildPreviewHtml({ fullName, title, email, affiliation, expertiseArea, achievements }) }} />
                <div className="ebm-footer" style={{ paddingTop: 16 }}>
                  <button type="button" className="ebm-btn ebm-btn-back" onClick={() => setStep("form")} disabled={sending}>
                    ← Edit
                  </button>
                  <button type="button" className="ebm-btn ebm-btn-send" onClick={handleSend} disabled={sending}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Confirm & Send
                  </button>
                </div>
                {error && (
                  <div style={{ padding: "0 24px 16px" }}>
                    <div className="ebm-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
