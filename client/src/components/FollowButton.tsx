import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { toast } from 'sonner';

interface FollowButtonProps {
  // Same convention as TierSidebar: the mock creator id / URL slug, used to
  // look up the *real* creator by handle. Following only makes sense
  // against a real creators.id row, never a mock/demo one.
  handle: string;
}

export function FollowButton({ handle }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [pending, setPending] = useState(false);

  const { data: realCreator } = trpc.public.creatorByHandle.useQuery(
    { handle },
    { retry: false }
  );

  const { data: isFollowing } = trpc.follow.isFollowing.useQuery(
    { creatorId: realCreator?.id ?? 0 },
    { enabled: isAuthenticated && !!realCreator?.id, retry: false }
  );

  const { data: followerCount } = trpc.follow.followerCount.useQuery(
    { creatorId: realCreator?.id ?? 0 },
    { enabled: !!realCreator?.id, retry: false }
  );

  const followMutation = trpc.follow.follow.useMutation();
  const unfollowMutation = trpc.follow.unfollow.useMutation();

  // No real creator behind this profile (i.e. it's one of the demo/mock
  // profiles) — there's nothing real to follow, so don't show the button.
  if (!realCreator?.id) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl(window.location.pathname);
      return;
    }
    setPending(true);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({ creatorId: realCreator.id });
      } else {
        await followMutation.mutateAsync({ creatorId: realCreator.id });
      }
      await Promise.all([
        utils.follow.isFollowing.invalidate({ creatorId: realCreator.id }),
        utils.follow.followerCount.invalidate({ creatorId: realCreator.id }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        padding: '8px 20px',
        background: isFollowing ? 'transparent' : 'oklch(0.72 0.09 75)',
        color: isFollowing ? 'oklch(0.72 0.09 75)' : 'oklch(0.04 0.008 285)',
        border: '1px solid oklch(0.72 0.09 75)',
        borderRadius: '4px',
        fontFamily: "'Cinzel', serif",
        fontSize: '10px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {isFollowing ? 'Following' : 'Follow'}
      {typeof followerCount === 'number' && (
        <span style={{ opacity: 0.7 }}>· {followerCount}</span>
      )}
    </button>
  );
}
