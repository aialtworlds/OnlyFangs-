// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Navbar Component
// Victorian Occult Luxury · Fixed top nav with scroll effect
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'discover', label: 'Discover', path: '/discover' },
    { id: 'creators', label: 'Creators', path: '/creators' },
    { id: 'categories', label: 'Categories', path: '/discover' },
    { id: 'pricing', label: 'Plans', path: '/#pricing' },
  ];

  const currentPage = location.replace('/', '') || 'home';

  return (
    <>
      {/* Announcement Bar */}
      <div
        style={{
          background: 'oklch(0.28 0.1 20)',
          padding: '9px',
          textAlign: 'center',
          fontFamily: "'Cinzel', serif",
          fontSize: '10px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'oklch(0.93 0.02 80)',
        }}
      >
        ✦ &nbsp;{' '}
        <span style={{ color: 'oklch(0.82 0.1 78)' }}>
          Founders
        </span>{' '}
        — Applications open for founding creators &nbsp; ✦
      </div>

      {/* Main Nav */}
      <nav
        style={{
          position: 'fixed',
          top: scrolled ? '0' : '34px',
          width: '100%',
          zIndex: 1000,
          padding: '0 48px',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled
            ? 'oklch(0.04 0.008 285 / 98%)'
            : 'linear-gradient(180deg, oklch(0.04 0.008 285 / 95%) 0%, oklch(0.04 0.008 285 / 0%) 100%)',
          borderBottom: `1px solid oklch(0.72 0.09 75 / ${scrolled ? '20%' : '10%'})`,
          backdropFilter: 'blur(14px)',
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setLocation('/')}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '20px',
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'oklch(0.72 0.09 75)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/logo-icon-GS2XhBKAJ7cguv6fE9nSDv.png"
            alt="Only Fangs"
            style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'invert(1) sepia(1) saturate(2) hue-rotate(10deg)' }}
          />
          ONLY
          <span style={{ color: 'oklch(0.93 0.02 80)', fontWeight: 400 }}>
            FANGS
          </span>
        </button>

        {/* Desktop Nav Links */}
        <ul
          style={{
            display: 'flex',
            gap: '36px',
            listStyle: 'none',
            alignItems: 'center',
            margin: 0,
            padding: 0,
          }}
          className="hidden md:flex"
        >
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => setLocation(link.path)}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: currentPage === link.id
                    ? 'oklch(0.72 0.09 75)'
                    : 'oklch(0.82 0.03 75)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '4px 0',
                  transition: 'color 0.3s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = 'oklch(0.72 0.09 75)';
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== link.id) {
                    (e.target as HTMLElement).style.color = 'oklch(0.82 0.03 75)';
                  }
                }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'oklch(0.55 0.03 60)',
              cursor: 'pointer',
              padding: '6px',
              transition: 'color 0.3s',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = 'oklch(0.72 0.09 75)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = 'oklch(0.55 0.03 60)';
            }}
          >
            <Search size={16} />
          </button>

          {/* Notifications */}
          <button
            onClick={() => toast('No new notifications', { description: 'The silence is a ritual.' })}
            style={{
              background: 'none',
              border: 'none',
              color: 'oklch(0.55 0.03 60)',
              cursor: 'pointer',
              padding: '6px',
              transition: 'color 0.3s',
              display: 'flex',
              alignItems: 'center',
            }}
            className="hidden md:flex"
          >
            <Bell size={16} />
          </button>

          {/* Join the Coven CTA */}
          <button
            onClick={() => setLocation('/apply')}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: 'oklch(0.72 0.09 75)',
              color: 'oklch(0.04 0.008 285)',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              transition: 'background 0.3s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'oklch(0.82 0.1 78)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'oklch(0.72 0.09 75)';
            }}
            onMouseDown={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
            className="hidden md:block"
          >
            Join the Coven
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'oklch(0.82 0.03 75)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            className="md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Search Bar */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            top: scrolled ? '68px' : '102px',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'oklch(0.085 0.015 330)',
            borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
            padding: '16px 48px',
            animation: 'fadeUp 0.2s ease',
          }}
        >
          <input
            autoFocus
            placeholder="Search creators, works, rituals..."
            className="input-dark"
            style={{ maxWidth: '600px' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: '102px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            background: 'oklch(0.04 0.008 285 / 98%)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 32px',
            gap: '8px',
          }}
        >
          {navLinks.map((link, i) => (
            <button
              key={link.id}
              onClick={() => {
                setLocation(link.path);
                setMobileOpen(false);
              }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '18px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'oklch(0.93 0.02 80)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '16px 0',
                borderBottom: '1px solid oklch(1 0 0 / 6%)',
                textAlign: 'left',
                animation: `fadeUp 0.3s ${i * 0.05}s ease both`,
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setLocation('/apply');
              setMobileOpen(false);
            }}
            className="btn-gold"
            style={{ marginTop: '24px', textAlign: 'center' }}
          >
            Join the Coven
          </button>
        </div>
      )}
    </>
  );
}
