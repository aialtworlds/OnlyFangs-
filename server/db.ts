import { eq, desc, and, count, sql, isNull, or, ne, isNotNull, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, creators, subscriptions, tiers, follows,
  releases, savedContent, activityFeed, notifications, messages, content, conversations, messageReactions, viewingHistory,
  moderationQueue, moderationLogs, contentFlags, appeals, collections, comments, covens, covenMembers, covenPosts, covenComments, covenBans, covenWarnings,
  type InsertUser
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationPromise: Promise<void> | null = null;

async function runMigration(db: any) {
  console.log("[Database] Running migrations...");
  try {
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    console.log("[Database] Migrations successfully applied!");
  } catch (error) {
    console.error("[Database] Migration failed:", error);
  }
}

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
  if (_db && !_migrationPromise) {
    _migrationPromise = runMigration(_db);
  }
  if (_migrationPromise) {
    await _migrationPromise;
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
    } else {
      const adminEmails = ENV.adminEmails
        ? ENV.adminEmails.split(",").map((email) => email.trim().toLowerCase())
        : [];
      const isEmailAdmin = !!(user.email && adminEmails.includes(user.email.toLowerCase()));

      if (user.openId === ENV.ownerOpenId || isEmailAdmin) {
        values.role = 'admin';
        updateSet.role = 'admin';
      }
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
      tierId: subscriptions.tierId,
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
  
  const creatorTiers = await db
    .select()
    .from(tiers)
    .where(eq(tiers.creatorId, creatorId))
    .orderBy(tiers.sortOrder);

  // If there is no free tier (price = '0.00'), create one dynamically
  const hasFree = creatorTiers.some((t) => parseFloat(t.price) === 0);
  if (!hasFree) {
    await db.insert(tiers).values({
      creatorId,
      name: "Free",
      slug: "free",
      description: "Access to free content and public updates",
      price: "0.00",
      currency: "USD",
      perks: [],
      featured: false,
      sortOrder: 0
    });
    // Fetch again
    return db
      .select()
      .from(tiers)
      .where(eq(tiers.creatorId, creatorId))
      .orderBy(tiers.sortOrder);
  }

  return creatorTiers;
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
  return getCreatorTiers(creatorId);
}

export async function followCreator(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.creatorId, creatorId)))
    .limit(1);

  if (existing.length > 0) return; // already following, nothing to do

  await db.insert(follows).values({ followerId, creatorId });
}

export async function unfollowCreator(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.creatorId, creatorId)));
}

export async function isFollowingCreator(followerId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.creatorId, creatorId)))
    .limit(1);

  return existing.length > 0;
}

export async function getFollowerCount(creatorId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.creatorId, creatorId));

  return result[0]?.value ?? 0;
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
  const user = await getUserById(data.userId);
  await db.insert(creators).values({
    userId: data.userId,
    alias: data.alias,
    handle: data.handle,
    bio: data.bio ?? null,
    category: data.category ?? null,
    avatarUrl: user?.avatarUrl ?? null,
    coverUrl: user?.coverUrl ?? null,
    status: "active",
  });
  // Only promote user role to creator if they are not already an admin
  if (user && user.role !== "admin") {
    await db
      .update(users)
      .set({ role: "creator" })
      .where(eq(users.id, data.userId));
  }
  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, data.userId))
    .limit(1);
  const creator = result[0];
  if (creator) {
    // Automatically create a default free tier so they immediately have one!
    await db.insert(tiers).values({
      creatorId: creator.id,
      name: "Fledgling",
      slug: "fledgling",
      price: "0.00",
      description: "Free tier for all shadow followers",
      sortOrder: 1,
    });
  }
  return creator;
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
    stripeConnectAccountId: string;
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
  const result = await db.insert(releases).values(data);
  const releaseId = Array.isArray(result) ? (result[0] as any).id : (result as any).insertId;
  
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
  
  return releaseId;
}

export async function updateUserProfile(
  userId: number,
  data: Partial<{
    displayName: string;
    avatarUrl: string;
    coverUrl: string;
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
  thumbnailUrl?: string,
  collectionId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert content with pending moderation status
  const result = await db.insert(content).values({
    creatorId,
    tierId,
    collectionId: collectionId ?? null,
    title,
    description: description ?? null,
    type: type as any,
    fileUrl,
    fileKey,
    mimeType: mimeType ?? null,
    fileSize: fileSize ?? null,
    duration: duration ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
    moderationStatus: "pending",
  });
  
  // Automatically submit to moderation queue
  const contentId = (result as any).insertId;
  if (contentId) {
    try {
      await db.insert(moderationQueue).values({
        contentId,
        creatorId,
        status: "pending",
      });
      
      // Log the submission
      await db.insert(moderationLogs).values({
        contentId,
        action: "submitted",
        performedBy: creatorId,
        reason: "Content automatically submitted for moderation upon upload",
      });
      
      // Notify all admins about new content in moderation queue
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));
      
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "moderation",
          title: "New Content Awaiting Review",
          message: `New content "${title}" from creator needs moderation review`,
          read: false,
        });
      }
    } catch (error) {
      console.error("[Content] Error submitting to moderation queue:", error);
      // Don't fail the upload if moderation submission fails
    }
  }
  
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

  // Admin bypass (God Mode / Night Royalty privilege)
  const user = await getUserById(patronId);
  if (user && user.role === 'admin') {
    return true;
  }

  const item = await getContentById(contentId);
  if (!item) return false;

  // If the required tier is free (price = '0.00'), anyone can access it!
  const [tier] = await db.select().from(tiers).where(eq(tiers.id, item.tierId)).limit(1);
  if (tier && parseFloat(tier.price) === 0) {
    return true;
  }

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


