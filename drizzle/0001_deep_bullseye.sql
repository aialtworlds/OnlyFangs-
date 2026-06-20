ALTER TABLE `subscriptions` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `stripePriceId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);