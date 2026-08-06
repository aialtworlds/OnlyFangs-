CREATE TABLE `creator_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`targetAmount` decimal(10,2) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`patronId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`instructions` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`status` enum('pending','accepted','completed','declined') NOT NULL DEFAULT 'pending',
	`deliveryUrl` text,
	`stripeSessionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `custom_requests_id` PRIMARY KEY(`id`)
);
