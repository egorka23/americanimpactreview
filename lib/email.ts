import { Resend } from "resend";
import { signAssignment } from "@/lib/review-tokens";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeEmail(email: string): string {
  return email.replace(/[\r\n]/g, "").trim();
}

/** Format "2026-02-28" → "February 28, 2026" */
function formatDateLong(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const reviewerInbox = process.env.REVIEWER_INBOX || process.env.RESEND_TO;
const submissionsInbox = process.env.SUBMISSIONS_INBOX || process.env.RESEND_TO;

function getResend() {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(resendApiKey);
}

export async function sendReviewerApplicationEmail(payload: {
  fullName: string;
  email: string;
  affiliation: string;
  discipline: string;
  keywords: string;
  degree?: string;
  orcid?: string;
  publications?: string;
  reviewHistory?: string;
  manuscriptTypes?: string;
  conflicts?: string;
  ethics?: string;
}) {
  if (!resendFrom || !reviewerInbox) {
    throw new Error("RESEND_FROM or REVIEWER_INBOX is not set");
  }
  const resend = getResend();
  const e = (s: string) => escapeHtml(s);
  const subject = `Reviewer application: ${payload.fullName}`;
  const html = `
    <h2>Reviewer Application</h2>
    <p><strong>Name:</strong> ${e(payload.fullName)}</p>
    <p><strong>Email:</strong> ${e(payload.email)}</p>
    <p><strong>Affiliation:</strong> ${e(payload.affiliation)}</p>
    <p><strong>Discipline:</strong> ${e(payload.discipline)}</p>
    <p><strong>Keywords:</strong> ${e(payload.keywords)}</p>
    <hr />
    <p><strong>Highest degree:</strong> ${e(payload.degree || "-")}</p>
    <p><strong>ORCID / profile:</strong> ${e(payload.orcid || "-")}</p>
    <p><strong>Publications / Scholar:</strong> ${e(payload.publications || "-")}</p>
    <p><strong>Review history:</strong> ${e(payload.reviewHistory || "-")}</p>
    <p><strong>Manuscript types:</strong> ${e(payload.manuscriptTypes || "-")}</p>
    <p><strong>Conflicts:</strong> ${e(payload.conflicts || "-")}</p>
    <p><strong>Ethics agreement:</strong> ${payload.ethics ? "Yes" : "No"}</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: reviewerInbox,
    subject,
    html,
    replyTo: sanitizeEmail(payload.email),
  });
}

export async function sendSubmissionEmail(payload: {
  submissionId: string;
  title: string;
  abstract: string;
  category: string;
  articleType: string;
  keywords?: string | null;
  coverLetter?: string | null;
  conflictOfInterest?: string | null;
  manuscriptUrl?: string | null;
  manuscriptName?: string | null;
  authorEmail?: string | null;
  authorName?: string | null;
  authorAffiliation?: string | null;
  coAuthors?: string | null;
  fundingStatement?: string | null;
  ethicsApproval?: string | null;
  dataAvailability?: string | null;
  aiDisclosure?: string | null;
}) {
  if (!resendFrom || !submissionsInbox) {
    throw new Error("RESEND_FROM or SUBMISSIONS_INBOX is not set");
  }
  const resend = getResend();

  // Parse co-authors for display
  let coAuthorCount = 0;
  let coAuthorList = "";
  if (payload.coAuthors) {
    try {
      const parsed = JSON.parse(payload.coAuthors) as Array<{ name: string; email: string; affiliation?: string; orcid?: string }>;
      coAuthorCount = parsed.length;
      coAuthorList = parsed.map((ca) =>
        `${escapeHtml(ca.name)} (${escapeHtml(ca.email)}${ca.affiliation ? `, ${escapeHtml(ca.affiliation)}` : ""}${ca.orcid ? `, ORCID: ${escapeHtml(ca.orcid)}` : ""})`
      ).join("<br />");
    } catch { /* ignore parse errors */ }
  }

  const subject = `New submission: ${escapeHtml(payload.title)}`;
  const html = `
    <h2>New Manuscript Submission</h2>
    <p><strong>Submission ID:</strong> ${escapeHtml(payload.submissionId)}</p>
    <p><strong>Title:</strong> ${escapeHtml(payload.title)}</p>
    <p><strong>Article Type:</strong> ${escapeHtml(payload.articleType)}</p>
    <p><strong>Category:</strong> ${escapeHtml(payload.category)}</p>
    <p><strong>Author:</strong> ${escapeHtml(payload.authorName || "-")} (${escapeHtml(payload.authorEmail || "-")})</p>
    <p><strong>Affiliation:</strong> ${escapeHtml(payload.authorAffiliation || "-")}</p>
    <hr />
    <p><strong>Abstract:</strong></p>
    <p>${escapeHtml(payload.abstract)}</p>
    <p><strong>Keywords:</strong> ${escapeHtml(payload.keywords || "-")}</p>
    ${coAuthorCount > 0 ? `<p><strong>Co-authors (${coAuthorCount}):</strong><br />${coAuthorList}</p>` : "<p><strong>Co-authors:</strong> None</p>"}
    <hr />
    <p><strong>Ethics/IRB:</strong> ${escapeHtml(payload.ethicsApproval || "-")}</p>
    <p><strong>Funding:</strong> ${escapeHtml(payload.fundingStatement || "-")}</p>
    <p><strong>Data availability:</strong> ${escapeHtml(payload.dataAvailability || "-")}</p>
    <p><strong>AI disclosure:</strong> ${escapeHtml(payload.aiDisclosure || "-")}</p>
    <p><strong>Conflict of interest:</strong> ${escapeHtml(payload.conflictOfInterest || "-")}</p>
    <hr />
    <p><strong>Cover letter:</strong> ${escapeHtml(payload.coverLetter || "-")}</p>
    <p><strong>Manuscript file:</strong> ${
      payload.manuscriptUrl
        ? `<a href="${escapeHtml(payload.manuscriptUrl)}">${escapeHtml(payload.manuscriptName || "Download manuscript")}</a>`
        : "No file uploaded"
    }</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: submissionsInbox,
    subject,
    html,
    replyTo: payload.authorEmail ? sanitizeEmail(payload.authorEmail) : undefined,
  });

  // Confirmation email to author
  if (payload.authorEmail) {
    const confirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8f6f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 4px 24px rgba(10,22,40,0.06);">

      <!-- Logo area -->
      <div style="text-align:center;margin-bottom:32px;">
        <img src="https://americanimpactreview.com/logo-email.png" alt="AIR" width="48" height="48" style="display:block;margin:0 auto 12px;width:48px;height:48px;" />
        <div style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.01em;">American Impact Review</div>
        <div style="font-size:11px;color:#8a7e6e;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">A Peer-Reviewed Multidisciplinary Journal</div>
      </div>

      <!-- Heading -->
      <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Submission Received</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        Thank you for submitting your manuscript to American Impact Review.
      </p>

      <!-- Submission details -->
      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:130px;vertical-align:top;">Submission&nbsp;ID</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${escapeHtml(payload.submissionId)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Article Type</td>
            <td style="padding:6px 0;color:#0a1628;">${escapeHtml(payload.articleType)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${escapeHtml(payload.title)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Category</td>
            <td style="padding:6px 0;color:#0a1628;">${escapeHtml(payload.category)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Manuscript</td>
            <td style="padding:6px 0;color:#0a1628;">${escapeHtml(payload.manuscriptName || "No file attached")}</td>
          </tr>${coAuthorCount > 0 ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Co-authors</td>
            <td style="padding:6px 0;color:#0a1628;">${coAuthorCount} co-author${coAuthorCount > 1 ? "s" : ""}</td>
          </tr>` : ""}${payload.authorAffiliation ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Affiliation</td>
            <td style="padding:6px 0;color:#0a1628;">${escapeHtml(payload.authorAffiliation)}</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- What happens next -->
      <h2 style="font-size:16px;color:#0a1628;margin:0 0 14px;">What happens next</h2>
      <div style="font-size:14px;color:#334155;line-height:1.7;">
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span>
          <span><strong>Initial screening</strong> (3-5 business days): our editors verify formatting, scope, and ethical compliance.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span>
          <span><strong>Peer review</strong> (2-4 weeks): independent reviewers evaluate your work.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span>
          <span><strong>Decision</strong>: accept, revise, or reject. You will be notified by email.</span>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">4</span>
          <span><strong>Publication</strong>: accepted articles go live within 24 hours with a permanent DOI.</span>
        </div>
      </div>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <!-- Footer note -->
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 4px;">
        If you have questions about your submission, reply to this email or contact us at
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>.
      </p>
    </div>

    <!-- Email footer -->
    <div style="text-align:center;padding:20px 0;font-size:11px;color:#94a3b8;">
      American Impact Review &middot; 501(c)(3) nonprofit (Global Talent Foundation, EIN: 33-2266959)<br />
      7613 Elmwood Ave, Suite 628241, Middleton, WI 53562, USA
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: resendFrom,
      to: sanitizeEmail(payload.authorEmail),
      subject: `Submission received: ${payload.title}`,
      html: confirmHtml,
      replyTo: "egor@americanimpactreview.com",
    });
  }
}

export async function sendReviewerInviteEmail(payload: {
  reviewerName: string;
  reviewerEmail: string;
  submissionId: string;
  title: string;
  abstract: string;
  category: string;
  dueAt?: string | null;
}) {
  if (!resendFrom || !reviewerInbox) {
    throw new Error("RESEND_FROM or REVIEWER_INBOX is not set");
  }
  const resend = getResend();
  const e = (s: string) => escapeHtml(s);
  const subject = `Review invitation: ${e(payload.title)}`;
  const html = `
    <h2>Review Invitation</h2>
    <p>Dear ${e(payload.reviewerName)},</p>
    <p>You are invited to review the following submission:</p>
    <p><strong>Manuscript ID:</strong> ${e(payload.submissionId)}</p>
    <p><strong>Title:</strong> ${e(payload.title)}</p>
    <p><strong>Category:</strong> ${e(payload.category)}</p>
    <p><strong>Abstract:</strong></p>
    <p>${e(payload.abstract)}</p>
    <p><strong>Due date:</strong> ${e(payload.dueAt || "Not specified")}</p>
    <p>Please reply to confirm availability.</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.reviewerEmail),
    subject,
    html,
    replyTo: reviewerInbox,
  });
}

export async function sendReviewFeedbackEmail(payload: {
  reviewerName: string;
  reviewerEmail: string;
  submissionTitle: string;
  editorFeedback: string;
}) {
  if (!resendFrom || !reviewerInbox) {
    throw new Error("RESEND_FROM or REVIEWER_INBOX is not set");
  }
  const resend = getResend();
  const e = (s: string) => escapeHtml(s);
  const subject = `Review feedback: ${e(payload.submissionTitle)}`;
  const html = `
    <h2>Review Feedback</h2>
    <p>Dear ${e(payload.reviewerName)},</p>
    <p>Thank you for your review. The editor has requested revisions:</p>
    <p>${e(payload.editorFeedback)}</p>
    <p>Please reply with updated comments at your earliest convenience.</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.reviewerEmail),
    subject,
    html,
    replyTo: reviewerInbox,
  });
}

export async function sendReviewSubmissionEmail(payload: {
  reviewerName: string;
  reviewerEmail: string;
  submissionTitle: string;
  submissionId: string;
  recommendation?: string | null;
  score?: number | null;
  commentsToAuthor?: string | null;
  commentsToEditor?: string | null;
}) {
  if (!resendFrom || !submissionsInbox) {
    throw new Error("RESEND_FROM or SUBMISSIONS_INBOX is not set");
  }
  const resend = getResend();
  const e = (s: string) => escapeHtml(s);
  const html = brandedEmail(`
      <h1 style="font-size:20px;color:#0a1628;margin:0 0 8px;text-align:center;">Review Submitted</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 24px;">
        A reviewer has submitted feedback for a manuscript.
      </p>

      <div style="background:#f8f6f3;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:130px;vertical-align:top;">Manuscript&nbsp;ID</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${e(payload.submissionId)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;">${e(payload.submissionTitle)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Reviewer</td>
            <td style="padding:6px 0;color:#0a1628;">${e(payload.reviewerName)} (${e(payload.reviewerEmail)})</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Recommendation</td>
            <td style="padding:6px 0;color:#0a1628;">${e(payload.recommendation || "-")}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Score</td>
            <td style="padding:6px 0;color:#0a1628;">${payload.score ?? "-"}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:#334155;margin:0 0 6px;"><strong>Comments to author</strong></p>
      <div style="font-size:13px;color:#475569;line-height:1.7;background:#f8f6f3;border-radius:8px;padding:14px 16px;">
        ${e(payload.commentsToAuthor || "Not provided")}
      </div>

      <p style="font-size:14px;color:#334155;margin:18px 0 6px;"><strong>Comments to editor</strong></p>
      <div style="font-size:13px;color:#475569;line-height:1.7;background:#f8f6f3;border-radius:8px;padding:14px 16px;">
        ${e(payload.commentsToEditor || "Not provided")}
      </div>
  `);

  await resend.emails.send({
    from: resendFrom,
    to: submissionsInbox,
    subject: `Review submitted: ${e(payload.submissionTitle)}`,
    html,
    replyTo: sanitizeEmail(payload.reviewerEmail),
  });
}

// ---------------------------------------------------------------------------
// Email header/footer shared across branded emails
// ---------------------------------------------------------------------------

const emailHeader = `
      <div style="text-align:center;margin-bottom:32px;">
        <img src="https://americanimpactreview.com/logo-email.png" alt="AIR" width="48" height="48" style="display:block;margin:0 auto 12px;width:48px;height:48px;" />
        <div style="font-size:18px;font-weight:700;color:#0a1628;letter-spacing:-0.01em;">American Impact Review</div>
        <div style="font-size:11px;color:#8a7e6e;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">A Peer-Reviewed Multidisciplinary Journal</div>
      </div>`;

const emailFooter = `
    <div style="text-align:center;padding:20px 0;font-size:11px;color:#94a3b8;">
      American Impact Review &middot; 501(c)(3) nonprofit (Global Talent Foundation, EIN: 33-2266959)<br />
      7613 Elmwood Ave, Suite 628241, Middleton, WI 53562, USA
    </div>`;

function brandedEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @media only screen and (max-width: 480px) {
      .email-outer { padding: 16px 8px !important; }
      .email-card { padding: 24px 18px !important; border-radius: 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f8f6f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div class="email-outer" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div class="email-card" style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 4px 24px rgba(10,22,40,0.06);">
      ${emailHeader}
      ${bodyHtml}
    </div>
    ${emailFooter}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Review invitation (editor -> reviewer)
// ---------------------------------------------------------------------------

function titleCaseName(name: string): string {
  return name.replace(/\b[a-zA-Z]/g, (ch, i, str) => {
    // Capitalize first letter of each word
    if (i === 0 || /\s/.test(str[i - 1])) return ch.toUpperCase();
    return ch;
  });
}

export async function sendReviewInvitation(payload: {
  reviewerName: string;
  reviewerEmail: string;
  articleTitle: string;
  articleId: string;
  abstract: string;
  deadline: string;
  manuscriptUrl?: string;
  editorNote?: string;
  assignmentId?: string;
}) {
  if (!resendFrom) throw new Error("RESEND_FROM is not set");
  const resend = getResend();

  const reviewerName = titleCaseName(payload.reviewerName.trim());

  // Remove duplicated trailing text from abstract.
  // The DB sometimes stores abstracts with the tail repeated, e.g.
  // "...accountability gap in algorithmic governance. of 2,400 adults, ..."
  // Strategy: find the longest suffix of the string that also appears earlier.
  const dedupeAbstract = (text: string) => {
    const t = text.trim();
    // Try progressively longer suffixes (min 40 chars to avoid false positives)
    for (let len = Math.floor(t.length / 2); len >= 40; len--) {
      const suffix = t.slice(-len).toLowerCase();
      const idx = t.toLowerCase().indexOf(suffix);
      // If the suffix appears earlier than where it starts at the end, it's a dupe
      if (idx >= 0 && idx < t.length - len) {
        return t.slice(0, t.length - len).trimEnd();
      }
    }
    return t;
  };
  const cleanAbstract = dedupeAbstract(payload.abstract);

  const html = brandedEmail(`
      <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Invitation to Serve as Peer Reviewer</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        Formal invitation to review a manuscript for American Impact Review
      </p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Dear ${escapeHtml(reviewerName)},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        On behalf of the editorial board of <strong>American Impact Review</strong>, a peer-reviewed, open-access journal operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959), I am writing to formally invite you to serve as an <strong>individual peer reviewer</strong> for the following manuscript.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        You were selected for this review based on your <strong>recognized expertise and publication record</strong> in the subject area of this manuscript. Our editorial board identifies and invites reviewers whose scholarly work demonstrates direct relevance to the research under consideration. You are being invited as one of two to three independent reviewers for this submission.
      </p>

      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top;">Manuscript&nbsp;ID</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${escapeHtml(payload.articleId)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${escapeHtml(payload.articleTitle)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Review&nbsp;type</td>
            <td style="padding:6px 0;color:#0a1628;">Single-blind peer review</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Review&nbsp;deadline</td>
            <td style="padding:6px 0;color:#1e3a5f;font-weight:600;">${formatDateLong(payload.deadline)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:#334155;line-height:1.7;"><strong>Abstract:</strong></p>
      <p style="font-size:13px;color:#475569;line-height:1.7;background:#f8f6f3;border-radius:8px;padding:16px;border-left:3px solid #1e3a5f;">
        ${escapeHtml(cleanAbstract)}
      </p>

      ${payload.manuscriptUrl ? `
      <div style="text-align:center;margin:24px 0 12px;">
        <a href="${escapeHtml(payload.manuscriptUrl)}" style="display:inline-block;padding:14px 32px;background:#1e3a5f;color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">&#8595;&ensp;Download Manuscript PDF</a>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0 0 8px;">PDF &middot; Confidential &middot; For Peer Review Only</p>` : ""}

      ${payload.editorNote ? `
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        <strong>Editor's note:</strong> ${escapeHtml(payload.editorNote)}
      </p>` : ""}

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Scope of your review</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        As a peer reviewer, you are asked to provide an independent expert evaluation of this scholarly work using our structured assessment form. Specifically, we request that you:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;line-height:1.7;">
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">1</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Evaluate the manuscript for <strong>originality, methodology, clarity, and significance</strong> within its field of study.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">2</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Provide a <strong>written assessment</strong> with constructive feedback, identifying strengths, weaknesses, and recommendations for improvement.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">3</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Submit a formal <strong>recommendation</strong> (accept, minor revision, major revision, or reject) based on your expert judgment.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">4</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Complete your review by <strong>${formatDateLong(payload.deadline)}</strong> using the secure review form linked below.</td>
        </tr>
      </table>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Your review will directly inform the editorial decision regarding this manuscript's suitability for publication. You will be notified of the final editorial decision once all reviews have been received and evaluated.
      </p>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Your response</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Please respond within <strong>5 business days</strong>. If you accept, you may begin your review immediately using the link below. If you are unable to review, please reply to this email to decline. We would appreciate a suggestion for an alternative reviewer with expertise in this subject area.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="https://americanimpactreview.com/review-form${payload.assignmentId ? `?token=${encodeURIComponent(signAssignment(payload.assignmentId))}` : ""}" style="display:inline-block;padding:12px 32px;background:#1e3a5f;color:#fff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">Accept &amp; Begin Review</a>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">To decline, simply reply to this email.</p>

      <div style="background:#fef9f0;border-left:3px solid #d97706;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>Conflict of interest &amp; confidentiality:</strong> Before accepting, please consider whether any conflicts of interest may affect your impartiality, including current or recent collaboration with the authors, shared institutional affiliation, or any financial interest related to this work. If a conflict exists, please decline this invitation. The manuscript and all review materials are strictly confidential. Please do not share, cite, or distribute any part of this submission or use its content for personal advantage. Do not upload the manuscript to AI or large language model tools.
      </div>

      <p style="font-size:13px;color:#475569;line-height:1.6;">
        For detailed evaluation criteria and our review policies, please visit our
        <a href="https://americanimpactreview.com/reviewer-guidelines" style="color:#1e3a5f;text-decoration:none;font-weight:500;">Reviewer Guidelines</a> and
        <a href="https://americanimpactreview.com/reviewers" style="color:#1e3a5f;text-decoration:none;font-weight:500;">Peer Reviewers</a> page.
      </p>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <div style="background:#f8f6f3;border-radius:10px;padding:16px 20px;margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
        <strong style="color:#0a1628;">About American Impact Review</strong><br />
        American Impact Review is a peer-reviewed, open-access multidisciplinary journal accepting original research across 12+ disciplines, operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959). All articles receive DOI assignment and are published under Creative Commons CC BY 4.0 licensing. Our peer review process adheres to the guidelines of the <a href="https://publicationethics.org" style="color:#1e3a5f;text-decoration:none;">Committee on Publication Ethics (COPE)</a>.<br />
        <a href="https://americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">americanimpactreview.com</a>
      </div>

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        Egor Akimov, PhD<br />
        Editor-in-Chief, American Impact Review<br />
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>
      </p>`);

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.reviewerEmail),
    subject: `Review invitation: ${payload.articleTitle}`,
    html,
    replyTo: "egor@americanimpactreview.com",
  });
}

// ---------------------------------------------------------------------------
// Editorial decision (editor -> author)
// ---------------------------------------------------------------------------

export type EditorialDecision = "accept" | "minor_revision" | "major_revision" | "reject";

const decisionLabels: Record<EditorialDecision, { heading: string; color: string; message: string }> = {
  accept: {
    heading: "Manuscript Accepted",
    color: "#059669",
    message: "We are pleased to inform you that your manuscript has been accepted for publication in American Impact Review.",
  },
  minor_revision: {
    heading: "Minor Revisions Required",
    color: "#d97706",
    message: "Your manuscript has been reviewed and the reviewers recommend minor revisions before it can be accepted for publication.",
  },
  major_revision: {
    heading: "Major Revisions Required",
    color: "#ea580c",
    message: "Your manuscript has been reviewed and the reviewers recommend major revisions. Please address all reviewer comments and resubmit your revised manuscript.",
  },
  reject: {
    heading: "Manuscript Not Accepted",
    color: "#dc2626",
    message: "After careful consideration, we regret to inform you that your manuscript does not meet the criteria for publication in American Impact Review at this time.",
  },
};

export async function sendEditorialDecision(payload: {
  authorName: string;
  authorEmail: string;
  articleTitle: string;
  articleId: string;
  decision: EditorialDecision;
  reviewerComments?: string;
  editorComments?: string;
  revisionDeadline?: string;
}) {
  if (!resendFrom) throw new Error("RESEND_FROM is not set");
  const resend = getResend();

  const d = decisionLabels[payload.decision];

  const nextSteps: Record<EditorialDecision, string> = {
    accept: `
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span>
          <span>You will receive a publication fee invoice ($200 USD).</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span>
          <span>After payment, your article will be formatted and published within 24 hours.</span>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span>
          <span>You will receive a publication certificate and permanent article URL.</span>
        </div>`,
    minor_revision: `
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span>
          <span>Address the reviewer comments below and revise your manuscript.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span>
          <span>Reply to this email with your revised manuscript and a point-by-point response letter attached${payload.revisionDeadline ? ` by <strong>${escapeHtml(payload.revisionDeadline)}</strong>` : ""}.</span>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span>
          <span>Your revision will be evaluated by the editor (no second peer review expected).</span>
        </div>`,
    major_revision: `
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span>
          <span>Carefully address all reviewer comments and revise your manuscript.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span>
          <span>Reply to this email with your revised manuscript and a detailed point-by-point response letter attached${payload.revisionDeadline ? ` by <strong>${escapeHtml(payload.revisionDeadline)}</strong>` : ""}.</span>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:${d.color};color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span>
          <span>Your revision will undergo a second round of peer review.</span>
        </div>`,
    reject: `
        <p style="font-size:14px;color:#334155;line-height:1.7;">
          We encourage you to consider the reviewer feedback and, if appropriate, submit a substantially revised version as a new submission in the future.
        </p>`,
  };

  const html = brandedEmail(`
      <h1 style="font-size:22px;color:${d.color};margin:0 0 8px;text-align:center;">${d.heading}</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        Editorial decision for your manuscript
      </p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Dear ${escapeHtml(payload.authorName)},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        ${d.message}
      </p>

      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top;">Manuscript&nbsp;ID</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${escapeHtml(payload.articleId)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${escapeHtml(payload.articleTitle)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Decision</td>
            <td style="padding:6px 0;color:${d.color};font-weight:700;">${d.heading}</td>
          </tr>${payload.revisionDeadline ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Revision&nbsp;deadline</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${escapeHtml(payload.revisionDeadline)}</td>
          </tr>` : ""}
        </table>
      </div>

      ${payload.reviewerComments ? `
      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Reviewer Comments</h2>
      <div style="font-size:13px;color:#475569;line-height:1.7;background:#f8f6f3;border-radius:8px;padding:16px;border-left:3px solid ${d.color};">
        ${escapeHtml(payload.reviewerComments).replace(/\n/g, "<br />")}
      </div>` : ""}

      ${payload.editorComments ? `
      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Editor's Comments</h2>
      <div style="font-size:13px;color:#475569;line-height:1.7;background:#f8f6f3;border-radius:8px;padding:16px;border-left:3px solid #0a1628;">
        ${escapeHtml(payload.editorComments).replace(/\n/g, "<br />")}
      </div>` : ""}

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Next Steps</h2>
      <div style="font-size:14px;color:#334155;line-height:1.7;">
        ${nextSteps[payload.decision]}
      </div>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        If you have questions, reply to this email or contact us at
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>.
      </p>`);

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.authorEmail),
    subject: `Editorial decision: ${payload.articleTitle}`,
    html,
    replyTo: "egor@americanimpactreview.com",
  });
}

