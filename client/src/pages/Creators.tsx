// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Creators List Page
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Image, Music, BookOpen, Camera, Search } from 'lucide-react';
import { CREATORS } from '@/lib/data';
import type { Creator } from '@/lib/data';



function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    image: <Image size={12} />,
    photo: <Camera size={12} />,
    music: <Music size={12} />,
    book: <BookOpen size={12} />,
  };
  return <>{icons[type] || null}</>;
}

function CreatorCard({ creator }: { creator: Creator }) {
  const [hovered, setHovered] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div
      className="card-dark"
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation('/creator/' + creator.id )}
    >
      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
        <img
          src={creator.coverImage}
          alt={creator.alias}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)', filter: 'brightness(0.6)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, oklch(0.085 0.015 330) 100%)' }} />
        {creator.verified && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'oklch(0.72 0.09 75)', color: 'oklch(0.04 0.008 285)', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.3em', padding: '3px 8px', textTransform: 'uppercase' }}>
            Verified
          </div>
        )}
      </div>
      <div style={{ padding: '0 18px 20px', position: 'relative' }}>
        <div style={{ marginTop: '-24px', marginBottom: '10px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <img
            src={creator.avatar}
            alt={creator.alias}
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid oklch(0.72 0.09 75 / 40%)', objectFit: 'cover', background: 'oklch(0.085 0.015 330)' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            {creator.contentTypes.map(type => (
              <div key={type} style={{ background: 'oklch(0.1 0.025 330)', border: '1px solid oklch(1 0 0 / 10%)', color: 'oklch(0.55 0.03 60)', padding: '3px 7px', display: 'flex', alignItems: 'center' }}>
                <ContentTypeIcon type={type} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.05em', marginBottom: '2px' }}>{creator.alias}</div>
        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.55 0.03 60)', marginBottom: '10px' }}>{creator.category}</div>
        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid oklch(1 0 0 / 6%)', paddingTop: '10px' }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.72 0.09 75)', fontWeight: 700 }}>{creator.subscribers.toLocaleString('en-US')}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.15em', color: 'oklch(0.45 0.02 60)', textTransform: 'uppercase' }}>Subscribers</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.72 0.09 75)', fontWeight: 700 }}>{creator.totalPosts}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '0.15em', color: 'oklch(0.45 0.02 60)', textTransform: 'uppercase' }}>Releases</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Creators() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const typeFilters = [
    { id: 'all', label: 'All' },
    { id: 'image', label: '🖼️ Images' },
    { id: 'photo', label: '📷 Photos' },
    { id: 'music', label: '🎵 Music' },
    { id: 'book', label: '📖 Books' },
  ];

  const filtered = CREATORS
    .filter(c => filterType === 'all' || c.contentTypes.includes(filterType as any))
    .filter(c => !search || c.alias.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ background: 'oklch(0.06 0.01 285)', borderBottom: '1px solid oklch(0.72 0.09 75 / 8%)', padding: '60px 0 40px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="tag-label">The Coven</span>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 4vw, 48px)', marginTop: '18px', color: 'oklch(0.93 0.02 80)' }}>
              Creatures of the Night
            </h1>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
          </div>

          <div style={{ maxWidth: '480px', margin: '0 auto 28px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.35 0.02 60)' }} />
            <input
              className="input-dark"
              placeholder="Search creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {typeFilters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  padding: '9px 18px',
                  border: `1px solid ${filterType === f.id ? 'oklch(0.72 0.09 75)' : 'oklch(1 0 0 / 10%)'}`,
                  background: filterType === f.id ? 'oklch(0.72 0.09 75 / 12%)' : 'transparent',
                  color: filterType === f.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.55 0.03 60)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container" style={{ paddingTop: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px' }}>
          {filtered.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'oklch(0.35 0.02 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '20px' }}>
            No creators found in the darkness...
          </div>
        )}
      </div>
    </div>
  );
}
