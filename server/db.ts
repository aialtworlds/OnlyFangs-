import { eq, desc, and, count, sql, isNull, or, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, creators, subscriptions, tiers, follows,
  releases, savedContent, activityFeed, notifications, messages, content, conversations, messageReactions,
  type InsertUser
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Patron Dashboard ───────────────────────────────────────────

export async function getPatronStats(userId: number) {
  const db = await getDb();
  if (!db) return { activeSubscriptions: 0, savedContentCount: 0, followingCreators: 0, loyaltyPoints: 0 };

  const [activeSubs] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(and(eq(subscriptions.patronId, userId), eq(subscriptions.status, "active")));

  const [savedCount] = await db
    .select({ count: count() })
    .from(savedContent)
    .where(eq(savedContent.userId, userId));

  const [followingCount] = await db
    .select({ count: count() })
    .from(follows)
    .where(eq(follows.followerId, userId));

  const [userRow] = await db
    .select({ loyaltyPoints: users.loyaltyPoints })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return {
    activeSubscriptions: activeSubs?.count ?? 0,
    savedContentCount: savedCount?.count ?? 0,
    followingCreators: followingCount?.count ?? 0,
    loyaltyPoints: userRow?.loyaltyPoints ?? 0,
  };
}

export async function getPatronSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      subId: subscriptions.id,
      status: subscriptions.status,
      renewsAt: subscriptions.renewsAt,
      startedAt: subscriptions.startedAt,
      creatorId: creators.id,
      creatorAlias: creators.alias,
      creatorHandle: creators.handle,
      creatorCategory: creators.category,
      creatorAvatarUrl: creators.avatarUrl,
      creatorVerified: creators.verified,
    })
    .from(subscriptions)
    .innerJoin(creators, eq(subscriptions.creatorId, creators.id))
    .where(and(eq(subscriptions.patronId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.startedAt))
    .limit(20);
}

export async function getPatronActivity(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: activityFeed.id,
      type: activityFeed.type,
      message: activityFeed.message,
      createdAt: activityFeed.createdAt,
      creatorAlias: creators.alias,
      creatorAvatarUrl: creators.avatarUrl,
    })
    .from(activityFeed)
    .leftJoin(creators, eq(activityFeed.creatorId, creators.id))
    .where(eq(activityFeed.userId, userId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(10);
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: count() })
    .from(messages)
    .where(and(eq(messages.senderId, userId), isNull(messages.readAt)));
  return row?.count ?? 0;
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return row?.count ?? 0;
}

export async function getDiscoverCreators(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(creators)
    .where(eq(creators.status, "active"))
    .orderBy(desc(creators.totalSubscribers))
    .limit(limit);
}

// ── Creator Dashboard ──────────────────────────────────────────

export async function getCreatorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCreatorReleases(creatorId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(releases)
    .where(eq(releases.creatorId, creatorId))
    .orderBy(desc(releases.publishedAt))
    .limit(limit);
}

export async function getCreatorTiers(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tiers)
    .where(eq(tiers.creatorId, creatorId))
    .orderBy(tiers.sortOrder);
}

export async function getCreatorByHandle(handle: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.handle, handle))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublicCreatorTiers(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tiers)
    .where(eq(tiers.creatorId, creatorId))
    .orderBy(tiers.sortOrder);
}

export async function createCreatorProfile(data: {
  userId: number;
  alias: string;
  handle: string;
  bio?: string;
  category?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(creators).values({
    userId: data.userId,
    alias: data.alias,
    handle: data.handle,
    bio: data.bio ?? null,
    category: data.category ?? null,
    status: "pending",
  });
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, data.userId))
    .limit(1);
  return result[0];
}

export async function updateCreatorProfile(
  creatorId: number,
  data: Partial<{
    alias: string;
    bio: string;
    longBio: string;
    location: string;
    category: string;
    avatarUrl: string;
    coverUrl: string;
    socialInstagram: string;
    socialTiktok: string;
    socialTwitter: string;
    socialWebsite: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creators).set(data).where(eq(creators.id, creatorId));
}

