CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`reviewer_name` text NOT NULL DEFAULT '',
	`username` text NOT NULL DEFAULT '',
	`rating` integer NOT NULL DEFAULT 5,
	`title` text NOT NULL DEFAULT '',
	`review_text` text NOT NULL DEFAULT '',
	`bike_id` integer,
	`bike_label` text NOT NULL DEFAULT '',
	`created_at` integer NOT NULL
);
