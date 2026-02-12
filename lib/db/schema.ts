import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  affiliation: text("affiliation"),
  orcid: text("orcid"),
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
  status: text("status", {
    enum: ["submitted", "under_review", "accepted", "rejected", "revision_requested"],
  }).notNull().default("submitted"),
  pipelineStatus: text("pipeline_status"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
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
