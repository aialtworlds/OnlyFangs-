import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  getConversations,
  getUnreadMessageCountInConversation,
  markConversationAsRead,
  getCreatorByUserId,
} from './db';
import { users, creators, conversations, messages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Messaging System Integration Tests', () => {
  let db: any;
  let creatorUserId = 1;
  let patronUserId = 2;
  let creatorId: number;
  let conversationId: number;
  let messageId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      console.warn('Database not available, skipping tests');
      return;
    }

    // Clean up test data
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(creators);
    await db.delete(users);

    // Create test users
    const [creator] = await db
      .insert(users)
      .values({
        id: creatorUserId,
        openId: `openid_creator_${creatorUserId}`,
        email: 'creator@test.com',
        name: 'Creator',
      })
      .$returningId();

    const [patron] = await db
      .insert(users)
      .values({
        id: patronUserId,
        openId: `openid_patron_${patronUserId}`,
        email: 'patron@test.com',
        name: 'Patron',
      })
      .$returningId();

    // Create creator profile
    const [creatorProfile] = await db
      .insert(creators)
      .values({
        userId: creatorUserId,
        alias: 'test_creator',
        handle: 'test_creator_handle',
        bio: 'Test creator',
      })
      .$returningId();

    creatorId = creatorProfile.id;
  });

  afterAll(async () => {
    if (!db) return;
    // Clean up test data
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(creators);
    await db.delete(users);
  });

  describe('Conversation Management', () => {
    it('should create or get a conversation between creator and patron', async () => {
      if (!db) return;

      const conv = await getOrCreateConversation(creatorId, patronUserId);
      expect(conv).toBeDefined();
      expect(conv?.creatorId).toBe(creatorId);
      expect(conv?.patronId).toBe(patronUserId);

      conversationId = conv!.id;
    });

    it('should return same conversation on subsequent calls', async () => {
      if (!db) return;

      const conv1 = await getOrCreateConversation(creatorId, patronUserId);
      const conv2 = await getOrCreateConversation(creatorId, patronUserId);

      expect(conv1?.id).toBe(conv2?.id);
    });

    it('should list conversations for creator', async () => {
      if (!db) return;

      const convs = await getConversations(creatorUserId);
      expect(Array.isArray(convs)).toBe(true);
      expect(convs.length).toBeGreaterThan(0);
      expect(convs[0].creator).toBeDefined();
    });

    it('should list conversations for patron', async () => {
      if (!db) return;

      const convs = await getConversations(patronUserId);
      expect(Array.isArray(convs)).toBe(true);
      expect(convs.length).toBeGreaterThan(0);
    });
  });

  describe('Message Operations', () => {
    it('should send a message from patron to creator', async () => {
      if (!db) return;

      const msg = await sendMessage(conversationId, patronUserId, 'Hello creator!');
      expect(msg).toBeDefined();
      expect(msg?.content).toBe('Hello creator!');
      expect(msg?.senderId).toBe(patronUserId);
      expect(msg?.conversationId).toBe(conversationId);

      messageId = msg!.id;
    });

    it('should retrieve messages from conversation', async () => {
      if (!db) return;

      const msgs = await getMessages(conversationId);
      expect(Array.isArray(msgs)).toBe(true);
      expect(msgs.length).toBeGreaterThan(0);
      expect(msgs[0].content).toBe('Hello creator!');
    });

    it('should send multiple messages', async () => {
      if (!db) return;

      await sendMessage(conversationId, creatorUserId, 'Hi patron!');
      await sendMessage(conversationId, patronUserId, 'How are you?');
      await sendMessage(conversationId, creatorUserId, 'I am good!');

      const msgs = await getMessages(conversationId);
      expect(msgs.length).toBe(4); // 1 from before + 3 new
    });

    it('should retrieve messages in reverse chronological order', async () => {
      if (!db) return;

      const msgs = await getMessages(conversationId);
      expect(msgs.length).toBeGreaterThan(1);

      // Messages should be ordered by createdAt DESC
      for (let i = 0; i < msgs.length - 1; i++) {
        expect(msgs[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          msgs[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe('Unread Message Tracking', () => {
    it('should count unread messages for patron', async () => {
      if (!db) return;

      const unreadCount = await getUnreadMessageCountInConversation(conversationId, patronUserId);
      expect(unreadCount).toBeGreaterThan(0);
    });

    it('should not count messages from patron as unread for patron', async () => {
      if (!db) return;

      const unreadCount = await getUnreadMessageCountInConversation(conversationId, patronUserId);
      // Should not include messages sent by patron
      const msgs = await getMessages(conversationId);
      const creatorMsgs = msgs.filter((m) => m.senderId === creatorUserId && !m.readAt);
      expect(unreadCount).toBe(creatorMsgs.length);
    });

    it('should mark message as read', async () => {
      if (!db) return;

      // Get first unread message
      const msgs = await getMessages(conversationId);
      const unreadMsg = msgs.find((m) => !m.readAt && m.senderId === creatorUserId);

      if (unreadMsg) {
        await markMessageAsRead(unreadMsg.id);

        const updated = await getMessages(conversationId);
        const markedMsg = updated.find((m) => m.id === unreadMsg.id);
        expect(markedMsg?.readAt).toBeDefined();
      }
    });

    it('should mark all messages in conversation as read', async () => {
      if (!db) return;

      // Mark all as read for patron
      await markConversationAsRead(conversationId, patronUserId);

      const unreadCount = await getUnreadMessageCountInConversation(conversationId, patronUserId);
      expect(unreadCount).toBe(0);
    });
  });

  describe('Conversation Enrichment', () => {
    it('should include creator info in conversations', async () => {
      if (!db) return;

      const convs = await getConversations(patronUserId);
      const conv = convs.find((c) => c.id === conversationId);

      expect(conv).toBeDefined();
      expect(conv?.creator).toBeDefined();
      expect(conv?.creator?.alias).toBe('test_creator');
    });

    it('should include unread count in conversations', async () => {
      if (!db) return;

      // Send new message from creator
      await sendMessage(conversationId, creatorUserId, 'New message');

      const convs = await getConversations(patronUserId);
      const conv = convs.find((c) => c.id === conversationId);

      expect(conv?.unreadCount).toBeDefined();
      expect(typeof conv?.unreadCount).toBe('number');
    });
  });

  describe('Creator Lookup', () => {
    it('should get creator by user ID', async () => {
      if (!db) return;

      const creator = await getCreatorByUserId(creatorUserId);
      expect(creator).toBeDefined();
      expect(creator?.id).toBe(creatorId);
      expect(creator?.alias).toBe('test_creator');
    });

    it('should return null for non-creator user', async () => {
      if (!db) return;

      const creator = await getCreatorByUserId(patronUserId);
      expect(creator).toBeUndefined();
    });
  });
});
