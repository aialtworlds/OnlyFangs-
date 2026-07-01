import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (conversationId: number) => void;
  selectedConversationId?: number;
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: conversations, isLoading } = trpc.messaging.getConversations.useQuery();

  const filteredConversations = conversations?.filter((conv) => {
    const creatorName = conv.creator?.alias || '';
    return creatorName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? 'default' : 'ghost'}
                className="w-full justify-start text-left h-auto py-3 px-3 rounded-lg"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {conversation.creator?.alias || 'Unknown Creator'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {conversation.lastMessageAt
                      ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })
                      : 'No messages yet'}
                  </div>
                </div>
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <div className="ml-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </div>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
