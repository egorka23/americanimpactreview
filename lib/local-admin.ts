import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export function isLocalHost(host: string) {
  const value = host.toLowerCase();
  return value.includes("localhost") || value.includes("127.0.0.1");
}

export function isLocalAdminRequest(request: Request) {
  const host = request.headers.get("host") || "";
  if (process.env.NODE_ENV !== "development" || !isLocalHost(host)) {
    return false;
  }
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("air_admin=1");
}

export async function ensureLocalAdminSchema() {
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

  try {
    await db.run(sql`ALTER TABLE submissions ADD COLUMN pipeline_status TEXT`);
  } catch {
    // Ignore if column already exists
  }
}
