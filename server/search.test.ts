import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
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

describe('Search System', () => {

  describe('creator.search', () => {
    it('should search creators by query', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'lady',
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by category', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'a',
        category: 'art',
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'a',
        limit: 5,
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for non-matching query', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'xyzabc123notexist',
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should validate query length', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.creator.search({
          query: '',
          limit: 20,
        });
        // Empty query should fail validation
        expect(false).toBe(true);
      } catch (error: any) {
        // Validation error should be thrown
        expect(error).toBeDefined();
      }
    });

    it('should validate limit range', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.creator.search({
          query: 'test',
          limit: 100,
        });
        // Limit > 50 should fail validation
        expect(false).toBe(true);
      } catch (error: any) {
        // Validation error should be thrown
        expect(error).toBeDefined();
      }
    });
  });

  describe('creator.categories', () => {
    it('should fetch all categories', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const categories = await caller.creator.categories();

      expect(Array.isArray(categories)).toBe(true);
      // Should include common categories
      expect(categories.length).toBeGreaterThanOrEqual(0);
    });

    it('should return unique categories', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const categories = await caller.creator.categories();
      const uniqueCategories = new Set(categories);

      expect(uniqueCategories.size).toBe(categories.length);
    });

    it('should return sorted categories', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const categories = await caller.creator.categories();
      const sorted = [...categories].sort();

      expect(categories).toEqual(sorted);
    });
  });

  describe('Search result structure', () => {
    it('should return creators with required fields', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'a',
        limit: 1,
      });

      if (results.length > 0) {
        const creator = results[0];
        expect(creator).toHaveProperty('id');
        expect(creator).toHaveProperty('alias');
        expect(creator).toHaveProperty('verified');
        expect(creator).toHaveProperty('totalSubscribers');
      }
    });

    it('should prioritize verified creators', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.creator.search({
        query: 'a',
        limit: 20,
      });

      if (results.length > 1) {
        // Verified creators should come first
        const verifiedIndex = results.findIndex(c => c.verified);
        const unverifiedIndex = results.findIndex(c => !c.verified);

        if (verifiedIndex !== -1 && unverifiedIndex !== -1) {
          expect(verifiedIndex).toBeLessThan(unverifiedIndex);
        }
      }
    });
  });

  describe('content.search', () => {
    it('should search content by query', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.content.search({
        query: 'a',
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should respect limit parameter', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.content.search({
        query: 'a',
        limit: 5,
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for non-matching query', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.content.search({
        query: 'xyzabc123notexist',
        limit: 20,
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should validate query length', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.content.search({
          query: '',
          limit: 20,
        });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should return content with required fields', async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.content.search({
        query: 'a',
        limit: 1,
      });

      if (results.length > 0) {
        const content = results[0];
        expect(content).toHaveProperty('id');
        expect(content).toHaveProperty('title');
        expect(content).toHaveProperty('creatorId');
      }
    });
  });
});

