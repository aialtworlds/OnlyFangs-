-- Collapse multi-tier subscriptions into a single subscription plan per creator.
-- Safe to run against a database with no real creators/subscribers yet
-- (confirmed with Sam before writing this).

ALTER TABLE `creators` ADD `subscriptionPrice` decimal(10,2);
ALTER TABLE `creators` ADD `subscriptionCurrency` varchar(3) NOT NULL DEFAULT 'USD';
ALTER TABLE `creators` ADD `subscriptionPerks` json DEFAULT ('[]');
ALTER TABLE `creators` ADD `subscriptionStripePriceId` varchar(255);
--> statement-breakpoint
ALTER TABLE `content` ADD `locked` boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE `covens` ADD `locked` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `tierId`;
--> statement-breakpoint
ALTER TABLE `content` DROP COLUMN `tierId`;
--> statement-breakpoint
ALTER TABLE `covens` DROP COLUMN `tierId`;
--> statement-breakpoint
ALTER TABLE `releases` DROP COLUMN `tierRequired`;
--> statement-breakpoint
DROP TABLE `tiers`;
