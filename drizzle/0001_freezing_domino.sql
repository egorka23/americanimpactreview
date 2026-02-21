CREATE TABLE `admin_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`display_name` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_accounts_username_unique` ON `admin_accounts` (`username`);--> statement-breakpoint
CREATE TABLE `ai_intake_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer,
	`created_by_user_id` text,
	`original_file_url` text,
	`original_file_name` text,
	`extracted_json` text,
	`confidence_json` text,
	`warnings_json` text,
	`evidence_json` text,
	`model_version` text,
	`status` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`detail` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `eb_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`title` text,
	`affiliation` text,
	`expertise_area` text,
	`achievements` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`sent_at` integer,
	`opened_at` integer,
	`responded_at` integer
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body_html` text NOT NULL,
	`description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `journal_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `published_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`abstract` text,
	`content` text,
	`excerpt` text,
	`category` text,
	`subject` text,
	`authors` text,
	`affiliations` text,
	`keywords` text,
	`manuscript_url` text,
	`author_username` text,
	`article_type` text,
	`orcids` text,
	`pdf_url` text,
	`volume` text,
	`issue` text,
	`year` integer,
	`doi` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`visibility` text DEFAULT 'public',
	`scheduled_at` integer,
	`published_at` integer,
	`received_at` integer,
	`accepted_at` integer,
	`created_at` integer,
	`view_count` integer DEFAULT 0,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `review_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`invited_at` integer,
	`due_at` integer,
	`completed_at` integer,
	`notes` text,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `reviewers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviewers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`affiliation` text,
	`expertise` text,
	`status` text DEFAULT 'active',
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviewers_email_unique` ON `reviewers` (`email`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`recommendation` text,
	`score` integer,
	`comments_to_author` text,
	`comments_to_editor` text,
	`needs_work` integer DEFAULT 0,
	`editor_feedback` text,
	`submitted_at` integer,
	FOREIGN KEY (`assignment_id`) REFERENCES `review_assignments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`abstract` text NOT NULL,
	`category` text NOT NULL,
	`subject` text,
	`manuscript_url` text,
	`manuscript_name` text,
	`keywords` text,
	`cover_letter` text,
	`conflict_of_interest` text,
	`article_type` text,
	`co_authors` text,
	`author_affiliation` text,
	`author_orcid` text,
	`funding_statement` text,
	`ethics_approval` text,
	`data_availability` text,
	`ai_disclosure` text,
	`policy_agreed` integer,
	`ai_review_report` text,
	`source` text,
	`ai_intake_id` text,
	`ai_assisted` integer DEFAULT 0,
	`status` text DEFAULT 'submitted' NOT NULL,
	`pipeline_status` text,
	`handling_editor_id` text,
	`created_at` integer,
	`updated_at` integer,
	`payment_status` text DEFAULT 'unpaid',
	`stripe_session_id` text,
	`payment_amount` integer,
	`paid_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`handling_editor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`affiliation` text,
	`orcid` text,
	`role` text DEFAULT 'author',
	`status` text DEFAULT 'active',
	`last_login` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);