export async function sendPasswordResetEmail(payload: {
  name: string;
  email: string;
  resetUrl: string;
}) {
  if (!resendFrom) throw new Error("RESEND_FROM is not set");
  const resend = getResend();

  const html = brandedEmail(`
      <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Reset Your Password</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        A password reset was requested for your account.
      </p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Hi ${escapeHtml(payload.name)},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Click the button below to reset your password. If you didn&rsquo;t request this, you can safely ignore this email.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${escapeHtml(payload.resetUrl)}" style="display:inline-block;padding:14px 36px;background:#0a1628;color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">Reset Password</a>
      </div>

      <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="font-size:13px;color:#92400e;margin:0;line-height:1.5;">
          <strong>Tip:</strong> Check your spam/junk folder &mdash; password reset emails sometimes end up there.
        </p>
      </div>

      <p style="font-size:13px;color:#64748b;line-height:1.6;">
        This link expires in <strong>1 hour</strong>. After that, you&rsquo;ll need to request a new one.
      </p>

      <p style="font-size:12px;color:#94a3b8;line-height:1.5;word-break:break-all;">
        If the button doesn&rsquo;t work, copy and paste this URL into your browser:<br />
        ${escapeHtml(payload.resetUrl)}
      </p>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        If you have questions, contact us at
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>.
      </p>`);

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.email),
    subject: "Reset your password | American Impact Review",
    html,
    replyTo: "egor@americanimpactreview.com",
  });
}

