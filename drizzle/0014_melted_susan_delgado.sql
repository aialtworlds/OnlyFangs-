CREATE TABLE `coven_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coven_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`covenId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','moderator','owner') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coven_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`covenId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `covens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int,
	`tierId` int,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` varchar(1000),
	`avatarUrl` text,
	`coverUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `covens_id` PRIMARY KEY(`id`),
	CONSTRAINT `covens_name_unique` UNIQUE(`name`),
	CONSTRAINT `covens_slug_unique` UNIQUE(`slug`)
);
