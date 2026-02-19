import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isLocalAdminRequest, logLocalAdminEvent } from "@/lib/local-admin";

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
    const sk = process.env.STRIPE_SECRET_KEY;
    if (!sk) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }

    // Create Checkout Session via Stripe REST API (fetch)
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amount));
    params.append("line_items[0][price_data][product_data][name]", "Publication Fee");
    params.append("line_items[0][price_data][product_data][description]", sub.title);
    params.append("line_items[0][quantity]", "1");
    params.append("customer_email", sub.userEmail);
    params.append("metadata[submissionId]", submissionId);
    params.append("success_url", `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${baseUrl}/payment/cancel`);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sk}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe API error:", session);
      return NextResponse.json(
        { error: session.error?.message || "Stripe error" },
        { status: 500 },
      );
    }

    if (!session.url) {
      return NextResponse.json({ error: "Stripe returned no checkout URL", stripeResponse: { id: session.id, url: session.url, object: session.object } }, { status: 500 });
    }

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

    // Send email (dynamic import + non-blocking)
    try {
      const { sendPaymentLinkEmail } = await import("@/lib/email");
      await sendPaymentLinkEmail({
        authorName: sub.userName || "Author",
        authorEmail: sub.userEmail,
        articleTitle: sub.title,
        amount,
        checkoutUrl: session.url,
      });
    } catch (emailErr) {
      console.error("Payment email send failed:", emailErr);
    }

    await logLocalAdminEvent({
      action: "payment_link_sent",
      entityType: "submission",
      entityId: submissionId,
      detail: `Amount: $${(amount / 100).toFixed(2)}, Stripe session: ${session.id}`,
    });

    return NextResponse.json({ ok: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Payment link error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 5).join(" | ") : undefined;
    return NextResponse.json(
      { error: msg, _trace: stack, _v: "v7" },
      { status: 500 },
    );
  }
}
