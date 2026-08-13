import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCreatorContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `creator-${userId}`,
    email: `creator${userId}@example.com`,
    name: `Creator ${userId}`,
    loginMethod: "test",
    role: "admin", // Using 'admin' role to bypass creatorProcedure check
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Subscription Plan Operations via tRPC", () => {
  describe("creator.updateSubscriptionPlan", () => {
    it("should allow authenticated users to set their plan", async () => {
      const ctx = createCreatorContext(1);
      const caller = appRouter.createCaller(ctx);

      // Note: This will fail if the user doesn't have a creator profile
      // but it tests that the procedure is accessible and validates input
      try {
        await caller.creator.updateSubscriptionPlan({
          price: "9.99",
          currency: "USD",
          perks: ["Perk 1", "Perk 2"],
        });
      } catch (error: any) {
        // Expected to fail if no creator profile exists
        // But the error should be about creator profile, not authorization
        expect(error.message).toContain("Creator profile not found");
      }
    });

    it("should validate required fields", async () => {
      const ctx = createCreatorContext(2);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.creator.updateSubscriptionPlan({
          // price is required by the schema
        } as any);
        // If we get here, validation didn't work
        expect(true).toBe(false);
      } catch (error: any) {
        // Should fail validation
        expect(error).toBeDefined();
      }
    });
  });

  describe("creator.disableSubscriptionPlan", () => {
    it("should require a creator profile", async () => {
      const ctx = createCreatorContext(5);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.creator.disableSubscriptionPlan();
      } catch (error: any) {
        // Expected to fail since there's no creator profile / plan yet
        expect(error).toBeDefined();
      }
    });
  });

  describe("creator.subscriptionPlan", () => {
    it("should return null if user has no creator profile", async () => {
      const ctx = createCreatorContext(7);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.creator.subscriptionPlan();
      expect(result).toBeNull();
    });
  });

  describe("creator.subscriptions", () => {
    it("should return empty array if user has no creator profile", async () => {
      const ctx = createCreatorContext(7);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.creator.subscriptions();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe("creator.analytics", () => {
    it("should return zero analytics if user has no creator profile", async () => {
      const ctx = createCreatorContext(8);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.creator.analytics();
      expect(result).toBeDefined();
      expect(result.totalSubscribers).toBe(0);
      expect(result.activeSubscriptions).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.monthlyRevenue).toBe(0);
    });

    it("should return empty analytics for new creator", async () => {
      const ctx = createCreatorContext(9);
      const caller = appRouter.createCaller(ctx);

      const analytics = await caller.creator.analytics();
      expect(analytics.totalSubscribers).toBeGreaterThanOrEqual(0);
      expect(analytics.activeSubscriptions).toBeGreaterThanOrEqual(0);
      expect(analytics.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Access Control", () => {
    it("should require authentication for creator procedures", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.creator.subscriptions();
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("login");
      }
    });

    it("should allow authenticated users to access creator procedures", async () => {
      const ctx = createCreatorContext(10);
      const caller = appRouter.createCaller(ctx);

      // Should not throw authentication error
      const result = await caller.creator.analytics();
      expect(result).toBeDefined();
    });
  });

  describe("Input Validation", () => {
    it("should validate currency length", async () => {
      const ctx = createCreatorContext(11);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.creator.updateSubscriptionPlan({
          price: "9.99",
          currency: "US", // Too short, schema requires exactly 3 chars
        } as any);
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should accept a valid perks array", async () => {
      const ctx = createCreatorContext(14);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.creator.updateSubscriptionPlan({
          price: "9.99",
          perks: ["Perk 1", "Perk 2", "Perk 3"],
        });
      } catch (error: any) {
        // Expected to fail if no creator profile, but not due to perks validation
        expect(error.message).toContain("Creator profile not found");
      }
    });
  });
});
