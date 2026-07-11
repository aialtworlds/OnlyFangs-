CREATE TABLE `admin_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`targetType` varchar(50) NOT NULL,
	`targetId` int,
	`details` json DEFAULT ('{}'),
	`reason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`permission` varchar(100) NOT NULL,
	`grantedBy` int,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','creator','admin','sub_admin','moderator','admin_master') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `adminIndex` ON `admin_audit_logs` (`adminId`);--> statement-breakpoint
CREATE INDEX `actionIndex` ON `admin_audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `targetIndex` ON `admin_audit_logs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `createdAtIndex` ON `admin_audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `permAdminIndex` ON `admin_permissions` (`adminId`);--> statement-breakpoint
CREATE INDEX `permissionIndex` ON `admin_permissions` (`permission`);