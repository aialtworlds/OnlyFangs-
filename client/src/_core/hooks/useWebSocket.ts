import { useEffect, useRef, useCallback, useState } from 'react';

export interface WSMessage {
  type: 'message' | 'read' | 'typing' | 'online' | 'offline';
  conversationId: number;
  userId: number;
  data?: any;
  timestamp?: number;
}

export interface UseWebSocketOptions {
  userId: number;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send auth message
        if (wsRef.current) {
          wsRef.current.send(
            JSON.stringify({
              type: 'online',
              userId: options.userId,
              timestamp: Date.now(),
            })
          );
        }

        options.onConnect?.();
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          options.onMessage?.(message);
        } catch (error) {
          console.error('[WS] Message parse error:', error);
        }
      };

      wsRef.current.onerror = (error: Event) => {
        console.error('[WS] Connection error:', error);
        options.onError?.(error);
      };

      wsRef.current.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        options.onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WS] Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error('[WS] Connection error:', error);
      options.onError?.(error as Event);
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] WebSocket not connected');
    }
  }, []);

  const subscribeToConversation = useCallback((conversationId: number) => {
    send({
      type: 'online',
      conversationId,
      userId: options.userId,
      timestamp: Date.now(),
    });
  }, [send, options.userId]);

  const sendMessage = useCallback((conversationId: number, content: string) => {
    send({
      type: 'message',
      conversationId,
      userId: options.userId,
      data: { content },
      timestamp: Date.now(),
    });
  }, [send, options.userId]);

  const sendReadReceipt = useCallback((conversationId: number, messageId: number) => {
    send({
      type: 'read',
      conversationId,
      userId: options.userId,
      data: { messageId },
      timestamp: Date.now(),
    });
  }, [send, options.userId]);

  const sendTypingIndicator = useCallback((conversationId: number) => {
    send({
      type: 'typing',
      conversationId,
      userId: options.userId,
      timestamp: Date.now(),
    });
  }, [send, options.userId]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    send,
    subscribeToConversation,
    sendMessage,
    sendReadReceipt,
    sendTypingIndicator,
    disconnect,
  };
}
