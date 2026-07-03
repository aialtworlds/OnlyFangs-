import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { SmilePlus, X } from 'lucide-react';

interface Reaction {
  emoji: string;
  count: number;
  userIds: number[];
}

interface MessageReactionsProps {
  messageId: number;
  currentUserId: number;
  reactions?: Reaction[];
  onReactionsChange?: (reactions: Reaction[]) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export function MessageReactions({
  messageId,
  currentUserId,
  reactions = [],
  onReactionsChange,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addReactionMutation = trpc.messaging.addReaction.useMutation({
    onSuccess: (newReactions) => {
      onReactionsChange?.(newReactions);
      setShowEmojiPicker(false);
    },
  });

  const removeReactionMutation = trpc.messaging.removeReaction.useMutation({
    onSuccess: (newReactions) => {
      onReactionsChange?.(newReactions);
    },
  });

  const handleAddReaction = (emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  };

  const handleRemoveReaction = (emoji: string) => {
    removeReactionMutation.mutate({ messageId, emoji });
  };

  const handleToggleReaction = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    const userHasReacted = reaction?.userIds.includes(currentUserId);

    if (userHasReacted) {
      handleRemoveReaction(emoji);
    } else {
      handleAddReaction(emoji);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Existing reactions */}
      {reactions.map((reaction) => {
        const userHasReacted = reaction.userIds.includes(currentUserId);
        return (
          <Button
            key={reaction.emoji}
            variant={userHasReacted ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={() => handleToggleReaction(reaction.emoji)}
            disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
          >
            <span>{reaction.emoji}</span>
            <span className="text-xs">{reaction.count}</span>
          </Button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={addReactionMutation.isPending}
        >
          <SmilePlus className="w-3 h-3" />
        </Button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg p-2 shadow-lg z-10 flex flex-wrap gap-1 w-48">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-accent"
                onClick={() => handleAddReaction(emoji)}
                disabled={addReactionMutation.isPending}
              >
                {emoji}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-auto"
              onClick={() => setShowEmojiPicker(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
