// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Unified Personal Space (Profile & Dashboard)
// Victorian Occult Luxury · Dark Creator Platform
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import {
  Edit2, Check, X, BookOpen, Image, Music, Camera, Star, Loader2, ExternalLink,
  User, LayoutDashboard, Crown, Bookmark, MessageCircle, Bell, Settings, Users,
  Plus, Share2, MapPin, Heart, Compass, History, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { ContentUploadForm } from '@/components/ContentUploadForm';
import { TierForm } from '@/components/TierForm';
import { CollectionForm } from '@/components/CollectionForm';
import { CommentsSection } from '@/components/CommentsSection';

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

function NavItem({
  icon: Icon, label, active, badge, onClick,
}: {
  icon: React.ElementType; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px", width: "100%",
        padding: "10px 16px", borderRadius: "6px",
        background: active ? "oklch(0.38 0.14 20 / 15%)" : "transparent",
        border: "none", cursor: "pointer",
        color: active ? "oklch(0.75 0.14 20)" : "oklch(0.65 0.02 60)",
        fontFamily: "'Cinzel', serif", fontSize: "12px", letterSpacing: "0.06em",
        textAlign: "left", transition: "all 0.2s", position: "relative",
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 4%)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <Icon size={16} />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          marginLeft: "auto", background: "oklch(0.38 0.14 20)", color: "white",
          fontSize: "10px", fontFamily: "sans-serif", borderRadius: "999px",
          padding: "1px 7px", minWidth: "18px", textAlign: "center",
        }}>{badge}</span>
      )}
    </button>
  );
}

function FeedPostCard({ item }: { item: any }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  return (
    <div
      style={{
        background: 'oklch(0.06 0.01 285)',
        border: '1px solid oklch(1 0 0 / 6%)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header: Creator Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {item.creatorAvatarUrl ? (
          <img
            src={item.creatorAvatarUrl}
            alt=""
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'oklch(0.28 0.1 20)',
              color: 'oklch(0.93 0.02 80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            {item.creatorAlias.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <a
            href={`/creator/${item.creatorHandle}`}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '14px',
              fontWeight: 700,
              color: 'oklch(0.93 0.02 80)',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'oklch(0.72 0.09 75)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'oklch(0.93 0.02 80)')}
          >
            {item.creatorAlias}
          </a>
          <div
            style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: 'italic',
              fontSize: '11px',
              color: 'oklch(0.45 0.02 60)',
              marginTop: '2px',
            }}
          >
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Body: Title & Description */}
      <div>
        <h3
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '18px',
            color: 'oklch(0.93 0.02 80)',
            margin: '0 0 8px 0',
            letterSpacing: '0.04em',
          }}
        >
          {item.title}
        </h3>
        {item.description && (
          <p
            style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'oklch(0.65 0.02 60)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Media Preview (if applicable) */}
      {item.thumbnailUrl && (
        <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', maxHeight: '360px', background: 'oklch(0.04 0.008 285)' }}>
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '360px' }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid oklch(1 0 0 / 4%)', paddingTop: '16px' }}>
        <button
          onClick={() => setLiked(!liked)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: liked ? 'oklch(0.42 0.16 20)' : 'oklch(0.45 0.02 60)',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            transition: 'color 0.2s',
          }}
        >
          <Heart size={14} fill={liked ? 'oklch(0.42 0.16 20)' : 'none'} />
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: showComments ? 'oklch(0.72 0.09 75)' : 'oklch(0.45 0.02 60)',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            transition: 'color 0.2s',
          }}
        >
          <MessageCircle size={14} fill={showComments ? 'oklch(0.72 0.09 75 / 20%)' : 'none'} />
          <span>Whispers</span>
        </button>

        <button
          onClick={async () => {
            const postUrl = `${window.location.origin}/creator/${item.creatorHandle}#post-${item.id}`;
            if (navigator.share) {
              try {
                await navigator.share({
                  title: item.title,
                  text: item.description || `Confira este post de ${item.creatorAlias} no OnlyFangs`,
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
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'oklch(0.45 0.02 60)',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            transition: 'color 0.2s',
            marginLeft: 'auto',
          }}
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentsSection contentId={item.id} />
      )}
    </div>
  );
}

