import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';

/**
 * WebSocket Message Types
 */
export type WSMessageType = 'message' | 'read' | 'typing' | 'online' | 'offline';

export interface WSMessage {
  type: WSMessageType;
  conversationId: number;
  userId: number;
  data?: any;
  timestamp?: number;
}

/**
 * User connection tracking
 * Maps userId to their WebSocket connection
 */
const userConnections = new Map<number, WebSocket>();

/**
 * Conversation subscriptions
 * Maps conversationId to set of userIds listening to it
 */
const conversationSubscriptions = new Map<number, Set<number>>();

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;

    // Handle incoming messages
    ws.on('message', (data: string) => {
      try {
        const message: WSMessage = JSON.parse(data);

        // First message should be auth with userId
        if (!userId && message.type === 'online') {
          userId = message.userId;
          userConnections.set(userId, ws);
          console.log(`[WS] User ${userId} connected`);
          return;
        }

        if (!userId) {
          ws.close(1008, 'Unauthorized');
          return;
        }

        // Handle message events
        if (message.type === 'message') {
          broadcastToConversation(message.conversationId, {
            type: 'message',
            conversationId: message.conversationId,
            userId: userId,
            data: message.data,
            timestamp: Date.now(),
          });
        }

        // Handle read receipts
        if (message.type === 'read') {
          broadcastToConversation(message.conversationId, {
            type: 'read',
            conversationId: message.conversationId,
            userId: userId,
            data: message.data, // messageId
            timestamp: Date.now(),
          });
        }

        // Handle typing indicators
        if (message.type === 'typing') {
          broadcastToConversation(message.conversationId, {
            type: 'typing',
            conversationId: message.conversationId,
            userId: userId,
            timestamp: Date.now(),
          });
        }

        // Handle subscription to conversation
        if (message.type === 'online') {
          subscribeToConversation(message.conversationId, userId);
        }
      } catch (error) {
        console.error('[WS] Message parse error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (userId) {
        userConnections.delete(userId);
        unsubscribeUserFromAll(userId);
        console.log(`[WS] User ${userId} disconnected`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WS] Connection error:', error);
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  return wss;
}

/**
 * Subscribe user to conversation updates
 */
export function subscribeToConversation(conversationId: number, userId: number): void {
  if (!conversationSubscriptions.has(conversationId)) {
    conversationSubscriptions.set(conversationId, new Set());
  }
  conversationSubscriptions.get(conversationId)!.add(userId);
}

/**
 * Unsubscribe user from conversation
 */
export function unsubscribeFromConversation(conversationId: number, userId: number): void {
  const subscribers = conversationSubscriptions.get(conversationId);
  if (subscribers) {
    subscribers.delete(userId);
    if (subscribers.size === 0) {
      conversationSubscriptions.delete(conversationId);
    }
  }
}

/**
 * Unsubscribe user from all conversations
 */
export function unsubscribeUserFromAll(userId: number): void {
  conversationSubscriptions.forEach((subscribers) => {
    subscribers.delete(userId);
  });
}

/**
 * Broadcast message to all users in a conversation
 */
export function broadcastToConversation(conversationId: number, message: WSMessage): void {
  const subscribers = conversationSubscriptions.get(conversationId);
  if (!subscribers) return;

  const payload = JSON.stringify(message);

  subscribers.forEach((userId) => {
    const ws = userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

/**
 * Send message to specific user
 */
export function sendToUser(userId: number, message: WSMessage): void {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Get active user count
 */
export function getActiveUserCount(): number {
  return userConnections.size;
}

/**
 * Get users in conversation
 */
export function getUsersInConversation(conversationId: number): number[] {
  const subscribers = conversationSubscriptions.get(conversationId);
  if (!subscribers) return [];
  const result: number[] = [];
  subscribers.forEach((userId) => {
    result.push(userId);
  });
  return result;
}
