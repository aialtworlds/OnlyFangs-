import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { TypingIndicator } from './TypingIndicator';
import { MessageReactions } from './MessageReactions';
import { Button } from '@/components/ui/button';

interface Reaction {
  emoji: string;
  count: number;
  userIds: number[];
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  readAt: Date | null;
  createdAt: Date;
  price?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "photo" | "music" | "video" | "book" | null;
  locked?: boolean;
  reactions?: Reaction[];
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  creatorId?: number; // Creator associated with conversation for payment
  onMarkAsRead?: (messageId: number) => void;
  isTyping?: boolean;
  typingUserName?: string;
}

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Lock, Play, Eye } from 'lucide-react';

export function MessageList({ messages, isLoading, creatorId, onMarkAsRead, isTyping = false, typingUserName }: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, Reaction[]>>({});

  const unlockMutation = trpc.stripe.createOneTimeCheckout.useMutation();

  const handleUnlock = async (messageId: number, price: number) => {
    if (!creatorId) {
      toast.error("Creator ID not found for this conversation");
      return;
    }
    try {
      const res = await unlockMutation.mutateAsync({
        creatorId,
        amount: price,
        type: "message",
        targetId: messageId,
        origin: window.location.origin,
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate checkout");
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they become visible
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
              const message = messages.find((m) => m.id === messageId);
              if (message && !message.readAt && message.senderId !== user?.id) {
                onMarkAsRead?.(messageId);
              }
            }
          });
        },
        { threshold: 0.5 }
      );
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, user?.id, onMarkAsRead]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            const hasPPV = message.price && parseFloat(message.price) > 0;
            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg space-y-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{message.content}</p>

                  {/* PPV Locked / Unlocked Content Rendering */}
                  {hasPPV && (
                    <div className="mt-2 border border-border/20 rounded-md overflow-hidden bg-black/40">
                      {message.locked ? (
                        // Locked State
                        <div className="relative p-4 flex flex-col items-center justify-center text-center aspect-video min-h-[140px] bg-black/80">
                          <div className="absolute inset-0 bg-cover bg-center filter blur-md opacity-25" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742')" }} />
                          <div className="relative z-10 flex flex-col items-center gap-2">
                            <Lock className="w-8 h-8 text-yellow-500 animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-500/90">Exclusive Media</span>
                            <Button
                              onClick={() => handleUnlock(message.id, parseFloat(message.price || "0"))}
                              disabled={unlockMutation.isPending}
                              variant="outline"
                              size="sm"
                              className="mt-1 bg-yellow-500 text-black border-none hover:bg-yellow-600 font-bold"
                            >
                              {unlockMutation.isPending ? "Connecting..." : `Unlock for $${parseFloat(message.price || "0").toFixed(2)}`}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Unlocked State
                        <div className="p-2">
                          {(message.mediaType === "image" || message.mediaType === "photo") && message.mediaUrl && (
                            <img
                              src={message.mediaUrl}
                              alt="Unlocked PPV Content"
                              className="w-full max-h-60 object-cover rounded-md"
                            />
                          )}
                          {message.mediaType === "music" && message.mediaUrl && (
                            <audio src={message.mediaUrl} controls className="w-full mt-1" />
                          )}
                          {message.mediaType === "video" && message.mediaUrl && (
                            <video src={message.mediaUrl} controls className="w-full max-h-60 rounded-md mt-1" />
                          )}
                          {message.mediaType === "book" && message.mediaUrl && (
                            <a
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-yellow-500 hover:underline p-1"
                            >
                              <Play className="w-4 h-4" /> Download PDF/Book
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    {isOwn && message.readAt && ' • Read'}
                  </div>
                </div>
                <MessageReactions
                  messageId={message.id}
                  currentUserId={user?.id || 0}
                  reactions={messageReactions[message.id] || []}
                  onReactionsChange={(reactions) => {
                    setMessageReactions((prev) => ({
                      ...prev,
                      [message.id]: reactions,
                    }));
                  }}
                />
              </div>
            );
          })
        )}
        {isTyping && <TypingIndicator isTyping={isTyping} userName={typingUserName} />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
