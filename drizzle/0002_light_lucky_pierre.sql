CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`subscribed_at` integer,
	`unsubscribed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
ALTER TABLE `published_articles` ADD `download_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `submissions` ADD `received_at` integer;--> statement-breakpoint
ALTER TABLE `submissions` ADD `accepted_at` integer;--> statement-breakpoint
ALTER TABLE `submissions` ADD `article_published_at` integer;