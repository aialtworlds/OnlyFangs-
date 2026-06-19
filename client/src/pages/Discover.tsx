// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Discover Page
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { Lock, Play, BookOpen, Image, Music, Camera, Search } from 'lucide-react';
import { CONTENT_ITEMS, CREATORS, CATEGORIES } from '@/lib/data';
import type { ContentItem } from '@/lib/data';
import { toast } from 'sonner';

interface DiscoverProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
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
  mortal: 'Mortal',
  initiate: 'Iniciado',
  acolyte: 'Acólito',
  immortal: 'Imortal',
};

function DiscoverCard({ item, onNavigate }: { item: ContentItem; onNavigate: (page: string, params?: Record<string, string>) => void }) {
  const [hovered, setHovered] = useState(false);
  const creator = CREATORS.find(c => c.id === item.creatorId);

  return (
    <div
      className="card-dark"
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate('creator', { id: item.creatorId })}
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
            filter: item.locked ? 'brightness(0.35) blur(3px)' : 'brightness(0.8)',
          }}
        />
        {item.locked && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Lock size={24} style={{ color: 'oklch(0.72 0.09 75)' }} />
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)' }}>
              Tier {tierLabels[item.tier]}
            </div>
          </div>
        )}
        {item.type === 'music' && !item.locked && hovered && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.04 0.008 285 / 40%)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'oklch(0.72 0.09 75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={(e) => { e.stopPropagation(); toast('Reproduzindo: ' + item.title); }}>
              <Play size={18} fill="oklch(0.04 0.008 285)" style={{ color: 'oklch(0.04 0.008 285)', marginLeft: '2px' }} />
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'oklch(0.04 0.008 285 / 80%)', backdropFilter: 'blur(4px)', border: '1px solid oklch(1 0 0 / 10%)', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'oklch(0.82 0.03 75)', fontSize: '11px', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <ContentIcon type={item.type} />
          {item.type === 'music' && item.duration && <span>{item.duration}</span>}
          {item.type === 'book' && item.pages && <span>{item.pages}p</span>}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.04em', marginBottom: '4px' }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          {creator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={creator.avatar} alt={creator.alias} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', border: '1px solid oklch(0.72 0.09 75 / 30%)' }} />
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.1em', color: 'oklch(0.55 0.03 60)', textTransform: 'uppercase' }}>{creator.alias}</span>
            </div>
          )}
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', color: 'oklch(0.35 0.02 60)' }}>♥ {item.likes.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

export default function Discover({ onNavigate }: DiscoverProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const filtered = CONTENT_ITEMS
    .filter(item => activeCategory === 'all' || item.type === activeCategory)
    .filter(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortBy === 'popular' ? b.likes - a.likes : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div
        style={{
          background: 'oklch(0.06 0.01 285)',
          borderBottom: '1px solid oklch(0.72 0.09 75 / 8%)',
          padding: '60px 0 40px',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="tag-label">Explorar</span>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(28px, 4vw, 48px)', marginTop: '18px', color: 'oklch(0.93 0.02 80)' }}>
              Descobrir Conteúdo
            </h1>
            <div className="ornament" style={{ margin: '18px auto' }}>
              <span style={{ color: 'oklch(0.72 0.09 75)' }}>✦</span>
            </div>
          </div>

          {/* Search */}
          <div style={{ maxWidth: '560px', margin: '0 auto 32px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.35 0.02 60)' }} />
            <input
              className="input-dark"
              placeholder="Buscar obras, criadores, categorias..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {CATEGORIES.map(cat => (
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

          {/* Sort */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[{ id: 'recent', label: 'Mais Recentes' }, { id: 'popular', label: 'Mais Populares' }].map(s => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as typeof sortBy)}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '8px 16px',
                  border: `1px solid ${sortBy === s.id ? 'oklch(0.72 0.09 75 / 40%)' : 'oklch(1 0 0 / 8%)'}`,
                  background: sortBy === s.id ? 'oklch(0.72 0.09 75 / 8%)' : 'transparent',
                  color: sortBy === s.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.35 0.02 60)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container" style={{ paddingTop: '48px' }}>
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2px' }}>
            {filtered.map(item => (
              <DiscoverCard key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'oklch(0.35 0.02 60)', fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '20px' }}>
            Nenhum conteúdo encontrado nas trevas...
          </div>
        )}
      </div>
    </div>
  );
}
