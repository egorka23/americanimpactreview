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
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
