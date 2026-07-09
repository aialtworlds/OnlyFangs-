CREATE TABLE `content_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`flaggedBy` int NOT NULL,
	`reason` enum('inappropriate','copyright','spam','other') NOT NULL,
	`description` text,
	`flaggedAt` timestamp NOT NULL DEFAULT (now()),
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`action` enum('submitted','approved','rejected','flagged','changes_requested') NOT NULL,
	`performedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`creatorId` int NOT NULL,
	`status` enum('pending','approved','rejected','changes_requested') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`notes` text,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderation_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `contentIndex` ON `content_flags` (`contentId`);--> statement-breakpoint
CREATE INDEX `resolvedIndex` ON `content_flags` (`resolved`);--> statement-breakpoint
CREATE INDEX `contentIndex` ON `moderation_logs` (`contentId`);--> statement-breakpoint
CREATE INDEX `actionIndex` ON `moderation_logs` (`action`);--> statement-breakpoint
CREATE INDEX `contentIndex` ON `moderation_queue` (`contentId`);--> statement-breakpoint
CREATE INDEX `creatorIndex` ON `moderation_queue` (`creatorId`);--> statement-breakpoint
CREATE INDEX `statusIndex` ON `moderation_queue` (`status`);