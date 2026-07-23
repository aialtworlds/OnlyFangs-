// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Creator Profile Page
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Lock, Play, BookOpen, Image, Music, Camera, Heart, MessageCircle, Share2, ChevronLeft, Loader2 } from 'lucide-react';
import { CREATORS, CONTENT_ITEMS, getCreatorById, getContentByCreatorId } from '@/lib/data';
import type { ContentItem } from '@/lib/data';
import { toast } from 'sonner';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { VerificationBadge } from '@/components/VerificationBadge';
import { FollowButton } from '@/components/FollowButton';
import { CommentsSection } from '@/components/CommentsSection';

interface CreatorProfileProps {
  creatorId: string;
}

function ContentIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    image: <Image size={14} />,
    photo: <Camera size={14} />,
    music: <Music size={14} />,
    book: <BookOpen size={14} />,
  };
  return <>{icons[type] || <Image size={14} />}</>;
}

const tierLabels: Record<string, string> = {
  fledgling: 'Fledgling',
  dweller: 'Dweller',
  courtier: 'Courtier',
  'night-royalty': 'Night Royalty',
};

function ContentCard({ item, onPlayMusic, creatorAlias }: { item: ContentItem; onPlayMusic: (item: ContentItem) => void; creatorAlias: string }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const isLocked = item.locked && user?.role !== 'admin';

  return (
    <div
      className="card-dark"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        <img
          src={item.thumbnail}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            filter: isLocked ? 'brightness(0.3) blur(2px)' : 'brightness(0.85)',
          }}
        />

        {isLocked && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Lock size={28} style={{ color: 'oklch(0.72 0.09 75)' }} />
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '9px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'oklch(0.72 0.09 75)',
              }}
            >
              Tier {tierLabels[item.tier]}
            </div>
            <button
              onClick={() => toast('Subscribe to unlock this content', { description: `Requires ${tierLabels[item.tier]} tier or higher.` })}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: 'oklch(0.72 0.09 75)',
                color: 'oklch(0.04 0.008 285)',
                border: 'none',
                padding: '8px 16px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Unlock
            </button>
          </div>
        )}

        {item.type === 'music' && !isLocked && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'oklch(0.72 0.09 75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
            onClick={() => onPlayMusic(item)}
          >
            <Play size={16} fill="oklch(0.04 0.008 285)" style={{ color: 'oklch(0.04 0.008 285)', marginLeft: '2px' }} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'oklch(0.04 0.008 285 / 80%)',
            backdropFilter: 'blur(4px)',
            border: '1px solid oklch(1 0 0 / 10%)',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'oklch(0.82 0.03 75)',
            fontSize: '11px',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <ContentIcon type={item.type} />
          {item.type === 'music' && item.duration && <span>{item.duration}</span>}
          {item.type === 'book' && item.pages && <span>{item.pages}p</span>}
        </div>
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '14px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.04em',
            marginBottom: '6px',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'oklch(0.55 0.03 60)',
            marginBottom: '14px',
            lineHeight: 1.6,
          }}
        >
          {item.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              onClick={() => { setLiked(!liked); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: liked ? 'oklch(0.42 0.16 20)' : 'oklch(0.35 0.02 60)',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
                transition: 'color 0.3s',
              }}
            >
              <Heart size={13} fill={liked ? 'oklch(0.42 0.16 20)' : 'none'} />
              {item.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => {
                if (isLocked) {
                  toast('Subscribe to unlock comments', { description: `Requires ${tierLabels[item.tier]} tier or higher.` });
                } else {
                  setShowComments(!showComments);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: showComments ? 'oklch(0.72 0.09 75)' : 'oklch(0.35 0.02 60)',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
                transition: 'color 0.3s',
              }}
            >
              <MessageCircle size={13} fill={showComments ? 'oklch(0.72 0.09 75 / 20%)' : 'none'} />
              {item.comments}
            </button>
          </div>
          <button
            onClick={async () => {
              const postUrl = `${window.location.origin}/creator/${item.creatorId}#post-${item.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: item.title,
                    text: item.description || `Check out this post by ${creatorAlias} on OnlyFangs`,
                    url: postUrl,
                  });
                } catch (err) {
                  if ((err as Error).name !== 'AbortError') {
                    toast.error('Error sharing post');
                  }
                }
              } else {
                try {
                  await navigator.clipboard.writeText(postUrl);
                  toast.success('Post link copied!');
                } catch {
                  toast.error('Error copying link');
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'none',
              border: 'none',
              color: 'oklch(0.35 0.02 60)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            <Share2 size={13} />
          </button>
        </div>
        {showComments && !isLocked && (
          <CommentsSection contentId={parseInt(item.id)} />
        )}
      </div>
    </div>
  );
}

// ── Tier Sidebar with Stripe Checkout ────────────────────────
function TierSidebar({ creatorId: mockCreatorId }: { creatorId: string }) {
  const { isAuthenticated } = useAuth();
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

  // Try to find the real creator by handle (mock creator id = handle)
  const { data: realCreator } = trpc.public.creatorByHandle.useQuery(
    { handle: mockCreatorId },
    { retry: false }
  );

  // Fetch real tiers if we found the creator
  const { data: realTiers } = trpc.public.creatorTiers.useQuery(
    { creatorId: realCreator?.id ?? 0 },
    { enabled: !!realCreator?.id, retry: false }
  );

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      toast('Redirecting to Stripe checkout...', { description: 'A new tab will open for payment.' });
      window.open(data.url, '_blank');
    },
    onError: (err) => {
      toast.error('Checkout failed', { description: err.message });
    },
  });

  const handleSelectTier = (tierId: number) => {
    if (!isAuthenticated) {
      toast('Login required', { description: 'Please sign in to subscribe.' });
      window.location.href = getLoginUrl();
      return;
    }
    if (!realCreator) {
      toast.error('Creator not found in database', {
        description: 'This creator has not yet set up their profile.',
      });
      return;
    }
    setSelectedTierId(tierId);
    checkoutMutation.mutate({ tierId, origin: window.location.origin });
  };

  // Use real tiers if available, otherwise fall back to mock tiers
  const mockCreator = getCreatorById(mockCreatorId);
  const mockTiers = mockCreator?.tiers.filter(t => t.id !== 'fledgling') ?? [];

  if (realTiers && realTiers.length > 0) {
    return (
      <div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'oklch(0.72 0.09 75)',
            marginBottom: '20px',
            borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
            paddingBottom: '12px',
          }}
        >
          Membership Tiers
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {realTiers.map(tier => {
            const isLoading = checkoutMutation.isPending && selectedTierId === tier.id;
            return (
              <div
                key={tier.id}
                style={{
                  background: 'oklch(0.085 0.015 330)',
                  border: '1px solid oklch(1 0 0 / 8%)',
                  padding: '20px',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.05em' }}>
                      {tier.name}
                    </div>
                    {tier.description && (
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.55 0.03 60)', marginTop: '2px' }}>
                        {tier.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', fontWeight: 700, color: 'oklch(0.72 0.09 75)' }}>
                      ${parseFloat(tier.price).toFixed(2)}
                    </div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', color: 'oklch(0.35 0.02 60)', letterSpacing: '0.1em' }}>
                      / month
                    </div>
                  </div>
                </div>
                {tier.perks && tier.perks.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {tier.perks.slice(0, 3).map((perk, i) => (
                      <li key={i} style={{ fontSize: '12px', color: 'oklch(0.55 0.03 60)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'oklch(0.72 0.09 75)', fontSize: '7px', flexShrink: 0, marginTop: '4px' }}>✦</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  disabled={isLoading}
                  onClick={() => handleSelectTier(tier.id)}
                  style={{
                    width: '100%',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding: '10px',
                    background: 'transparent',
                    color: 'oklch(0.72 0.09 75)',
                    border: '1px solid oklch(0.72 0.09 75 / 40%)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback: mock tiers (no real creator in DB yet)
  return (
    <div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '11px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'oklch(0.72 0.09 75)',
          marginBottom: '20px',
          borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
          paddingBottom: '12px',
        }}
      >
        Membership Tiers
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {mockTiers.map(tier => (
          <div
            key={tier.id}
            style={{
              background: 'oklch(0.085 0.015 330)',
              border: '1px solid oklch(1 0 0 / 8%)',
              padding: '20px',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.05em' }}>
                  {tier.icon} {tier.name}
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.55 0.03 60)' }}>
                  {tier.latinName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.45 0.02 60)', letterSpacing: '0.04em' }}>
                  Price set by creator
                </div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {tier.perks.slice(0, 3).map(perk => (
                <li key={perk} style={{ fontSize: '12px', color: 'oklch(0.55 0.03 60)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'oklch(0.72 0.09 75)', fontSize: '7px', flexShrink: 0, marginTop: '4px' }}>✦</span>
                  {perk}
                </li>
              ))}
            </ul>
            <button
              onClick={() => toast('Creator not yet in database', { description: 'This creator has not set up their profile yet.' })}
              style={{
                width: '100%',
                fontFamily: "'Cinzel', serif",
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '10px',
                background: 'transparent',
                color: 'oklch(0.72 0.09 75)',
                border: '1px solid oklch(0.72 0.09 75 / 40%)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreatorProfile({ creatorId }: CreatorProfileProps) {
  const [, setLocation] = useLocation();
  const { playTrack } = useMusicPlayer();
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'photo' | 'music' | 'book'>('all');
  const [viewMode, setViewMode] = useState<'releases' | 'collections'>('releases');
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  const { isAuthenticated, user } = useAuth();

  // Try to find the real creator by handle
  const { data: dbCreator, isLoading: dbCreatorLoading } = trpc.public.creatorByHandle.useQuery(
    { handle: creatorId },
    { retry: false }
  );

  // Fetch real content if database creator exists
  const { data: dbContent, isLoading: dbContentLoading } = trpc.public.creatorContent.useQuery(
    { creatorId: dbCreator?.id ?? 0 },
    { enabled: !!dbCreator?.id, retry: false }
  );

  // Fetch real tiers if database creator exists
  const { data: realTiers } = trpc.public.creatorTiers.useQuery(
    { creatorId: dbCreator?.id ?? 0 },
    { enabled: !!dbCreator?.id, retry: false }
  );

  // Fetch real collections if database creator exists
  const { data: creatorCollections = [] } = trpc.public.creatorCollections.useQuery(
    { creatorId: dbCreator?.id ?? 0 },
    { enabled: !!dbCreator?.id, retry: false }
  );

  // Fetch user subscriptions to verify access
  const { data: userSubscriptions } = trpc.patron.subscriptions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (dbCreatorLoading || dbContentLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'oklch(0.04 0.008 285)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'oklch(0.72 0.09 75)' }} />
      </div>
    );
  }

  // Resolve creator object (either DB or mock fallback)
  const creator = dbCreator
    ? {
        id: dbCreator.id.toString(),
        name: dbCreator.alias,
        alias: dbCreator.alias,
        category: dbCreator.category || 'Creator',
        bio: dbCreator.bio || '',
        avatar: dbCreator.avatarUrl || '/images/default-avatar.jpg',
        coverImage: dbCreator.coverUrl || '/images/default-cover.jpg',
        verified: dbCreator.verified,
        subscribers: dbCreator.totalSubscribers || 0,
        totalPosts: dbCreator.totalReleases || 0,
        joinedDate: new Date(dbCreator.createdAt).toLocaleDateString(),
        contentTypes: (dbCreator.contentTypes as string[]) || ['image', 'photo', 'music', 'book'],
        tags: (dbCreator.tags as string[]) || [],
        isDemo: false,
      }
    : getCreatorById(creatorId) || CREATORS[0];

  // Determine active subscription
  const hasActiveSub = userSubscriptions?.some(
    (sub) => sub.creatorId === dbCreator?.id && sub.status === 'active'
  );

  // Resolve content (either DB or mock fallback)
  const content: ContentItem[] = dbCreator
    ? (dbContent || []).map((item) => {
        const associatedTier = realTiers?.find(t => t.id === item.tierId);
        const tierSlug = associatedTier?.slug || 'free';
        const isFree = !item.tierId || parseFloat(associatedTier?.price || '0') === 0;

        const isSubscribedToThisTier = userSubscriptions?.some(
          (sub) => sub.creatorId === dbCreator?.id && sub.tierId === item.tierId && sub.status === 'active'
        );
        const locked = !isFree && !isSubscribedToThisTier && user?.role !== 'admin';

        return {
          id: item.id.toString(),
          creatorId: creatorId,
          type: (item.type === 'post' ? 'image' : item.type) as any,
          title: item.title,
          description: item.description || '',
          thumbnail: item.thumbnailUrl || '/images/default-thumbnail.jpg',
          locked: locked,
          tier: tierSlug as any,
          likes: 0,
          comments: 0,
          publishedAt: new Date(item.createdAt).toISOString().split('T')[0],
          duration: item.duration || undefined,
          pages: undefined,
          collectionId: item.collectionId ?? undefined,
        };
      })
    : getContentByCreatorId(creator.id);

  const handlePlayMusic = (item: ContentItem) => {
    playTrack({
      id: item.id,
      title: item.title,
      artist: creator.alias,
      duration: item.duration || '0:00',
      thumbnail: item.thumbnail,
      tier: item.tier,
    });
  };

  const contentFilteredByCollection = selectedCollectionId
    ? content.filter(item => (item as any).collectionId === selectedCollectionId)
    : content;

  const filteredContent = activeTab === 'all'
    ? contentFilteredByCollection
    : contentFilteredByCollection.filter(c => c.type === activeTab);

  const tabs = [
    { id: 'all', label: 'All', count: contentFilteredByCollection.length },
    ...creator.contentTypes.map(type => ({
      id: type,
      label: { image: 'Images', photo: 'Photos', music: 'Music', book: 'Books' }[type] || type,
      count: contentFilteredByCollection.filter(c => c.type === type).length,
    })),
  ];

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh' }}>
      {/* Back button */}
      <div
        style={{
          position: 'fixed',
          top: '120px',
          left: '24px',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setLocation('/discover')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'oklch(0.085 0.015 330 / 90%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid oklch(1 0 0 / 10%)',
            color: 'oklch(0.55 0.03 60)',
            fontFamily: "'Cinzel', serif",
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = 'oklch(0.72 0.09 75)';
            el.style.borderColor = 'oklch(0.72 0.09 75 / 30%)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = 'oklch(0.55 0.03 60)';
            el.style.borderColor = 'oklch(1 0 0 / 10%)';
          }}
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      {/* Cover Image */}
      <div style={{ position: 'relative', height: '380px', overflow: 'hidden' }}>
        <img
          src={creator.coverImage}
          alt={creator.alias}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, oklch(0.04 0.008 285) 100%)',
          }}
        />
      </div>

      {/* Profile Header */}
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px',
            marginTop: '-80px',
            position: 'relative',
            zIndex: 10,
            marginBottom: '48px',
            alignItems: 'flex-end',
          }}
        >
          {/* Avatar */}
          <div>
            <img
              src={creator.avatar}
              alt={creator.alias}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '3px solid oklch(0.72 0.09 75 / 40%)',
                objectFit: 'cover',
                background: 'oklch(0.085 0.015 330)',
              }}
            />
          </div>

          {/* Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  color: 'oklch(0.93 0.02 80)',
                  letterSpacing: '0.06em',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {creator.alias}
                  <VerificationBadge verified={creator.verified ?? false} size="md" />
                  {creator.isDemo && (
                    <span
                      style={{
                        background: 'oklch(0.35 0.05 200)',
                        color: 'oklch(0.93 0.02 80)',
                        fontFamily: "'Cinzel', serif",
                        fontSize: '9px',
                        letterSpacing: '0.2em',
                        padding: '3px 8px',
                        textTransform: 'uppercase',
                      }}
                      title="Example profile - explore features without affecting real data"
                    >
                      Demo
                    </span>
                  )}
                </div>
              </h1>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FollowButton handle={creatorId} />
                <button
                  onClick={async () => {
                    const profileUrl = `${window.location.origin}/creator/${creatorId}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: creator.alias,
                          text: creator.bio || `Check out ${creator.alias}'s page on OnlyFangs!`,
                          url: profileUrl,
                        });
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          toast.error('Error sharing profile');
                        }
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(profileUrl);
                        toast.success('Profile link copied!');
                      } catch {
                        toast.error('Error copying link');
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    background: 'oklch(0.085 0.015 330 / 90%)',
                    border: '1px solid oklch(0.72 0.09 75 / 30%)',
                    color: 'oklch(0.72 0.09 75)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75 / 10%)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.085 0.015 330 / 90%)';
                  }}
                  title="Share Profile"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>
            <div
              style={{
                fontFamily: "'IM Fell English', serif",
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'oklch(0.55 0.03 60)',
                marginBottom: '12px',
              }}
            >
              {creator.category} · {creator.name}
            </div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '16px',
                color: 'oklch(0.82 0.03 75)',
                lineHeight: 1.7,
                maxWidth: '500px',
              }}
            >
              {creator.bio}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {creator.tags.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '8px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'oklch(0.55 0.03 60)',
                    border: '1px solid oklch(1 0 0 / 10%)',
                    padding: '4px 10px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              background: 'oklch(0.085 0.015 330)',
              border: '1px solid oklch(1 0 0 / 8%)',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700, color: 'oklch(0.72 0.09 75)' }}>
                  {creator.subscribers.toLocaleString('en-US')}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.2em', color: 'oklch(0.35 0.02 60)', textTransform: 'uppercase' }}>
                  Patrons
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700, color: 'oklch(0.72 0.09 75)' }}>
                  {creator.totalPosts}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.2em', color: 'oklch(0.35 0.02 60)', textTransform: 'uppercase' }}>
                  Releases
                </div>
              </div>
            </div>
            <button
              className="btn-gold"
              style={{ width: '100%', textAlign: 'center' }}
              onClick={() => {
                document.getElementById('tiers-sidebar')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className="creator-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 300px',
            gap: '32px',
            paddingBottom: '80px',
          }}
        >
          {/* Content Feed */}
          <div>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid oklch(1 0 0 / 6%)', paddingBottom: '12px' }}>
              <button
                onClick={() => { setViewMode('releases'); setSelectedCollectionId(null); }}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '12px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  color: viewMode === 'releases' ? 'oklch(0.72 0.09 75)' : 'oklch(0.45 0.02 60)',
                  cursor: 'pointer',
                  fontWeight: viewMode === 'releases' ? 700 : 400,
                  transition: 'color 0.2s',
                  position: 'relative'
                }}
              >
                Releases
                {viewMode === 'releases' && (
                  <span style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'oklch(0.72 0.09 75)' }} />
                )}
              </button>
              {creatorCollections.length > 0 && (
                <button
                  onClick={() => setViewMode('collections')}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '12px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    color: viewMode === 'collections' ? 'oklch(0.72 0.09 75)' : 'oklch(0.45 0.02 60)',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'collections' ? 700 : 400,
                    transition: 'color 0.2s',
                    position: 'relative'
                  }}
                >
                  Collections ({creatorCollections.length})
                  {viewMode === 'collections' && (
                    <span style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'oklch(0.72 0.09 75)' }} />
                  )}
                </button>
              )}
            </div>

            {viewMode === 'releases' ? (
              <div>
                {/* Collection Filter active banner */}
                {selectedCollectionId && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'oklch(0.08 0.02 330)', border: '1px solid oklch(0.72 0.09 75 / 20%)', padding: '12px 18px', borderRadius: '6px', marginBottom: '24px' }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.04em' }}>
                      Viewing Collection: <strong style={{ color: 'oklch(0.72 0.09 75)' }}>{creatorCollections.find(c => c.id === selectedCollectionId)?.title || 'Selected'}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedCollectionId(null)}
                      style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: 'oklch(0.75 0.14 20)', border: 'none', cursor: 'pointer' }}
                    >
                      Clear Filter [X]
                    </button>
                  </div>
                )}

                {/* Tabs */}
                <div
                  style={{
                    display: 'flex',
                    gap: '2px',
                    marginBottom: '32px',
                    borderBottom: '1px solid oklch(1 0 0 / 8%)',
                  }}
                >
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '10px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        padding: '12px 20px',
                        background: 'none',
                        border: 'none',
                        borderBottom: `2px solid ${activeTab === tab.id ? 'oklch(0.72 0.09 75)' : 'transparent'}`,
                        color: activeTab === tab.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.55 0.03 60)',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        marginBottom: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {tab.label}
                      <span
                        style={{
                          background: 'oklch(0.12 0.02 330)',
                          padding: '2px 6px',
                          fontSize: '8px',
                          color: 'oklch(0.35 0.02 60)',
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '2px',
                  }}
                >
                  {filteredContent.map((item: any) => (
                    <ContentCard key={item.id} item={item} onPlayMusic={handlePlayMusic} creatorAlias={creator.alias} />
                  ))}
                  {filteredContent.length === 0 && (
                    <div
                      style={{
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: 'oklch(0.35 0.02 60)',
                        fontFamily: "'IM Fell English', serif",
                        fontStyle: 'italic',
                        fontSize: '18px',
                      }}
                    >
                      No content in this category yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {creatorCollections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => {
                        setSelectedCollectionId(collection.id);
                        setViewMode('releases');
                      }}
                      style={{
                        background: 'oklch(0.06 0.01 285)',
                        border: '1px solid oklch(1 0 0 / 6%)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'oklch(0.72 0.09 75 / 30%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'oklch(1 0 0 / 6%)';
                      }}
                    >
                      {/* Cover Art */}
                      <div style={{ height: '160px', overflow: 'hidden', background: 'oklch(0.1 0.02 285)', position: 'relative' }}>
                        {collection.coverUrl ? (
                          <img src={collection.coverUrl} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'oklch(0.45 0.02 60)', fontSize: '40px' }}>
                            🖤
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '6px' }}>
                          {collection.type}
                        </span>
                        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: 'oklch(0.93 0.02 80)', margin: '0 0 6px 0', letterSpacing: '0.04em', fontWeight: 600 }}>
                          {collection.title}
                        </h3>
                        {collection.description && (
                          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.55 0.03 60)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Tiers */}
          <div id="tiers-sidebar">
            <TierSidebar creatorId={creatorId} />
          </div>
        </div>
      </div>
    </div>
  );
}
