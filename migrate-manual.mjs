import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS \`activityFeed\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`creatorId\` int,
    \`releaseId\` int,
    \`type\` enum('new_post','new_photo','new_music','new_book','new_video','unlocked_post','new_subscriber','new_follower') NOT NULL,
    \`message\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`activityFeed_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`creators\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`alias\` varchar(100) NOT NULL,
    \`handle\` varchar(50) NOT NULL,
    \`bio\` text,
    \`longBio\` text,
    \`avatarUrl\` text,
    \`coverUrl\` text,
    \`location\` varchar(100),
    \`verified\` boolean NOT NULL DEFAULT false,
    \`category\` varchar(100),
    \`contentTypes\` json,
    \`tags\` json,
    \`socialInstagram\` varchar(100),
    \`socialTiktok\` varchar(100),
    \`socialTwitter\` varchar(100),
    \`socialWebsite\` text,
    \`renown\` int NOT NULL DEFAULT 0,
    \`totalFollowers\` int NOT NULL DEFAULT 0,
    \`totalSubscribers\` int NOT NULL DEFAULT 0,
    \`totalReleases\` int NOT NULL DEFAULT 0,
    \`status\` enum('active','pending','suspended') NOT NULL DEFAULT 'pending',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`creators_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`creators_handle_unique\` UNIQUE(\`handle\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`follows\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`followerId\` int NOT NULL,
    \`creatorId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`follows_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`messages\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`fromUserId\` int NOT NULL,
    \`toUserId\` int NOT NULL,
    \`content\` text NOT NULL,
    \`read\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`messages_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`notifications\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`type\` varchar(50) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`message\` text,
    \`read\` boolean NOT NULL DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`releases\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`creatorId\` int NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`description\` text,
    \`type\` enum('image','photo','music','book','video','post') NOT NULL,
    \`thumbnailUrl\` text,
    \`mediaUrl\` text,
    \`duration\` varchar(20),
    \`pages\` int,
    \`tierRequired\` enum('free','fledgling','dweller','courtier','night_royalty') NOT NULL DEFAULT 'free',
    \`locked\` boolean NOT NULL DEFAULT false,
    \`likes\` int NOT NULL DEFAULT 0,
    \`views\` int NOT NULL DEFAULT 0,
    \`publishedAt\` timestamp NOT NULL DEFAULT (now()),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`releases_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`savedContent\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`releaseId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`savedContent_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`subscriptions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`patronId\` int NOT NULL,
    \`creatorId\` int NOT NULL,
    \`tierId\` int NOT NULL,
    \`status\` enum('active','cancelled','expired','paused') NOT NULL DEFAULT 'active',
    \`renewsAt\` timestamp,
    \`startedAt\` timestamp NOT NULL DEFAULT (now()),
    \`cancelledAt\` timestamp,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`subscriptions_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`tiers\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`creatorId\` int NOT NULL,
    \`name\` varchar(100) NOT NULL,
    \`slug\` varchar(50) NOT NULL,
    \`description\` text,
    \`price\` decimal(10,2) NOT NULL DEFAULT '0.00',
    \`currency\` varchar(3) NOT NULL DEFAULT 'USD',
    \`perks\` json,
    \`featured\` boolean NOT NULL DEFAULT false,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`tiers_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`openId\` varchar(64) NOT NULL,
    \`name\` text,
    \`email\` varchar(320),
    \`loginMethod\` varchar(64),
    \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
    \`displayName\` varchar(100),
    \`avatarUrl\` text,
    \`loyaltyPoints\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
  )`,
];

for (const sql of statements) {
  try {
    await conn.query(sql);
    const tableName = sql.match(/TABLE.*?`(\w+)`/)?.[1] || sql.match(/ALTER TABLE.*?`(\w+)`/)?.[1] || 'unknown';
    console.log('✓', tableName);
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.message.includes('already exists')) {
      console.log('~ already exists, skipping');
    } else {
      console.error('✗ Error:', e.message);
    }
  }
}

await conn.end();
console.log('\nMigration complete!');
