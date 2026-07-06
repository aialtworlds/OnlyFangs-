import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Notifications Page - Full notifications history
 */
export default function Notifications() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch all notifications
  const notificationsQuery = trpc.notifications.list.useQuery({ limit: 100 });

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      setMarkingId(null);
      utils.notifications.list.invalidate();
      utils.notifications.unread.invalidate();
      toast.success('Marked as read');
    },
    onError: (error) => {
      setMarkingId(null);
      toast.error(error.message || 'Failed to mark as read');
    },
  });

  // Delete mutation
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      setDeletingId(null);
      utils.notifications.list.invalidate();
      utils.notifications.unread.invalidate();
      toast.success('Notification deleted');
    },
    onError: (error) => {
      setDeletingId(null);
      toast.error(error.message || 'Failed to delete');
    },
  });

  // Mark all as read
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unread.invalidate();
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark all as read');
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    setMarkingId(notificationId);
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDelete = (notificationId: number) => {
    setDeletingId(notificationId);
    deleteMutation.mutate({ notificationId });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with all your notifications</p>
        </div>

        {/* Actions */}
        {notificationsQuery.data && notificationsQuery.data.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
              size="sm"
            >
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notificationsQuery.isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
            notificationsQuery.data.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.read
                    ? 'bg-accent/20 border-accent/50'
                    : 'bg-card border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {notification.type}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markingId === notification.id}
                        className="p-2 hover:bg-background rounded transition-colors disabled:opacity-50"
                        title="Mark as read"
                      >
                        {markingId === notification.id ? (
                          <Loader2 size={18} className="animate-spin text-muted-foreground" />
                        ) : (
                          <CheckCircle size={18} className="text-green-500 hover:text-green-600" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={deletingId === notification.id}
                      className="p-2 hover:bg-background rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === notification.id ? (
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                      ) : (
                        <Trash2 size={18} className="text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see notifications here when creators you follow post new content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
