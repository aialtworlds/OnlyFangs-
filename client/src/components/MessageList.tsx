import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  readAt: Date | null;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onMarkAsRead?: (messageId: number) => void;
  isTyping?: boolean;
  typingUserName?: string;
}

export function MessageList({ messages, isLoading, onMarkAsRead, isTyping = false, typingUserName }: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
            return (
              <div
                key={message.id}
                data-message-id={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    {isOwn && message.readAt && ' • Read'}
                  </div>
                </div>
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
