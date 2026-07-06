import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

/**
 * NotificationDropdown - Dropdown showing recent notifications
 */
export function NotificationDropdown({ onClose, onNotificationRead }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch notifications
  const notificationsQuery = trpc.notifications.list.useQuery({ limit: 10 });

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      onNotificationRead?.();
      utils.notifications.unread.invalidate();
      utils.notifications.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark notification as read');
    },
  });

  // Delete mutation
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unread.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete notification');
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Notifications</h3>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notificationsQuery.isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
          <div className="divide-y divide-border">
            {notificationsQuery.data.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent/50 transition-colors ${
                  !notification.read ? 'bg-accent/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() =>
                          markAsReadMutation.mutate({ notificationId: notification.id })
                        }
                        disabled={markAsReadMutation.isPending}
                        className="p-1 hover:bg-background rounded transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle size={16} className="text-green-500" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate({ notificationId: notification.id })}
                      disabled={deleteMutation.isPending}
                      className="p-1 hover:bg-background rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notificationsQuery.data && notificationsQuery.data.length > 0 && (
        <div className="p-3 border-t border-border text-center">
          <a
            href="/notifications"
            onClick={onClose}
            className="text-xs text-primary hover:underline"
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
}
