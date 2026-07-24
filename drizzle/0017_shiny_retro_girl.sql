CREATE TABLE `coven_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`covenId` int NOT NULL,
	`postId` int NOT NULL,
	`commentId` int,
	`reportedUserId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`reason` enum('spam','harassment','other') NOT NULL,
	`description` varchar(1000),
	`escalated` boolean NOT NULL DEFAULT false,
	`status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coven_reports_id` PRIMARY KEY(`id`)
);
