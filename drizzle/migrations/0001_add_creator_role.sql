-- Add 'creator' role to the role enum
ALTER TABLE `users` MODIFY COLUMN `role` enum('user', 'creator', 'admin') NOT NULL DEFAULT 'user';
