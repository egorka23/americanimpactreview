import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  affiliation: text("affiliation"),
  orcid: text("orcid"),
  role: text("role").default("author"),
  status: text("status").default("active"),
  lastLogin: integer("last_login", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  category: text("category").notNull(),
  subject: text("subject"),
  manuscriptUrl: text("manuscript_url"),
  manuscriptName: text("manuscript_name"),
  keywords: text("keywords"),
  coverLetter: text("cover_letter"),
  conflictOfInterest: text("conflict_of_interest"),
  articleType: text("article_type"),
  coAuthors: text("co_authors"),
  authorAffiliation: text("author_affiliation"),
  authorOrcid: text("author_orcid"),
  fundingStatement: text("funding_statement"),
  ethicsApproval: text("ethics_approval"),
  dataAvailability: text("data_availability"),
  aiDisclosure: text("ai_disclosure"),
  policyAgreed: integer("policy_agreed"),
  aiReviewReport: text("ai_review_report"),
  source: text("source"),
  aiIntakeId: text("ai_intake_id"),
  aiAssisted: integer("ai_assisted").default(0),
  status: text("status", {
    enum: ["submitted", "under_review", "accepted", "rejected", "revision_requested", "published"],
  }).notNull().default("submitted"),
  pipelineStatus: text("pipeline_status"),
  handlingEditorId: text("handling_editor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  paymentStatus: text("payment_status").default("unpaid"),
  stripeSessionId: text("stripe_session_id"),
  paymentAmount: integer("payment_amount"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
});

export const reviewers = sqliteTable("reviewers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  affiliation: text("affiliation"),
  expertise: text("expertise"),
  status: text("status").default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const reviewAssignments = sqliteTable("review_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").notNull().references(() => reviewers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("invited"),
  invitedAt: integer("invited_at", { mode: "timestamp" }),
  dueAt: integer("due_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  notes: text("notes"),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignment_id").notNull().references(() => reviewAssignments.id, { onDelete: "cascade" }),
  recommendation: text("recommendation"),
  score: integer("score"),
  commentsToAuthor: text("comments_to_author"),
  commentsToEditor: text("comments_to_editor"),
  needsWork: integer("needs_work").default(0),
  editorFeedback: text("editor_feedback"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const emailTemplates = sqliteTable("email_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const journalSettings = sqliteTable("journal_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const publishedArticles = sqliteTable("published_articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  abstract: text("abstract"),
  content: text("content"),
  excerpt: text("excerpt"),
  category: text("category"),
  subject: text("subject"),
  authors: text("authors"),
  affiliations: text("affiliations"),
  keywords: text("keywords"),
  manuscriptUrl: text("manuscript_url"),
  authorUsername: text("author_username"),
  articleType: text("article_type"),
  orcids: text("orcids"),
  pdfUrl: text("pdf_url"),
  volume: text("volume"),
  issue: text("issue"),
  year: integer("year"),
  doi: text("doi"),
  status: text("status").notNull().default("draft"),
  visibility: text("visibility").default("public"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  receivedAt: integer("received_at", { mode: "timestamp" }),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  viewCount: integer("view_count").default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const adminAccounts = sqliteTable("admin_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const aiIntakeRuns = sqliteTable("ai_intake_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdByUserId: text("created_by_user_id"),
  originalFileUrl: text("original_file_url"),
  originalFileName: text("original_file_name"),
  extractedJson: text("extracted_json"),
  confidenceJson: text("confidence_json"),
  warningsJson: text("warnings_json"),
  evidenceJson: text("evidence_json"),
  modelVersion: text("model_version"),
  status: text("status"),
  errorMessage: text("error_message"),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

export const ebInvitations = sqliteTable("eb_invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  title: text("title"),
  affiliation: text("affiliation"),
  expertiseArea: text("expertise_area"),
  achievements: text("achievements"),
  status: text("status").notNull().default("sent"),  // sent | opened | accepted | declined
  sentAt: integer("sent_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  openedAt: integer("opened_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
