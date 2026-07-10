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
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'oklch(0.35 0.05 200)', color: 'oklch(0.93 0.02 80)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', padding: '3px 8px', textTransform: 'uppercase' }}>
            Demo
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

function ContentCard({ content, creator }: { content: any; creator: any }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="card-dark cursor-pointer hover:shadow-lg transition-shadow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/creator/${content.creatorId}`)}
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

  // Fetch search results
  const { data: creatorResults = [], isLoading: isSearchingCreators } = trpc.creator.search.useQuery(
    { query: searchQuery, category: activeCategory !== 'all' ? activeCategory : undefined, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  const { data: contentResults = [], isLoading: isSearchingContent } = trpc.content.search.useQuery(
    { query: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
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
  const displayedCreators = searchQuery.length > 0 
    ? creatorResults.slice(0, displayCount)
    : CREATORS.slice(0, displayCount);

  const displayedContent = searchQuery.length > 0 
    ? contentResults.slice(0, displayCount)
    : [];

  const hasMoreCreators = searchQuery.length > 0 
    ? creatorResults.length > displayCount
    : CREATORS.length > displayCount;

  const hasMoreContent = contentResults.length > displayCount;

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
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎭</div>
            <p style={{ color: 'oklch(0.55 0.03 60)', fontSize: '16px' }}>
              Start searching to discover creators and content
            </p>
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
                        const creator = CREATORS.find(c => c.id === content.creatorId);
                        return (
                          <ContentCard key={content.id} content={content} creator={creator} />
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
