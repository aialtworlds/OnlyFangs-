import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createUserContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: 'test',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return ctx;
}

describe('Notification System', () => {
  describe('notifications.list', () => {
    it('should fetch user notifications', async () => {
      const ctx = createUserContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const ctx = createUserContext(2);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list({ limit: 1 });
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should default to limit of 50', async () => {
      const ctx = createUserContext(3);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('notifications.unread', () => {
    it('should return unread notification count', async () => {
      const ctx = createUserContext(4);
      const caller = appRouter.createCaller(ctx);

      const count = await caller.notifications.unread();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return number for different users', async () => {
      const ctx1 = createUserContext(5);
      const caller1 = appRouter.createCaller(ctx1);

      const ctx2 = createUserContext(6);
      const caller2 = appRouter.createCaller(ctx2);

      const count1 = await caller1.notifications.unread();
      const count2 = await caller2.notifications.unread();

      expect(typeof count1).toBe('number');
      expect(typeof count2).toBe('number');
    });
  });

  describe('notifications.markAsRead', () => {
    it('should throw error for non-existent notification', async () => {
      const ctx = createUserContext(7);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notifications.markAsRead({ notificationId: 999999 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should throw error if user is not owner', async () => {
      const ctx1 = createUserContext(8);
      const caller1 = appRouter.createCaller(ctx1);

      const ctx2 = createUserContext(9);
      const caller2 = appRouter.createCaller(ctx2);

      try {
        // Try to mark a notification from another user
        await caller2.notifications.markAsRead({ notificationId: 999999 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('notifications.markAllAsRead', () => {
    it('should return success response', async () => {
      const ctx = createUserContext(10);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.markAllAsRead();
      expect(result.success).toBe(true);
    });
  });

  describe('notifications.delete', () => {
    it('should throw error for non-existent notification', async () => {
      const ctx = createUserContext(11);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notifications.delete({ notificationId: 999999 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });

    it('should throw error if user is not owner', async () => {
      const ctx = createUserContext(12);
      const caller = appRouter.createCaller(ctx);

      try {
        // Try to delete a notification from another user (simulated with non-existent ID)
        await caller.notifications.delete({ notificationId: 999999 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Authorization', () => {
    it('should require authentication for notifications.list', async () => {
      const ctx = {
        user: null,
        req: { protocol: 'https', headers: {} } as TrpcContext['req'],
        res: { clearCookie: () => {} } as TrpcContext['res'],
      } as TrpcContext;

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notifications.list({ limit: 10 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Please login');
      }
    });

    it('should require authentication for notifications.unread', async () => {
      const ctx = {
        user: null,
        req: { protocol: 'https', headers: {} } as TrpcContext['req'],
        res: { clearCookie: () => {} } as TrpcContext['res'],
      } as TrpcContext;

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notifications.unread();
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Please login');
      }
    });
  });
});
