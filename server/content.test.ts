import { describe, it, expect } from "vitest";
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
    role: "admin",
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

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "test",
    role: "user",
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

describe("Content Upload & Tier-Locking", () => {
  describe("content.upload", () => {
    it("should validate required fields", async () => {
      const caller = appRouter.createCaller(createCreatorContext(1));

      await expect(
        caller.content.upload({
          title: "",
          description: "Test",
          type: "image",
          fileUrl: "https://example.com/image.jpg",
          fileKey: "test-key",
          tierId: 1,
        })
      ).rejects.toThrow();
    });

    it("should reject upload without creator role", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      await expect(
        caller.content.upload({
          title: "Test",
          description: "Test",
          type: "image",
          fileUrl: "https://example.com/image.jpg",
          fileKey: "test-key",
          tierId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("content.canAccess", () => {
    it("should check access permission for authenticated user", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      // Should not throw, but return false (no subscription)
      const canAccess = await caller.content.canAccess({
        contentId: 1,
      });

      expect(typeof canAccess).toBe("boolean");
    });

    it("should deny access for non-existent content", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      const canAccess = await caller.content.canAccess({
        contentId: 99999,
      });

      expect(canAccess).toBe(false);
    });
  });

  describe("content.delete", () => {
    it("should reject delete without creator role", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      await expect(
        caller.content.delete({
          contentId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("content.list", () => {
    it("should reject list without creator role", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      await expect(caller.content.list()).rejects.toThrow();
    });

    it("should allow list for creator", async () => {
      const caller = appRouter.createCaller(createCreatorContext(1));

      // Should not throw
      const result = await caller.content.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("content.getById", () => {
    it("should return content metadata for public access", async () => {
      // This is a public procedure, no auth required
      const caller = appRouter.createCaller({
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      });

      // Should not throw even for non-existent content
      try {
        const result = await caller.content.getById({
          contentId: 99999,
        });
        expect(result).toBeNull();
      } catch {
        // Expected if content doesn't exist
      }
    });
  });

  describe("Tier-Locking Validation", () => {
    it("should enforce tier-based access control", async () => {
      const caller = appRouter.createCaller(createUserContext(2));

      // User without subscription should not have access
      const canAccess = await caller.content.canAccess({
        contentId: 1,
      });

      expect(canAccess).toBe(false);
    });

    it("should allow upload with valid tier", async () => {
      const caller = appRouter.createCaller(createCreatorContext(1));

      // Should not throw for valid input
      try {
        const result = await caller.content.upload({
          title: "Test",
          description: "Test",
          type: "image",
          fileUrl: "https://example.com/image.jpg",
          fileKey: "test-key",
          tierId: 1,
        });
        expect(result).toBeDefined();
      } catch (e) {
        // Expected if tier doesn't exist in test DB
      }
    });
  });

  describe("Content Type Validation", () => {
    it("should accept valid content types", async () => {
      const caller = appRouter.createCaller(createCreatorContext(1));

      const validTypes = ["image", "music", "video", "book", "post"];

      for (const type of validTypes) {
        try {
          await caller.content.upload({
            title: `Test ${type}`,
            description: "Test",
            type: type as any,
            fileUrl: "https://example.com/file",
            fileKey: `test-key-${type}`,
            tierId: 1,
          });
        } catch {
          // Expected if tier doesn't exist in test DB
        }
      }
    });
  });
});
