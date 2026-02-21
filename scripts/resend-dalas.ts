/**
 * Regenerate review copy for Akimov HSP70 article and send to dalas310516@gmail.com
 */
import fs from "fs";
import path from "path";

// Load env
const envPath = "/Users/aeb/Desktop/americanimpactreview/.env.local";
const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1 || line.startsWith("#")) continue;
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  val = val.replace(/[\r\n]+$/, '').replace(/\\n$/, '');
  if (key) process.env[key] = val;
}

import { createClient } from "@libsql/client";
import { generateReviewCopyPdf } from "../lib/generate-review-pdf";
import { put } from "@vercel/blob";
import { Resend } from "resend";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY!);

async function main() {
  const assignmentId = "f5cbfa45-44f3-4d4b-9f2f-e2b3babf176c";

  // Get assignment + submission + reviewer
  const { rows } = await db.execute({
    sql: `SELECT ra.id, ra.due_at, r.name as reviewer_name, r.email as reviewer_email,
                 s.id as sub_id, s.title, s.article_type, s.keywords, s.category, s.abstract,
                 s.manuscript_url, s.co_authors, s.user_id, s.created_at as received
          FROM review_assignments ra
          JOIN reviewers r ON ra.reviewer_id = r.id
          JOIN submissions s ON ra.submission_id = s.id
          WHERE ra.id = ?`,
    args: [assignmentId],
  });

  const a = rows[0] as any;
  console.log("Assignment:", a.reviewer_email, "→", a.title?.toString().slice(0, 60));

  // Get author name
  const { rows: userRows } = await db.execute({
    sql: "SELECT name FROM users WHERE id = ?",
    args: [a.user_id],
  });
  let authors = userRows[0]?.name?.toString() || "Unknown";
  if (a.co_authors) {
    try {
      const co = JSON.parse(a.co_authors.toString());
      if (Array.isArray(co) && co.length > 0) {
        authors += ", " + co.map((c: any) => c.name).join(", ");
      }
    } catch {}
  }

  // Download manuscript docx
  const msUrl = a.manuscript_url?.toString();
  console.log("Manuscript URL:", msUrl?.slice(0, 80));

  let docxBuffer: Buffer | undefined;
  if (msUrl?.startsWith("http")) {
    const res = await fetch(msUrl);
    if (res.ok && (msUrl.endsWith(".docx") || msUrl.endsWith(".doc"))) {
      docxBuffer = Buffer.from(await res.arrayBuffer());
      console.log("Downloaded docx:", (docxBuffer.length / 1024).toFixed(1), "KB");
    }
  }

  if (!docxBuffer) {
    console.error("Could not get docx!");
    process.exit(1);
  }

  // Generate manuscript ID
  const msId = `AIR-${a.sub_id?.toString().slice(0, 8).toUpperCase()}`;
  const pdfFilename = `${msId}-${assignmentId.slice(0, 8)}.pdf`;

  console.log("Generating PDF:", pdfFilename);

  const pdfBytes = await generateReviewCopyPdf({
    docxBuffer,
    manuscriptId: msId,
    title: a.title?.toString() || "",
    authors,
    articleType: a.article_type?.toString() || "Original Research",
    keywords: a.keywords?.toString() || "",
    category: a.category?.toString() || "",
    abstract: a.abstract?.toString() || "",
    reviewerName: a.reviewer_name?.toString() || "",
    deadline: a.due_at ? String(a.due_at).slice(0, 10) : "",
    receivedDate: a.received ? String(a.received).slice(0, 10) : "",
  });

  // Save locally for inspection
  fs.writeFileSync("/tmp/dalas-review-copy.pdf", Buffer.from(pdfBytes));
  console.log("Local copy: /tmp/dalas-review-copy.pdf", (pdfBytes.length / 1024).toFixed(1), "KB");

  // Upload to Vercel Blob
  const blob = await put(`review-copies/${pdfFilename}`, Buffer.from(pdfBytes), {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  } as any);
  console.log("Uploaded to Blob:", blob.url);

  // Send email
  const reviewerName = a.reviewer_name?.toString() || "Reviewer";
  const reviewerEmail = a.reviewer_email?.toString() || "";
  const title = a.title?.toString() || "";

  console.log("Sending email to:", reviewerEmail);

  const { data, error } = await resend.emails.send({
    from: "American Impact Review <noreply@americanimpactreview.com>",
    to: [reviewerEmail],
    subject: `Updated Review Copy: ${title.slice(0, 60)}`,
    html: `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://americanimpactreview.com/logo-email.png" alt="AIR" style="height: 48px;" />
        </div>
        <h2 style="color: #0a1628; font-size: 18px;">Updated Manuscript Review Copy</h2>
        <p>Dear ${reviewerName},</p>
        <p>Please find the updated review copy of the manuscript below. This version includes improved table formatting.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold; width: 140px;">Manuscript</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${msId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">Title</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${title}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${blob.url}" style="display: inline-block; padding: 12px 28px; background: #0a1628; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Review Copy (PDF)</a>
        </p>
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          This document is confidential. Do not distribute, cite, or upload to any AI tools.<br/>
          Please submit your review to <a href="mailto:egor@americanimpactreview.com">egor@americanimpactreview.com</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          American Impact Review | Published by Global Talent Foundation 501(c)(3)
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Email error:", error);
  } else {
    console.log("Email sent! ID:", data?.id);
  }
}

main().catch(console.error);
