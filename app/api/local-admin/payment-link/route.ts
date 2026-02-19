import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";
import { getStripe } from "@/lib/stripe";
import { sendPaymentLinkEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, amount } = body as { submissionId: string; amount: number };

    if (!submissionId || !amount || amount < 100) {
      return NextResponse.json({ error: "submissionId and amount (min 100 cents) required" }, { status: 400 });
    }

    // Fetch submission + author
    const rows = await db
      .select({
        id: submissions.id,
        title: submissions.title,
        userEmail: users.email,
        userName: users.name,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    const sub = rows[0];
    if (!sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (!sub.userEmail) {
      return NextResponse.json({ error: "Author has no email" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://americanimpactreview.com";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: "Publication Fee",
              description: sub.title,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: sub.userEmail,
      metadata: { submissionId },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
    });

    // Update submission
    await db
      .update(submissions)
      .set({
        stripeSessionId: session.id,
        paymentStatus: "pending",
        paymentAmount: amount,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));

    // Send email
    await sendPaymentLinkEmail({
      authorName: sub.userName || "Author",
      authorEmail: sub.userEmail,
      articleTitle: sub.title,
      amount,
      checkoutUrl: session.url!,
    });

    await logLocalAdminEvent({
      action: "payment_link_sent",
      entityType: "submission",
      entityId: submissionId,
      detail: `Amount: $${(amount / 100).toFixed(2)}, Stripe session: ${session.id}`,
    });

    return NextResponse.json({ ok: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Payment link error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
