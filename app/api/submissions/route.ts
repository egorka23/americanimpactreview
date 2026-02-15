import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, users, publishedArticles } from "@/lib/db/schema";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { put } from "@vercel/blob";
import { sendSubmissionEmail } from "@/lib/email";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Trim + truncate to a safe length */
function sanitize(val: string | null | undefined, maxLen: number): string {
  if (!val) return "";
  return val.trim().slice(0, maxLen);
}

const FIELD_LIMITS = {
  title: 300,
  abstract: 4000,
  subject: 100,
  keywords: 500,
  authorAffiliation: 300,
  authorOrcid: 19,
  ethicsApproval: 1000,
  fundingStatement: 1000,
  dataAvailability: 500,
  aiDisclosure: 1000,
  conflictOfInterest: 1000,
  coverLetter: 3000,
  coAuthorName: 100,
  coAuthorEmail: 150,
  coAuthorAffiliation: 300,
} as const;

const ALLOWED_ARTICLE_TYPES = [
  "Original Research",
  "Review Article",
  "Theoretical Article",
  "Policy Analysis",
  "Case Study",
  "Short Communication",
  "Commentary / Opinion",
  "Meta-Analysis",
];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const abstract = formData.get("abstract") as string;
    const category = formData.get("category") as string;
    const subject = formData.get("subject") as string | null;
    const articleType = formData.get("articleType") as string;
    const manuscript = formData.get("manuscript") as File | null;
    const keywords = formData.get("keywords") as string | null;
    const coverLetter = formData.get("coverLetter") as string | null;
    const conflictOfInterest = formData.get("conflictOfInterest") as string | null;
    const policyAgreedRaw = formData.get("policyAgreed") as string | null;
    const coAuthorsRaw = formData.get("coAuthors") as string | null;
    const authorAffiliation = formData.get("authorAffiliation") as string | null;
    const authorOrcid = formData.get("authorOrcid") as string | null;
    const fundingStatement = formData.get("fundingStatement") as string | null;
    const ethicsApproval = formData.get("ethicsApproval") as string | null;
    const dataAvailability = formData.get("dataAvailability") as string | null;
    const aiDisclosure = formData.get("aiDisclosure") as string | null;

    if (!title || !abstract || !category) {
      return NextResponse.json(
        { error: "Title, abstract, and category are required" },
        { status: 400 }
      );
    }

    if (title.length > FIELD_LIMITS.title) {
      return NextResponse.json({ error: `Title must be under ${FIELD_LIMITS.title} characters` }, { status: 400 });
    }
    if (abstract.length > FIELD_LIMITS.abstract) {
      return NextResponse.json({ error: `Abstract must be under ${FIELD_LIMITS.abstract} characters` }, { status: 400 });
    }

    if (!articleType || !ALLOWED_ARTICLE_TYPES.includes(articleType)) {
      return NextResponse.json(
        { error: "A valid article type is required" },
        { status: 400 }
      );
    }

    if (!keywords?.trim()) {
      return NextResponse.json(
        { error: "Keywords are required" },
        { status: 400 }
      );
    }

    if (policyAgreedRaw !== "1") {
      return NextResponse.json(
        { error: "You must agree to the publication policies" },
        { status: 400 }
      );
    }

    if (!manuscript || manuscript.size === 0) {
      return NextResponse.json(
        { error: "Manuscript file is required" },
        { status: 400 }
      );
    }

    if (manuscript.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 50MB" },
        { status: 400 }
      );
    }

    const ext = manuscript.name.split(".").pop()?.toLowerCase();
    if (!["docx", "doc"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only Word files (.doc, .docx) are accepted" },
        { status: 400 }
      );
    }

    const blob = await put(
      `manuscripts/${session.user.id}/${Date.now()}-${manuscript.name}`,
      manuscript,
      { access: "public" }
    );
    const manuscriptUrl = blob.url;
    const manuscriptName = manuscript.name;

    // Sanitize co-authors JSON: truncate each field
    let sanitizedCoAuthors: string | null = null;
    if (coAuthorsRaw) {
      try {
        const parsed = JSON.parse(coAuthorsRaw);
        if (Array.isArray(parsed)) {
          const clean = parsed.slice(0, 10).map((ca: Record<string, string>) => ({
            name: sanitize(ca.name, FIELD_LIMITS.coAuthorName),
            email: sanitize(ca.email, FIELD_LIMITS.coAuthorEmail),
            affiliation: sanitize(ca.affiliation, FIELD_LIMITS.coAuthorAffiliation),
            orcid: sanitize(ca.orcid, 19),
          }));
          sanitizedCoAuthors = JSON.stringify(clean);
        }
      } catch { /* invalid JSON — ignore */ }
    }

    const safeTitle = sanitize(title, FIELD_LIMITS.title);
    const safeAbstract = sanitize(abstract, FIELD_LIMITS.abstract);

    const [submission] = await db
      .insert(submissions)
      .values({
        userId: session.user.id,
        title: safeTitle,
        abstract: safeAbstract,
        category,
        subject: sanitize(subject, FIELD_LIMITS.subject) || null,
        articleType,
        manuscriptUrl,
        manuscriptName,
        keywords: sanitize(keywords, FIELD_LIMITS.keywords),
        coverLetter: sanitize(coverLetter, FIELD_LIMITS.coverLetter) || null,
        conflictOfInterest: sanitize(conflictOfInterest, FIELD_LIMITS.conflictOfInterest) || null,
        coAuthors: sanitizedCoAuthors,
        authorAffiliation: sanitize(authorAffiliation, FIELD_LIMITS.authorAffiliation) || null,
        authorOrcid: sanitize(authorOrcid, FIELD_LIMITS.authorOrcid) || null,
        fundingStatement: sanitize(fundingStatement, FIELD_LIMITS.fundingStatement) || null,
        ethicsApproval: sanitize(ethicsApproval, FIELD_LIMITS.ethicsApproval) || null,
        dataAvailability: sanitize(dataAvailability, FIELD_LIMITS.dataAvailability) || null,
        aiDisclosure: sanitize(aiDisclosure, FIELD_LIMITS.aiDisclosure) || null,
        policyAgreed: 1,
      })
      .returning({ id: submissions.id });

    try {
      await sendSubmissionEmail({
        submissionId: submission.id,
        title: safeTitle,
        abstract: safeAbstract,
        category,
        articleType,
        keywords: sanitize(keywords, FIELD_LIMITS.keywords),
        coverLetter: sanitize(coverLetter, FIELD_LIMITS.coverLetter) || null,
        conflictOfInterest: sanitize(conflictOfInterest, FIELD_LIMITS.conflictOfInterest) || null,
        manuscriptUrl,
        manuscriptName,
        authorEmail: session.user.email || null,
        authorName: session.user.name || null,
        authorAffiliation: sanitize(authorAffiliation, FIELD_LIMITS.authorAffiliation) || null,
        coAuthors: sanitizedCoAuthors,
        fundingStatement: sanitize(fundingStatement, FIELD_LIMITS.fundingStatement) || null,
        ethicsApproval: sanitize(ethicsApproval, FIELD_LIMITS.ethicsApproval) || null,
        dataAvailability: sanitize(dataAvailability, FIELD_LIMITS.dataAvailability) || null,
        aiDisclosure: sanitize(aiDisclosure, FIELD_LIMITS.aiDisclosure) || null,
      });
    } catch (emailError) {
      console.error("Submission email failed:", emailError);
    }

    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(session.user.email?.toLowerCase() || "");

    if (isAdmin) {
      const allSubmissions = await db
        .select({
          id: submissions.id,
          title: submissions.title,
          abstract: submissions.abstract,
          category: submissions.category,
          articleType: submissions.articleType,
          manuscriptUrl: submissions.manuscriptUrl,
          manuscriptName: submissions.manuscriptName,
          keywords: submissions.keywords,
          coverLetter: submissions.coverLetter,
          conflictOfInterest: submissions.conflictOfInterest,
          coAuthors: submissions.coAuthors,
          authorAffiliation: submissions.authorAffiliation,
          authorOrcid: submissions.authorOrcid,
          fundingStatement: submissions.fundingStatement,
          ethicsApproval: submissions.ethicsApproval,
          dataAvailability: submissions.dataAvailability,
          aiDisclosure: submissions.aiDisclosure,
          policyAgreed: submissions.policyAgreed,
          status: submissions.status,
          createdAt: submissions.createdAt,
          updatedAt: submissions.updatedAt,
          userId: submissions.userId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(submissions)
        .leftJoin(users, eq(submissions.userId, users.id))
        .orderBy(submissions.createdAt);

      return NextResponse.json(allSubmissions);
    }

    const userSubmissions = await db
      .select({
        ...getTableColumns(submissions),
        publishedSlug: publishedArticles.slug,
        publishedAt: publishedArticles.publishedAt,
        publishedAuthors: publishedArticles.authors,
        publishedDoi: publishedArticles.doi,
        publishedVolume: publishedArticles.volume,
        publishedIssue: publishedArticles.issue,
        publishedYear: publishedArticles.year,
      })
      .from(submissions)
      .leftJoin(publishedArticles, eq(submissions.id, publishedArticles.submissionId))
      .where(eq(submissions.userId, session.user.id))
      .orderBy(desc(submissions.createdAt));

    return NextResponse.json(userSubmissions);
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
