CREATE TABLE `message_reactions` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `messageId` int NOT NULL,
  `userId` int NOT NULL,
  `emoji` varchar(10) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniqueReaction` (`messageId`, `userId`, `emoji`)
);