export async function sendContactEmail(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  if (!resendFrom || !submissionsInbox) {
    throw new Error("RESEND_FROM or SUBMISSIONS_INBOX is not set");
  }
  const resend = getResend();

  const html = `
    <h2>Contact Form Message</h2>
    <p><strong>From:</strong> ${escapeHtml(payload.name)} (${escapeHtml(payload.email)})</p>
    <p><strong>Subject:</strong> ${escapeHtml(payload.subject)}</p>
    <hr />
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: submissionsInbox,
    subject: `Contact: ${payload.subject}`,
    html,
    replyTo: sanitizeEmail(payload.email),
  });
}

// ---------------------------------------------------------------------------
// Peer review submission (reviewer -> editorial office)
// ---------------------------------------------------------------------------

export async function sendPaymentLinkEmail(payload: {
  authorName: string;
  authorEmail: string;
  articleTitle: string;
  amount: number; // cents
  checkoutUrl: string;
}) {
  if (!resendFrom) throw new Error("RESEND_FROM is not set");
  const resend = getResend();

  const dollars = (payload.amount / 100).toFixed(2);

  const html = brandedEmail(`
      <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Publication Fee</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        Payment required for your accepted manuscript
      </p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Dear ${escapeHtml(payload.authorName)},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Your manuscript has been accepted for publication in American Impact Review. To proceed with formatting and publication, please complete the publication fee payment below.
      </p>

      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:120px;vertical-align:top;">Article</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${escapeHtml(payload.articleTitle)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Amount</td>
            <td style="padding:6px 0;color:#059669;font-weight:700;font-size:1.1em;">$${dollars} USD</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${escapeHtml(payload.checkoutUrl)}" style="display:inline-block;padding:14px 36px;background:#059669;color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">Pay Now</a>
      </div>

      <p style="font-size:12px;color:#94a3b8;line-height:1.5;word-break:break-all;text-align:center;">
        If the button doesn&rsquo;t work, copy and paste this URL:<br />
        ${escapeHtml(payload.checkoutUrl)}
      </p>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        If you have questions about this payment, reply to this email or contact us at
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>.
      </p>`);

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.authorEmail),
    subject: `Publication fee: ${payload.articleTitle}`,
    html,
    replyTo: "egor@americanimpactreview.com",
  });
}

export async function sendPeerReviewEmail(payload: {
  reviewerName: string;
  reviewerEmail: string;
  manuscriptId: string;
  recommendation: string;
  // Section evaluations
  objectivesClear?: string;
  literatureAdequate?: string;
  introComments?: string;
  methodsReproducible?: string;
  statisticsAppropriate?: string;
  methodsComments?: string;
  resultsPresentation?: string;
  tablesAppropriate?: string;
  resultsComments?: string;
  conclusionsSupported?: string;
  limitationsStated?: string;
  discussionComments?: string;
  // Overall ratings
  originality?: string;
  methodology?: string;
  clarity?: string;
  significance?: string;
  languageEditing?: string;
  // Feedback
  majorIssues?: string;
  minorIssues?: string;
  commentsToAuthors?: string;
  confidentialComments?: string;
}) {
  if (!resendFrom || !submissionsInbox) {
    throw new Error("RESEND_FROM or SUBMISSIONS_INBOX is not set");
  }
  const resend = getResend();

  const yn = (label: string, val?: string) => val ? `<td style="padding:4px 12px 4px 0;color:#334155;">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600;color:#0a1628;">${escapeHtml(val)}</td>` : "";
  const sectionRows = [
    yn("Objectives clear", payload.objectivesClear),
    yn("Literature adequate", payload.literatureAdequate),
    yn("Methods reproducible", payload.methodsReproducible),
    yn("Statistics appropriate", payload.statisticsAppropriate),
    yn("Results clear", payload.resultsPresentation),
    yn("Tables/figures appropriate", payload.tablesAppropriate),
    yn("Conclusions supported", payload.conclusionsSupported),
    yn("Limitations stated", payload.limitationsStated),
    yn("Language editing needed", payload.languageEditing),
  ].filter(Boolean).map((r) => `<tr>${r}</tr>`).join("");

  const ratings = [
    payload.originality ? `Originality: ${escapeHtml(payload.originality)}` : null,
    payload.methodology ? `Methodology: ${escapeHtml(payload.methodology)}` : null,
    payload.clarity ? `Clarity: ${escapeHtml(payload.clarity)}` : null,
    payload.significance ? `Significance: ${escapeHtml(payload.significance)}` : null,
  ].filter(Boolean);

  const commentBlock = (label: string, text?: string) =>
    text ? `<p><strong>${escapeHtml(label)}:</strong></p><p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>` : "";

  const html = `
    <h2>Peer Review Received</h2>
    <p><strong>Reviewer:</strong> ${escapeHtml(payload.reviewerName)} (${escapeHtml(payload.reviewerEmail)})</p>
    <p><strong>Manuscript ID:</strong> ${escapeHtml(payload.manuscriptId)}</p>
    <p><strong>Recommendation:</strong> <span style="font-weight:700;font-size:1.1em;">${escapeHtml(payload.recommendation)}</span></p>
    ${ratings.length ? `<p><strong>Ratings:</strong> ${ratings.join(" | ")}</p>` : ""}

    ${sectionRows ? `<hr /><h3>Section-by-Section Evaluation</h3><table style="border-collapse:collapse;font-size:14px;">${sectionRows}</table>` : ""}

    ${payload.introComments ? `${commentBlock("Introduction comments", payload.introComments)}` : ""}
    ${payload.methodsComments ? `${commentBlock("Methods comments", payload.methodsComments)}` : ""}
    ${payload.resultsComments ? `${commentBlock("Results comments", payload.resultsComments)}` : ""}
    ${payload.discussionComments ? `${commentBlock("Discussion comments", payload.discussionComments)}` : ""}

    <hr />
    ${commentBlock("Major Issues", payload.majorIssues)}
    ${commentBlock("Minor Issues", payload.minorIssues)}
    ${commentBlock("Comments to Authors", payload.commentsToAuthors)}
    ${payload.confidentialComments ? `<hr /><p style="color:#1e3a5f;font-weight:700;">CONFIDENTIAL - Editor Only:</p><p>${escapeHtml(payload.confidentialComments).replace(/\n/g, "<br />")}</p>` : ""} <!-- confidential label stays navy -->
  `;

  await resend.emails.send({
    from: resendFrom,
    to: submissionsInbox,
    subject: `Peer review: ${payload.manuscriptId} - ${payload.recommendation}`,
    html,
    replyTo: sanitizeEmail(payload.reviewerEmail),
  });
}

