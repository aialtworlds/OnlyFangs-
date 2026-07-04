CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`patronId` int NOT NULL,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_reactions_messageId_userId_emoji_unique` UNIQUE(`messageId`,`userId`,`emoji`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `conversationId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `senderId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `fromUserId`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `toUserId`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `read`;