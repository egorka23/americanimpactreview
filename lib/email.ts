import { Resend } from "resend";

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
  const subject = `Reviewer application: ${payload.fullName}`;
  const html = `
    <h2>Reviewer Application</h2>
    <p><strong>Name:</strong> ${payload.fullName}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Affiliation:</strong> ${payload.affiliation}</p>
    <p><strong>Discipline:</strong> ${payload.discipline}</p>
    <p><strong>Keywords:</strong> ${payload.keywords}</p>
    <hr />
    <p><strong>Highest degree:</strong> ${payload.degree || "-"}</p>
    <p><strong>ORCID / profile:</strong> ${payload.orcid || "-"}</p>
    <p><strong>Publications / Scholar:</strong> ${payload.publications || "-"}</p>
    <p><strong>Review history:</strong> ${payload.reviewHistory || "-"}</p>
    <p><strong>Manuscript types:</strong> ${payload.manuscriptTypes || "-"}</p>
    <p><strong>Conflicts:</strong> ${payload.conflicts || "-"}</p>
    <p><strong>Ethics agreement:</strong> ${payload.ethics ? "Yes" : "No"}</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: reviewerInbox,
    subject,
    html,
    replyTo: payload.email,
  });
}

export async function sendSubmissionEmail(payload: {
  submissionId: string;
  title: string;
  abstract: string;
  category: string;
  keywords?: string | null;
  coverLetter?: string | null;
  conflictOfInterest?: string | null;
  manuscriptUrl?: string | null;
  manuscriptName?: string | null;
  authorEmail?: string | null;
  authorName?: string | null;
}) {
  if (!resendFrom || !submissionsInbox) {
    throw new Error("RESEND_FROM or SUBMISSIONS_INBOX is not set");
  }
  const resend = getResend();
  const subject = `New submission: ${payload.title}`;
  const html = `
    <h2>New Manuscript Submission</h2>
    <p><strong>Submission ID:</strong> ${payload.submissionId}</p>
    <p><strong>Title:</strong> ${payload.title}</p>
    <p><strong>Category:</strong> ${payload.category}</p>
    <p><strong>Author:</strong> ${payload.authorName || "-"} (${payload.authorEmail || "-"})</p>
    <hr />
    <p><strong>Abstract:</strong></p>
    <p>${payload.abstract}</p>
    <p><strong>Keywords:</strong> ${payload.keywords || "-"}</p>
    <p><strong>Cover letter:</strong> ${payload.coverLetter || "-"}</p>
    <p><strong>Conflict of interest:</strong> ${payload.conflictOfInterest || "-"}</p>
    <p><strong>Manuscript file:</strong> ${
      payload.manuscriptUrl
        ? `<a href="${payload.manuscriptUrl}">${payload.manuscriptName || "Download manuscript"}</a>`
        : "No file uploaded"
    }</p>
  `;

  await resend.emails.send({
    from: resendFrom,
    to: submissionsInbox,
    subject,
    html,
    replyTo: payload.authorEmail || undefined,
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
        <div style="display:inline-block;width:44px;height:44px;border-radius:50%;border:1.5px solid #c0b8a8;text-align:center;line-height:44px;margin-bottom:12px;">
          <div style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1.5px solid #b5432a;vertical-align:middle;"></div>
        </div>
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
            <td style="padding:6px 0;color:#0a1628;font-weight:600;">${payload.submissionId}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Title</td>
            <td style="padding:6px 0;color:#0a1628;font-weight:500;">${payload.title}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Category</td>
            <td style="padding:6px 0;color:#0a1628;">${payload.category}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;vertical-align:top;">Manuscript</td>
            <td style="padding:6px 0;color:#0a1628;">${payload.manuscriptName || "No file attached"}</td>
          </tr>
        </table>
      </div>

      <!-- What happens next -->
      <h2 style="font-size:16px;color:#0a1628;margin:0 0 14px;">What happens next</h2>
      <div style="font-size:14px;color:#334155;line-height:1.7;">
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#b5432a;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">1</span>
          <span><strong>Initial screening</strong> (3-5 business days): our editors verify formatting, scope, and ethical compliance.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#b5432a;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">2</span>
          <span><strong>Peer review</strong> (2-4 weeks): independent reviewers evaluate your work.</span>
        </div>
        <div style="display:flex;margin-bottom:10px;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#b5432a;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">3</span>
          <span><strong>Decision</strong>: accept, revise, or reject. You will be notified by email.</span>
        </div>
        <div style="display:flex;margin-bottom:0;">
          <span style="display:inline-block;min-width:24px;height:24px;line-height:24px;text-align:center;background:#b5432a;color:#fff;border-radius:50%;font-size:12px;font-weight:700;margin-right:12px;">4</span>
          <span><strong>Publication</strong>: accepted articles go live within 24 hours with a permanent DOI.</span>
        </div>
      </div>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #e2e0dc;margin:28px 0;" />

      <!-- Footer note -->
      <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 4px;">
        If you have questions about your submission, reply to this email or contact us at
        <a href="mailto:egor@americanimpactreview.com" style="color:#b5432a;text-decoration:none;">egor@americanimpactreview.com</a>.
      </p>
    </div>

    <!-- Email footer -->
    <div style="text-align:center;padding:20px 0;font-size:11px;color:#94a3b8;">
      American Impact Review &middot; Published by Global Talent Foundation 501(c)(3)<br />
      7613 Elmwood Ave 628241, Middleton, WI 53562, USA
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: resendFrom,
      to: payload.authorEmail,
      subject: `Submission received: ${payload.title}`,
      html: confirmHtml,
      replyTo: "egor@americanimpactreview.com",
    });
  }
}