// ── Recommendation System ────────────────────────────────────────

/**
 * Get recommended creators based on user's viewing history and subscriptions
 * Algorithm:
 * 1. Find creators the user is already subscribed to
 * 2. Find creators with similar content types
 * 3. Find popular creators in categories user follows
 * 4. Exclude creators already followed
 * 5. Prioritize creators with free tiers
 */
export async function getRecommendedCreators(userId: number, limit: number = 6) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get user's subscriptions to understand their interests
    const userSubscriptions = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(eq(subscriptions.patronId, userId));

    const subscribedCreatorIds = userSubscriptions.map(s => s.creatorId);

    // Get creators the user already follows
    const userFollows = await db
      .select({ creatorId: follows.creatorId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followedCreatorIds = userFollows.map(f => f.creatorId);

    // Get creators the user has viewed content from (real viewing history)
    const viewedCreators = await db
      .select({ creatorId: viewingHistory.creatorId })
      .from(viewingHistory)
      .where(eq(viewingHistory.userId, userId))
      .limit(100);

    const viewedCreatorIds = viewedCreators.map(v => v.creatorId);

    // Find creators with similar content that user isn't following
    let recommendedCreators = await db
      .select({
        id: creators.id,
        alias: creators.alias,
        avatarUrl: creators.avatarUrl,
        coverUrl: creators.coverUrl,
        verified: creators.verified,
        totalSubscribers: creators.totalSubscribers,
        totalReleases: creators.totalReleases,
      })
      .from(creators)
      .where(
        and(
          // Exclude self
          ne(creators.id, userId),
          // Exclude already followed
          sql`${creators.id} NOT IN (${sql.join([...followedCreatorIds, userId])})`
        )
      )
      .limit(limit * 3); // Get more to filter

    // Score and rank creators
    const scoredCreators = recommendedCreators.map(creator => {
      let score = 0;

      // Bonus for verified creators
      if (creator.verified) score += 15;

      // Bonus for popular creators (more subscribers)
      score += Math.min(creator.totalSubscribers / 10, 20);

      // Bonus for active creators (more releases)
      score += Math.min(creator.totalReleases / 5, 15);

      // Bonus if user is subscribed to similar creators
      if (subscribedCreatorIds.includes(creator.id)) score += 30;

      // Bonus if user has viewed content from similar creators (viewing history)
      if (viewedCreatorIds.includes(creator.id)) score += 25;

      return { ...creator, score };
    });

    // Sort by score and return top results
    return scoredCreators
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...creator }) => creator);
  } catch (error) {
    console.error('[Recommendations] Error fetching recommendations:', error);
    return [];
  }
}

/**
 * Track when a user views content
 */
export async function trackContentView(userId: number, contentId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(viewingHistory).values({
      userId,
      contentId,
      creatorId,
    });
  } catch (error) {
    console.error('[ViewingHistory] Error tracking view:', error);
  }
}

/**
 * Get trending creators (popular across all users)
 */
export async function getTrendingCreators(limit: number = 6) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        id: creators.id,
        alias: creators.alias,
        avatarUrl: creators.avatarUrl,
        coverUrl: creators.coverUrl,
        verified: creators.verified,
        totalSubscribers: creators.totalSubscribers,
        totalReleases: creators.totalReleases,
      })
      .from(creators)
      .orderBy(desc(creators.totalSubscribers))
      .limit(limit);
  } catch (error) {
    console.error('[Trending] Error fetching trending creators:', error);
    return [];
  }
}


// ═══════════════════════════════════════════════════════════
// Search & Filtering Functions
// ═══════════════════════════════════════════════════════════

export async function searchCreators(query: string, category?: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    let conditions = [];

    // Filter by search query (alias or bio)
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      conditions.push(
        sql`(LOWER(${creators.alias}) LIKE LOWER(${searchTerm}) OR LOWER(${creators.bio}) LIKE LOWER(${searchTerm}))`
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      conditions.push(eq(creators.category, category));
    }

    let query_builder: any = db
      .select({
        id: creators.id,
        alias: creators.alias,
        bio: creators.bio,
        avatarUrl: creators.avatarUrl,
        coverUrl: creators.coverUrl,
        verified: creators.verified,
        totalSubscribers: creators.totalSubscribers,
        totalReleases: creators.totalReleases,
        category: creators.category,
      })
      .from(creators);

    if (conditions.length > 0) {
      query_builder = query_builder.where(and(...(conditions as any)));
    }

    const results = await (query_builder as any)
      .orderBy(desc(creators.verified), desc(creators.totalSubscribers))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('[Search] Error searching creators:', error);
    return [];
  }
}

