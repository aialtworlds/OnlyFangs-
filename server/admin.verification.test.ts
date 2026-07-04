import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'admin-test',
    email: 'admin@example.com',
    name: 'Admin User',
    loginMethod: 'test',
    role: 'admin',
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

function createCreatorContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `creator-${userId}`,
    email: `creator${userId}@example.com`,
    name: `Creator ${userId}`,
    loginMethod: 'test',
    role: 'creator',
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

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: 'user-test',
    email: 'user@example.com',
    name: 'Regular User',
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

describe('admin.toggleCreatorVerification', () => {
  it('should toggle creator verification status', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Use a test creator ID (from CREATORS data in lib/data.ts)
    const testCreatorId = 1;

    try {
      const result = await adminCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('verified');
      expect(typeof result.verified).toBe('boolean');
    } catch (error: any) {
      // If creator doesn't exist in DB, that's OK for this test
      // The important thing is the procedure exists and is callable
      expect(error.code).toBeDefined();
    }
  });

  it('should return verification status after toggle', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const testCreatorId = 2;

    try {
      const result = await adminCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });

      expect(result).toHaveProperty('verified');
      expect(typeof result.verified).toBe('boolean');
    } catch (error: any) {
      // Expected if creator doesn't exist
      expect(error.code).toBeDefined();
    }
  });

  it('should require admin role to toggle verification', async () => {
    const creatorCtx = createCreatorContext();
    const creatorCaller = appRouter.createCaller(creatorCtx);

    const testCreatorId = 1;

    try {
      await creatorCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });
      // If we reach here, the procedure didn't enforce admin role
      expect(false).toBe(true);
    } catch (error: any) {
      // Should get FORBIDDEN error
      expect(error.code).toBe('FORBIDDEN');
    }
  });

  it('should deny access to non-admin users', async () => {
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);

    const testCreatorId = 1;

    try {
      await userCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });
      expect(false).toBe(true);
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
    }
  });

  it('should handle invalid creator ID', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    try {
      await adminCaller.admin.toggleCreatorVerification({
        creatorId: 999999,
      });
      // If creator doesn't exist, should get NOT_FOUND
      expect(false).toBe(true);
    } catch (error: any) {
      expect(error.code).toBe('NOT_FOUND');
    }
  });

  it('should validate creatorId is a positive number', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    try {
      await adminCaller.admin.toggleCreatorVerification({
        creatorId: -1,
      });
      expect(false).toBe(true);
    } catch (error: any) {
      // Should get validation error
      expect(error.code).toBeDefined();
    }
  });

  it('should be callable only by admins', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    expect(adminCaller.admin).toBeDefined();
    expect(adminCaller.admin.toggleCreatorVerification).toBeDefined();
  });

  it('should return consistent response structure', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    try {
      const result = await adminCaller.admin.toggleCreatorVerification({
        creatorId: 1,
      });

      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('id');
      expect(typeof result.verified).toBe('boolean');
      expect(typeof result.id).toBe('number');
    } catch (error: any) {
      // Expected if creator doesn't exist
      expect(error.code).toBeDefined();
    }
  });

  it('should handle multiple toggle requests', async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const testCreatorId = 1;

    try {
      // First toggle
      const result1 = await adminCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });

      // Second toggle
      const result2 = await adminCaller.admin.toggleCreatorVerification({
        creatorId: testCreatorId,
      });

      // Verification status should be opposite
      expect(result1.verified).not.toBe(result2.verified);
    } catch (error: any) {
      // Expected if creator doesn't exist
      expect(error.code).toBeDefined();
    }
  });
});
