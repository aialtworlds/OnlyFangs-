// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Discover Page
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Lock, Play, BookOpen, Image, Music, Camera } from 'lucide-react';
import { CREATORS } from '@/lib/data';
import { toast } from 'sonner';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { ContentSkeletonGrid } from '@/components/ContentSkeleton';
import { useInfiniteScroll } from '@/_core/hooks/useInfiniteScroll';
import { VerificationBadge } from '@/components/VerificationBadge';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

// Gradient fallback for missing images
function GradientFallback({ seed }: { seed: string | number }) {
  const hues = [330, 60, 120, 240, 300];
  const hue = hues[Number(seed) % hues.length];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, oklch(0.3 0.1 ${hue}) 0%, oklch(0.15 0.05 ${hue + 30}) 100%)`,
      }}
    />
  );
}

function CreatorCard({ creator }: { creator: any }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="card-dark cursor-pointer hover:shadow-lg transition-shadow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/creator/${creator.id}`)}
    >
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        {!imageError && creator.coverUrl ? (
          <img
            src={creator.coverUrl}
            alt={creator.alias}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <GradientFallback seed={creator.id} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 30%, oklch(0.085 0.015 330) 100%)',
          }}
        />
        {creator.isDemo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'oklch(0.35 0.05 200)', color: 'oklch(0.93 0.02 80)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', padding: '3px 8px', textTransform: 'uppercase', cursor: 'help' }}>
                Demo
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Example profile - explore features without affecting real data</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '14px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {creator.alias}
          {creator.verified && <VerificationBadge verified={true} />}
        </div>
        <p style={{ fontSize: '12px', color: 'oklch(0.55 0.03 60)', marginBottom: '12px' }}>
          {creator.totalSubscribers} patrons
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'oklch(0.7 0.05 70)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {creator.bio}
        </p>
      </div>
    </div>
  );
}