export async function searchContent(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    let conditions = [];

    // Filter by search query (title or description)
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      conditions.push(
        sql`(LOWER(${content.title}) LIKE LOWER(${searchTerm}) OR LOWER(${content.description}) LIKE LOWER(${searchTerm}))`
      );
    }

    let query_builder: any = db
      .select({
        id: content.id,
        title: content.title,
        description: content.description,
        thumbnailUrl: content.thumbnailUrl,
        creatorId: content.creatorId,
        type: content.type,
        tierId: content.tierId,
        createdAt: content.createdAt,
      })
      .from(content);

    if (conditions.length > 0) {
      query_builder = query_builder.where(and(...(conditions as any)));
    }

    const results = await (query_builder as any)
      .orderBy(desc(content.createdAt))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('[Search] Error searching content:', error);
    return [];
  }
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get unique categories from creators
    const creatorCategories = await db
      .selectDistinct({ category: creators.category })
      .from(creators)
      .where(isNotNull(creators.category));

    return creatorCategories
      .map(c => c.category)
      .filter((cat): cat is string => cat !== null && cat !== undefined)
      .sort();
  } catch (error) {
    console.error('[Search] Error fetching categories:', error);
    return [];
  }
}


// ── MODERATION HELPERS ────────────────────────────────────────

export async function submitContentForModeration(contentId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if already in queue
    const existing = await db
      .select()
      .from(moderationQueue)
      .where(eq(moderationQueue.contentId, contentId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new moderation queue entry
    const result = await db
      .insert(moderationQueue)
      .values({
        contentId,
        creatorId,
        status: "pending",
      });

    // Log the submission
    await db
      .insert(moderationLogs)
      .values({
        contentId,
        action: "submitted",
        performedBy: creatorId,
        reason: "Content submitted for moderation",
      });

    return { contentId, status: "pending" };
  } catch (error) {
    console.error("[Moderation] Error submitting content:", error);
    throw error;
  }
}

export async function getPendingModerations(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        id: moderationQueue.id,
        contentId: moderationQueue.contentId,
        creatorId: moderationQueue.creatorId,
        status: moderationQueue.status,
        submittedAt: moderationQueue.submittedAt,
        reviewedAt: moderationQueue.reviewedAt,
        notes: moderationQueue.notes,
        title: content.title,
        type: content.type,
        creatorAlias: creators.alias,
      })
      .from(moderationQueue)
      .leftJoin(content, eq(moderationQueue.contentId, content.id))
      .leftJoin(creators, eq(moderationQueue.creatorId, creators.userId))
      .where(eq(moderationQueue.status, "pending"))
      .orderBy(desc(moderationQueue.submittedAt))
      .limit(limit);
  } catch (error) {
    console.error("[Moderation] Error fetching pending:", error);
    return [];
  }
}

export async function approveContent(contentId: number, adminId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Update moderation queue
    await db
      .update(moderationQueue)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        notes: notes || null,
      })
      .where(eq(moderationQueue.contentId, contentId));

    // Log the approval
    await db
      .insert(moderationLogs)
      .values({
        contentId,
        action: "approved",
        performedBy: adminId,
        reason: notes || "Content approved",
      });

    return { success: true, contentId };
  } catch (error) {
    console.error("[Moderation] Error approving content:", error);
    throw error;
  }
}

export async function rejectContent(contentId: number, adminId: number, rejectionReason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Update moderation queue
    await db
      .update(moderationQueue)
      .set({
        status: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason,
      })
      .where(eq(moderationQueue.contentId, contentId));

    // Log the rejection
    await db
      .insert(moderationLogs)
      .values({
        contentId,
        action: "rejected",
        performedBy: adminId,
        reason: rejectionReason,
      });

    return { success: true, contentId };
  } catch (error) {
    console.error("[Moderation] Error rejecting content:", error);
    throw error;
  }
}

export async function requestChanges(contentId: number, adminId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Update moderation queue
    await db
      .update(moderationQueue)
      .set({
        status: "changes_requested",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        notes,
      })
      .where(eq(moderationQueue.contentId, contentId));

    // Log the request
    await db
      .insert(moderationLogs)
      .values({
        contentId,
        action: "changes_requested",
        performedBy: adminId,
        reason: notes,
      });

    return { success: true, contentId };
  } catch (error) {
    console.error("[Moderation] Error requesting changes:", error);
    throw error;
  }
}

export async function getModerationStats() {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0 };

  try {
    const stats = await db
      .select({
        status: moderationQueue.status,
        count: count(),
      })
      .from(moderationQueue)
      .groupBy(moderationQueue.status);

    const result = { pending: 0, approved: 0, rejected: 0, changes_requested: 0 };
    stats.forEach((stat) => {
      if (stat.status in result) {
        result[stat.status as keyof typeof result] = stat.count;
      }
    });

    return result;
  } catch (error) {
    console.error("[Moderation] Error fetching stats:", error);
    return { pending: 0, approved: 0, rejected: 0, changes_requested: 0 };
  }
}

export async function flagContent(contentId: number, userId: number, reason: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .insert(contentFlags)
      .values({
        contentId,
        flaggedBy: userId,
        reason: reason as "inappropriate" | "copyright" | "spam" | "other",
        description: description || null,
      });

    // Log the flag
    await db
      .insert(moderationLogs)
      .values({
        contentId,
        action: "flagged",
        performedBy: userId,
        reason: `Flagged as ${reason}: ${description || ""}`,
      });

    // Notify all admins about the new flag — same pattern already used
    // when content is submitted for moderation review.
    try {
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));

      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "moderation",
          title: "Content Flagged",
          message: `Content was flagged as "${reason}"${description ? `: ${description}` : ""}`,
          read: false,
        });
      }
    } catch (notifyError) {
      console.error("[Moderation] Error notifying admins of flag:", notifyError);
      // Don't fail the flag submission if notifying admins fails
    }

    return { success: true, flagId: (result as any).insertId || 0 };
  } catch (error) {
    console.error("[Moderation] Error flagging content:", error);
    throw error;
  }
}

