// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Navbar Component
// Victorian Occult Luxury · Fully responsive
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
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location]);

  const navLinks = [
    { id: 'discover', label: 'Discover', path: '/discover' },
    { id: 'creators', label: 'Creators', path: '/creators' },
    { id: 'categories', label: 'Categories', path: '/discover' },
    { id: 'plans', label: 'Plans', path: '/#pricing' },
  ];

  const currentPage = location.replace('/', '') || 'home';

  const navBg = scrolled ? 'oklch(0.04 0.008 285 / 98%)' : 'oklch(0.04 0.008 285 / 95%)';
  const navBorder = scrolled ? 'oklch(0.72 0.09 75 / 20%)' : 'oklch(0.72 0.09 75 / 10%)';

  return (
    <>
      {/* Sticky wrapper — announcement bar + nav together */}
      <div className="sticky top-0 z-[1000] w-full">
        {/* Announcement Bar */}
        <div
          style={{
            background: 'oklch(0.28 0.1 20)',
            padding: '8px 16px',
            textAlign: 'center',
            fontFamily: "'Cinzel', serif",
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'oklch(0.93 0.02 80)',
            lineHeight: 1.3,
          }}
        >
          <span className="sm:hidden">
            <span style={{ color: 'oklch(0.82 0.1 78)' }}>✦ Founders</span>
            {' — Applications open ✦'}
          </span>
          <span className="hidden sm:inline">
            <span style={{ color: 'oklch(0.82 0.1 78)' }}>✦ Founders</span>
            {' — Applications open for founding creators ✦'}
          </span>
        </div>

        {/* Main Nav */}
        <nav
          style={{
            width: '100%',
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: navBg,
            borderBottom: `1px solid ${navBorder}`,
            backdropFilter: 'blur(14px)',
            transition: 'background 0.3s, border-color 0.3s',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Logo */}
          <button
            onClick={() => setLocation('/')}
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '17px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663776899552/EqrmbXCk9cv2fubgnH6rvo/logo-icon-GS2XhBKAJ7cguv6fE9nSDv.png"
              alt="Only Fangs"
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain',
                filter: 'invert(1) sepia(1) saturate(2) hue-rotate(10deg)',
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'oklch(0.72 0.09 75)' }}>
              ONLY{' '}
              <span style={{ color: 'oklch(0.93 0.02 80)', fontWeight: 400 }}>FANGS</span>
            </span>
          </button>

          {/* Desktop Nav Links — hidden below md */}
          <ul className="hidden md:flex" style={{ gap: '28px', listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => setLocation(link.path)}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: currentPage === link.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.75 0.03 75)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    transition: 'color 0.25s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
                  onMouseLeave={(e) => { if (currentPage !== link.id) (e.target as HTMLElement).style.color = 'oklch(0.75 0.03 75)'; }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center"
              style={{
                background: 'none',
                border: 'none',
                color: 'oklch(0.55 0.03 60)',
                cursor: 'pointer',
                padding: '8px',
                transition: 'color 0.25s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.03 60)'; }}
            >
              <Search size={16} />
            </button>

            {/* Notifications — desktop only */}
            <button
              onClick={() => toast('No new notifications', { description: 'The silence is a ritual.' })}
              className="hidden md:flex items-center"
              style={{
                background: 'none',
                border: 'none',
                color: 'oklch(0.55 0.03 60)',
                cursor: 'pointer',
                padding: '8px',
                transition: 'color 0.25s',
              }}
            >
              <Bell size={16} />
            </button>

            {/* Join the Coven CTA — desktop only */}
            <button
              onClick={() => setLocation('/apply')}
              className="hidden md:block"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '9px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                background: 'oklch(0.72 0.09 75)',
                color: 'oklch(0.04 0.008 285)',
                border: 'none',
                padding: '10px 18px',
                cursor: 'pointer',
                transition: 'background 0.25s, transform 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.82 0.1 78)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75)'; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              Join the Coven
            </button>

            {/* Mobile Hamburger — visible only below md */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden items-center"
              style={{
                background: 'none',
                border: 'none',
                color: 'oklch(0.82 0.03 75)',
                cursor: 'pointer',
                padding: '8px',
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Search Bar */}
        {searchOpen && (
          <div
            style={{
              background: 'oklch(0.085 0.015 330)',
              borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)',
              padding: '14px 20px',
            }}
          >
            <input
              autoFocus
              placeholder="Search creators, works, rituals..."
              style={{
                maxWidth: '600px',
                width: '100%',
                background: 'oklch(0.06 0.01 285)',
                border: '1px solid oklch(0.72 0.09 75 / 20%)',
                color: 'oklch(0.93 0.02 80)',
                fontFamily: "'Cinzel', serif",
                fontSize: '12px',
                letterSpacing: '0.08em',
                padding: '10px 16px',
                outline: 'none',
                display: 'block',
              }}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
            />
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu — fixed overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[997] flex flex-col overflow-y-auto"
          style={{
            background: 'oklch(0.04 0.008 285 / 98%)',
            backdropFilter: 'blur(20px)',
            padding: '120px 24px 40px',
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => { setLocation(link.path); setMobileOpen(false); }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '22px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: currentPage === link.id ? 'oklch(0.72 0.09 75)' : 'oklch(0.93 0.02 80)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid oklch(1 0 0 / 6%)',
                cursor: 'pointer',
                padding: '20px 0',
                textAlign: 'left',
                width: '100%',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setLocation('/apply'); setMobileOpen(false); }}
            style={{
              marginTop: '32px',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              background: 'oklch(0.72 0.09 75)',
              color: 'oklch(0.04 0.008 285)',
              border: 'none',
              padding: '18px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Join the Coven
          </button>
        </div>
      )}
    </>
  );
}