export default function PatronProfile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [dashboardSubMode, setDashboardSubMode] = useState<'feed' | 'activity'>('feed');

  // Queries
  const statsQuery = trpc.patron.stats.useQuery(undefined, { enabled: isAuthenticated });
  const subsQuery = trpc.patron.subscriptions.useQuery(undefined, { enabled: isAuthenticated });
  const activityQuery = trpc.patron.activity.useQuery(undefined, { enabled: isAuthenticated });
  const homeFeedQuery = trpc.patron.homeFeed.useQuery(undefined, { enabled: isAuthenticated });
  const unreadQuery = trpc.patron.unreadCounts.useQuery(undefined, { enabled: isAuthenticated });
  const creatorProfileQuery = trpc.creator.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  
  const isCreatorOrAdmin = user?.role === 'creator' || user?.role === 'admin';
  
  const creatorReleasesQuery = trpc.creator.releases.useQuery(undefined, {
    enabled: isAuthenticated && isCreatorOrAdmin
  });
  
  const creatorTiersQuery = trpc.creator.tiers.useQuery(undefined, {
    enabled: isAuthenticated && isCreatorOrAdmin
  });

  const myCollectionsQuery = trpc.creator.myCollections.useQuery(undefined, {
    enabled: isAuthenticated && isCreatorOrAdmin
  });

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

  // Redirect to login if unauthenticated
  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.04 0.008 285)' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.3em', color: 'oklch(0.45 0.02 60)', textTransform: 'uppercase' }}>
          Summoning your profile...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.04 0.008 285)', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦇</div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '24px', color: 'oklch(0.93 0.02 80)', marginBottom: '12px' }}>You Are Not a Patron</h2>
        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '16px', color: 'oklch(0.55 0.03 60)', marginBottom: '32px', maxWidth: '360px' }}>
          Sign up to access your profile, follow creators, and unlock exclusive content.
        </p>
        <a href={getLoginUrl()} style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'oklch(0.72 0.09 75)', color: 'oklch(0.04 0.008 285)', padding: '14px 32px', textDecoration: 'none', display: 'inline-block', transition: 'background 0.25s' }}>
          Sign Up
        </a>
      </div>
    );
  }

  const stats = statsQuery.data;
  const subscriptions = subsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const unread = unreadQuery.data;
  const creatorProfile = creatorProfileQuery.data;
  const releases = creatorReleasesQuery.data ?? [];
  const tiers = creatorTiersQuery.data ?? [];
  const myCollections = myCollectionsQuery.data ?? [];
  const homeFeed = homeFeedQuery.data ?? [];

  // Sidebar Menu Configuration
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Feed / Dashboard" },
    { id: "profile", icon: User, label: "My Profile" },
    { id: "subscriptions", icon: Crown, label: "Subscriptions" },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unread?.messages },
    { id: "notifications", icon: Bell, label: "Notifications", badge: unread?.notifications },
    
    // Creator Section
    ...(isCreatorOrAdmin ? [
      { id: "releases", icon: Image, label: "Nocturnal Releases" },
      { id: "collections", icon: Bookmark, label: "Collections" },
      { id: "tiers", icon: Crown, label: "Tiers" },
      { id: "audience", icon: Users, label: "Audience" },
      { id: "settings", icon: Settings, label: "Creator Admin" }
    ] : [])
  ];

  const handleNav = (id: string) => {
    if (id === "messages") {
      setLocation("/messages");
    } else if (id === "notifications") {
      setLocation("/notifications");
    } else if (id === "settings") {
      setLocation("/creator-admin");
    } else {
      setActiveNav(id);
    }
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid oklch(1 0 0 / 6%)", cursor: "pointer" }} onClick={() => setLocation("/")}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", letterSpacing: "0.12em", color: "oklch(0.93 0.02 80)" }}>
          ONLY <span style={{ color: "oklch(0.75 0.14 20)", fontWeight: 900 }}>FANGS</span>
        </div>
      </div>
      <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => (
          <NavItem key={item.id} icon={item.icon} label={item.label}
            active={activeNav === item.id} badge={item.badge} onClick={() => handleNav(item.id)} />
        ))}
      </nav>
      {user?.role === 'admin' && (
        <div style={{ margin: "0 12px 12px", padding: "12px 16px", background: "oklch(0.08 0.02 330)", border: "1px solid oklch(0.38 0.14 20 / 20%)", borderRadius: "8px" }}>
          <button
            onClick={() => setLocation('/moderation')}
            style={{ width: "100%", padding: "8px", border: "1px solid oklch(0.38 0.14 20 / 40%)", background: "transparent", color: "oklch(0.72 0.09 75)", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px" }}
          >
            Moderation Panel
          </button>
        </div>
      )}
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.04 0.008 285)", display: "flex", paddingTop: "68px" }}>
      
      {/* Desktop Sidebar */}
      <div style={{ width: "240px", flexShrink: 0, background: "oklch(0.055 0.012 330)", borderRight: "1px solid oklch(1 0 0 / 6%)", display: "flex", flexDirection: "column", height: "calc(100vh - 68px)", position: "sticky", top: "68px", overflowY: "auto" }}>
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden", padding: "clamp(20px, 4vw, 40px)" }}>
        
        {/* Render Feed/Dashboard Tab */}
        {activeNav === 'dashboard' && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.55 0.03 60)", marginBottom: "6px" }}>Welcome back,</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "12px" }}>
                {displayName} <span style={{ fontSize: "20px" }}>✦</span>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
              <StatBox value={stats?.activeSubscriptions ?? 0} label="Subscriptions" />
              <StatBox value={stats?.followingCreators ?? 0} label="Following" />
              <StatBox value={stats?.savedContentCount ?? 0} label="Saved" />
              <StatBox value={stats?.loyaltyPoints ?? 0} label="Loyalty Pts" />
            </div>

            {/* Dashboard Sub-mode Selector */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '28px', borderBottom: '1px solid oklch(1 0 0 / 6%)', paddingBottom: '12px' }}>
              <button
                onClick={() => setDashboardSubMode('feed')}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  color: dashboardSubMode === 'feed' ? 'oklch(0.72 0.09 75)' : 'oklch(0.45 0.02 60)',
                  cursor: 'pointer',
                  fontWeight: dashboardSubMode === 'feed' ? 700 : 400,
                  transition: 'color 0.2s',
                  position: 'relative'
                }}
              >
                Nocturnal Feed
                {dashboardSubMode === 'feed' && (
                  <span style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'oklch(0.72 0.09 75)' }} />
                )}
              </button>
              <button
                onClick={() => setDashboardSubMode('activity')}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  color: dashboardSubMode === 'activity' ? 'oklch(0.72 0.09 75)' : 'oklch(0.45 0.02 60)',
                  cursor: 'pointer',
                  fontWeight: dashboardSubMode === 'activity' ? 700 : 400,
                  transition: 'color 0.2s',
                  position: 'relative'
                }}
              >
                Ritual Logs
                {dashboardSubMode === 'activity' && (
                  <span style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', background: 'oklch(0.72 0.09 75)' }} />
                )}
              </button>
            </div>

            {dashboardSubMode === 'feed' ? (
              <div>
                {homeFeedQuery.isLoading ? (
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', color: 'oklch(0.45 0.02 60)', fontSize: '14px' }}>
                    Summoning your feed...
                  </div>
                ) : homeFeed.length === 0 ? (
                  <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🦇</div>
                    <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)', maxWidth: '380px', margin: '0 auto' }}>
                      Your feed is silent. Follow or subscribe to creators to receive their updates here.
                    </div>
                  </div>
                ) : (
                  <div>
                    {homeFeed.map((item) => (
                      <FeedPostCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {activityQuery.isLoading ? (
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', color: 'oklch(0.45 0.02 60)', fontSize: '14px' }}>
                    Reading the omens...
                  </div>
                ) : activity.length === 0 ? (
                  <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🩸</div>
                    <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                      The chronicles are empty. Your story begins when you subscribe to a creator.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activity.map((item) => (
                      <div key={item.id} style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {item.creatorAvatarUrl ? (
                          <img src={item.creatorAvatarUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'oklch(0.12 0.02 285)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(0.55 0.03 60)', flexShrink: 0 }}>
                            <ContentTypeIcon type={item.type.replace('new_', '')} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', color: 'oklch(0.82 0.03 75)', letterSpacing: '0.04em', marginBottom: '2px' }}>
                            {item.message || item.type.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.40 0.02 60)' }}>
                            {item.creatorAlias && `${item.creatorAlias} · `}
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Render Profile Tab */}
        {activeNav === 'profile' && (
          <div>
            {/* Cover Banner */}
            <div style={{ position: "relative", height: "200px", overflow: "hidden", borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, oklch(0.1 0.05 20) 0%, oklch(0.05 0.01 285) 60%, oklch(0.14 0.07 20) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, oklch(0.04 0.008 285 / 60%) 100%)" }} />
            </div>

            {/* Profile Info */}
            <div style={{ padding: "0 12px", position: "relative", marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginTop: '-60px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid oklch(0.04 0.008 285)', background: 'oklch(0.1 0.025 330)' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'oklch(0.28 0.1 20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '36px', color: 'oklch(0.93 0.02 80)', fontWeight: 700, border: '3px solid oklch(0.04 0.008 285)' }}>
                      {avatarLetter}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '200px', paddingTop: '68px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {editingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateProfileMutation.mutate({ displayName: nameInput });
                            if (e.key === 'Escape') setEditingName(false);
                          }}
                          style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', background: 'oklch(0.06 0.01 285)', border: '1px solid oklch(0.72 0.09 75 / 40%)', padding: '4px 10px', outline: 'none', letterSpacing: '0.04em' }}
                        />
                        <button onClick={() => updateProfileMutation.mutate({ displayName: nameInput })} disabled={updateProfileMutation.isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(0.72 0.09 75)' }}><Check size={16} /></button>
                        <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(0.45 0.02 60)' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 3vw, 28px)', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.04em', margin: 0 }}>
                          {displayName}
                        </h2>
                        <button onClick={() => { setNameInput(displayName); setEditingName(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(0.45 0.02 60)', padding: '4px' }}><Edit2 size={14} /></button>
                      </>
                    )}
                  </div>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)', marginBottom: '8px' }}>
                    Member since {memberSince}
                  </div>
                  <div style={{ display: 'inline-block', fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', border: '1px solid oklch(0.72 0.09 75 / 30%)', padding: '4px 12px' }}>
                    {user?.role === 'admin' ? 'Admin Master' : user?.role === 'creator' ? 'Creator' : 'Patron'}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Tabs based on Role */}
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '20px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '12px' }}>
              My Subscriptions
            </h3>
            
            {subscriptions.length === 0 ? (
              <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '13px', color: 'oklch(0.45 0.02 60)' }}>
                  You are not subscribed to any creators yet.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                {subscriptions.map((sub) => (
                  <div key={sub.subId} style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setLocation(`/creator/${sub.creatorHandle}`)}>
                      {sub.creatorAvatarUrl ? (
                        <img src={sub.creatorAvatarUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'oklch(0.28 0.1 20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '16px', color: 'oklch(0.93 0.02 80)' }}>
                          {sub.creatorAlias.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', color: 'oklch(0.93 0.02 80)' }}>
                          {sub.creatorAlias}
                        </div>
                        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '11px', color: 'oklch(0.45 0.02 60)' }}>
                          {sub.creatorCategory || 'Dark Creator'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render Subscriptions Tab */}
        {activeNav === 'subscriptions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', margin: 0 }}>Active Memberships</h2>
              <button
                onClick={() => billingPortalMutation.mutate({ origin: window.location.origin })}
                disabled={billingPortalMutation.isPending}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', color: 'oklch(0.72 0.09 75)', border: '1px solid oklch(0.72 0.09 75 / 30%)', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {billingPortalMutation.isPending ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={10} />}
                Manage Billing
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)', marginBottom: '20px' }}>
                  No active subscriptions. Explore our creators to join their tiers.
                </div>
                <button onClick={() => setLocation('/discover')} style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'oklch(0.72 0.09 75)', color: 'oklch(0.04 0.008 285)', border: 'none', padding: '10px 24px', cursor: 'pointer' }}>
                  Discover Creators
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {subscriptions.map((sub) => (
                  <div key={sub.subId} style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {sub.creatorAvatarUrl ? (
                        <img src={sub.creatorAvatarUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'oklch(0.28 0.1 20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '18px', color: 'oklch(0.93 0.02 80)' }}>
                          {sub.creatorAlias.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: 'oklch(0.93 0.02 80)' }}>{sub.creatorAlias}</div>
                        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.45 0.02 60)' }}>{sub.creatorCategory || 'Dark Creator'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', color: 'oklch(0.65 0.12 145)', border: '1px solid oklch(0.65 0.12 145 / 30%)', padding: '4px 10px' }}>
                        {sub.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel subscription to ${sub.creatorAlias}?`)) {
                            cancelSubMutation.mutate({ subscriptionId: sub.subId });
                          }
                        }}
                        disabled={cancelSubMutation.isPending}
                        style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', color: 'oklch(0.55 0.04 20)', border: '1px solid oklch(0.55 0.04 20 / 30%)', padding: '8px 16px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render Releases Tab (Creator Only) */}
        {activeNav === 'releases' && isCreatorOrAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', margin: 0 }}>My Releases</h2>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'oklch(0.38 0.14 20)', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={12} /> {showUploadForm ? 'Close Form' : 'New Release'}
              </button>
            </div>

            {showUploadForm && (
              <div style={{ background: 'oklch(0.055 0.012 330)', border: '1px solid oklch(1 0 0 / 6%)', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                <ContentUploadForm onSuccess={() => {
                  toast.success('Content published and sent for review!');
                  setShowUploadForm(false);
                  utils.creator.releases.invalidate();
                }} />
              </div>
            )}

            {releases.length === 0 ? (
              <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                  You have not uploaded any releases yet. Publish your first content!
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {releases.map((release) => (
                  <div key={release.id} style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '140px', background: 'oklch(0.05 0.01 285)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {release.thumbnailUrl ? (
                        <img src={release.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '24px' }}>🦇</div>
                      )}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.93 0.02 80)', margin: '0 0 4px 0' }}>{release.title}</h4>
                      <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.45 0.02 60)', margin: 0 }}>{release.type.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render Tiers Tab (Creator Only) */}
        {activeNav === 'tiers' && isCreatorOrAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', margin: 0 }}>Membership Tiers</h2>
              <button
                onClick={() => setShowTierForm(!showTierForm)}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'oklch(0.38 0.14 20)', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={12} /> {showTierForm ? 'Close Form' : 'New Tier'}
              </button>
            </div>

            {showTierForm && (
              <div style={{ background: 'oklch(0.055 0.012 330)', border: '1px solid oklch(1 0 0 / 6%)', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                <TierForm onSuccess={() => {
                  toast.success('Tier created successfully!');
                  setShowTierForm(false);
                  utils.creator.tiers.invalidate();
                }} onCancel={() => setShowTierForm(false)} />
              </div>
            )}

            {tiers.length === 0 ? (
              <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                  No tiers configured. Create tiers to start offering subscription access!
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {tiers.map((tier) => (
                  <div key={tier.id} style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(0.38 0.14 20 / 20%)', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: 'oklch(0.93 0.02 80)', marginBottom: '4px' }}>{tier.name}</div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', fontWeight: 700, color: 'oklch(0.75 0.14 20)', marginBottom: '8px' }}>
                      {parseFloat(tier.price) === 0 ? 'Free' : `$${tier.price}/mo`}
                    </div>
                    {tier.description && <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.45 0.02 60)' }}>{tier.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render Audience Tab (Creator Only) */}
        {activeNav === 'audience' && isCreatorOrAdmin && (
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', marginBottom: '24px' }}>My Audience</h2>
            <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                Your loyal followers list will appear here as your community grows.
              </div>
            </div>
          </div>
        )}

        {/* Render Collections Tab (Creator Only) */}
        {activeNav === 'collections' && isCreatorOrAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', color: 'oklch(0.93 0.02 80)', margin: 0 }}>My Collections</h2>
              <button
                onClick={() => setShowCollectionForm(!showCollectionForm)}
                style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'oklch(0.38 0.14 20)', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={12} /> {showCollectionForm ? 'Close Form' : 'New Collection'}
              </button>
            </div>

            {showCollectionForm && (
              <div style={{ marginBottom: '32px' }}>
                <CollectionForm onSuccess={() => setShowCollectionForm(false)} />
              </div>
            )}

            {myCollections.length === 0 ? (
              <div style={{ background: 'oklch(0.085 0.015 330)', border: '1px solid oklch(1 0 0 / 8%)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>
                  No collections created yet. Build a series, album, or gallery to group your dark art!
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {myCollections.map((collection) => (
                  <div
                    key={collection.id}
                    style={{
                      background: 'oklch(0.06 0.01 285)',
                      border: '1px solid oklch(1 0 0 / 6%)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Cover Art */}
                    <div style={{ height: '160px', overflow: 'hidden', background: 'oklch(0.1 0.02 285)' }}>
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
                      <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '15px', color: 'oklch(0.93 0.02 80)', margin: '0 0 6px 0', letterSpacing: '0.04em' }}>
                        {collection.title}
                      </h3>
                      {collection.description && (
                        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '13px', color: 'oklch(0.55 0.03 60)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
