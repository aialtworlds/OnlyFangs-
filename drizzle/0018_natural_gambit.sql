CREATE TABLE `coven_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int,
	`commentId` int,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coven_thread_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_thread_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coven_comments` ADD `updatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `coven_posts` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `coven_posts` ADD `updatedAt` timestamp;