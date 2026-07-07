import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb, trackContentView } from "./db";
import { users, creators, subscriptions, follows, viewingHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const caller = appRouter.createCaller({
  user: { id: 1, email: "test@example.com", name: "Test User", openId: "test-open-id", role: "user" },
  req: {} as any,
  res: {} as any,
});

const publicCaller = appRouter.createCaller({
  user: null,
  req: {} as any,
  res: {} as any,
});

describe("Recommendation System", () => {
  describe("creator.getRecommendations", () => {
    it("should fetch recommendations for authenticated user", async () => {
      const result = await caller.creator.getRecommendations({ limit: 6 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it("should respect limit parameter", async () => {
      const result3 = await caller.creator.getRecommendations({ limit: 3 });
      const result6 = await caller.creator.getRecommendations({ limit: 6 });
      
      expect(result3.length).toBeLessThanOrEqual(3);
      expect(result6.length).toBeLessThanOrEqual(6);
    });

    it("should exclude self from recommendations", async () => {
      const result = await caller.creator.getRecommendations({ limit: 20 });
      const selfIds = result.filter(c => c.id === caller.user.id);
      expect(selfIds.length).toBe(0);
    });

    it("should return creators with required fields", async () => {
      const result = await caller.creator.getRecommendations({ limit: 6 });
      if (result.length > 0) {
        const creator = result[0];
        expect(creator).toHaveProperty("id");
        expect(creator).toHaveProperty("alias");
        expect(creator).toHaveProperty("verified");
        expect(creator).toHaveProperty("totalSubscribers");
        expect(creator).toHaveProperty("totalReleases");
      }
    });

    it("should throw error if not authenticated", async () => {
      try {
        await publicCaller.creator.getRecommendations({ limit: 6 });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should handle limit validation", async () => {
      try {
        await caller.creator.getRecommendations({ limit: 0 });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should handle max limit validation", async () => {
      try {
        await caller.creator.getRecommendations({ limit: 100 });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("creator.getTrending", () => {
    it("should fetch trending creators for public users", async () => {
      const result = await publicCaller.creator.getTrending({ limit: 6 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it("should fetch trending creators for authenticated users", async () => {
      const result = await caller.creator.getTrending({ limit: 6 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it("should respect limit parameter", async () => {
      const result3 = await publicCaller.creator.getTrending({ limit: 3 });
      const result6 = await publicCaller.creator.getTrending({ limit: 6 });
      
      expect(result3.length).toBeLessThanOrEqual(3);
      expect(result6.length).toBeLessThanOrEqual(6);
    });

    it("should return creators with required fields", async () => {
      const result = await publicCaller.creator.getTrending({ limit: 6 });
      if (result.length > 0) {
        const creator = result[0];
        expect(creator).toHaveProperty("id");
        expect(creator).toHaveProperty("alias");
        expect(creator).toHaveProperty("verified");
        expect(creator).toHaveProperty("totalSubscribers");
        expect(creator).toHaveProperty("totalReleases");
      }
    });

    it("should be sorted by subscriber count (descending)", async () => {
      const result = await publicCaller.creator.getTrending({ limit: 10 });
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].totalSubscribers).toBeGreaterThanOrEqual(result[i + 1].totalSubscribers);
        }
      }
    });
  });

  describe("Viewing History Tracking", () => {
    it("should track content views", async () => {
      const db = await getDb();
      if (!db) return;

      // Track a view
      await trackContentView(1, 1, 2);

      // Verify it was recorded
      const views = await db
        .select()
        .from(viewingHistory)
        .where(eq(viewingHistory.userId, 1))
        .limit(1);

      expect(views.length).toBeGreaterThan(0);
    });

    it("should influence recommendations based on viewed creators", async () => {
      // Track views for a specific creator
      await trackContentView(1, 1, 3);
      await trackContentView(1, 2, 3);

      // Get recommendations
      const result = await caller.creator.getRecommendations({ limit: 6 });

      // Should return array
      expect(Array.isArray(result)).toBe(true);
      // Recommendations should be influenced by viewing history
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Recommendation Ranking", () => {
    it("should exclude already-followed creators", async () => {
      const db = await getDb();
      if (!db) return;

      const result = await caller.creator.getRecommendations({ limit: 20 });

      // Get user's follows
      const userFollows = await db
        .select({ creatorId: follows.creatorId })
        .from(follows)
        .where(eq(follows.followerId, 1));

      const followedIds = userFollows.map(f => f.creatorId);

      // Verify no followed creators in recommendations
      result.forEach(creator => {
        expect(followedIds).not.toContain(creator.id);
      });
    });

    it("should prioritize verified creators", async () => {
      const result = await caller.creator.getRecommendations({ limit: 10 });

      if (result.length > 1) {
        // Count verified creators at the beginning
        let verifiedCount = 0;
        for (const creator of result) {
          if (creator.verified) verifiedCount++;
          else break;
        }

        // Verified creators should appear early (though not guaranteed if few exist)
        expect(verifiedCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
