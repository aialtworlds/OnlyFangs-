CREATE TABLE `one_time_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('post','message','tip') NOT NULL,
	`targetId` int,
	`creatorId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`stripeSessionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `one_time_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content` ADD `price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `messages` ADD `price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `messages` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `mediaKey` varchar(255);--> statement-breakpoint
ALTER TABLE `messages` ADD `mediaType` enum('image','photo','music','video','book');