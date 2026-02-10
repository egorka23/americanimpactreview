import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { sendSubmissionEmail } from "@/lib/email";

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
    const manuscript = formData.get("manuscript") as File | null;
    const keywords = formData.get("keywords") as string | null;
    const coverLetter = formData.get("coverLetter") as string | null;
    const conflictOfInterest = formData.get("conflictOfInterest") as string | null;
    const policyAgreedRaw = formData.get("policyAgreed") as string | null;

    if (!title || !abstract || !category) {
      return NextResponse.json(
        { error: "Title, abstract, and category are required" },
        { status: 400 }
      );
    }

    let manuscriptUrl: string | null = null;
    let manuscriptName: string | null = null;

    if (manuscript && manuscript.size > 0) {
      if (manuscript.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size must be under 10MB" },
          { status: 400 }
        );
      }

      const ext = manuscript.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "doc"].includes(ext || "")) {
        return NextResponse.json(
          { error: "Only PDF and DOCX files are accepted" },
          { status: 400 }
        );
      }

      const blob = await put(
        `manuscripts/${session.user.id}/${Date.now()}-${manuscript.name}`,
        manuscript,
        { access: "public" }
      );
      manuscriptUrl = blob.url;
      manuscriptName = manuscript.name;
    }

    const [submission] = await db
      .insert(submissions)
      .values({
        userId: session.user.id,
        title: title.trim(),
        abstract: abstract.trim(),
        category,
        manuscriptUrl,
        manuscriptName,
        keywords: keywords?.trim() || null,
        coverLetter: coverLetter?.trim() || null,
        conflictOfInterest: conflictOfInterest !== null ? conflictOfInterest : null,
        policyAgreed: policyAgreedRaw === "1" ? 1 : 0,
      })
      .returning({ id: submissions.id });

    try {
      await sendSubmissionEmail({
        submissionId: submission.id,
        title: title.trim(),
        abstract: abstract.trim(),
        category,
        keywords: keywords?.trim() || null,
        coverLetter: coverLetter?.trim() || null,
        conflictOfInterest: conflictOfInterest !== null ? conflictOfInterest : null,
        manuscriptUrl,
        manuscriptName,
        authorEmail: session.user.email || null,
        authorName: session.user.name || null,
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
          manuscriptUrl: submissions.manuscriptUrl,
          manuscriptName: submissions.manuscriptName,
          keywords: submissions.keywords,
          coverLetter: submissions.coverLetter,
          conflictOfInterest: submissions.conflictOfInterest,
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
