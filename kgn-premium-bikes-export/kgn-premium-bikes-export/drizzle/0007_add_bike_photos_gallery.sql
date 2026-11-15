CREATE TABLE `bike_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bike_id` integer NOT NULL,
	`blob_key` text NOT NULL DEFAULT '',
	`sort_order` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL
);