export async function createRelease(data: {
  creatorId: number;
  title: string;
  description?: string;
  type: "image" | "photo" | "music" | "book" | "video" | "post";
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: string;
  pages?: number;
  tierRequired: "free" | "fledgling" | "dweller" | "courtier" | "night_royalty";
  locked: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(releases).values(data);
  const [creator] = await db
    .select({ totalReleases: creators.totalReleases })
    .from(creators)
    .where(eq(creators.id, data.creatorId))
    .limit(1);
  if (creator) {
    await db
      .update(creators)
      .set({ totalReleases: creator.totalReleases + 1 })
      .where(eq(creators.id, data.creatorId));
  }
}

export async function updateUserProfile(
  userId: number,
  data: Partial<{
    displayName: string;
    avatarUrl: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTier(data: {
  creatorId: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  currency?: string;
  perks?: string[] | null;
  featured?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(tiers).values({
    creatorId: data.creatorId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    price: data.price,
    currency: data.currency ?? "USD",
    perks: data.perks ?? null,
    featured: data.featured ?? false,
    sortOrder: data.sortOrder ?? 0,
  });
  
  // Query the newly created tier to get its ID
  const createdTier = await db
    .select({ id: tiers.id, name: tiers.name, slug: tiers.slug })
    .from(tiers)
    .where(eq(tiers.slug, data.slug))
    .limit(1);
  
  if (!createdTier.length) {
    throw new Error("Failed to retrieve created tier");
  }
  
  return createdTier[0];
}


// ── Creator Admin Panel ────────────────────────────────────────

export async function getCreatorSubscriptions(creatorId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: subscriptions.id,
      patronId: subscriptions.patronId,
      tierId: subscriptions.tierId,
      tierName: tiers.name,
      status: subscriptions.status,
      startedAt: subscriptions.startedAt,
      renewsAt: subscriptions.renewsAt,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(tiers, eq(subscriptions.tierId, tiers.id))
    .where(eq(subscriptions.creatorId, creatorId))
    .orderBy(subscriptions.createdAt);

  return result;
}

export async function getCreatorAnalytics(creatorId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalSubscribers: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      tierBreakdown: [],
    };
  }

  // Get total and active subscriptions
  const [subStats] = await db
    .select({
      total: sql`COUNT(DISTINCT ${subscriptions.patronId})`.as('total'),
      active: sql`COUNT(CASE WHEN ${subscriptions.status} = 'active' THEN 1 END)`.as('active'),
    })
    .from(subscriptions)
    .innerJoin(tiers, eq(subscriptions.tierId, tiers.id))
    .where(eq(subscriptions.creatorId, creatorId));

  // Get tier breakdown
  const tierBreakdown = await db
    .select({
      tierName: tiers.name,
      tierId: tiers.id,
      count: sql`COUNT(${subscriptions.id})`.as('count'),
      price: tiers.price,
    })
    .from(subscriptions)
    .innerJoin(tiers, eq(subscriptions.tierId, tiers.id))
    .where(eq(subscriptions.creatorId, creatorId))
    .groupBy(tiers.id, tiers.name, tiers.price) as any;

  // Calculate revenue (simplified: price * count)
  let totalRevenue = 0;
  let monthlyRevenue = 0;
  tierBreakdown.forEach((tier: any) => {
    const count = Number(tier.count) || 0;
    const price = parseFloat(tier.price) || 0;
    totalRevenue += price * count;
  });

  // Estimate monthly (assuming all active subs renew)
  monthlyRevenue = (Number(subStats?.active) || 0) * 25; // Average tier price

  return {
    totalSubscribers: Number(subStats?.total) || 0,
    activeSubscriptions: Number(subStats?.active) || 0,
    totalRevenue,
    monthlyRevenue,
    tierBreakdown: tierBreakdown.map((t: any) => ({
      tierName: t.tierName,
      tierId: t.tierId,
      subscribers: Number(t.count) || 0,
      price: t.price,
    })),
  };
}

export async function updateTier(tierId: number, creatorId: number, data: {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: string;
  currency?: string;
  perks?: string[] | null;
  featured?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify tier belongs to creator
  const tier = await db
    .select()
    .from(tiers)
    .where(eq(tiers.id, tierId))
    .limit(1);

  if (!tier.length || tier[0].creatorId !== creatorId) {
    throw new Error("Tier not found or access denied");
  }

  await db
    .update(tiers)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      currency: data.currency,
      perks: data.perks,
      featured: data.featured,
      sortOrder: data.sortOrder,
    })
    .where(eq(tiers.id, tierId));
}

export async function deleteTier(tierId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify tier belongs to creator
  const tier = await db
    .select()
    .from(tiers)
    .where(eq(tiers.id, tierId))
    .limit(1);

  if (!tier.length || tier[0].creatorId !== creatorId) {
    throw new Error("Tier not found or access denied");
  }

  // Check if tier has active subscriptions
  const activeSubs = await db
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(subscriptions)
    .where(eq(subscriptions.tierId, tierId));

  if (Number(activeSubs[0]?.count) > 0) {
    throw new Error("Cannot delete tier with active subscriptions");
  }

  await db.delete(tiers).where(eq(tiers.id, tierId));
}

// ── Content Management ────────────────────────────────────────

export async function uploadContent(
  creatorId: number,
  tierId: number,
  title: string,
  description: string | undefined,
  type: string,
  fileUrl: string,
  fileKey: string,
  mimeType?: string,
  fileSize?: number,
  duration?: string,
  thumbnailUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(content).values({
    creatorId,
    tierId,
    title,
    description: description ?? null,
    type: type as any,
    fileUrl,
    fileKey,
    mimeType: mimeType ?? null,
    fileSize: fileSize ?? null,
    duration: duration ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
  });
  return result;
}

export async function getCreatorContent(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(content)
    .where(eq(content.creatorId, creatorId))
    .orderBy(desc(content.createdAt));
}

export async function getContentById(contentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(content)
    .where(eq(content.id, contentId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteContent(contentId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const item = await getContentById(contentId);
  if (!item || item.creatorId !== creatorId) {
    throw new Error("Content not found or unauthorized");
  }
  await db.delete(content).where(eq(content.id, contentId));
}

export async function canAccessContent(
  patronId: number,
  contentId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const item = await getContentById(contentId);
  if (!item) return false;

  // Check if patron has active subscription to the required tier
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.patronId, patronId),
        eq(subscriptions.tierId, item.tierId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  return subscription.length > 0;
}


// ── Messaging Functions ────────────────────────────────────────
export async function getOrCreateConversation(creatorId: number, patronId: number) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.creatorId, creatorId), eq(conversations.patronId, patronId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [newConv] = await db
    .insert(conversations)
    .values({ creatorId, patronId })
    .$returningId();

  return newConv;
}

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get creator profile for this user (if they are a creator)
  const userCreator = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, userId))
    .limit(1);

  const creatorId = userCreator[0]?.id;

  // Get conversations where user is either:
  // 1. A creator (creatorId matches their creator profile)
  // 2. A patron (patronId matches their user ID)
  const convs = await db
    .select()
    .from(conversations)
    .where((conv) => 
      or(
        creatorId ? eq(conv.creatorId, creatorId) : undefined,
        eq(conv.patronId, userId)
      )
    )
    .orderBy(desc(conversations.lastMessageAt));

  // Enrich conversations with creator info and unread count
  const enriched = await Promise.all(
    convs.map(async (conv) => {
      const creator = await db
        .select()
        .from(creators)
        .where(eq(creators.id, conv.creatorId))
        .limit(1);

      const unreadCount = await getUnreadMessageCountInConversation(conv.id, userId);

      return {
        ...conv,
        creator: creator[0] || null,
        unreadCount,
      };
    })
  );

  return enriched;
}

