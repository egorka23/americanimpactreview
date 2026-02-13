import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET || "";

/**
 * Sign an assignment ID → "assignmentId.hmac16chars"
 */
export function signAssignment(assignmentId: string): string {
  const sig = createHmac("sha256", SECRET)
    .update(assignmentId)
    .digest("hex")
    .slice(0, 16);
  return `${assignmentId}.${sig}`;
}

/**
 * Verify token → assignmentId or null if invalid
 */
export function verifyAssignment(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET)
    .update(id)
    .digest("hex")
    .slice(0, 16);
  if (sig.length !== 16 || sig !== expected) return null;
  return id;
}
