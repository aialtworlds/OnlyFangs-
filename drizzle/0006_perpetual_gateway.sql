CREATE TABLE `viewingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int NOT NULL,
	`creatorId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `viewingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userContentIndex` ON `viewingHistory` (`userId`,`contentId`);--> statement-breakpoint
CREATE INDEX `userCreatorIndex` ON `viewingHistory` (`userId`,`creatorId`);