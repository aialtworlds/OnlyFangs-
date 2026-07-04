import { Buffer } from "buffer";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, creatorProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
  uploadContent,
  getCreatorContent,
  getContentById,
  canAccessContent,
  deleteContent,
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
} from "./db";
import { conversations, messages, creators } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";

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
        await createRelease({ creatorId: creator.id, ...input });
        return { success: true };
      }),
    myTiers: creatorProcedure.query(async ({ ctx }) => {
      const creator = await getCreatorByUserId(ctx.user.id);
      if (!creator) return [];
      return getCreatorTiers(creator.id);
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
  }),

  content: router({
    upload: creatorProcedure
      .input(z.object({
        tierId: z.number(),
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
          input.thumbnailUrl
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
        return canAccessContent(ctx.user.id, input.contentId);
      }),
    getById: publicProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input }) => {
        return getContentById(input.contentId);
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
        return sendMessage(conv.id, ctx.user.id, input.content);
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
});

export type AppRouter = typeof appRouter;
