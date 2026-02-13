import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { sendSubmissionEmail } from "@/lib/email";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED_ARTICLE_TYPES = [
  "Original Research",
  "Review Article",
  "Short Communication",
  "Case Study",
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
    if (!["docx", "doc", "tex", "zip"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only Word (.docx/.doc) and LaTeX (.tex/.zip) files are accepted" },
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

    const [submission] = await db
      .insert(submissions)
      .values({
        userId: session.user.id,
        title: title.trim(),
        abstract: abstract.trim(),
        category,
        subject: subject?.trim() || null,
        articleType,
        manuscriptUrl,
        manuscriptName,
        keywords: keywords.trim(),
        coverLetter: coverLetter?.trim() || null,
        conflictOfInterest: conflictOfInterest !== null ? conflictOfInterest : null,
        coAuthors: coAuthorsRaw || null,
        authorAffiliation: authorAffiliation?.trim() || null,
        authorOrcid: authorOrcid?.trim() || null,
        fundingStatement: fundingStatement?.trim() || null,
        ethicsApproval: ethicsApproval?.trim() || null,
        dataAvailability: dataAvailability?.trim() || null,
        aiDisclosure: aiDisclosure?.trim() || null,
        policyAgreed: 1,
      })
      .returning({ id: submissions.id });

    try {
      await sendSubmissionEmail({
        submissionId: submission.id,
        title: title.trim(),
        abstract: abstract.trim(),
        category,
        articleType,
        keywords: keywords.trim(),
        coverLetter: coverLetter?.trim() || null,
        conflictOfInterest: conflictOfInterest !== null ? conflictOfInterest : null,
        manuscriptUrl,
        manuscriptName,
        authorEmail: session.user.email || null,
        authorName: session.user.name || null,
        authorAffiliation: authorAffiliation?.trim() || null,
        coAuthors: coAuthorsRaw || null,
        fundingStatement: fundingStatement?.trim() || null,
        ethicsApproval: ethicsApproval?.trim() || null,
        dataAvailability: dataAvailability?.trim() || null,
        aiDisclosure: aiDisclosure?.trim() || null,
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
      .select()
      .from(submissions)
      .where(eq(submissions.userId, session.user.id))
      .orderBy(submissions.createdAt);

    return NextResponse.json(userSubmissions);
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
