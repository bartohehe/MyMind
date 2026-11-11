CREATE TABLE `activity_days` (
	`date` text PRIMARY KEY NOT NULL,
	`steps` integer,
	`sleep_minutes` integer,
	`calories` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'personal' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`date`);--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_tasks_project_idx` ON `project_tasks` (`project_id`);--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'med' NOT NULL,
	`due_date` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`type` text DEFAULT 'walk' NOT NULL,
	`distance_km` real,
	`duration_min` integer,
	`calories` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workouts_date_idx` ON `workouts` (`date`);--> statement-breakpoint
DROP INDEX `medication_logs_medication_date_unq`;--> statement-breakpoint
ALTER TABLE `medication_logs` ADD `slot` text DEFAULT 'morning' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `medication_logs_med_date_slot_unq` ON `medication_logs` (`medication_id`,`date`,`slot`);--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `mood` integer;--> statement-breakpoint
ALTER TABLE `medications` ADD `times` text DEFAULT '["morning"]' NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `full_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `birth_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `weight_kg` real;--> statement-breakpoint
ALTER TABLE `profile` ADD `height_cm` integer;--> statement-breakpoint
ALTER TABLE `profile` ADD `insurance` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profile` ADD `pesel` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `due_date` text;