export async function getContentFlags(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        id: contentFlags.id,
        contentId: contentFlags.contentId,
        reason: contentFlags.reason,
        description: contentFlags.description,
        flaggedAt: contentFlags.flaggedAt,
        resolved: contentFlags.resolved,
        title: content.title,
        creatorAlias: creators.alias,
      })
      .from(contentFlags)
      .leftJoin(content, eq(contentFlags.contentId, content.id))
      .leftJoin(creators, eq(content.creatorId, creators.userId))
      .where(eq(contentFlags.resolved, false))
      .orderBy(desc(contentFlags.flaggedAt))
      .limit(limit);
  } catch (error) {
    console.error("[Moderation] Error fetching flags:", error);
    return [];
  }
}

export async function resolveFlag(flagId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(contentFlags)
      .set({
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      })
      .where(eq(contentFlags.id, flagId));

    return { success: true, flagId };
  } catch (error) {
    console.error("[Moderation] Error resolving flag:", error);
    throw error;
  }
}


// ── Content Appeals ────────────────────────────────────────────

export async function submitAppeal(
  contentId: number,
  creatorId: number,
  reason: string
): Promise<{ appealId: number }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if content exists and belongs to creator
    const contentItem = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId));

    if (!contentItem.length) throw new Error("Content not found");
    if (contentItem[0].creatorId !== creatorId) throw new Error("Unauthorized");
    if (contentItem[0].moderationStatus !== "rejected") {
      throw new Error("Can only appeal rejected content");
    }

    // Check if appeal already exists
    const existingAppeal = await db
      .select()
      .from(appeals)
      .where(
        and(
          eq(appeals.contentId, contentId),
          eq(appeals.status, "pending")
        )
      );

    if (existingAppeal.length) {
      throw new Error("Appeal already pending for this content");
    }

    // Create appeal
    const result = await db.insert(appeals).values({
      contentId,
      creatorId,
      reason,
      status: "pending",
    });

    const appealId = (result as any).insertId;

    // Log appeal submission
    await db.insert(moderationLogs).values({
      contentId,
      action: "submitted",
      performedBy: creatorId,
      reason: `Creator appealed rejection with reason: ${reason}`,
    });

    // Notify admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "appeal",
        title: "New Content Appeal",
        message: `Creator appealed rejected content. Review needed.`,
        read: false,
      });
    }

    return { appealId };
  } catch (error) {
    console.error("[Appeals] Error submitting appeal:", error);
    throw error;
  }
}

export async function getCreatorAppeals(creatorId: number) {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(appeals)
      .where(eq(appeals.creatorId, creatorId))
      .orderBy(desc(appeals.submittedAt));
  } catch (error) {
    console.error("[Appeals] Error fetching creator appeals:", error);
    return [];
  }
}

export async function getPendingAppeals() {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(appeals)
      .where(eq(appeals.status, "pending"))
      .orderBy(desc(appeals.submittedAt));
  } catch (error) {
    console.error("[Appeals] Error fetching pending appeals:", error);
    return [];
  }
}

export async function approveAppeal(
  appealId: number,
  adminId: number,
  adminResponse?: string
): Promise<{ success: boolean }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get appeal
    const appeal = await db
      .select()
      .from(appeals)
      .where(eq(appeals.id, appealId));

    if (!appeal.length) throw new Error("Appeal not found");

    const appealData = appeal[0];

    // Update appeal status
    await db
      .update(appeals)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: adminId,
        adminResponse: adminResponse || "Appeal approved",
      })
      .where(eq(appeals.id, appealId));

    // Update content status back to approved
    await db
      .update(content)
      .set({ moderationStatus: "approved" })
      .where(eq(content.id, appealData.contentId));

    // Log approval
    await db.insert(moderationLogs).values({
      contentId: appealData.contentId,
      action: "approved",
      performedBy: adminId,
      reason: `Appeal approved. Content re-published.`,
    });

    // Notify creator
    await db.insert(notifications).values({
      userId: appealData.creatorId,
      type: "appeal",
      title: "Appeal Approved",
      message: `Your appeal has been approved. Content is now published.`,
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("[Appeals] Error approving appeal:", error);
    throw error;
  }
}

export async function denyAppeal(
  appealId: number,
  adminId: number,
  adminResponse: string
): Promise<{ success: boolean }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get appeal
    const appeal = await db
      .select()
      .from(appeals)
      .where(eq(appeals.id, appealId));

    if (!appeal.length) throw new Error("Appeal not found");

    const appealData = appeal[0];

    // Update appeal status
    await db
      .update(appeals)
      .set({
        status: "denied",
        reviewedAt: new Date(),
        reviewedBy: adminId,
        adminResponse: adminResponse || "Appeal denied",
      })
      .where(eq(appeals.id, appealId));

    // Log denial
    await db.insert(moderationLogs).values({
      contentId: appealData.contentId,
      action: "rejected",
      performedBy: adminId,
      reason: `Appeal denied. Reason: ${adminResponse}`,
    });

    // Notify creator
    await db.insert(notifications).values({
      userId: appealData.creatorId,
      type: "appeal",
      title: "Appeal Denied",
      message: `Your appeal has been denied. ${adminResponse}`,
      read: false,
    });

    return { success: true };
  } catch (error) {
    console.error("[Appeals] Error denying appeal:", error);
    throw error;
  }
}

