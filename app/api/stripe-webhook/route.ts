import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Manual Stripe signature verification (no SDK needed)
function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  tolerance = 300, // 5 minutes
): Record<string, unknown> {
  const parts = sigHeader.split(",").reduce(
    (acc, part) => {
      const [key, val] = part.split("=");
      if (key === "t") acc.timestamp = val;
      if (key === "v1") acc.signatures.push(val);
      return acc;
    },
    { timestamp: "", signatures: [] as string[] },
  );

  if (!parts.timestamp || parts.signatures.length === 0) {
    throw new Error("Invalid Stripe-Signature header");
  }

  const ts = parseInt(parts.timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > tolerance) {
    throw new Error("Webhook timestamp too old");
  }

  const signedPayload = `${parts.timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const match = parts.signatures.some(
    (sig) => crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")),
  );
  if (!match) {
    throw new Error("Signature mismatch");
  }

  return JSON.parse(payload);
}

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Webhook: missing signature or secret");
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    const body = await request.text();
    event = verifyStripeSignature(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = event.type as string;
  const dataObj = (event.data as Record<string, unknown>)?.object as Record<string, unknown>;
  const submissionId = (dataObj?.metadata as Record<string, string>)?.submissionId;

  console.log(`Webhook received: ${eventType}, submissionId: ${submissionId || "none"}`);

  if (eventType === "checkout.session.completed" && submissionId) {
    await db
      .update(submissions)
      .set({
        paymentStatus: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));
    console.log(`Payment marked as paid for submission ${submissionId}`);
  } else if (eventType === "checkout.session.expired" && submissionId) {
    await db
      .update(submissions)
      .set({
        paymentStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));
    console.log(`Payment marked as failed for submission ${submissionId}`);
  }

  return NextResponse.json({ received: true });
}