// ---------------------------------------------------------------------------
// Editorial Board invitation (editor -> invitee)
// ---------------------------------------------------------------------------

export async function sendEditorialBoardInvitation(payload: {
  fullName: string;
  email: string;
  title: string; // e.g. "PhD", "MD"
  affiliation: string;
  expertiseArea: string;
  achievements: string;
  trackingId?: string;
}) {
  if (!resendFrom) throw new Error("RESEND_FROM is not set");
  const resend = getResend();

  const name = titleCaseName(payload.fullName.trim());
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const html = brandedEmail(`
      <h1 style="font-size:22px;color:#0a1628;margin:0 0 8px;text-align:center;">Invitation to Join the Editorial Board</h1>
      <p style="font-size:14px;color:#64748b;text-align:center;margin:0 0 28px;">
        Formal invitation to serve as a member of the Editorial Board of American Impact Review
      </p>

      <p style="font-size:13px;color:#94a3b8;text-align:right;margin:0 0 20px;">${today}</p>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        Dear ${escapeHtml(name)},
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        On behalf of the editorial leadership of <strong>American Impact Review</strong>, a peer-reviewed, open-access journal operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959), I am writing to formally invite you to serve as a member of the <strong>Editorial Board</strong>.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        This invitation is extended in recognition of your distinguished expertise and scholarly contributions in the field of <strong>${escapeHtml(payload.expertiseArea)}</strong>. Your work, including ${escapeHtml(payload.achievements)}, reflects the caliber of scholarship and intellectual leadership that our journal seeks to represent on its Editorial Board. Our editorial team identified your profile through a careful review of leading researchers and practitioners whose expertise aligns with the journal's interdisciplinary mission.
      </p>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Role and responsibilities</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        The Editorial Board plays a vital role in upholding the quality, integrity, and scholarly rigor of the journal. As a Board member, your responsibilities would include:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;line-height:1.7;">
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">1</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Providing strategic guidance on the journal's editorial direction, scope, and standards within your area of expertise.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">2</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Reviewing and evaluating manuscripts as needed, particularly those that fall within your domain of specialization.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">3</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Advising on the selection and invitation of qualified peer reviewers for submitted manuscripts.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">4</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Contributing to the development of special issues, thematic collections, or editorial initiatives that advance the journal's mission.</td>
        </tr>
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 10px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#1e3a5f;color:#fff;border-radius:50%;font-size:12px;font-weight:700;">5</span>
          </td>
          <td style="vertical-align:top;padding-bottom:10px;">Serving as an ambassador for the journal within your professional and academic networks.</td>
        </tr>
      </table>

      <p style="font-size:14px;color:#334155;line-height:1.7;">
        We understand the demands on your time and have structured the Editorial Board role to be meaningful without being burdensome. Board members are typically asked to review two to four manuscripts per year and participate in periodic editorial consultations. Your name, affiliation, and biographical summary will be listed on the journal's website.
      </p>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Appointment details</h2>
      <div style="background:#f8f6f3;border-radius:12px;padding:20px 24px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:140px;vertical-align:top;">Position</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">Editorial Board Member</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Term</td>
            <td style="padding:6px 0;color:#0a1628;">Two years (renewable upon mutual agreement)</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Compensation</td>
            <td style="padding:6px 0;color:#0a1628;">Pro bono (honorary scholarly appointment)</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Affiliation listing</td>
            <td style="padding:6px 0;color:#0a1628;">${escapeHtml(name)}, ${escapeHtml(payload.title)}<br />${escapeHtml(payload.affiliation)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Date of invitation</td>
            <td style="padding:6px 0;color:#0a1628;">${today}</td>
          </tr>
        </table>
      </div>

      <div style="background:#f8f6f3;border-radius:10px;padding:16px 20px;margin:0 0 20px;font-size:13px;color:#475569;line-height:1.6;">
        <strong style="color:#0a1628;">About American Impact Review</strong><br />
        American Impact Review is a peer-reviewed, open-access multidisciplinary journal publishing original research across 12+ disciplines, operating under 501(c)(3) nonprofit status (Global Talent Foundation, EIN: 33-2266959). All articles receive DOI assignment and are published under Creative Commons CC BY 4.0 licensing. Our peer review process adheres to the guidelines of the <a href="https://publicationethics.org" style="color:#1e3a5f;text-decoration:none;">Committee on Publication Ethics (COPE)</a>.<br />
        <a href="https://americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">americanimpactreview.com</a>
      </div>

      <h2 style="font-size:16px;color:#0a1628;margin:28px 0 14px;">Your response</h2>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        If you wish to accept this invitation, please reply to this email confirming your interest, and we will provide you with onboarding materials and access to our editorial management system. If you are unable to serve at this time, we would welcome a recommendation of a colleague with relevant expertise.
      </p>
      <p style="font-size:14px;color:#334155;line-height:1.7;">
        We sincerely hope you will consider joining us in shaping a journal committed to rigorous, impactful, and accessible scholarship.
      </p>

      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
        Egor Akimov, PhD<br />
        Editor-in-Chief, American Impact Review<br />
        <a href="mailto:egor@americanimpactreview.com" style="color:#1e3a5f;text-decoration:none;">egor@americanimpactreview.com</a>
      </p>
      ${payload.trackingId ? `<img src="https://americanimpactreview.com/api/eb-track/${encodeURIComponent(payload.trackingId)}" width="1" height="1" style="display:block" alt="" />` : ""}`);

  await resend.emails.send({
    from: resendFrom,
    to: sanitizeEmail(payload.email),
    subject: `Invitation to Join the Editorial Board | American Impact Review`,
    html,
    replyTo: "egor@americanimpactreview.com",
  });
}