// ── Media Collections & Comments Functions ────────────────────
export async function createCollection(data: {
  creatorId: number;
  title: string;
  description?: string;
  coverUrl?: string;
  type: "album" | "gallery" | "playlist" | "anthology";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(collections).values({
    creatorId: data.creatorId,
    title: data.title,
    description: data.description ?? null,
    coverUrl: data.coverUrl ?? null,
    type: data.type
  });
  const insertId = (result as any).insertId;
  return { id: insertId, ...data };
}

export async function getCreatorCollections(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(collections)
    .where(eq(collections.creatorId, creatorId))
    .orderBy(desc(collections.createdAt));
}

export async function getCollectionById(collectionId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function addComment(data: {
  contentId: number;
  userId: number;
  text: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  const insertId = (result as any).insertId;
  return { id: insertId, ...data, createdAt: new Date() };
}

export async function getContentComments(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: comments.id,
      contentId: comments.contentId,
      userId: comments.userId,
      text: comments.text,
      createdAt: comments.createdAt,
      userName: users.name,
      userDisplayName: users.displayName,
      userAvatarUrl: users.avatarUrl
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.contentId, contentId))
    .orderBy(desc(comments.createdAt));
}

export async function getPatronHomeFeed(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get followed creators
  const followed = await db
    .select({ creatorId: follows.creatorId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  // Get subscribed creators
  const subscribed = await db
    .select({ creatorId: subscriptions.creatorId })
    .from(subscriptions)
    .where(and(eq(subscriptions.patronId, userId), eq(subscriptions.status, 'active')));

  const creatorIds = Array.from(
    new Set([
      ...followed.map(f => f.creatorId),
      ...subscribed.map(s => s.creatorId)
    ])
  );

  if (creatorIds.length === 0) return [];

  // Fetch approved content from these creators
  const { inArray } = await import("drizzle-orm");
  const feedItems = await db
    .select({
      id: content.id,
      creatorId: content.creatorId,
      tierId: content.tierId,
      collectionId: content.collectionId,
      title: content.title,
      description: content.description,
      type: content.type,
      fileUrl: content.fileUrl,
      fileKey: content.fileKey,
      mimeType: content.mimeType,
      fileSize: content.fileSize,
      duration: content.duration,
      thumbnailUrl: content.thumbnailUrl,
      createdAt: content.createdAt,
      creatorAlias: creators.alias,
      creatorAvatarUrl: creators.avatarUrl,
      creatorHandle: creators.handle,
    })
    .from(content)
    .innerJoin(creators, eq(content.creatorId, creators.id))
    .where(
      and(
        inArray(content.creatorId, creatorIds),
        eq(content.moderationStatus, 'approved')
      )
    )
    .orderBy(desc(content.createdAt))
    .limit(20);

  return feedItems;
}

export async function getRecentContent(limit: number = 12) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: content.id,
      creatorId: content.creatorId,
      tierId: content.tierId,
      collectionId: content.collectionId,
      title: content.title,
      description: content.description,
      type: content.type,
      fileUrl: content.fileUrl,
      fileKey: content.fileKey,
      mimeType: content.mimeType,
      fileSize: content.fileSize,
      duration: content.duration,
      thumbnailUrl: content.thumbnailUrl,
      createdAt: content.createdAt,
      creatorAlias: creators.alias,
      creatorAvatarUrl: creators.avatarUrl,
      creatorHandle: creators.handle,
      tierPrice: tiers.price,
    })
    .from(content)
    .innerJoin(creators, eq(content.creatorId, creators.id))
    .leftJoin(tiers, eq(content.tierId, tiers.id))
    .where(eq(content.moderationStatus, 'approved'))
    .orderBy(desc(content.createdAt))
    .limit(limit);

  // SECURITY: same reasoning as public.creatorContent — this feeds the
  // Discover page's preview carousels, including for anonymous visitors.
  // A row's fileUrl/fileKey is the real, direct link to the stored file;
  // it must never go out for content the requester hasn't unlocked, no
  // matter what the current frontend does or doesn't do with it yet.
  return rows.map((row) => {
    const isFree = row.tierPrice !== undefined && row.tierPrice !== null && parseFloat(row.tierPrice) === 0;
    if (isFree) return { ...row, isFree: true };
    const { fileUrl: _fileUrl, fileKey: _fileKey, ...safeRow } = row;
    return { ...safeRow, isFree: false };
  });
}

export async function getRecentSubscriptions(limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: subscriptions.id,
      createdAt: subscriptions.createdAt,
      creatorAlias: creators.alias,
      creatorHandle: creators.handle,
      userName: users.name,
      userDisplayName: users.displayName,
      tierName: tiers.name,
    })
    .from(subscriptions)
    .innerJoin(creators, eq(subscriptions.creatorId, creators.id))
    .innerJoin(users, eq(subscriptions.patronId, users.id))
    .leftJoin(tiers, eq(subscriptions.tierId, tiers.id))
    .where(eq(subscriptions.status, 'active'))
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit);
}

// ── Coven Helper Functions ────────────────────────────────────

export async function getCovens() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covens.id,
      creatorId: covens.creatorId,
      tierId: covens.tierId,
      name: covens.name,
      slug: covens.slug,
      description: covens.description,
      avatarUrl: covens.avatarUrl,
      coverUrl: covens.coverUrl,
      createdAt: covens.createdAt,
      creatorAlias: creators.alias,
      creatorHandle: creators.handle,
      tierName: tiers.name,
      tierPrice: tiers.price,
    })
    .from(covens)
    .leftJoin(creators, eq(covens.creatorId, creators.id))
    .leftJoin(tiers, eq(covens.tierId, tiers.id));
}

