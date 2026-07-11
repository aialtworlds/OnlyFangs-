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
  unique,
  index,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "creator", "admin", "sub_admin", "moderator", "admin_master"]).default("user").notNull(),
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
  email: varchar("email", { length: 320 }),
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


// ── Exclusive Content ─────────────────────────────────────────
export const content = mysqlTable("content", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  tierId: int("tierId").notNull(), // Tier required to access this content
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["image", "photo", "music", "book", "video", "post"]).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL from storagePut
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for reference
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // Size in bytes
  duration: varchar("duration", { length: 20 }), // For audio/video: "HH:MM:SS"
  thumbnailUrl: text("thumbnailUrl"), // Optional preview image
  moderationStatus: mysqlEnum("moderationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Content = typeof content.$inferSelect;
export type InsertContent = typeof content.$inferInsert;


// ── Conversations ─────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  patronId: int("patronId").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ── Messages ───────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ── Message Reactions ────────────────────────────────────────
export const messageReactions = mysqlTable(
  'message_reactions',
  {
    id: int('id').autoincrement().primaryKey(),
    messageId: int('messageId').notNull(),
    userId: int('userId').notNull(),
    emoji: varchar('emoji', { length: 10 }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one reaction per user per message per emoji
    uniqueReaction: unique().on(table.messageId, table.userId, table.emoji),
  })
);

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;


// ── Viewing History ────────────────────────────────────────────
export const viewingHistory = mysqlTable(
  "viewingHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    contentId: int("contentId").notNull(),
    creatorId: int("creatorId").notNull(),
    viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  },
  (table) => ({
    userContentIndex: index("userContentIndex").on(table.userId, table.contentId),
    userCreatorIndex: index("userCreatorIndex").on(table.userId, table.creatorId),
  })
);

export type ViewingHistory = typeof viewingHistory.$inferSelect;
export type InsertViewingHistory = typeof viewingHistory.$inferInsert;

// ── Moderation Queue ──────────────────────────────────────────
export const moderationQueue = mysqlTable(
  "moderation_queue",
  {
    id: int("id").autoincrement().primaryKey(),
    contentId: int("contentId").notNull(),
    creatorId: int("creatorId").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "changes_requested"]).default("pending").notNull(),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
    reviewedBy: int("reviewedBy"), // Admin user ID
    notes: text("notes"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    contentIndex: index("contentIndex").on(table.contentId),
    creatorIndex: index("creatorIndex").on(table.creatorId),
    statusIndex: index("statusIndex").on(table.status),
  })
);

export type ModerationQueue = typeof moderationQueue.$inferSelect;
export type InsertModerationQueue = typeof moderationQueue.$inferInsert;

// ── Moderation Logs ──────────────────────────────────────────
export const moderationLogs = mysqlTable(
  "moderation_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    contentId: int("contentId").notNull(),
    action: mysqlEnum("action", ["submitted", "approved", "rejected", "flagged", "changes_requested"]).notNull(),
    performedBy: int("performedBy").notNull(), // User ID (admin or system)
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    contentIndex: index("contentIndex").on(table.contentId),
    actionIndex: index("actionIndex").on(table.action),
  })
);

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;

// ── Content Flags (User Reports) ──────────────────────────────
export const contentFlags = mysqlTable(
  "content_flags",
  {
    id: int("id").autoincrement().primaryKey(),
    contentId: int("contentId").notNull(),
    flaggedBy: int("flaggedBy").notNull(), // User who reported
    reason: mysqlEnum("reason", ["inappropriate", "copyright", "spam", "other"]).notNull(),
    description: text("description"),
    flaggedAt: timestamp("flaggedAt").defaultNow().notNull(),
    resolved: boolean("resolved").default(false).notNull(),
    resolvedBy: int("resolvedBy"), // Admin who resolved
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    contentIndex: index("contentIndex").on(table.contentId),
    resolvedIndex: index("resolvedIndex").on(table.resolved),
  })
);

export type ContentFlag = typeof contentFlags.$inferSelect;
export type InsertContentFlag = typeof contentFlags.$inferInsert;


// ── Content Appeals ────────────────────────────────────────────
export const appeals = mysqlTable(
  "appeals",
  {
    id: int("id").autoincrement().primaryKey(),
    contentId: int("contentId").notNull(),
    creatorId: int("creatorId").notNull(), // Creator submitting appeal
    reason: text("reason").notNull(), // Why content should be reconsidered
    status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending").notNull(),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
    reviewedBy: int("reviewedBy"), // Admin who reviewed
    adminResponse: text("adminResponse"), // Admin's feedback
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    contentIndex: index("appealContentIndex").on(table.contentId),
    creatorIndex: index("appealCreatorIndex").on(table.creatorId),
    statusIndex: index("appealStatusIndex").on(table.status),
  })
);

export type Appeal = typeof appeals.$inferSelect;
export type InsertAppeal = typeof appeals.$inferInsert;


// ── Admin Audit Logs ──────────────────────────────────────────
export const adminAuditLogs = mysqlTable(
  "admin_audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    adminId: int("adminId").notNull(), // Admin who performed action
    action: varchar("action", { length: 100 }).notNull(), // e.g., "verify_creator", "remove_content", "ban_user"
    targetType: varchar("targetType", { length: 50 }).notNull(), // "user", "creator", "content", "admin"
    targetId: int("targetId"), // ID of affected entity
    details: json("details").$type<Record<string, any>>().default({}), // Additional context
    reason: text("reason"), // Why the action was taken
    ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
    userAgent: text("userAgent"), // Browser/client info
    status: mysqlEnum("status", ["success", "failed", "pending"]).default("success").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    adminIndex: index("adminIndex").on(table.adminId),
    actionIndex: index("actionIndex").on(table.action),
    targetIndex: index("targetIndex").on(table.targetType, table.targetId),
    createdAtIndex: index("createdAtIndex").on(table.createdAt),
  })
);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogs.$inferInsert;

// ── Admin Permissions ────────────────────────────────────────
export const adminPermissions = mysqlTable(
  "admin_permissions",
  {
    id: int("id").autoincrement().primaryKey(),
    adminId: int("adminId").notNull(), // Admin user ID
    permission: varchar("permission", { length: 100 }).notNull(), // e.g., "verify_creators", "remove_content", "manage_admins"
    grantedBy: int("grantedBy"), // Admin who granted this permission
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"), // Optional expiration
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    adminIndex: index("permAdminIndex").on(table.adminId),
    permissionIndex: index("permissionIndex").on(table.permission),
  })
);

export type AdminPermission = typeof adminPermissions.$inferSelect;
export type InsertAdminPermission = typeof adminPermissions.$inferInsert;
