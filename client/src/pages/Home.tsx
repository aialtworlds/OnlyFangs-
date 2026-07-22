// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Home Page
// Victorian Occult Luxury · Dark Creator Platform
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Lock, Play, BookOpen, Image, Music, Camera, Star, ChevronRight } from 'lucide-react';
import { CREATORS, CONTENT_ITEMS, TIERS, CATEGORIES, getFeaturedCreators } from '@/lib/data';
import type { ContentItem, Creator } from '@/lib/data';
import { RecommendedCreators } from '@/components/RecommendedCreators';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HomeProps {}

// ── Floating Particles ──────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    delay: `${Math.random() * 6}s`,
    duration: `${6 + Math.random() * 4}s`,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: p.left,
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'oklch(0.72 0.09 75)',
            animation: `floatUp ${p.duration} ${p.delay} ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Content Type Icon ────────────────────────────────────────
function ContentIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    image: <Image size={14} />,
    photo: <Camera size={14} />,
    music: <Music size={14} />,
    book: <BookOpen size={14} />,
  };
  return <>{icons[type] || <Star size={14} />}</>;
}

// ── Creator Card ─────────────────────────────────────────────
function CreatorCard({ creator }: { creator: Creator }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="card-dark"
      style={{ cursor: 'pointer', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/creator/${creator.id}`)}
    >
      {/* Cover Image */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
        <img
          src={creator.coverImage}
          alt={creator.alias}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
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
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'oklch(0.35 0.05 200)',
                  color: 'oklch(0.93 0.02 80)',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '7px',
                  letterSpacing: '0.3em',
                  padding: '4px 10px',
                  textTransform: 'uppercase',
                  cursor: 'help',
                }}
              >
                Demo
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Example profile - explore features without affecting real data</p>
            </TooltipContent>
          </Tooltip>
        )}
        {creator.verified && (
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
            Verified
          </div>
        )}
      </div>

      {/* Avatar + Info */}
      <div style={{ padding: '0 20px 24px', position: 'relative' }}>
        <div
          style={{
            marginTop: '-28px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <img
            src={creator.avatar}
            alt={creator.alias}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid oklch(0.72 0.09 75 / 40%)',
              objectFit: 'cover',
              background: 'oklch(0.085 0.015 330)',
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {creator.contentTypes.map((type) => (
              <div
                key={type}
                style={{
                  background: 'oklch(0.1 0.025 330)',
                  border: '1px solid oklch(1 0 0 / 10%)',
                  color: 'oklch(0.55 0.03 60)',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                }}
              >
                <ContentIcon type={type} />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '15px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.05em',
            marginBottom: '2px',
          }}
        >
          {creator.alias}
        </div>
        <div
          style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'oklch(0.55 0.03 60)',
            marginBottom: '12px',
          }}
        >
          {creator.category}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            borderTop: '1px solid oklch(1 0 0 / 6%)',
            paddingTop: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '14px',
                color: 'oklch(0.72 0.09 75)',
                fontWeight: 700,
              }}
            >
              {creator.subscribers.toLocaleString('en-US')}
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.2em', color: 'oklch(0.35 0.02 60)', textTransform: 'uppercase' }}>
              Patrons
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '14px',
                color: 'oklch(0.72 0.09 75)',
                fontWeight: 700,
              }}
            >
              {creator.totalPosts}
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.2em', color: 'oklch(0.35 0.02 60)', textTransform: 'uppercase' }}>
              Releases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Content Card ─────────────────────────────────────────────
