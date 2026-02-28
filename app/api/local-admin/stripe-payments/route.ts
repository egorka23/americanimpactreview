import { NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

export async function GET(request: Request) {
  if (!isLocalAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  try {
    // Fetch completed checkout sessions from Stripe
    const params = new URLSearchParams({
      limit: "100",
      "expand[]": "data.customer_details",
    });

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions?${params}`,
      {
        headers: { Authorization: `Bearer ${sk}` },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || "Stripe API error" }, { status: 500 });
    }

    const data = await res.json();

    const sessions = data.data.map((s: Record<string, unknown>) => {
      const customerDetails = s.customer_details as Record<string, unknown> | null;
      const metadata = s.metadata as Record<string, string> | null;
      return {
        id: s.id,
        paymentStatus: s.payment_status,
        status: s.status,
        amountTotal: s.amount_total,
        currency: s.currency,
        customerEmail: customerDetails?.email || s.customer_email || null,
        customerName: customerDetails?.name || null,
        submissionId: metadata?.submissionId || null,
        created: s.created,
        paymentIntentId: s.payment_intent,
        url: s.url,
      };
    });

    // Also fetch balance to show actual revenue
    const balanceRes = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${sk}` },
    });
    let balance = null;
    if (balanceRes.ok) {
      const balanceData = await balanceRes.json();
      balance = {
        available: balanceData.available,
        pending: balanceData.pending,
      };
    }

    return NextResponse.json({ sessions, balance });
  } catch (error) {
    console.error("Stripe payments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch Stripe data" }, { status: 500 });
  }
}
