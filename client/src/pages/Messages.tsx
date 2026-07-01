import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useWebSocket } from '@/_core/hooks/useWebSocket';
import { useNotifications } from '@/_core/hooks/useNotifications';
import { ConversationList } from '@/components/ConversationList';
import { MessageList } from '@/components/MessageList';
import { ChatBox } from '@/components/ChatBox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  // Notifications
  const { showMessageNotification } = useNotifications({ enabled: true });

  // WebSocket connection
  const { isConnected, sendMessage: sendWSMessage, sendReadReceipt, subscribeToConversation } = useWebSocket({
    userId: user?.id || 0,
    onMessage: (message) => {
      console.log('[WS] Received message:', message);
      // Refetch messages when new message arrives
      if (message.type === 'message' && selectedConversationId === message.conversationId) {
        refetchMessages();

        // Show notification if message is from another user
        if (message.userId !== user?.id) {
          const senderConv = conversations.find((c) => c.id === message.conversationId);
          if (senderConv?.creator?.alias) {
            showMessageNotification(
              senderConv.creator.alias,
              message.data?.content || 'New message',
              message.conversationId
            );
          }
        }
      }
    },
  });

  // Fetch conversations to get creator info
  const { data: conversations = [], refetch: refetchConversations } = trpc.messaging.getConversations.useQuery();
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Fetch messages for selected conversation
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = trpc.messaging.getMessages.useQuery(
    { conversationId: selectedConversationId || 0 },
    { enabled: !!selectedConversationId && selectedConversationId > 0 }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchConversations();
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = trpc.messaging.markAsRead.useMutation();

  // Subscribe to conversation when selected
  useEffect(() => {
    if (selectedConversationId && isConnected) {
      subscribeToConversation(selectedConversationId);
    }
  }, [selectedConversationId, isConnected, subscribeToConversation]);

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    setIsMobileListVisible(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user || !selectedConversation) return;

    try {
      // Get the creator's user ID from the conversation
      // The creator profile has a userId field that we need
      const creatorUserId = selectedConversation.creator?.userId || user.id;
      
      await sendMessageMutation.mutateAsync({
        creatorId: creatorUserId,
        content,
      });

      // Send via WebSocket for real-time delivery
      if (isConnected) {
        sendWSMessage(selectedConversationId, content);
      }

      // Refetch conversations to update last message time
      refetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ messageId });

      // Send read receipt via WebSocket
      if (isConnected && selectedConversationId) {
        sendReadReceipt(selectedConversationId, messageId);
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          {!isConnected && <div className="text-xs text-muted-foreground">Connecting...</div>}
          {isConnected && <div className="text-xs text-green-600">Connected</div>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List - Desktop */}
        <div className="hidden md:flex md:w-80 border-r border-border">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId || undefined}
          />
        </div>

        {/* Conversation List - Mobile */}
        {isMobileListVisible && (
          <div className="md:hidden absolute inset-0 z-50 bg-background border-r border-border">
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversationId || undefined}
            />
          </div>
        )}

        {/* Chat Area */}
        {selectedConversationId ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-border bg-card p-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileListVisible(true)}
                className="md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold">Chat</h2>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              isLoading={messagesLoading}
              onMarkAsRead={handleMarkAsRead}
            />

            {/* Chat Input */}
            <ChatBox
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              isLoading={sendMessageMutation.isPending}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center">
            <div>
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
