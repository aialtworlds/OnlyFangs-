import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * NotificationBell - Bell icon with unread count badge
 * Shows unread notification count and opens dropdown on click
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  
  // Fetch unread count
  const unreadQuery = trpc.notifications.unread.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Update unread count from query
  useEffect(() => {
    if (unreadQuery.data !== undefined) {
      setUnreadCount(unreadQuery.data);
    }
  }, [unreadQuery.data]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-accent rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          onNotificationRead={() => setUnreadCount(Math.max(0, unreadCount - 1))}
        />
      )}
    </div>
  );
}
