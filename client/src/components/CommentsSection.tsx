// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Comments Section Component
// Victorian Occult Luxury · Engagement & Discussion
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface CommentsSectionProps {
  contentId: number;
}

export function CommentsSection({ contentId }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  // Fetch comments
  const { data: comments = [], isLoading } = trpc.content.getComments.useQuery({ contentId });

  // Add comment mutation
  const addCommentMutation = trpc.content.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      toast.success('Comment shared with the void.');
      utils.content.getComments.invalidate({ contentId });
    },
    onError: (err) => {
      toast.error('Failed to leave comment', { description: err.message });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    addCommentMutation.mutate({
      contentId,
      text: commentText.trim()
    });
  };

  return (
    <div
      style={{
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid oklch(1 0 0 / 6%)',
        fontFamily: "'Cinzel', serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'oklch(0.72 0.09 75)',
          marginBottom: '20px',
        }}
      >
        <MessageSquare size={14} />
        <span>Whispers ({comments.length})</span>
      </div>

      {/* Comment Input */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Share your thoughts with the creator..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: 'oklch(0.06 0.01 285)',
              border: '1px solid oklch(0.72 0.09 75 / 20%)',
              color: 'oklch(0.93 0.02 80)',
              padding: '10px 16px',
              fontFamily: "'IM Fell English', serif",
              fontStyle: 'italic',
              fontSize: '14px',
              outline: 'none',
              borderRadius: '4px',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'oklch(0.72 0.09 75 / 50%)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'oklch(0.72 0.09 75 / 20%)')}
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            style={{
              background: 'oklch(0.38 0.14 20)',
              border: 'none',
              color: 'white',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '4px',
              opacity: commentText.trim() ? 1 : 0.6,
              transition: 'background 0.2s',
            }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      ) : (
        <div
          style={{
            background: 'oklch(0.08 0.02 330 / 50%)',
            border: '1px solid oklch(1 0 0 / 4%)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '24px',
            borderRadius: '4px',
          }}
        >
          <p
            style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: 'italic',
              fontSize: '13px',
              color: 'oklch(0.55 0.03 60)',
              margin: '0 0 10px 0',
            }}
          >
            You must join the ritual to share your thoughts.
          </p>
          <a
            href={getLoginUrl()}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'oklch(0.72 0.09 75)',
              textDecoration: 'underline',
            }}
          >
            Sign In / Sign Up
          </a>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'oklch(0.45 0.02 60)', fontSize: '12px' }}>
          <Loader2 size={12} className="animate-spin" />
          <span>Summoning comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'oklch(0.45 0.02 60)',
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          Silence fills the crypt. Be the first to whisper.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((comment) => {
            const authorName = comment.userDisplayName || comment.userName || 'Nightwalker';
            return (
              <div
                key={comment.id}
                style={{
                  background: 'oklch(0.06 0.01 285 / 40%)',
                  border: '1px solid oklch(1 0 0 / 4%)',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  display: 'flex',
                  gap: '14px',
                }}
              >
                {/* Avatar */}
                {comment.userAvatarUrl ? (
                  <img
                    src={comment.userAvatarUrl}
                    alt=""
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'oklch(0.28 0.1 20)',
                      color: 'oklch(0.93 0.02 80)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Comment Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'oklch(0.82 0.03 75)', letterSpacing: '0.04em' }}>
                      {authorName}
                    </span>
                    <span style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '10px', color: 'oklch(0.4 0.02 60)' }}>
                      {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "'IM Fell English', serif",
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: 'oklch(0.65 0.02 60)',
                      margin: 0,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {comment.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