function ContentCard({ item }: { item: ContentItem }) {
  const [, setLocation] = useLocation();
  const [hovered, setHovered] = useState(false);
  const creator = CREATORS.find((c) => c.id === item.creatorId);

  const tierColors: Record<string, string> = {
    fledgling: 'oklch(0.55 0.03 60)',
    dweller: 'oklch(0.72 0.09 75)',
    courtier: 'oklch(0.72 0.09 75)',
    'night-royalty': 'oklch(0.82 0.1 78)',
  };

  const tierLabels: Record<string, string> = {
    fledgling: 'Fledgling',
    dweller: 'Dweller',
    courtier: 'Courtier',
    'night-royalty': 'Night Royalty',
  };

  return (
    <div
      className="card-dark"
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/creator/${item.creatorId}`)}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img
          src={item.thumbnail}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            filter: item.locked ? 'brightness(0.4)' : 'brightness(0.85)',
          }}
        />

        {/* Locked Overlay */}
        {item.locked && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Lock size={24} style={{ color: 'oklch(0.72 0.09 75)' }} />
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
          </div>
        )}

        {/* Type Badge */}
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

        {/* Play button for music */}
        {item.type === 'music' && !item.locked && hovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'oklch(0.04 0.008 285 / 40%)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'oklch(0.72 0.09 75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={20} fill="oklch(0.04 0.008 285)" style={{ color: 'oklch(0.04 0.008 285)', marginLeft: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div style={{ padding: '16px 18px' }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '13px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.04em',
            marginBottom: '6px',
            lineHeight: 1.4,
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
            marginBottom: '12px',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </div>

        {/* Creator + Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {creator && (
              <>
                <img
                  src={creator.avatar}
                  alt={creator.alias}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid oklch(0.72 0.09 75 / 30%)',
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    color: 'oklch(0.55 0.03 60)',
                    textTransform: 'uppercase',
                  }}
                >
                  {creator.alias}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', color: 'oklch(0.35 0.02 60)' }}>
              ♥ {item.likes.toLocaleString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tier Card ─────────────────────────────────────────────────
function TierCard({ tier }: { tier: typeof TIERS[0] }) {
  const [, setLocation] = useLocation();
  return (
    <div
      style={{
        background: tier.featured
          ? 'linear-gradient(160deg, oklch(0.1 0.025 330) 0%, oklch(0.08 0.03 20) 100%)'
          : 'oklch(0.085 0.015 330)',
        border: `1px solid ${tier.featured ? 'oklch(0.72 0.09 75 / 30%)' : 'oklch(1 0 0 / 8%)'}`,
        padding: '36px 28px',
        position: 'relative',
        transition: 'transform 0.4s ease',
        textAlign: 'center',
        transform: tier.featured ? 'translateY(-8px)' : 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = tier.featured ? 'translateY(-14px)' : 'translateY(-5px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = tier.featured ? 'translateY(-8px)' : 'translateY(0)';
      }}
    >
      {tier.featured && (
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'oklch(0.72 0.09 75)',
            color: 'oklch(0.04 0.008 285)',
            fontFamily: "'Cinzel', serif",
            fontSize: '8px',
            letterSpacing: '0.3em',
            padding: '5px 16px',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          Most Popular
        </div>
      )}

      <div style={{ fontSize: '28px', marginBottom: '14px' }}>{tier.icon}</div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '16px',
          color: 'oklch(0.93 0.02 80)',
          letterSpacing: '0.09em',
          marginBottom: '4px',
        }}
      >
        {tier.name}
      </div>
      <div
        style={{
          fontFamily: "'IM Fell English', serif",
          fontStyle: 'italic',
          fontSize: '12px',
          color: 'oklch(0.55 0.03 60)',
          marginBottom: '14px',
        }}
      >
        {tier.latinName}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '32px',
          fontWeight: 700,
          color: 'oklch(0.72 0.09 75)',
          marginBottom: '4px',
        }}
      >
        {tier.price === 0 ? 'Free' : "Creator's Choice"}
      </div>
      <div style={{ fontSize: '13px', color: 'oklch(0.55 0.03 60)', marginBottom: '14px' }}>
        {tier.price > 0 ? '/month' : 'forever'}
      </div>
      <div
        style={{
          fontFamily: "'IM Fell English', serif",
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'oklch(0.55 0.03 60)',
          lineHeight: 1.7,
          marginBottom: '20px',
        }}
      >
        {tier.description}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
        {tier.perks.map((perk) => (
          <li
            key={perk}
            style={{
              fontSize: '14px',
              color: 'oklch(0.82 0.03 75)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: 'oklch(0.72 0.09 75)', fontSize: '9px', flexShrink: 0, marginTop: '5px' }}>✦</span>
            {perk}
          </li>
        ))}
      </ul>
      <button
        onClick={() => setLocation('/signup?role=creator')}
        style={{
          display: 'block',
          width: '100%',
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding: '11px',
          border: `1px solid ${tier.featured ? 'oklch(0.72 0.09 75 / 40%)' : 'oklch(0.72 0.09 75 / 25%)'}`,
          color: tier.featured ? 'oklch(0.72 0.09 75)' : 'oklch(0.55 0.03 60)',
          background: tier.featured ? 'oklch(0.72 0.09 75 / 10%)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = 'oklch(0.72 0.09 75)';
          el.style.color = 'oklch(0.72 0.09 75)';
          el.style.background = 'oklch(0.72 0.09 75 / 8%)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = tier.featured ? 'oklch(0.72 0.09 75 / 40%)' : 'oklch(0.72 0.09 75 / 25%)';
          el.style.color = tier.featured ? 'oklch(0.72 0.09 75)' : 'oklch(0.55 0.03 60)';
          el.style.background = tier.featured ? 'oklch(0.72 0.09 75 / 10%)' : 'transparent';
        }}
      >
        {tier.price === 0 ? 'Begin for Free' : 'Subscribe'}
      </button>
    </div>
  );
}

// ── Main Home Component ───────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const featuredCreators = getFeaturedCreators();
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  
  const navigate = (page: string, params?: Record<string, string>) => {
    // For now, just log. Will implement proper routing later
    console.log('Navigate to:', page, params);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => { const next = new Set(Array.from(prev)); next.add(entry.target.id); return next; });
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const filteredContent = activeCategory === 'all'
    ? CONTENT_ITEMS
    : CONTENT_ITEMS.filter((c) => c.type === activeCategory);

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(120px, 15vw, 160px) clamp(16px, 5vw, 40px) 100px',
        }}
      >
        {/* Background Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/hero-bg-EPesZhJvHu4iKNMcUHxWzo.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 55% 45% at 50% 55%, oklch(0.28 0.1 20 / 18%) 0%, transparent 65%),
              radial-gradient(ellipse 100% 50% at 50% 100%, oklch(0.04 0.008 285) 0%, transparent 55%),
              radial-gradient(ellipse 60% 100% at 0% 50%, oklch(0.04 0.008 285 / 85%) 0%, transparent 55%),
              radial-gradient(ellipse 60% 100% at 100% 50%, oklch(0.04 0.008 285 / 85%) 0%, transparent 55%)
            `,
            zIndex: 1,
          }}
        />

        <Particles />

        {/* Gothic arch decoration */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '680px',
            maxWidth: '100vw',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '460px',
              height: '320px',
              border: '1px solid oklch(0.72 0.09 75 / 7%)',
              borderBottom: 'none',
              borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="animate-fade-up" style={{ marginBottom: '36px' }}>
            <span className="tag-label">Dark Creators Platform</span>
          </div>

          <h1
            className="animate-fade-up-d1"
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(56px, 10vw, 120px)',
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: '0.06em',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '0.38em',
                letterSpacing: '0.5em',
                fontWeight: 400,
                color: 'oklch(0.93 0.02 80)',
                marginBottom: '8px',
              }}
            >
              Welcome to
            </span>
            <span
              style={{
                display: 'block',
                color: 'oklch(0.38 0.14 20)',
                fontFamily: "'Cinzel', serif",
                textShadow: '0 0 60px oklch(0.38 0.14 20 / 60%), 0 0 120px oklch(0.38 0.14 20 / 25%)',
              }}
            >
              ONLY FANGS
            </span>
          </h1>

          <p
            className="animate-fade-up-d2 font-fell"
            style={{
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              color: 'oklch(0.55 0.03 60)',
              margin: '0 auto 40px',
              maxWidth: '520px',
              lineHeight: 1.8,
            }}
          >
            The exclusive platform where{' '}
            <strong style={{ color: 'oklch(0.82 0.03 75)', fontStyle: 'normal', fontWeight: 400 }}>
              creatures of the night
            </strong>{' '}
            share images, photos, books and music with their patrons.
          </p>

          {/* CTA Cards */}
          <div
            className="animate-fade-up-d3"
            style={{
              display: 'flex',
              gap: '18px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              paddingLeft: '12px',
              paddingRight: '12px',
              boxSizing: 'border-box',
            }}
          >
            {/* Patron Card */}
            <div
              style={{
                background: 'oklch(0.085 0.015 330)',
                border: '1px solid oklch(0.72 0.09 75 / 18%)',
                padding: '28px 32px',
                textAlign: 'center',
                maxWidth: '240px',
                minWidth: '200px',
                cursor: 'pointer',
                transition: 'all 0.4s',
                position: 'relative',
                overflow: 'hidden',
                flex: '1 1 auto',
              }}
              onClick={() => setLocation('/signup?role=patron')}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'oklch(0.72 0.09 75 / 40%)';
                el.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'oklch(0.72 0.09 75 / 18%)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🩸</span>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '13px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.93 0.02 80)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                I am a Patron
              </span>
              <span
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: 'oklch(0.55 0.03 60)',
                  display: 'block',
                  marginBottom: '16px',
                  lineHeight: 1.6,
                }}
              >
                Discover and support creatures of the night
              </span>
              <button
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  display: 'block',
                  padding: '10px 20px',
                  border: '1px solid oklch(0.72 0.09 75 / 40%)',
                  color: 'oklch(0.72 0.09 75)',
                  background: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                Explore
              </button>
            </div>

            {/* Creator Card */}
            <div
              style={{
                background: 'linear-gradient(160deg, oklch(0.1 0.025 330) 0%, oklch(0.08 0.03 20) 100%)',
                border: '1px solid oklch(0.72 0.09 75 / 35%)',
                padding: '28px 32px',
                textAlign: 'center',
                maxWidth: '240px',
                minWidth: '200px',
                cursor: 'pointer',
                transition: 'all 0.4s',
                position: 'relative',
                overflow: 'hidden',
                flex: '1 1 auto',
              }}
              onClick={() => setLocation('/signup?role=creator')}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>🦇</span>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '13px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.93 0.02 80)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                I am a Creator
              </span>
              <span
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: 'italic',
                  fontSize: '13px',
                  color: 'oklch(0.55 0.03 60)',
                  display: 'block',
                  marginBottom: '16px',
                  lineHeight: 1.6,
                }}
              >
                Monetize your exclusive dark content
              </span>
              <button
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  display: 'block',
                  padding: '10px 20px',
                  background: 'oklch(0.72 0.09 75)',
                  color: 'oklch(0.04 0.008 285)',
                  border: '1px solid oklch(0.72 0.09 75)',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0.45,
            animation: 'fadeUp 2s 1.8s ease both',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '48px',
              background: 'linear-gradient(180deg, oklch(0.72 0.09 75), transparent)',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }}
          />
        </div>
      </section>

      {/* ── FEATURED CREATORS ────────────────────────────────── */}
      <section
        id="featured-creators"
        ref={(el) => { sectionRefs.current['featured-creators'] = el; }}
        style={{
          padding: '100px 0',
          background: 'oklch(0.06 0.01 285)',
          opacity: visibleSections.has('featured-creators') ? 1 : 0,
          transform: visibleSections.has('featured-creators') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span className="tag-label">Featured Creators</span>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 48px)',
                marginTop: '18px',
                color: 'oklch(0.93 0.02 80)',
              }}
            >
              Featured Creators
            </h2>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
            <p
              className="font-fell"
              style={{ color: 'oklch(0.55 0.03 60)', maxWidth: '480px', margin: '0 auto' }}
            >
              Verified creators who define the standards of darkness.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2px',
            }}
          >
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              className="btn-outline"
              onClick={() => setLocation('/creators')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              View All Creators
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── CONTENT FEED ─────────────────────────────────────── */}
      <section
        id="content-feed"
        ref={(el) => { sectionRefs.current['content-feed'] = el; }}
        style={{
          padding: '100px 0',
          background: 'oklch(0.04 0.008 285)',
          opacity: visibleSections.has('content-feed') ? 1 : 0,
          transform: visibleSections.has('content-feed') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="tag-label">Recent Content</span>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 48px)',
                marginTop: '18px',
                color: 'oklch(0.93 0.02 80)',
              }}
            >
              The Open Grimoire
            </h2>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
          </div>

          {/* Category Filter */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '48px',
              flexWrap: 'wrap',
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  padding: '10px 20px',
                  border: `1px solid ${activeCategory === cat.id ? 'oklch(0.72 0.09 75)' : 'oklch(1 0 0 / 10%)'}`,
                  background: activeCategory === cat.id ? 'oklch(0.72 0.09 75 / 12%)' : 'transparent',
                  color: activeCategory === cat.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.55 0.03 60)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2px',
            }}
          >
            {filteredContent.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button
              className="btn-gold"
              onClick={() => setLocation('/discover')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Explore All Content
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section
        id="how-it-works"
        ref={(el) => { sectionRefs.current['how-it-works'] = el; }}
        style={{
          padding: '100px 0',
          background: 'oklch(0.06 0.01 285)',
          opacity: visibleSections.has('how-it-works') ? 1 : 0,
          transform: visibleSections.has('how-it-works') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span className="tag-label">Como Funciona</span>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 48px)',
                marginTop: '18px',
                color: 'oklch(0.93 0.02 80)',
              }}
            >
              The Initiation Ritual
            </h2>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '48px',
            }}
          >
            {/* For Patrons */}
            <div>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '11px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.72 0.09 75)',
                  marginBottom: '32px',
                  borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
                  paddingBottom: '16px',
                }}
              >
                For Patrons
              </div>
              {[
                { n: '01', title: 'Discover Creators', desc: 'Explore the catalog of verified dark creators. Filter by content type, category or tier.' },
                { n: '02', title: 'Choose Your Tier', desc: 'Select the access level you desire. From Fledgling (free) to Night Royalty (full access).' },
                { n: '03', title: 'Access the Content', desc: 'Unlock exclusive images, photos, books and music. Your personal grimoire.' },
                { n: '04', title: 'Support the Darkness', desc: 'Each subscription goes directly to the creator. You sustain the art you love.' },
              ].map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '28px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '28px',
                      fontWeight: 900,
                      color: 'oklch(0.72 0.09 75 / 20%)',
                      lineHeight: 1,
                      flexShrink: 0,
                      width: '40px',
                    }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '14px',
                        color: 'oklch(0.93 0.02 80)',
                        letterSpacing: '0.05em',
                        marginBottom: '6px',
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IM Fell English', serif",
                        fontStyle: 'italic',
                        fontSize: '15px',
                        color: 'oklch(0.55 0.03 60)',
                        lineHeight: 1.7,
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* For Creators */}
            <div>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '11px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: 'oklch(0.38 0.14 20)',
                  marginBottom: '32px',
                  borderBottom: '1px solid oklch(0.38 0.14 20 / 20%)',
                  paddingBottom: '16px',
                }}
              >
                For Creators
              </div>
              {[
                { n: '01', title: 'Create Profile', desc: 'Enter your alias, link, and choose a category. Your profile is active instantly.' },
                { n: '02', title: 'Configure Your Tiers', desc: 'Define your access levels and prices. You control what each tier can see.' },
                { n: '03', title: 'Publish Your Content', desc: 'Images, photos, books, music. All in one place, with your captive audience.' },
                { n: '04', title: 'Receive Your Earnings', desc: 'Direct monthly payments. Full transparency. You keep 90% of each subscription.' },
              ].map((step) => (
                <div
                  key={step.n}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '28px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '28px',
                      fontWeight: 900,
                      color: 'oklch(0.38 0.14 20 / 30%)',
                      lineHeight: 1,
                      flexShrink: 0,
                      width: '40px',
                    }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '14px',
                        color: 'oklch(0.93 0.02 80)',
                        letterSpacing: '0.05em',
                        marginBottom: '6px',
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IM Fell English', serif",
                        fontStyle: 'italic',
                        fontSize: '15px',
                        color: 'oklch(0.55 0.03 60)',
                        lineHeight: 1.7,
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TIERS / PRICING ──────────────────────────────────── */}
      <section
        id="pricing"
        ref={(el) => { sectionRefs.current['pricing'] = el; }}
        style={{
          padding: '100px 0',
          background: 'linear-gradient(180deg, oklch(0.04 0.008 285) 0%, oklch(0.06 0.01 285) 100%)',
          opacity: visibleSections.has('pricing') ? 1 : 0,
          transform: visibleSections.has('pricing') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span className="tag-label">Membership Plans</span>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 48px)',
                marginTop: '18px',
                color: 'oklch(0.93 0.02 80)',
              }}
            >
              Choose Your Initiation Level
            </h2>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
            <p
              className="font-fell"
              style={{ color: 'oklch(0.55 0.03 60)', maxWidth: '480px', margin: '0 auto' }}
            >
              Each creator defines their own tiers and pricing. The names and structure below show how it works.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '2px',
              alignItems: 'end',
            }}
          >
            {TIERS.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section
        id="final-cta"
        ref={(el) => { sectionRefs.current['final-cta'] = el; }}
        style={{
          padding: '90px 0',
          background: 'oklch(0.06 0.01 285)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          opacity: visibleSections.has('final-cta') ? 1 : 0,
          transform: visibleSections.has('final-cta') ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 55% 80% at 50% 50%, oklch(0.28 0.1 20 / 22%) 0%, transparent 70%)',
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '9px',
              letterSpacing: '0.5em',
              color: 'oklch(0.72 0.09 75)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '20px',
            }}
          >
            The Darkness Calls
          </span>
          <h2
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(32px, 5vw, 60px)',
              color: 'oklch(0.93 0.02 80)',
              marginBottom: '14px',
            }}
          >
            Step Into the Dark
          </h2>
          <p
            className="font-fell"
            style={{
              fontSize: '18px',
              color: 'oklch(0.55 0.03 60)',
              marginBottom: '40px',
              maxWidth: '480px',
              margin: '0 auto 40px',
            }}
          >
            Join thousands of creators and patrons who already dwell in the darkness.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-gold" onClick={() => setLocation('/signup?role=creator')}>
              Become a Creator
            </button>
            <button className="btn-outline" onClick={() => setLocation('/discover')}>
              Explore as a Patron
            </button>
          </div>
        </div>
      </section>

      {/* Recommended Creators Section */}
      <section style={{ padding: '80px 20px', background: 'oklch(0.085 0.015 330)', borderTop: '1px solid oklch(0.72 0.09 75 / 20%)' }}>
        <div className="container mx-auto max-w-6xl">
          <RecommendedCreators />
        </div>
      </section>
    </div>
  );
}
