CREATE TABLE `service_popularity_daily` (
	`day` text NOT NULL,
	`service_id` text NOT NULL,
	`search_clicks` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`day`, `service_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_service_popularity_day` ON `service_popularity_daily` (`day`);