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
  coverUrl: text("coverUrl"),
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
  stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 255 }),
  // Single subscription plan per creator (no multi-tier). Null price = not offering a paid subscription yet.
  subscriptionPrice: decimal("subscriptionPrice", { precision: 10, scale: 2 }),
  subscriptionCurrency: varchar("subscriptionCurrency", { length: 3 }).default("USD").notNull(),
  subscriptionPerks: json("subscriptionPerks").$type<string[]>().default([]),
  subscriptionStripePriceId: varchar("subscriptionStripePriceId", { length: 255 }), // Cached Stripe Price object id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

// ── Subscriptions ─────────────────────────────────────────────
// One plan per creator (price/perks live on `creators`), so a subscription
// is scoped to (patron, creator) — no separate tierId to track.
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  patronId: int("patronId").notNull(),
  creatorId: int("creatorId").notNull(),
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
  locked: boolean("locked").default(true).notNull(), // true = requires an active subscription to access
  collectionId: int("collectionId"), // Optional collection/album ID
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["image", "photo", "music", "book", "video", "post"]).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL from storagePut
  fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for reference
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // Size in bytes
  duration: varchar("duration", { length: 20 }), // For audio/video: "HH:MM:SS"
  thumbnailUrl: text("thumbnailUrl"), // Optional preview image
  price: decimal("price", { precision: 10, scale: 2 }), // One-time unlock price (optional)
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
  price: decimal("price", { precision: 10, scale: 2 }), // Pay-Per-View lock price
  mediaUrl: text("mediaUrl"), // Locked media URL
  mediaKey: varchar("mediaKey", { length: 255 }), // S3 Key for the locked media
  mediaType: mysqlEnum("mediaType", ["image", "photo", "music", "video", "book"]), // Type of PPV attachment
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ── One-Time Purchases ──────────────────────────────────────────
export const oneTimePurchases = mysqlTable("one_time_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["post", "message", "tip"]).notNull(),
  targetId: int("targetId"), // ID of post or message, null for direct tips
  creatorId: int("creatorId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OneTimePurchase = typeof oneTimePurchases.$inferSelect;
export type InsertOneTimePurchase = typeof oneTimePurchases.$inferInsert;

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

// ── Media Collections ─────────────────────────────────────────
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  type: mysqlEnum("type", ["album", "gallery", "playlist", "anthology"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

// ── Comments ──────────────────────────────────────────────────
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ── Covens (Communities) ──────────────────────────────────────
export const covens = mysqlTable("covens", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId"), // null if global/admin community
  locked: boolean("locked").default(false).notNull(), // true = only active subscribers (or creator/admin) can access
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 1000 }),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coven = typeof covens.$inferSelect;
export type InsertCoven = typeof covens.$inferInsert;

// ── Coven Members ──────────────────────────────────────────────
export const covenMembers = mysqlTable("coven_members", {
  id: int("id").autoincrement().primaryKey(),
  covenId: int("covenId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "moderator", "owner"]).default("member").notNull(),
  mutedUntil: timestamp("mutedUntil"), // null = not muted; a future timestamp blocks posting/commenting until then
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type CovenMember = typeof covenMembers.$inferSelect;
export type InsertCovenMember = typeof covenMembers.$inferInsert;

// ── Coven Bans (permanent, blocks re-entry even after leaving/kick) ──
export const covenBans = mysqlTable("coven_bans", {
  id: int("id").autoincrement().primaryKey(),
  covenId: int("covenId").notNull(),
  userId: int("userId").notNull(),
  bannedBy: int("bannedBy").notNull(),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CovenBan = typeof covenBans.$inferSelect;

// ── Coven Warnings (logged, non-restrictive) ─────────────────────
export const covenWarnings = mysqlTable("coven_warnings", {
  id: int("id").autoincrement().primaryKey(),
  covenId: int("covenId").notNull(),
  userId: int("userId").notNull(),
  issuedBy: int("issuedBy").notNull(),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CovenWarning = typeof covenWarnings.$inferSelect;

// ── Coven Reports (post/comment reports, with admin escalation) ──
export const covenReports = mysqlTable("coven_reports", {
  id: int("id").autoincrement().primaryKey(),
  covenId: int("covenId").notNull(),
  postId: int("postId").notNull(),
  commentId: int("commentId"), // null = reporting the post itself, otherwise a specific comment
  reportedUserId: int("reportedUserId").notNull(), // author of the reported post/comment
  reportedBy: int("reportedBy").notNull(),
  reason: mysqlEnum("reason", ["spam", "harassment", "other"]).notNull(),
  description: varchar("description", { length: 1000 }),
  // Escalated reports (harassment reason, or the reported user is coven
  // staff) go straight to the platform admin queue instead of the coven's
  // own owner/moderators — so staff can't quietly bury a report against
  // themselves or a friend, and real threats get a faster, wider-eyes review.
  escalated: boolean("escalated").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "resolved"]).default("pending").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CovenReport = typeof covenReports.$inferSelect;

// ── Coven Posts (Threads) ───────────────────────────────────────
export const covenPosts = mysqlTable("coven_posts", {
  id: int("id").autoincrement().primaryKey(),
  covenId: int("covenId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  isPinned: boolean("isPinned").default(false).notNull(),
  isLocked: boolean("isLocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"), // null = never edited
});

export type CovenPost = typeof covenPosts.$inferSelect;
export type InsertCovenPost = typeof covenPosts.$inferInsert;

// ── Coven Comments (Thread Replies) ─────────────────────────────
export const covenComments = mysqlTable("coven_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"), // null = never edited
});

export type CovenComment = typeof covenComments.$inferSelect;
export type InsertCovenComment = typeof covenComments.$inferInsert;

// ── Coven Reactions (likes on a post or a comment, never both) ───
export const covenReactions = mysqlTable("coven_reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId"),
  commentId: int("commentId"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CovenReaction = typeof covenReactions.$inferSelect;

// ── Coven Thread Follows (get notified of new replies without commenting) ──
export const covenThreadFollows = mysqlTable("coven_thread_follows", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CovenThreadFollow = typeof covenThreadFollows.$inferSelect;

// ── Custom Requests (Creator Custom Commissions) ────────────────
export const customRequests = mysqlTable("custom_requests", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  patronId: int("patronId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  instructions: text("instructions").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "completed", "declined"]).default("pending").notNull(),
  deliveryUrl: text("deliveryUrl"), // Uploaded file URL by creator
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CustomRequest = typeof customRequests.$inferSelect;
export type InsertCustomRequest = typeof customRequests.$inferInsert;

// ── Creator Funding Goals ─────────────────────────────────────────
export const creatorGoals = mysqlTable("creator_goals", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("targetAmount", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreatorGoal = typeof creatorGoals.$inferSelect;
export type InsertCreatorGoal = typeof creatorGoals.$inferInsert;
