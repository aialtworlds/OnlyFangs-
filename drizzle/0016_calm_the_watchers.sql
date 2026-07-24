CREATE TABLE `coven_bans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`covenId` int NOT NULL,
	`userId` int NOT NULL,
	`bannedBy` int NOT NULL,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_bans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coven_warnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`covenId` int NOT NULL,
	`userId` int NOT NULL,
	`issuedBy` int NOT NULL,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_warnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coven_members` ADD `mutedUntil` timestamp;