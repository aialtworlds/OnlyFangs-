import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "creator", "admin"]).default("user").notNull(),
  displayName: varchar("displayName", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Creator Profiles ──────────────────────────────────────────
export const creators = mysqlTable("creators", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alias: varchar("alias", { length: 100 }).notNull(),
  handle: varchar("handle", { length: 50 }).notNull().unique(),
  bio: text("bio"),
  longBio: text("longBio"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  location: varchar("location", { length: 100 }),
  verified: boolean("verified").default(false).notNull(),
  category: varchar("category", { length: 100 }),
  contentTypes: json("contentTypes").$type<string[]>().default([]),
  tags: json("tags").$type<string[]>().default([]),
  socialInstagram: varchar("socialInstagram", { length: 100 }),
  socialTiktok: varchar("socialTiktok", { length: 100 }),
  socialTwitter: varchar("socialTwitter", { length: 100 }),
  socialWebsite: text("socialWebsite"),
  renown: int("renown").default(0).notNull(),
  totalFollowers: int("totalFollowers").default(0).notNull(),
  totalSubscribers: int("totalSubscribers").default(0).notNull(),
  totalReleases: int("totalReleases").default(0).notNull(),
  status: mysqlEnum("status", ["active", "pending", "suspended"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

// ── Subscription Tiers ────────────────────────────────────────
export const tiers = mysqlTable("tiers", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  perks: json("perks").$type<string[]>().default([]),
  featured: boolean("featured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tier = typeof tiers.$inferSelect;
export type InsertTier = typeof tiers.$inferInsert;

// ── Subscriptions ─────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  patronId: int("patronId").notNull(),
  creatorId: int("creatorId").notNull(),
  tierId: int("tierId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "paused"]).default("active").notNull(),
  renewsAt: timestamp("renewsAt"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ── Follows ───────────────────────────────────────────────────
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  creatorId: int("creatorId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Releases (content posts) ──────────────────────────────────
export const releases = mysqlTable("releases", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["image", "photo", "music", "book", "video", "post"]).notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  mediaUrl: text("mediaUrl"),
  duration: varchar("duration", { length: 20 }),
  pages: int("pages"),
  tierRequired: mysqlEnum("tierRequired", ["free", "fledgling", "dweller", "courtier", "night_royalty"]).default("free").notNull(),
  locked: boolean("locked").default(false).notNull(),
  likes: int("likes").default(0).notNull(),
  views: int("views").default(0).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Release = typeof releases.$inferSelect;
export type InsertRelease = typeof releases.$inferInsert;

// ── Saved Content ─────────────────────────────────────────────
export const savedContent = mysqlTable("savedContent", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  releaseId: int("releaseId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Activity Feed ─────────────────────────────────────────────
export const activityFeed = mysqlTable("activityFeed", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  creatorId: int("creatorId"),
  releaseId: int("releaseId"),
  type: mysqlEnum("type", [
    "new_post",
    "new_photo",
    "new_music",
    "new_book",
    "new_video",
    "unlocked_post",
    "new_subscriber",
    "new_follower",
  ]).notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityFeed = typeof activityFeed.$inferSelect;

// ── Messages ──────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});