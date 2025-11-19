CREATE TABLE `complaints` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` text NOT NULL,
	`emergency` integer NOT NULL,
	`fix_till_date` text NOT NULL,
	`photo` text,
	`status` text DEFAULT 'open' NOT NULL,
	`raised_by` integer NOT NULL,
	`raised_by_name` text NOT NULL,
	`raised_by_branch` text,
	`raised_by_profile_pic` text,
	`volunteer_id` integer,
	`volunteer_name` text,
	`created_at` text NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`raised_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`volunteer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_id` integer NOT NULL,
	`sender_name` text NOT NULL,
	`receiver_id` integer NOT NULL,
	`complaint_id` integer,
	`content` text NOT NULL,
	`read` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`complaint_id` integer,
	`read` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `technical_team` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`department` text NOT NULL,
	`email` text NOT NULL,
	`phone_number` text NOT NULL,
	`available` integer DEFAULT true,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`branch` text,
	`roll_number` text,
	`semester` text,
	`year` text,
	`gender` text,
	`dob` text,
	`profile_picture` text,
	`phone_number` text,
	`department` text,
	`points` integer DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);