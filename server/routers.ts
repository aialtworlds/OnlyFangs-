import { Buffer } from "buffer";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, creatorProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  createConnectedAccount,
  createAccountOnboardingLink,
  createLoginLink,
  checkConnectedAccountActive,
} from "./stripe";
import {
  getPatronStats,
  getPatronSubscriptions,
  getPatronActivity,
  getPatronHomeFeed,
  getUnreadMessageCount,
  getUnreadNotificationCount,
  getDiscoverCreators,
  getCreatorByUserId,
  getCreatorByHandle,
  getPublicCreatorTiers,
  getCreatorReleases,
  getCreatorTiers,
  createCreatorProfile,
  updateCreatorProfile,
  createRelease,
  createTier,
  updateUserProfile,
  getUserById,
  getCreatorSubscriptions,
  getCreatorAnalytics,
  updateTier,
  deleteTier,
  followCreator,
  unfollowCreator,
  isFollowingCreator,
  getFollowerCount,
  uploadContent,
  getCreatorContent,
  getContentById,
  canAccessContent,
  deleteContent,
  getRecentContent,
  getRecentSubscriptions,
  createCollection,
  getCreatorCollections,
  getCollectionById,
  addComment,
  getContentComments,
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
  addMessageReaction,
  removeMessageReaction,
  getMessageReactions,
  hasUserReacted,
  getDb,
  isConversationParticipant,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  deleteNotification,
  notifyFollowersAboutNewRelease,
  notifySubscriptionConfirmed,
  notifyNewMessage,
  getRecommendedCreators,
  getTrendingCreators,
  trackContentView,
  searchCreators,
  searchContent,
  getCategories,
  submitContentForModeration,
  getPendingModerations,
  approveContent,
  rejectContent,
  requestChanges,
  getModerationStats,
  flagContent,
  getContentFlags,
  resolveFlag,
  submitAppeal,
  getCreatorAppeals,
  getPendingAppeals,
  approveAppeal,
  denyAppeal,
  getCovens,
  getCovenBySlug,
  canAccessCoven,
  joinCoven,
  leaveCoven,
  isCovenMember,
  getCovenMembersCount,
  getCovenPosts,
  getCovenPostById,
  createCovenPost,
  getCovenComments,
  createCovenComment,
  createCoven
} from "./db";
import { conversations, messages, creators, notifications, content, tiers, users, covens, covenMembers, covenPosts, covenComments } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { storagePut } from "./storage";