function ContentCard({ content, creator, onPlayMusic }: { content: any; creator: any; onPlayMusic?: (item: any, creatorAlias: string) => void }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="card-dark cursor-pointer hover:shadow-lg transition-shadow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/creator/${content.creatorId}`)}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        {!imageError && content.thumbnailUrl ? (
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <GradientFallback seed={content.id} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 30%, oklch(0.085 0.015 330) 100%)',
          }}
        />
        {content.tierId && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'oklch(0.72 0.09 75)',
              color: 'oklch(0.04 0.008 285)',
              fontFamily: "'Cinzel', serif",
              fontSize: '7px',
              letterSpacing: '0.3em',
              padding: '4px 10px',
              textTransform: 'uppercase',
            }}
          >
            {tierLabels[content.tierId] || 'Premium'}
          </div>
        )}

        {/* Music Play Overlay (Only for Free tier — fileUrl is only present when accessible) */}
        {content.type === 'music' && content.fileUrl && onPlayMusic && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'oklch(0.72 0.09 75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.3s',
              zIndex: 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPlayMusic(content, creator?.alias || 'Unknown');
            }}
          >
            <Play size={16} fill="oklch(0.04 0.008 285)" style={{ color: 'oklch(0.04 0.008 285)', marginLeft: '2px' }} />
          </div>
        )}

        {/* Lock Overlay for Premium content (no fileUrl means it wasn't unlocked) */}
        {!content.fileUrl && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'oklch(0.2 0.03 20 / 80%)',
              border: '1px solid oklch(0.72 0.09 75 / 30%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.3s',
              zIndex: 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              toast('Subscription required', {
                description: `This ${content.type || 'release'} is exclusive to subscribers. Redirecting to ${creator?.alias || 'creator'}'s profile...`
              });
              setTimeout(() => {
                setLocation(`/creator/${content.creatorId}`);
              }, 1200);
            }}
          >
            <Lock size={16} style={{ color: 'oklch(0.72 0.09 75)' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '14px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.05em',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {content.title}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'oklch(0.55 0.03 60)',
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {content.description}
        </div>

        {creator && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid oklch(1 0 0 / 10%)',
            }}
          >
            {creator.avatar && !imageError ? (
              <img
                src={creator.avatar}
                alt={creator.alias}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'oklch(0.2 0.08 330)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'oklch(0.72 0.09 75)',
                  fontWeight: 'bold',
                }}
              >
                {creator.alias?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: 'oklch(0.93 0.02 80)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {creator.alias}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Discover() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'creators' | 'content'>('creators');
  const [displayCount, setDisplayCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { playTrack } = useMusicPlayer();

  const handlePlayMusic = (item: any, creatorAlias: string) => {
    playTrack({
      id: item.id.toString(),
      title: item.title,
      artist: creatorAlias,
      duration: item.duration || '0:00',
      thumbnail: item.thumbnailUrl || '/images/default-thumbnail.jpg',
      tier: item.tierId ? 'premium' : 'free',
    });
  };

  // Fetch search results
  const { data: creatorResults = [], isLoading: isSearchingCreators } = trpc.creator.search.useQuery(
    { query: searchQuery, category: activeCategory !== 'all' ? activeCategory : undefined, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  const { data: contentResults = [], isLoading: isSearchingContent } = trpc.content.search.useQuery(
    { query: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  // Fetch default discovery values if search is empty
  const { data: allCreators = [], isLoading: isLoadingAllCreators } = trpc.public.allCreators.useQuery(
    undefined,
    { enabled: searchQuery.length === 0 }
  );

  const { data: recentContent = [], isLoading: isLoadingRecentContent } = trpc.public.recentContent.useQuery(
    { limit: 12 },
    { enabled: searchQuery.length === 0 }
  );

  const { data: recentSubscriptions = [], isLoading: isLoadingRecentSubs } = trpc.public.recentSubscriptions.useQuery(
    { limit: 5 },
    { enabled: searchQuery.length === 0 }
  );

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 6);
      setIsLoadingMore(false);
    }, 400);
  };

  const scrollTarget = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    threshold: 300,
    enabled: !isSearchingCreators && !isSearchingContent && !isLoadingMore,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setDisplayCount(12);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setDisplayCount(12);
  };

  // Display results
  const activeCreators = allCreators.length > 0 ? allCreators : CREATORS;

  const filteredCreators = activeCategory === 'all'
    ? activeCreators
    : activeCreators.filter(c => (c as any).category === activeCategory);

  const displayedCreators = searchQuery.length > 0 
    ? creatorResults.slice(0, displayCount)
    : filteredCreators.slice(0, displayCount);

  const filteredContent = activeCategory === 'all'
    ? recentContent
    : recentContent.filter(c => c.type === activeCategory);

  const displayedContent = searchQuery.length > 0 
    ? contentResults.slice(0, displayCount)
    : filteredContent.slice(0, displayCount);

  const hasMoreCreators = searchQuery.length > 0 
    ? creatorResults.length > displayCount
    : filteredCreators.length > displayCount;

  const hasMoreContent = searchQuery.length > 0
    ? contentResults.length > displayCount
    : filteredContent.length > displayCount;

  const isSearching = isSearchingCreators || isSearchingContent;

  return (
    <div style={{ minHeight: '100vh', background: 'oklch(0.085 0.015 330)', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ paddingTop: '80px', paddingBottom: '40px', background: 'linear-gradient(135deg, oklch(0.085 0.015 330) 0%, oklch(0.1 0.02 330) 100%)' }}>
        <div className="container">
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '32px',
              color: 'oklch(0.93 0.02 80)',
              letterSpacing: '0.1em',
              marginBottom: '32px',
              textTransform: 'uppercase',
            }}
          >
            Discover
          </h1>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search creators and content..."
              />
            </div>
            <CategoryFilter
              onCategoryChange={handleCategoryChange}
              selectedCategory={activeCategory}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-12">
        {isSearching ? (
          <ContentSkeletonGrid count={12} />
        ) : searchQuery.length === 0 ? (
          /* Dynamic Discovery Dashboard */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '40px' }} className="discover-layout-grid">
            {/* Left Column: Releases & Creators */}
            <div>
              {/* Featured Releases Section */}
              <div style={{ marginBottom: '56px' }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '24px', borderBottom: '1px solid oklch(1 0 0 / 6%)', paddingBottom: '12px' }}>
                  Featured Releases
                </h2>
                {filteredContent.length === 0 ? (
                  <p style={{ color: 'oklch(0.45 0.02 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic' }}>
                    No recent releases found.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {filteredContent.slice(0, 6).map((content: any) => {
                      const creator = activeCreators.find(c => c.id === content.creatorId);
                      return (
                        <ContentCard key={content.id} content={content} creator={creator} onPlayMusic={handlePlayMusic} />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Creators Section */}
              <div>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '24px', borderBottom: '1px solid oklch(1 0 0 / 6%)', paddingBottom: '12px' }}>
                  Active Creators
                </h2>
                {filteredCreators.length === 0 ? (
                  <p style={{ color: 'oklch(0.45 0.02 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic' }}>
                    No creators found in this category.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {displayedCreators.map((creator: any) => (
                      <CreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity Sidebar */}
            <div style={{ borderLeft: '1px solid oklch(1 0 0 / 6%)', paddingLeft: '32px' }} className="discover-sidebar">
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'oklch(0.72 0.09 75)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '10px' }}>
                Recent Activity
              </h3>
              
              {recentSubscriptions.length === 0 ? (
                <div style={{ padding: '24px 16px', background: 'oklch(0.06 0.01 285)', border: '1px solid oklch(1 0 0 / 4%)', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🦇</div>
                  <p style={{ color: 'oklch(0.45 0.02 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', margin: 0 }}>
                    The community is quiet.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentSubscriptions.map((sub: any) => (
                    <div
                      key={sub.id}
                      style={{
                        background: 'oklch(0.06 0.01 285)',
                        border: '1px solid oklch(1 0 0 / 4%)',
                        padding: '14px 16px',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'oklch(0.93 0.02 80)', fontFamily: "'Cinzel', serif", marginBottom: '4px' }}>
                        <span style={{ color: 'oklch(0.72 0.09 75)' }}>{sub.userDisplayName || sub.userName || 'Anonymous'}</span> Joined
                      </div>
                      <div style={{ fontSize: '11px', color: 'oklch(0.55 0.03 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic' }}>
                        Tier: <span style={{ color: 'oklch(0.72 0.09 75)' }}>{sub.tierName || 'Free'}</span> of{' '}
                        <a href={`/creator/${sub.creatorHandle}`} style={{ color: 'oklch(0.93 0.02 80)', textDecoration: 'none', fontWeight: 600 }}>
                          {sub.creatorAlias}
                        </a>
                      </div>
                      <div style={{ fontSize: '9px', color: 'oklch(0.35 0.02 60)', marginTop: '6px' }}>
                        {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : displayedCreators.length === 0 && displayedContent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: 'oklch(0.55 0.03 60)', fontSize: '16px' }}>
              No results found for "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'creators' | 'content')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="creators">
                  Creators ({displayedCreators.length})
                </TabsTrigger>
                <TabsTrigger value="content">
                  Content ({displayedContent.length})
                </TabsTrigger>
              </TabsList>
 
              <TabsContent value="creators">
                {displayedCreators.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ color: 'oklch(0.55 0.03 60)' }}>No creators found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedCreators.map((creator: any) => (
                        <CreatorCard key={creator.id} creator={creator} />
                      ))}
                    </div>
 
                    {hasMoreCreators && (
                      <div ref={scrollTarget} className="mt-12 text-center">
                        <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                          {isLoadingMore ? 'Loading...' : 'Load more'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
 
              <TabsContent value="content">
                {displayedContent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ color: 'oklch(0.55 0.03 60)' }}>No content found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedContent.map((content: any) => {
                        const creator = activeCreators.find(c => c.id === content.creatorId);
                        return (
                          <ContentCard key={content.id} content={content} creator={creator} onPlayMusic={handlePlayMusic} />
                        );
                      })}
                    </div>
 
                    {hasMoreContent && (
                      <div ref={scrollTarget} className="mt-12 text-center">
                        <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                          {isLoadingMore ? 'Loading...' : 'Load more'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
