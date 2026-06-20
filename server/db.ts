import { eq, desc, and, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, creators, subscriptions, tiers, follows,
  releases, savedContent, activityFeed, notifications, messages,
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
    .where(and(eq(messages.toUserId, userId), eq(messages.read, false)));
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
  perks?: string[];
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
}
