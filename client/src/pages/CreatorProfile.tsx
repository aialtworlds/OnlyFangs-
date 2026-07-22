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
            filter: item.locked ? 'brightness(0.3) blur(2px)' : 'brightness(0.85)',
          }}
        />

        {item.locked && (
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

        {item.type === 'music' && !item.locked && (
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
              onClick={() => toast('Comments coming soon')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: 'oklch(0.35 0.02 60)',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
              }}
            >
              <MessageCircle size={13} />
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
                    text: item.description || `Confira este post de ${creatorAlias} no OnlyFangs`,
                    url: postUrl,
                  });
                } catch (err) {
                  if ((err as Error).name !== 'AbortError') {
                    toast.error('Erro ao compartilhar');
                  }
                }
              } else {
                try {
                  await navigator.clipboard.writeText(postUrl);
                  toast.success('Link do post copiado!');
                } catch {
                  toast.error('Erro ao copiar link');
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
  const creator = getCreatorById(creatorId) || CREATORS[0];
  const content = getContentByCreatorId(creator.id);
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'photo' | 'music' | 'book'>('all');

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

  const filteredContent = activeTab === 'all' ? content : content.filter(c => c.type === activeTab);

  const tabs = [
    { id: 'all', label: 'All', count: content.length },
    ...creator.contentTypes.map(type => ({
      id: type,
      label: { image: 'Images', photo: 'Photos', music: 'Music', book: 'Books' }[type] || type,
      count: content.filter(c => c.type === type).length,
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
          onClick={() => setLocation('/creators')}
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
                          text: creator.bio || `Confira a página de ${creator.alias} no OnlyFangs!`,
                          url: profileUrl,
                        });
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          toast.error('Erro ao compartilhar');
                        }
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(profileUrl);
                        toast.success('Link do perfil copiado!');
                      } catch {
                        toast.error('Erro ao copiar link');
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
                  title="Compartilhar Perfil"
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
              {creator.tags.map(tag => (
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

          {/* Sidebar — Tiers */}
          <div id="tiers-sidebar">
            <TierSidebar creatorId={creatorId} />
          </div>
        </div>
      </div>
    </div>
  );
}
