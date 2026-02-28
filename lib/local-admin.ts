import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { createHmac } from "crypto";

const ADMIN_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-dev-secret";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isLocalHost(host: string) {
  const value = host.toLowerCase();
  return value.includes("localhost") || value.includes("127.0.0.1");
}

/**
 * Generate a signed admin cookie value: "timestamp.hmac"
 */
export function generateAdminToken(): string {
  const ts = Date.now().toString();
  const sig = createHmac("sha256", ADMIN_SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

/**
 * Verify a signed admin cookie value.
 * Returns true if signature is valid and token is not expired.
 */
export function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const ts = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", ADMIN_SECRET).update(ts).digest("hex");
  if (sig.length !== expected.length || sig !== expected) return false;
  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;
  if (Date.now() - timestamp > COOKIE_MAX_AGE_MS) return false;
  return true;
}

export function isLocalAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)air_admin=([^;]+)/);
  if (!match) return false;
  return verifyAdminToken(decodeURIComponent(match[1]));
}

export async function ensureLocalAdminSchema() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      description TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS journal_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS published_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      volume TEXT,
      issue TEXT,
      year INTEGER,
      doi TEXT,
      status TEXT DEFAULT 'draft',
      visibility TEXT DEFAULT 'public',
      scheduled_at INTEGER,
      published_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      detail TEXT,
      created_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS reviewers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      affiliation TEXT,
      expertise TEXT,
      status TEXT DEFAULT 'active',
      created_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS review_assignments (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'invited',
      invited_at INTEGER,
      due_at INTEGER,
      completed_at INTEGER,
      notes TEXT,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES reviewers(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      recommendation TEXT,
      score INTEGER,
      comments_to_author TEXT,
      comments_to_editor TEXT,
      needs_work INTEGER DEFAULT 0,
      editor_feedback TEXT,
      submitted_at INTEGER,
      FOREIGN KEY (assignment_id) REFERENCES review_assignments(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ai_intake_runs (
      id TEXT PRIMARY KEY,
      created_at INTEGER,
      created_by_user_id TEXT,
      original_file_url TEXT,
      original_file_name TEXT,
      extracted_json TEXT,
      confidence_json TEXT,
      warnings_json TEXT,
      evidence_json TEXT,
      model_version TEXT,
      status TEXT,
      error_message TEXT
    )
  `);

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN pipeline_status TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN handling_editor_id TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN source TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN ai_intake_id TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN ai_assisted INTEGER DEFAULT 0`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE published_articles ADD COLUMN orcids TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE published_articles ADD COLUMN pdf_url TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE published_articles ADD COLUMN visibility TEXT DEFAULT 'public'`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN payment_status TEXT DEFAULT 'unpaid'`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN stripe_session_id TEXT`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN payment_amount INTEGER`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN paid_at INTEGER`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'author'`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`);
  } catch {
    // Ignore if column already exists
  }

  try {
    await db.run(sql`ALTER TABLE users ADD COLUMN last_login INTEGER`);
  } catch {
    // Ignore if column already exists
  }
}

export async function logLocalAdminEvent(payload: {
  actor?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  try {
    await db.insert(auditEvents).values({
      actor: payload.actor || "local-admin",
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      detail: payload.detail || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Local admin audit error:", error);
  }
}
