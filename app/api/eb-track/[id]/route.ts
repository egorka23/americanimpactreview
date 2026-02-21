import { db } from "@/lib/db";
import { ebInvitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// 1x1 transparent PNG (68 bytes)
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
  "Nl7BcQAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Update status to "opened" only if still "sent"
  try {
    await db
      .update(ebInvitations)
      .set({ openedAt: new Date(), status: "opened" })
      .where(
        and(
          eq(ebInvitations.id, id),
          eq(ebInvitations.status, "sent")
        )
      );
  } catch {
    // Silently ignore DB errors — always return the pixel
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
