CREATE TABLE `appeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`creatorId` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`adminResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `appealContentIndex` ON `appeals` (`contentId`);--> statement-breakpoint
CREATE INDEX `appealCreatorIndex` ON `appeals` (`creatorId`);--> statement-breakpoint
CREATE INDEX `appealStatusIndex` ON `appeals` (`status`);