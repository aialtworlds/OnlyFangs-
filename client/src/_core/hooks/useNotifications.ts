import { useEffect, useCallback } from 'react';

export interface UseNotificationsOptions {
  enabled?: boolean;
  onNotificationClick?: (data: any) => void;
}

/**
 * Hook for requesting and managing browser notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, onNotificationClick } = options;

  // Request notification permission on mount
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!enabled || typeof window === 'undefined') return;

      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          onNotificationClick?.(options?.tag);
          notification.close();
        };

        return notification;
      }
    },
    [enabled, onNotificationClick]
  );

  const showMessageNotification = useCallback(
    (senderName: string, message: string, conversationId: number) => {
      return showNotification(`New message from ${senderName}`, {
        body: message.substring(0, 100),
        tag: `message-${conversationId}`,
        requireInteraction: false,
      });
    },
    [showNotification]
  );

  const hasPermission = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  return {
    showNotification,
    showMessageNotification,
    hasPermission,
    permissionStatus: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied',
  };
}
