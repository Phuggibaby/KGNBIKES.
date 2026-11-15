CREATE TABLE `profile_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`username` text NOT NULL DEFAULT '',
	`change_type` text NOT NULL DEFAULT '',
	`detail` text NOT NULL DEFAULT '',
	`created_at` integer NOT NULL
);