const LOCAL_APP_ID = "onlyfangs";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    listUsers: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          role: users.role,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .limit(50);
    }),
    devLogin: publicProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const targetUser = await getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const openId = targetUser.openId;
        const sessionToken = await sdk.signSession(
          { openId, appId: LOCAL_APP_ID, name: targetUser.name || "" },
          { expiresInMs: ONE_YEAR_MS }
        );

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: targetUser };
      }),
  }),

  patron: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getPatronStats(ctx.user.id);
    }),
    subscriptions: protectedProcedure.query(async ({ ctx }) => {
      return getPatronSubscriptions(ctx.user.id);
    }),
    activity: protectedProcedure.query(async ({ ctx }) => {
      return getPatronActivity(ctx.user.id);
    }),
    homeFeed: protectedProcedure.query(async ({ ctx }) => {
      return getPatronHomeFeed(ctx.user.id);
    }),
    unreadCounts: protectedProcedure.query(async ({ ctx }) => {
      const [messages, notifications] = await Promise.all([
        getUnreadMessageCount(ctx.user.id),
        getUnreadNotificationCount(ctx.user.id),
      ]);
      return { messages, notifications };
    }),
    discoverCreators: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return getDiscoverCreators(input?.limit ?? 6);
      }),
    profile: protectedProcedure.query(async ({ ctx }) => {
      return getUserById(ctx.user.id);
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileSizeInMB = buffer.length / (1024 * 1024);
        if (fileSizeInMB > 5) throw new Error("File size exceeds 5MB limit");

        const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimes.includes(input.mimeType)) {
          throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
        }

        const ext = input.mimeType.split("/")[1];
        const fileKey = `avatars/user-${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await updateUserProfile(ctx.user.id, { avatarUrl: url });

        const creator = await getCreatorByUserId(ctx.user.id);
        if (creator) {
          await updateCreatorProfile(creator.id, { avatarUrl: url });
        }

        return { success: true, avatarUrl: url };
      }),
    uploadCover: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileSizeInMB = buffer.length / (1024 * 1024);
        if (fileSizeInMB > 5) throw new Error("File size exceeds 5MB limit");

        const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimes.includes(input.mimeType)) {
          throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
        }

        const ext = input.mimeType.split("/")[1];
        const fileKey = `covers/user-${ctx.user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await updateUserProfile(ctx.user.id, { coverUrl: url });

        const creator = await getCreatorByUserId(ctx.user.id);
        if (creator) {
          await updateCreatorProfile(creator.id, { coverUrl: url });
        }

        return { success: true, coverUrl: url };
      }),
  }),

  public: router({
    allCreators: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return db.select().from(creators);
    }),
    creatorByHandle: publicProcedure
      .input(z.object({ handle: z.string() }))
      .query(async ({ input }) => {
        return getCreatorByHandle(input.handle);
      }),
    creatorTiers: publicProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ input }) => {
        return getPublicCreatorTiers(input.creatorId);
      }),
    creatorCollections: publicProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ input }) => {
        return getCreatorCollections(input.creatorId);
      }),
    creatorContent: publicProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const items = await db
          .select()
          .from(content)
          .where(
            and(
              eq(content.creatorId, input.creatorId),
              eq(content.moderationStatus, 'approved')
            )
          )
          .orderBy(desc(content.createdAt));

        // SECURITY: this is a public, unauthenticated-friendly endpoint (it
        // powers the public creator profile page, including for anonymous
        // visitors browsing before signing up). The frontend shows a lock
        // icon over content the visitor hasn't unlocked, but that's purely
        // cosmetic — if we returned fileUrl/fileKey (the real, direct S3
        // link) for every item regardless of access, anyone could read it
        // straight out of the network response and bypass payment entirely.
        // So: only include those two fields when the requester can actually
        // access the item (reusing the same canAccessContent check used
        // elsewhere, which already handles free tiers, active subscriptions,
        // and the admin bypass) — otherwise strip them before sending.
        const results = await Promise.all(
          items.map(async (item) => {
            const allowed = ctx.user
              ? await canAccessContent(ctx.user.id, item.id)
              : parseFloat(
                  (await db.select().from(tiers).where(eq(tiers.id, item.tierId)).limit(1))[0]?.price ?? '1'
                ) === 0;

            if (allowed) return item;

            const { fileUrl: _fileUrl, fileKey: _fileKey, ...safeItem } = item;
            return safeItem;
          })
        );

        return results;
      }),
    recentContent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentContent(input?.limit ?? 12);
      }),
    recentSubscriptions: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentSubscriptions(input?.limit ?? 5);
      }),
  }),

  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ tierId: z.number(), origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const url = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || undefined,
          tierId: input.tierId,
          origin: input.origin,
        });
        return { url };
      }),
    cancelSubscription: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await cancelSubscription(ctx.user.id, input.subscriptionId);
        return { success: true };
      }),
    getBillingPortalUrl: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const url = await createBillingPortalSession(ctx.user.id, input.origin);
        return { url };
      }),
  }),

  follow: router({
    isFollowing: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ ctx, input }) => {
        return isFollowingCreator(ctx.user.id, input.creatorId);
      }),
    followerCount: publicProcedure
      .input(z.object({ creatorId: z.number() }))
      .query(async ({ input }) => {
        return getFollowerCount(input.creatorId);
      }),
    follow: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await followCreator(ctx.user.id, input.creatorId);
        return { success: true };
      }),
    unfollow: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await unfollowCreator(ctx.user.id, input.creatorId);
        return { success: true };
      }),
  }),

  creator: router({
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return getCreatorByUserId(ctx.user.id);
    }),
    releases: protectedProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorReleases(creator.id);
    }),
    tiers: protectedProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorTiers(creator.id);
    }),
    createProfile: protectedProcedure
      .input(z.object({
        alias: z.string().min(2).max(100),
        handle: z.string().min(2).max(50).regex(/^[a-z0-9_]+$/),
        bio: z.string().max(500).optional(),
        category: z.string().max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createCreatorProfile({ userId: ctx.user.id, ...input });
      }),
    uploadAvatar: creatorProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");

        // Validate file size (max 5MB)
        const buffer = Buffer.from(input.base64, "base64");
        const fileSizeInMB = buffer.length / (1024 * 1024);
        if (fileSizeInMB > 5) {
          throw new Error("File size exceeds 5MB limit");
        }

        // Validate MIME type
        const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimes.includes(input.mimeType)) {
          throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
        }

        // Upload to storage
        const ext = input.mimeType.split("/")[1];
        const fileKey = `avatars/${creator.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Update creator profile with new avatar URL
        await updateCreatorProfile(creator.id, { avatarUrl: url });

        return { success: true, avatarUrl: url };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        alias: z.string().min(2).max(100).optional(),
        bio: z.string().max(500).optional(),
        longBio: z.string().max(2000).optional(),
        location: z.string().max(100).optional(),
        category: z.string().max(100).optional(),
        avatarUrl: z.string().optional(),
        coverUrl: z.string().optional(),
        socialInstagram: z.string().max(100).optional(),
        socialTiktok: z.string().max(100).optional(),
        socialTwitter: z.string().max(100).optional(),
        socialWebsite: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        await updateCreatorProfile(creator.id, input);
        return { success: true };
      }),
    createRelease: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        type: z.enum(["image", "photo", "music", "book", "video", "post"]),
        thumbnailUrl: z.string().optional(),
        mediaUrl: z.string().optional(),
        duration: z.string().max(20).optional(),
        pages: z.number().int().positive().optional(),
        tierRequired: z.enum(["free", "fledgling", "dweller", "courtier", "night_royalty"]),
        locked: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        const releaseId = await createRelease({ creatorId: creator.id, ...input });
        // Notify followers about new release
        await notifyFollowersAboutNewRelease(creator.id, releaseId, input.title);
        return { success: true };
      }),
    myTiers: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorTiers(creator.id);
    }),
    myCollections: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorCollections(creator.id);
    }),
    createCollection: creatorProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        coverUrl: z.string().url().optional(),
        type: z.enum(["album", "gallery", "playlist", "anthology"])
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        return createCollection({ creatorId: creator.id, ...input });
      }),
    createTier: creatorProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        description: z.string().max(500).optional(),
        price: z.string(),
        currency: z.string().length(3).optional(),
        perks: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        await createTier({ creatorId: creator.id, ...input });
        return { success: true };
      }),
    subscriptions: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorSubscriptions(creator.id);
    }),
    analytics: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) {
        return {
          totalSubscribers: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          tierBreakdown: [],
        };
      }
      return getCreatorAnalytics(creator.id);
    }),
    updateTier: creatorProcedure
      .input(z.object({
        tierId: z.number(),
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(50).optional(),
        description: z.string().max(500).optional().nullable(),
        price: z.string().optional(),
        currency: z.string().length(3).optional(),
        perks: z.array(z.string()).optional().nullable(),
        featured: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        const { tierId, ...data } = input;
        await updateTier(tierId, creator.id, data);
        return { success: true };
      }),
    duplicateTier: creatorProcedure
      .input(z.object({
        tierId: z.number(),
        newName: z.string().min(2).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");

        // Get the tier to duplicate
        const tiers = await getCreatorTiers(creator.id);
        const tierToDuplicate = tiers.find((t) => t.id === input.tierId);
        if (!tierToDuplicate) throw new Error("Tier not found");

        // Generate new slug
        let newSlug = `${tierToDuplicate.slug}-copy`;
        let counter = 2;
        while (tiers.some((t) => t.slug === newSlug)) {
          newSlug = `${tierToDuplicate.slug}-copy-${counter}`;
          counter++;
        }

        // Create new tier with duplicated data
        const newTier = await createTier({
          creatorId: creator.id,
          name: input.newName || `${tierToDuplicate.name} (Copy)`,
          slug: newSlug,
          description: tierToDuplicate.description || undefined,
          price: tierToDuplicate.price,
          currency: tierToDuplicate.currency,
          perks: tierToDuplicate.perks,
          featured: false,
          sortOrder: tiers.length + 1,
        });

        return { success: true, tierId: newTier.id, tierName: newTier.name };
      }),
    deleteTier: creatorProcedure
      .input(z.object({ tierId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        await deleteTier(input.tierId, creator.id);
        return { success: true };
      }),
    getRecommendations: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(20).default(6) }))
      .query(async ({ ctx, input }) => {
        return getRecommendedCreators(ctx.user.id, input.limit);
      }),
    getTrending: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(20).default(6) }))
      .query(async ({ input }) => {
        return getTrendingCreators(input.limit);
      }),

    search: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(100),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return searchCreators(input.query, input.category, input.limit);
      }),

    categories: publicProcedure
      .query(async () => {
        return getCategories();
      }),

    stripeConnectSetup: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not found" });

        let accountId = creator.stripeConnectAccountId;
        if (!accountId) {
          accountId = await createConnectedAccount(creator.email || ctx.user.email || "", "US");
          await updateCreatorProfile(creator.id, { stripeConnectAccountId: accountId });
        }

        const url = await createAccountOnboardingLink(accountId, input.origin);
        return { url };
      }),

    getStripeConnectStatus: protectedProcedure
      .query(async ({ ctx }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not found" });

        if (!creator.stripeConnectAccountId) {
          return { connected: false, active: false };
        }

        try {
          const active = await checkConnectedAccountActive(creator.stripeConnectAccountId);
          return {
            connected: true,
            active,
            accountId: creator.stripeConnectAccountId,
          };
        } catch (error) {
          console.error("Error retrieving Stripe account:", error);
          return { connected: true, active: false, accountId: creator.stripeConnectAccountId };
        }
      }),

    getStripeLoginLink: protectedProcedure
      .mutation(async ({ ctx }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not found" });
        if (!creator.stripeConnectAccountId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe Connect account found" });
        }

        const url = await createLoginLink(creator.stripeConnectAccountId);
        return { url };
      }),
  }),

  content: router({
    upload: creatorProcedure
      .input(z.object({
        tierId: z.number(),
        collectionId: z.number().optional(),
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        type: z.enum(["image", "photo", "music", "book", "video", "post"]),
        fileUrl: z.string().url(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        duration: z.string().optional(),
        thumbnailUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        const result = await uploadContent(
          creator.id,
          input.tierId,
          input.title,
          input.description,
          input.type,
          input.fileUrl,
          input.fileKey,
          input.mimeType,
          input.fileSize,
          input.duration,
          input.thumbnailUrl,
          input.collectionId
        );
        return { success: true };
      }),
    list: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorContent(creator.id);
    }),
    delete: creatorProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        await deleteContent(input.contentId, creator.id);
        return { success: true };
      }),
    canAccess: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await canAccessContent(ctx.user.id, input.contentId);
        // Track view if user has access
        if (hasAccess) {
          const content = await getContentById(input.contentId);
          if (content) {
            await trackContentView(ctx.user.id, input.contentId, content.creatorId);
          }
        }
        return hasAccess;
      }),
    getById: publicProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const content = await getContentById(input.contentId);
        // Track view if user is authenticated
        if (ctx.user && content) {
          await trackContentView(ctx.user.id, input.contentId, content.creatorId);
        }
        return content;
      }),
    search: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(100),
        limit: z.number().int().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return searchContent(input.query, input.limit);
      }),
    addComment: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        text: z.string().min(1).max(1000)
      }))
      .mutation(async ({ ctx, input }) => {
        return addComment({
          contentId: input.contentId,
          userId: ctx.user.id,
          text: input.text
        });
      }),
    getComments: publicProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input }) => {
        return getContentComments(input.contentId);
      }),
  }),

  messaging: router({
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return getConversations(ctx.user.id);
      }),
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, input.conversationId))
          .limit(1);

        if (!conv.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const isParticipant = await isConversationParticipant(input.conversationId, ctx.user.id);
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant in this conversation" });
        }

        return getMessages(input.conversationId);
      }),
    sendMessage: protectedProcedure
      .input(z.object({ creatorId: z.number(), content: z.string().min(1).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(input.creatorId);
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });
        }

        const conv = await getOrCreateConversation(creator.id, ctx.user.id);
        if (!conv) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create conversation" });
        }
        const message = await sendMessage(conv.id, ctx.user.id, input.content);
        // Notify creator about new message
        const user = ctx.user;
        const preview = input.content.substring(0, 50);
        await notifyNewMessage(creator.id, user.name || 'Unknown', preview);
        return message;
      }),
    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;

        const msg = await db
          .select()
          .from(messages)
          .where(eq(messages.id, input.messageId))
          .limit(1);

        if (!msg.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }

        const conv = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, msg[0].conversationId))
          .limit(1);

        if (!conv.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        }

        const isParticipant = await isConversationParticipant(msg[0].conversationId, ctx.user.id);
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant in this conversation" });
        }

        return markMessageAsRead(input.messageId);
      }),
    addReaction: protectedProcedure
      .input(z.object({ messageId: z.number(), emoji: z.string().min(1).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify message exists and user is participant
        const msg = await db
          .select()
          .from(messages)
          .where(eq(messages.id, input.messageId))
          .limit(1);

        if (!msg.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }

        const isParticipant = await isConversationParticipant(msg[0].conversationId, ctx.user.id);
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant in this conversation" });
        }

        await addMessageReaction(input.messageId, ctx.user.id, input.emoji);
        return getMessageReactions(input.messageId);
      }),
    removeReaction: protectedProcedure
      .input(z.object({ messageId: z.number(), emoji: z.string().min(1).max(10) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify message exists and user is participant
        const msg = await db
          .select()
          .from(messages)
          .where(eq(messages.id, input.messageId))
          .limit(1);

        if (!msg.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }

        const isParticipant = await isConversationParticipant(msg[0].conversationId, ctx.user.id);
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant in this conversation" });
        }

        await removeMessageReaction(input.messageId, ctx.user.id, input.emoji);
        return getMessageReactions(input.messageId);
      }),
    getReactions: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        // Verify message exists and user is participant
        const msg = await db
          .select()
          .from(messages)
          .where(eq(messages.id, input.messageId))
          .limit(1);

        if (!msg.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
        }

        const isParticipant = await isConversationParticipant(msg[0].conversationId, ctx.user.id);
        if (!isParticipant) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not a participant in this conversation" });
        }

        return getMessageReactions(input.messageId);
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getUserNotifications(ctx.user.id, input?.limit ?? 50);
      }),
    unread: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationAsRead(input.notificationId, ctx.user.id);
      }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteNotification(input.notificationId, ctx.user.id);
      }),
  }),

  admin: router({
    toggleCreatorVerification: protectedProcedure
      .input(z.object({ creatorId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admins can verify creators
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can verify creators' });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Get current verified status
        const creator = await db
          .select()
          .from(creators)
          .where(eq(creators.id, input.creatorId))
          .limit(1);

        if (!creator.length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator not found' });
        }

        // Toggle verified status
        const newVerifiedStatus = !creator[0].verified;
        await db
          .update(creators)
          .set({ verified: newVerifiedStatus })
          .where(eq(creators.id, input.creatorId));

        return { verified: newVerifiedStatus, creatorId: input.creatorId };
      }),
  }),

  moderation: router({
    getPending: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view moderation queue' });
        }
        return getPendingModerations(100);
      }),
    approve: protectedProcedure
      .input(z.object({ contentId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can approve content' });
        }
        return approveContent(input.contentId, ctx.user.id, input.notes);
      }),
    reject: protectedProcedure
      .input(z.object({ contentId: z.number(), reason: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can reject content' });
        }
        return rejectContent(input.contentId, ctx.user.id, input.reason);
      }),
    requestChanges: protectedProcedure
      .input(z.object({ contentId: z.number(), notes: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can request changes' });
        }
        return requestChanges(input.contentId, ctx.user.id, input.notes);
      }),
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view moderation stats' });
        }
        return getModerationStats();
      }),
    getFlags: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view content flags' });
        }
        return getContentFlags(100);
      }),
    resolveFlag: protectedProcedure
      .input(z.object({ flagId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can resolve flags' });
        }
        return resolveFlag(input.flagId, ctx.user.id);
      }),
    flagContent: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        reason: z.enum(['inappropriate', 'copyright', 'spam', 'other']),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return flagContent(input.contentId, ctx.user.id, input.reason, input.description);
      }),
  }),
  appeals: router({
    submit: creatorProcedure
      .input(z.object({
        contentId: z.number(),
        reason: z.string().min(10).max(1000),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new TRPCError({ code: 'FORBIDDEN', message: 'Creator profile not found' });
        return submitAppeal(input.contentId, creator.id, input.reason);
      }),
    list: creatorProcedure
      .query(async ({ ctx }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) return [];
        return getCreatorAppeals(creator.id);
      }),
    getPending: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can view pending appeals' });
        }
        return getPendingAppeals();
      }),
    approve: protectedProcedure
      .input(z.object({
        appealId: z.number(),
        adminResponse: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can approve appeals' });
        }
        return approveAppeal(input.appealId, ctx.user.id, input.adminResponse);
      }),
    deny: protectedProcedure
      .input(z.object({
        appealId: z.number(),
        adminResponse: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can deny appeals' });
        }
        return denyAppeal(input.appealId, ctx.user.id, input.adminResponse);
      }),
  }),
  coven: router({
    list: protectedProcedure.query(async () => {
      return getCovens();
    }),
    bySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const coven = await getCovenBySlug(input.slug);
        if (!coven) throw new TRPCError({ code: "NOT_FOUND", message: "Coven not found" });

        const allowed = await canAccessCoven(ctx.user.id, coven.id);
        const isMember = await isCovenMember(ctx.user.id, coven.id);
        const memberCount = await getCovenMembersCount(coven.id);

        return {
          ...coven,
          allowed,
          isMember,
          memberCount,
        };
      }),
    join: protectedProcedure
      .input(z.object({ covenId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await joinCoven(ctx.user.id, input.covenId);
        return { success: true };
      }),
    leave: protectedProcedure
      .input(z.object({ covenId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await leaveCoven(ctx.user.id, input.covenId);
        return { success: true };
      }),
    create: creatorProcedure
      .input(z.object({
        name: z.string().min(3).max(100),
        slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
        description: z.string().max(1000).optional(),
        tierId: z.number().optional(),
        avatarUrl: z.string().optional(),
        coverUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not found" });

        const coven = await createCoven({
          creatorId: creator.id,
          tierId: input.tierId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
        });

        // The creator automatically joins their own coven as owner
        await joinCoven(ctx.user.id, coven.id, "owner");

        return coven;
      }),
    posts: protectedProcedure
      .input(z.object({ covenId: z.number() }))
      .query(async ({ ctx, input }) => {
        const allowed = await canAccessCoven(ctx.user.id, input.covenId);
        if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Subscription required to access this coven" });
        return getCovenPosts(input.covenId);
      }),
    createPost: protectedProcedure
      .input(z.object({
        covenId: z.number(),
        title: z.string().min(3).max(255),
        content: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return createCovenPost(ctx.user.id, input.covenId, input.title, input.content);
      }),
    postDetail: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        const post = await getCovenPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        const allowed = await canAccessCoven(ctx.user.id, post.covenId);
        if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

        return post;
      }),
    comments: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ ctx, input }) => {
        const post = await getCovenPostById(input.postId);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        const allowed = await canAccessCoven(ctx.user.id, post.covenId);
        if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });

        return getCovenComments(input.postId);
      }),
    createComment: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return createCovenComment(ctx.user.id, input.postId, input.content);
      }),
  }),
});

export type AppRouter = typeof appRouter;
