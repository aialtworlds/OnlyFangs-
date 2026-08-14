-- Support Twitter/Facebook-style posts: text-only, with a link, or with
-- media — not every post needs a title or an attached file anymore.

ALTER TABLE `content` MODIFY COLUMN `title` varchar(255);
--> statement-breakpoint
ALTER TABLE `content` MODIFY COLUMN `fileUrl` text;
--> statement-breakpoint
ALTER TABLE `content` MODIFY COLUMN `fileKey` varchar(255);
--> statement-breakpoint
ALTER TABLE `content` MODIFY COLUMN `type` enum('image','photo','music','book','video','post','text') NOT NULL;
--> statement-breakpoint
ALTER TABLE `content` ADD `linkUrl` text;