export async function getCovenBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: covens.id,
      creatorId: covens.creatorId,
      tierId: covens.tierId,
      name: covens.name,
      slug: covens.slug,
      description: covens.description,
      avatarUrl: covens.avatarUrl,
      coverUrl: covens.coverUrl,
      createdAt: covens.createdAt,
      creatorAlias: creators.alias,
      creatorHandle: creators.handle,
      tierName: tiers.name,
      tierPrice: tiers.price,
    })
    .from(covens)
    .leftJoin(creators, eq(covens.creatorId, creators.id))
    .leftJoin(tiers, eq(covens.tierId, tiers.id))
    .where(eq(covens.slug, slug))
    .limit(1);

  return result[0] || null;
}

export async function canAccessCoven(userId: number, covenId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [coven] = await db.select().from(covens).where(eq(covens.id, covenId)).limit(1);
  if (!coven) return false;

  // Admin bypass always wins first, consistent with the "admin sees/does
  // everything" pattern used elsewhere (content access, moderation, etc.)
  const user = await getUserById(userId);
  if (user && user.role === "admin") return true;

  // A ban always wins over everything else — otherwise a banned patron
  // with an active subscription could just rejoin immediately.
  const banned = await isCovenBanned(userId, covenId);
  if (banned) return false;

  // 1. If public (no tier), anyone can access
  if (!coven.tierId) return true;

  // 3. Check if user is the hosting creator
  if (coven.creatorId) {
    const creator = await getCreatorByUserId(userId);
    if (creator && creator.id === coven.creatorId) return true;
  }

  // 4. Check if user has active subscription to the required tier
  const activeSub = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.patronId, userId),
        eq(subscriptions.tierId, coven.tierId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  return activeSub.length > 0;
}

export async function joinCoven(userId: number, covenId: number, role: "member" | "moderator" | "owner" = "member") {
  const db = await getDb();
  if (!db) return;

  // Verify access first
  const allowed = await canAccessCoven(userId, covenId);
  if (!allowed) throw new Error("Subscription required to join this coven");

  const existing = await db
    .select({ id: covenMembers.id })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  if (existing.length > 0) return; // already a member

  await db.insert(covenMembers).values({
    userId,
    covenId,
    role,
  });
}

export async function leaveCoven(userId: number, covenId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)));
}

export async function isCovenMember(userId: number, covenId: number) {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select({ id: covenMembers.id })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  return existing.length > 0;
}

export async function getCovenMembersCount(covenId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(covenMembers)
    .where(eq(covenMembers.covenId, covenId));

  return result[0]?.count ?? 0;
}

export async function getCovenPosts(covenId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covenPosts.id,
      covenId: covenPosts.covenId,
      userId: covenPosts.userId,
      title: covenPosts.title,
      content: covenPosts.content,
      isPinned: covenPosts.isPinned,
      isLocked: covenPosts.isLocked,
      createdAt: covenPosts.createdAt,
      userDisplayName: users.displayName,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      userRole: users.role,
    })
    .from(covenPosts)
    .innerJoin(users, eq(covenPosts.userId, users.id))
    .where(eq(covenPosts.covenId, covenId))
    .orderBy(desc(covenPosts.createdAt));
}

export async function getCovenPostById(postId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: covenPosts.id,
      covenId: covenPosts.covenId,
      userId: covenPosts.userId,
      title: covenPosts.title,
      content: covenPosts.content,
      isPinned: covenPosts.isPinned,
      isLocked: covenPosts.isLocked,
      createdAt: covenPosts.createdAt,
      userDisplayName: users.displayName,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      userRole: users.role,
    })
    .from(covenPosts)
    .innerJoin(users, eq(covenPosts.userId, users.id))
    .where(eq(covenPosts.id, postId))
    .limit(1);

  return result[0] || null;
}

export async function createCovenPost(userId: number, covenId: number, title: string, contentStr: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify access first
  const allowed = await canAccessCoven(userId, covenId);
  if (!allowed) throw new Error("Access denied to this coven");

  await db.insert(covenPosts).values({
    userId,
    covenId,
    title,
    content: contentStr,
  });

  const [created] = await db
    .select()
    .from(covenPosts)
    .where(and(eq(covenPosts.covenId, covenId), eq(covenPosts.userId, userId), eq(covenPosts.title, title)))
    .orderBy(desc(covenPosts.createdAt))
    .limit(1);

  return created;
}

export async function getCovenComments(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covenComments.id,
      postId: covenComments.postId,
      userId: covenComments.userId,
      content: covenComments.content,
      createdAt: covenComments.createdAt,
      userDisplayName: users.displayName,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
      userRole: users.role,
    })
    .from(covenComments)
    .innerJoin(users, eq(covenComments.userId, users.id))
    .where(eq(covenComments.postId, postId))
    .orderBy(covenComments.createdAt);
}

