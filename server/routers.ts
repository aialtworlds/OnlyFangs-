import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, creatorProcedure } from "./_core/trpc";
import { createCheckoutSession, createBillingPortalSession, cancelSubscription } from "./stripe";
import {
  getPatronStats,
  getPatronSubscriptions,
  getPatronActivity,
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
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  public: router({
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
        await createRelease({ creatorId: creator.id, ...input });
        return { success: true };
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
    deleteTier: creatorProcedure
      .input(z.object({ tierId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const creator = await getCreatorByUserId(ctx.user.id);
        if (!creator) throw new Error("Creator profile not found");
        await deleteTier(input.tierId, creator.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