export async function getMessages(conversationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function sendMessage(conversationId: number, senderId: number, content: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .insert(messages)
    .values({ conversationId, senderId, content });

  // Get the inserted message ID
  const [msg] = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.id))
    .limit(1);

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return msg;
}

export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) return null;

  return await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(eq(messages.id, messageId));
}


// ── Messaging Authorization Helpers ────────────────────────────
/**
 * Check if a user is a participant in a conversation.
 * Handles both direct participants (patronId) and creators (via creator profile).
 * 
 * @param conversationId - The conversation to check
 * @param userId - The authenticated user's ID
 * @returns true if user is a participant (either as patron or creator), false otherwise
 */
export async function isConversationParticipant(
  conversationId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const conv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv.length) return false;

  // Check if user is the patron
  if (conv[0].patronId === userId) return true;

  // Check if user is the creator (via creator profile)
  const creator = await db
    .select()
    .from(creators)
    .where(eq(creators.id, conv[0].creatorId))
    .limit(1);

  if (creator.length > 0 && creator[0].userId === userId) return true;

  return false;
}


// ── Unread Message Helpers ────────────────────────────────────
/**
 * Count unread messages in a conversation for a specific user
 * Unread = messages where readAt is null and sender is not the user
 */
export async function getUnreadMessageCountInConversation(conversationId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [row] = await db
    .select({ count: count() })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messages.readAt),
        ne(messages.senderId, userId)
      )
    );

  return row?.count || 0;
}