export async function createCovenComment(userId: number, postId: number, contentStr: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [post] = await db.select().from(covenPosts).where(eq(covenPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const allowed = await canAccessCoven(userId, post.covenId);
  if (!allowed) throw new Error("Access denied");

  await db.insert(covenComments).values({
    userId,
    postId,
    content: contentStr,
  });

  const [created] = await db
    .select()
    .from(covenComments)
    .where(and(eq(covenComments.postId, postId), eq(covenComments.userId, userId)))
    .orderBy(desc(covenComments.createdAt))
    .limit(1);

  return created;
}

export async function createCoven(data: {
  creatorId?: number;
  tierId?: number;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(covens).values({
    creatorId: data.creatorId ?? null,
    tierId: data.tierId ?? null,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
  });

  const [created] = await db
    .select()
    .from(covens)
    .where(eq(covens.slug, data.slug))
    .limit(1);

  return created;
}

export async function getMyCovens(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covens.id,
      name: covens.name,
      slug: covens.slug,
      description: covens.description,
      avatarUrl: covens.avatarUrl,
      coverUrl: covens.coverUrl,
      role: covenMembers.role,
      creatorAlias: creators.alias,
      creatorHandle: creators.handle,
      tierName: tiers.name,
      tierPrice: tiers.price,
    })
    .from(covenMembers)
    .innerJoin(covens, eq(covenMembers.covenId, covens.id))
    .leftJoin(tiers, eq(covens.tierId, tiers.id))
    .where(eq(covenMembers.userId, userId));
}

export async function getCovenRole(userId: number, covenId: number): Promise<'member' | 'moderator' | 'owner' | null> {
  const db = await getDb();
  if (!db) return null;

  const [membership] = await db
    .select({ role: covenMembers.role })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  return membership?.role ?? null;
}

export async function isCovenOwnerOrAdmin(userId: number, covenId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const user = await getUserById(userId);
  if (user && user.role === 'admin') return true;

  const [membership] = await db
    .select({ role: covenMembers.role })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  return !!membership && membership.role === 'owner';
}

export async function isCovenStaff(userId: number, covenId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const user = await getUserById(userId);
  if (user && user.role === 'admin') return true;

  const [membership] = await db
    .select({ role: covenMembers.role })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  return !!membership && (membership.role === 'owner' || membership.role === 'moderator');
}

export async function canModerateCoven(userId: number, covenId: number, postAuthorId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const user = await getUserById(userId);
  if (user && user.role === 'admin') return true;

  if (postAuthorId !== undefined && userId === postAuthorId) return true;

  const [membership] = await db
    .select({ role: covenMembers.role })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  if (membership && (membership.role === 'owner' || membership.role === 'moderator')) {
    return true;
  }

  return false;
}

export async function deleteCovenPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;

  const [post] = await db.select().from(covenPosts).where(eq(covenPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const canMod = await canModerateCoven(userId, post.covenId, post.userId);
  if (!canMod) throw new Error("Permission denied");

  await db.delete(covenComments).where(eq(covenComments.postId, postId));
  await db.delete(covenPosts).where(eq(covenPosts.id, postId));
}

export async function deleteCovenComment(userId: number, commentId: number) {
  const db = await getDb();
  if (!db) return;

  const [comment] = await db.select().from(covenComments).where(eq(covenComments.id, commentId)).limit(1);
  if (!comment) throw new Error("Comment not found");

  const [post] = await db.select().from(covenPosts).where(eq(covenPosts.id, comment.postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const canMod = await canModerateCoven(userId, post.covenId, comment.userId);
  if (!canMod) throw new Error("Permission denied");

  await db.delete(covenComments).where(eq(covenComments.id, commentId));
}

export async function togglePinCovenPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;

  const [post] = await db.select().from(covenPosts).where(eq(covenPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const isMod = await isCovenStaff(userId, post.covenId);
  if (!isMod) throw new Error("Permission denied");

  await db
    .update(covenPosts)
    .set({ isPinned: !post.isPinned })
    .where(eq(covenPosts.id, postId));
}

export async function toggleLockCovenPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;

  const [post] = await db.select().from(covenPosts).where(eq(covenPosts.id, postId)).limit(1);
  if (!post) throw new Error("Post not found");

  const isMod = await isCovenStaff(userId, post.covenId);
  if (!isMod) throw new Error("Permission denied");

  await db
    .update(covenPosts)
    .set({ isLocked: !post.isLocked })
    .where(eq(covenPosts.id, postId));
}

export async function getCovenMembersList(covenId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covenMembers.id,
      userId: covenMembers.userId,
      role: covenMembers.role,
      joinedAt: covenMembers.joinedAt,
      name: users.name,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(covenMembers)
    .innerJoin(users, eq(covenMembers.userId, users.id))
    .where(eq(covenMembers.covenId, covenId))
    .orderBy(covenMembers.joinedAt);
}

export async function updateCovenMemberRole(userId: number, covenId: number, targetUserId: number, newRole: 'member' | 'moderator') {
  const db = await getDb();
  if (!db) return;

  const isOwnerOrAdmin = await isCovenOwnerOrAdmin(userId, covenId);
  if (!isOwnerOrAdmin) throw new Error("Permission denied");

  await db
    .update(covenMembers)
    .set({ role: newRole })
    .where(and(eq(covenMembers.covenId, covenId), eq(covenMembers.userId, targetUserId)));
}

export async function kickCovenMember(userId: number, covenId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) return;

  const userRole = await getCovenRole(userId, covenId);
  const targetRole = await getCovenRole(targetUserId, covenId);
  const isAdminUser = (await getUserById(userId))?.role === 'admin';

  let allowed = false;
  if (isAdminUser) {
    allowed = true;
  } else if (userRole === 'owner') {
    allowed = targetUserId !== userId;
  } else if (userRole === 'moderator') {
    allowed = targetRole === 'member';
  }

  if (!allowed) throw new Error("Permission denied");

  await db
    .delete(covenMembers)
    .where(and(eq(covenMembers.covenId, covenId), eq(covenMembers.userId, targetUserId)));
}

// Shared hierarchy check reused by warn/mute/ban: moderators can only act
// on regular members, the owner can act on anyone but themselves, and a
// platform admin can always act. Mirrors kickCovenMember's rule exactly,
// since warn/mute/ban/kick are all "staff action on a member", just
// different severities.
async function canActOnCovenMember(userId: number, covenId: number, targetUserId: number): Promise<boolean> {
  const userRole = await getCovenRole(userId, covenId);
  const targetRole = await getCovenRole(targetUserId, covenId);
  const isAdminUser = (await getUserById(userId))?.role === 'admin';

  if (isAdminUser) return true;
  if (userRole === 'owner') return targetUserId !== userId;
  if (userRole === 'moderator') return targetRole === 'member';
  return false;
}

export async function warnCovenMember(issuedBy: number, covenId: number, targetUserId: number, reason?: string) {
  const db = await getDb();
  if (!db) return;

  const allowed = await canActOnCovenMember(issuedBy, covenId, targetUserId);
  if (!allowed) throw new Error("Permission denied");

  await db.insert(covenWarnings).values({
    covenId,
    userId: targetUserId,
    issuedBy,
    reason: reason || null,
  });
}

export async function getCovenWarnings(covenId: number, targetUserId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = targetUserId
    ? and(eq(covenWarnings.covenId, covenId), eq(covenWarnings.userId, targetUserId))
    : eq(covenWarnings.covenId, covenId);

  return db
    .select({
      id: covenWarnings.id,
      userId: covenWarnings.userId,
      issuedBy: covenWarnings.issuedBy,
      reason: covenWarnings.reason,
      createdAt: covenWarnings.createdAt,
    })
    .from(covenWarnings)
    .where(conditions)
    .orderBy(desc(covenWarnings.createdAt));
}

export async function muteCovenMember(issuedBy: number, covenId: number, targetUserId: number, durationMs: number) {
  const db = await getDb();
  if (!db) return;

  const allowed = await canActOnCovenMember(issuedBy, covenId, targetUserId);
  if (!allowed) throw new Error("Permission denied");

  const mutedUntil = new Date(Date.now() + durationMs);
  await db
    .update(covenMembers)
    .set({ mutedUntil })
    .where(and(eq(covenMembers.covenId, covenId), eq(covenMembers.userId, targetUserId)));
}

export async function unmuteCovenMember(issuedBy: number, covenId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) return;

  const allowed = await canActOnCovenMember(issuedBy, covenId, targetUserId);
  if (!allowed) throw new Error("Permission denied");

  await db
    .update(covenMembers)
    .set({ mutedUntil: null })
    .where(and(eq(covenMembers.covenId, covenId), eq(covenMembers.userId, targetUserId)));
}

export async function isCovenMuted(userId: number, covenId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [membership] = await db
    .select({ mutedUntil: covenMembers.mutedUntil })
    .from(covenMembers)
    .where(and(eq(covenMembers.userId, userId), eq(covenMembers.covenId, covenId)))
    .limit(1);

  if (!membership?.mutedUntil) return false;
  return membership.mutedUntil.getTime() > Date.now();
}

export async function banCovenMember(issuedBy: number, covenId: number, targetUserId: number, reason?: string) {
  const db = await getDb();
  if (!db) return;

  const allowed = await canActOnCovenMember(issuedBy, covenId, targetUserId);
  if (!allowed) throw new Error("Permission denied");

  // A ban implies removal — kicked out immediately, and the ban record
  // (unlike membership) is never deleted by leaving/kicking, so it keeps
  // blocking re-entry until explicitly lifted.
  await db.insert(covenBans).values({
    covenId,
    userId: targetUserId,
    bannedBy: issuedBy,
    reason: reason || null,
  });

  await db
    .delete(covenMembers)
    .where(and(eq(covenMembers.covenId, covenId), eq(covenMembers.userId, targetUserId)));
}

export async function unbanCovenMember(issuedBy: number, covenId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) return;

  // Lifting a ban is more sensitive than issuing routine warnings/mutes —
  // restricted to the owner or a platform admin, not regular moderators.
  const isOwnerOrAdmin = await isCovenOwnerOrAdmin(issuedBy, covenId);
  if (!isOwnerOrAdmin) throw new Error("Permission denied");

  await db
    .delete(covenBans)
    .where(and(eq(covenBans.covenId, covenId), eq(covenBans.userId, targetUserId)));
}

export async function isCovenBanned(userId: number, covenId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [ban] = await db
    .select({ id: covenBans.id })
    .from(covenBans)
    .where(and(eq(covenBans.covenId, covenId), eq(covenBans.userId, userId)))
    .limit(1);

  return !!ban;
}

export async function getCovenBans(covenId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: covenBans.id,
      userId: covenBans.userId,
      bannedBy: covenBans.bannedBy,
      reason: covenBans.reason,
      createdAt: covenBans.createdAt,
      name: users.name,
      displayName: users.displayName,
    })
    .from(covenBans)
    .innerJoin(users, eq(covenBans.userId, users.id))
    .where(eq(covenBans.covenId, covenId))
    .orderBy(desc(covenBans.createdAt));
}
