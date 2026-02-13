import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, reviewAssignments, reviewers, users } from "@/lib/db/schema";
import { isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { eq } from "drizzle-orm";
import { generateReviewCopyPdf } from "@/lib/generate-review-pdf";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const assignmentId = String(body.assignmentId || "").trim();
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
    }

    // Get assignment + reviewer + submission
    const [assignment] = await db
      .select()
      .from(reviewAssignments)
      .where(eq(reviewAssignments.id, assignmentId));
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, assignment.submissionId));
    const [reviewer] = await db
      .select()
      .from(reviewers)
      .where(eq(reviewers.id, assignment.reviewerId));

    if (!submission || !reviewer) {
      return NextResponse.json({ error: "Submission or reviewer not found" }, { status: 404 });
    }

    // Get author name
    const [author] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, submission.userId));

    // Parse co-authors
    let allAuthors = author?.name || "Unknown";
    if (submission.coAuthors) {
      try {
        const coArr = JSON.parse(submission.coAuthors);
        if (Array.isArray(coArr) && coArr.length > 0) {
          allAuthors += ", " + coArr.map((c: { name: string }) => c.name).join(", ");
        }
      } catch { /* ignore */ }
    }

    // Get manuscript content
    let docxBuffer: Buffer | undefined;
    let textContent: string | undefined;

    if (submission.manuscriptUrl) {
      const msUrl = submission.manuscriptUrl;
      if (msUrl.startsWith("http")) {
        // Download from Vercel Blob or external URL
        const res = await fetch(msUrl);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const isDocx = msUrl.endsWith(".docx") || msUrl.endsWith(".doc");
          if (isDocx) {
            docxBuffer = Buffer.from(arrayBuf);
          } else {
            // Treat as text/PDF link — use abstract as content
            textContent = submission.abstract || "";
          }
        }
      } else if (msUrl.startsWith("/")) {
        // Local file in public/
        const localPath = path.join(process.cwd(), "public", msUrl);
        if (fs.existsSync(localPath) && (msUrl.endsWith(".docx") || msUrl.endsWith(".doc"))) {
          docxBuffer = fs.readFileSync(localPath);
        }
      }
    }

    // If no docx found, try to use markdown from articles/
    if (!docxBuffer && !textContent) {
      const slug = getSlugFromTitle(submission.title);
      if (slug) {
        const mdPath = path.join(process.cwd(), "articles", `${slug}.md`);
        if (fs.existsSync(mdPath)) {
          textContent = fs.readFileSync(mdPath, "utf-8");
        }
      }
    }

    // Fallback to abstract
    if (!docxBuffer && !textContent) {
      textContent = submission.abstract || "(No manuscript content available)";
    }

    // Generate manuscript ID
    const slug = getSlugFromTitle(submission.title);
    const msId = slug ? `AIR-${slug.toUpperCase()}` : `AIR-${submission.id.slice(0, 8).toUpperCase()}`;

    // Generate PDF
    const pdfBytes = await generateReviewCopyPdf({
      docxBuffer,
      textContent,
      manuscriptId: msId,
      title: submission.title,
      authors: allAuthors,
      articleType: submission.articleType || "Original Research",
      keywords: submission.keywords || "",
      category: submission.category,
      abstract: submission.abstract || "",
      reviewerName: reviewer.name,
      deadline: assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 10) : "",
      receivedDate: submission.createdAt ? new Date(submission.createdAt).toISOString().slice(0, 10) : "",
    });

    // Store the PDF
    const pdfFilename = `${msId}-${assignmentId.slice(0, 8)}.pdf`;
    let publicUrl: string;

    // Try Vercel Blob first, fallback to local public/
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`review-copies/${pdfFilename}`, Buffer.from(pdfBytes), {
        access: "public",
        contentType: "application/pdf",
      });
      publicUrl = blob.url;
    } else {
      // Local: save to public/manuscripts/
      const outDir = path.join(process.cwd(), "public", "manuscripts");
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outDir, pdfFilename), Buffer.from(pdfBytes));
      publicUrl = `/manuscripts/${pdfFilename}`;
    }

    await logLocalAdminEvent({
      action: "review_copy.generated",
      entityType: "review_assignment",
      entityId: assignmentId,
      detail: JSON.stringify({ url: publicUrl, reviewer: reviewer.name }),
    });

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Review copy generation error:", error);
    const msg = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Map submission title prefixes to article slugs
const ARTICLE_SLUG_MAP: Record<string, string> = {
  "Monitoring and Scalability of High-Load Systems": "e2026001",
  "Diagnostic Capabilities of Hardware-Software Systems": "e2026002",
  "Finger Dermatoglyphics as Predictive Markers": "e2026003",
  "Laboratory Assessment of Aerobic and Anaerobic": "e2026004",
  "Genetic Markers for Talent Identification": "e2026005",
  "Longitudinal Physiological Monitoring": "e2026006",
  "Leveraging Artificial Intelligence for Scalable": "e2026007",
};

function getSlugFromTitle(title: string): string | null {
  for (const [prefix, slug] of Object.entries(ARTICLE_SLUG_MAP)) {
    if (title.startsWith(prefix)) return slug;
  }
  return null;
}
