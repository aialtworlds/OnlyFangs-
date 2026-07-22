// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Patron Profile Page
// Shows the logged-in patron's profile, subscriptions & activity
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Edit2, Check, X, BookOpen, Image, Music, Camera, Star, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div
      style={{
        background: 'oklch(0.085 0.015 330)',
        border: '1px solid oklch(1 0 0 / 8%)',
        padding: '20px 24px',
        textAlign: 'center',
        flex: 1,
        minWidth: '100px',
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '26px',
          fontWeight: 700,
          color: 'oklch(0.72 0.09 75)',
          marginBottom: '4px',
          textShadow: '0 0 20px oklch(0.72 0.09 75 / 30%)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '8px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'oklch(0.45 0.02 60)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    image: <Image size={12} />,
    photo: <Camera size={12} />,
    music: <Music size={12} />,
    book: <BookOpen size={12} />,
  };
  return <>{icons[type] || <Star size={12} />}</>;
}

export default function PatronProfile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const statsQuery = trpc.patron.stats.useQuery(undefined, { enabled: isAuthenticated });
  const subsQuery = trpc.patron.subscriptions.useQuery(undefined, { enabled: isAuthenticated });
  const activityQuery = trpc.patron.activity.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const cancelSubMutation = trpc.stripe.cancelSubscription.useMutation({
    onSuccess: () => {
      toast('Subscription cancelled', { description: 'Your subscription has been cancelled.' });
      utils.patron.subscriptions.invalidate();
      utils.patron.stats.invalidate();
    },
    onError: (err) => toast.error('Failed to cancel', { description: err.message }),
  });

  const billingPortalMutation = trpc.stripe.getBillingPortalUrl.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (err) => toast.error('Failed to open billing portal', { description: err.message }),
  });

  const updateProfileMutation = trpc.patron.updateProfile.useMutation({
    onSuccess: () => {
      toast('Profile updated', { description: 'Your name has been saved.' });
      utils.auth.me.invalidate();
      setEditingName(false);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const displayName = user?.displayName || user?.name || 'Patron';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatarUrl;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  // Not logged in
  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'oklch(0.04 0.008 285)',
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: 'oklch(0.45 0.02 60)',
            textTransform: 'uppercase',
          }}
        >
          Summoning your profile...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'oklch(0.04 0.008 285)',
          textAlign: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦇</div>
        <h2
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '24px',
            color: 'oklch(0.93 0.02 80)',
            marginBottom: '12px',
          }}
        >
          You Are Not a Patron
        </h2>
        <p
          style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '16px',
            color: 'oklch(0.55 0.03 60)',
            marginBottom: '32px',
            maxWidth: '360px',
          }}
        >
          Sign up to access your profile, follow creators, and unlock exclusive content.
        </p>
        <a
          href={getLoginUrl()}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: 'oklch(0.72 0.09 75)',
            color: 'oklch(0.04 0.008 285)',
            padding: '14px 32px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'background 0.25s',
          }}
        >
          Sign Up
        </a>
      </div>
    );
  }

  const stats = statsQuery.data;
  const subscriptions = subsQuery.data ?? [];
  const activity = activityQuery.data ?? [];

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh' }}>
      {/* Profile Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, oklch(0.08 0.02 330) 0%, oklch(0.04 0.008 285) 100%)',
          borderBottom: '1px solid oklch(1 0 0 / 6%)',
          padding: 'clamp(32px, 6vw, 64px) clamp(16px, 5vw, 48px) 40px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid oklch(0.72 0.09 75 / 40%)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    background: 'oklch(0.28 0.1 20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Cinzel', serif",
                    fontSize: '32px',
                    color: 'oklch(0.93 0.02 80)',
                    fontWeight: 700,
                    border: '2px solid oklch(0.72 0.09 75 / 40%)',
                  }}
                >
                  {avatarLetter}
                </div>
              )}
            </div>

            {/* Name + info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              {/* Editable display name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {editingName ? (
                  <>
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateProfileMutation.mutate({ displayName: nameInput });
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '22px',
                        color: 'oklch(0.93 0.02 80)',
                        background: 'oklch(0.06 0.01 285)',
                        border: '1px solid oklch(0.72 0.09 75 / 40%)',
                        padding: '4px 10px',
                        outline: 'none',
                        letterSpacing: '0.04em',
                        maxWidth: '280px',
                        width: '100%',
                      }}
                    />
                    <button
                      onClick={() => updateProfileMutation.mutate({ displayName: nameInput })}
                      disabled={updateProfileMutation.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(0.72 0.09 75)', padding: '4px' }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(0.45 0.02 60)', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <h1
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 'clamp(18px, 4vw, 26px)',
                        color: 'oklch(0.93 0.02 80)',
                        letterSpacing: '0.06em',
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      {displayName}
                    </h1>
                    <button
                      onClick={() => { setNameInput(displayName); setEditingName(true); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'oklch(0.45 0.02 60)',
                        padding: '4px',
                        transition: 'color 0.2s',
                      }}
                      title="Edit display name"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.45 0.02 60)'; }}
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>

              <div
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: 'oklch(0.45 0.02 60)',
                  marginBottom: '8px',
                }}
              >
                Patron · Member since {memberSince}
              </div>

              <div
                style={{
                  display: 'inline-block',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '8px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.72 0.09 75)',
                  border: '1px solid oklch(0.72 0.09 75 / 30%)',
                  padding: '4px 12px',
                }}
              >
                {user?.role === 'admin'
                  ? 'Admin Master'
                  : user?.role === 'creator'
                  ? 'Creator'
                  : 'Patron'}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '2px', marginTop: '32px', flexWrap: 'wrap' }}>
            <StatBox value={stats?.activeSubscriptions ?? 0} label="Subscriptions" />
            <StatBox value={stats?.followingCreators ?? 0} label="Following" />
            <StatBox value={stats?.savedContentCount ?? 0} label="Saved" />
            <StatBox value={stats?.loyaltyPoints ?? 0} label="Loyalty Pts" />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(16px, 5vw, 48px)' }}>

        {/* Active Subscriptions */}
        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'oklch(0.72 0.09 75)',
              marginBottom: '20px',
              borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
              paddingBottom: '12px',
            }}
          >
            Active Subscriptions
          </div>

          {subsQuery.isLoading ? (
            <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', color: 'oklch(0.45 0.02 60)', fontSize: '14px' }}>
              Consulting the grimoire...
            </div>
          ) : subscriptions.length === 0 ? (
            <div
              style={{
                background: 'oklch(0.085 0.015 330)',
                border: '1px solid oklch(1 0 0 / 8%)',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🩸</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.75 0.03 75)', marginBottom: '8px' }}>
                No Active Subscriptions
              </div>
              <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '13px', color: 'oklch(0.45 0.02 60)', marginBottom: '20px' }}>
                Discover creators and subscribe to unlock their exclusive content.
              </div>
              <button
                onClick={() => setLocation('/discover')}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  background: 'oklch(0.72 0.09 75)',
                  color: 'oklch(0.04 0.008 285)',
                  border: 'none',
                  padding: '10px 24px',
                  cursor: 'pointer',
                }}
              >
                Discover Creators
              </button>
            </div>
          ) : (
            <>
<div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => billingPortalMutation.mutate({ origin: window.location.origin })}
                  disabled={billingPortalMutation.isPending}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '8px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    color: 'oklch(0.72 0.09 75)',
                    border: '1px solid oklch(0.72 0.09 75 / 30%)',
                    padding: '8px 16px',
                    cursor: billingPortalMutation.isPending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: billingPortalMutation.isPending ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {billingPortalMutation.isPending ? (
                    <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <ExternalLink size={10} />
                  )}
                  Manage Billing
                </button>
              </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px' }}>
              {subscriptions.map((sub) => (
                <div
                  key={sub.subId}
                  style={{
                    background: 'oklch(0.085 0.015 330)',
                    border: '1px solid oklch(1 0 0 / 8%)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    onClick={() => setLocation(`/creator/${sub.creatorHandle}`)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {sub.creatorAvatarUrl ? (
                      <img
                        src={sub.creatorAvatarUrl}
                        alt={sub.creatorAlias}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'oklch(0.28 0.1 20)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Cinzel', serif",
                          fontSize: '16px',
                          color: 'oklch(0.93 0.02 80)',
                          flexShrink: 0,
                        }}
                      >
                        {sub.creatorAlias.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        {sub.creatorAlias}
                        {sub.creatorVerified && (
                          <span style={{ marginLeft: '6px', color: 'oklch(0.72 0.09 75)', fontSize: '9px' }}>✦</span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.45 0.02 60)' }}>
                        {sub.creatorCategory || 'Dark Creator'}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '8px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: sub.status === 'active' ? 'oklch(0.65 0.12 145)' : 'oklch(0.55 0.04 20)',
                        border: `1px solid ${sub.status === 'active' ? 'oklch(0.65 0.12 145 / 30%)' : 'oklch(0.55 0.04 20 / 30%)'}`,
                        padding: '3px 8px',
                        flexShrink: 0,
                      }}
                    >
                      {sub.status}
                    </div>
                  </div>
                  {sub.status === 'active' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Cancel subscription to ${sub.creatorAlias}?`)) {
                          cancelSubMutation.mutate({ subscriptionId: sub.subId });
                        }
                      }}
                      disabled={cancelSubMutation.isPending && cancelSubMutation.variables?.subscriptionId === sub.subId}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '8px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        background: 'transparent',
                        color: 'oklch(0.55 0.04 20)',
                        border: '1px solid oklch(0.55 0.04 20 / 30%)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cancelSubMutation.isPending && cancelSubMutation.variables?.subscriptionId === sub.subId ? (
                        <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : null}
                      Cancel Subscription
                    </button>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'oklch(0.72 0.09 75)',
              marginBottom: '20px',
              borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
              paddingBottom: '12px',
            }}
          >
            Recent Activity
          </div>

          {activityQuery.isLoading ? (
            <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', color: 'oklch(0.45 0.02 60)', fontSize: '14px' }}>
              Reading the omens...
            </div>
          ) : activity.length === 0 ? (
            <div
              style={{
                background: 'oklch(0.085 0.015 330)',
                border: '1px solid oklch(1 0 0 / 8%)',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                The chronicles are empty. Your story begins when you subscribe to a creator.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {activity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'oklch(0.085 0.015 330)',
                    border: '1px solid oklch(1 0 0 / 8%)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  {item.creatorAvatarUrl ? (
                    <img
                      src={item.creatorAvatarUrl}
                      alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'oklch(0.12 0.02 285)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'oklch(0.55 0.03 60)',
                        flexShrink: 0,
                      }}
                    >
                      <ContentTypeIcon type={item.type.replace('new_', '')} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'oklch(0.82 0.03 75)', letterSpacing: '0.04em', marginBottom: '2px' }}>
                      {item.message || item.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.4 0.02 60)' }}>
                      {item.creatorAlias && `${item.creatorAlias} · `}
                      {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
