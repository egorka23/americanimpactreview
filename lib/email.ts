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
}