/**
 * Mark all messages in a conversation as read for a user
 * (messages sent by other users)
 */
export async function markConversationAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  return await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messages.readAt),
        ne(messages.senderId, userId)
      )
    );
}


/**
 * Add a reaction to a message
 */
export async function addMessageReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .insert(messageReactions)
      .values({ messageId, userId, emoji });
    return result;
  } catch (error) {
    // If unique constraint fails, the reaction already exists
    console.log(`[DB] Reaction already exists: message ${messageId}, user ${userId}, emoji ${emoji}`);
    return null;
  }
}

/**
 * Remove a reaction from a message
 */
export async function removeMessageReaction(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return null;

  return await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    );
}

/**
 * Get all reactions for a message
 */
export async function getMessageReactions(messageId: number) {
  const db = await getDb();
  if (!db) return [];

  const reactions = await db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));

  // Group reactions by emoji and count
  const grouped = reactions.reduce((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);
    if (existing) {
      existing.count++;
      existing.userIds.push(reaction.userId);
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        userIds: [reaction.userId],
      });
    }
    return acc;
  }, [] as Array<{ emoji: string; count: number; userIds: number[] }>);

  return grouped;
}

/**
 * Check if user has reacted with specific emoji
 */
export async function hasUserReacted(messageId: number, userId: number, emoji: string) {
  const db = await getDb();
  if (!db) return false;

  const reaction = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    )
    .limit(1);

  return reaction.length > 0;
}


// ── Notifications ─────────────────────────────────────────────

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const notification = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification.length || notification[0].userId !== userId) {
    throw new Error("Notification not found or unauthorized");
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));

  return notification[0];
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values({
    userId,
    type,
    title,
    message: message || null,
    read: false,
  });

  const notificationId = result[0].insertId as number;
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1)
    .then(rows => rows[0]);
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const notification = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification.length || notification[0].userId !== userId) {
    throw new Error("Notification not found or unauthorized");
  }

  await db
    .delete(notifications)
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

/**
 * Notify creator followers about new release
 */
export async function notifyFollowersAboutNewRelease(creatorId: number, releaseId: number, releaseTitle: string) {
  const db = await getDb();
  if (!db) return;

  // Get all followers of the creator
  const followers = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.creatorId, creatorId));

  if (followers.length === 0) return;

  // Get creator name
  const creator = await db
    .select({ alias: creators.alias })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator.length) return;

  // Create notifications for all followers
  const creatorName = creator[0].alias;
  for (const follower of followers) {
    await createNotification(
      follower.followerId,
      'new_release',
      `New release from ${creatorName}`,
      `${creatorName} posted: ${releaseTitle}`
    );
  }
}

/**
 * Notify user about subscription confirmation
 */
export async function notifySubscriptionConfirmed(userId: number, creatorName: string, tierName: string) {
  await createNotification(
    userId,
    'subscription_confirmed',
    `Subscription confirmed`,
    `You are now subscribed to ${creatorName}'s ${tierName} tier`
  );
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(userId: number, senderName: string, messagePreview: string) {
  await createNotification(
    userId,
    'new_message',
    `New message from ${senderName}`,
    messagePreview.substring(0, 100)
  );
}
