// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Navbar Component
// Victorian Occult Luxury · Fully responsive · Auth-aware
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, Menu, X, LogOut, User, ChevronDown, Bell, LayoutDashboard, Settings, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { NotificationBell } from './NotificationBell';

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const moderationStats = trpc.moderation.getStats.useQuery(undefined, {
    enabled: user?.role === 'admin',
    refetchInterval: 60000,
  });
  const pendingModerationCount = (moderationStats.data?.pending ?? 0);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      setLocation('/');
      setUserMenuOpen(false);
    },
  });

  const utils = trpc.useUtils();
  const { data: dbUsers = [] } = trpc.auth.listUsers.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const devLoginMutation = trpc.auth.devLogin.useMutation();

  const handleDevLogin = async (userId: number) => {
    try {
      await devLoginMutation.mutateAsync({ userId });
      toast.success("Switched account successfully");
      await utils.auth.me.invalidate();
      setUserMenuOpen(false);
      setLocation('/profile');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to switch account");
    }
  };

  const switchableUsers = dbUsers.filter(u => u.id !== user?.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'discover', label: 'Discover', path: '/discover' },
    { id: 'plans', label: 'Plans', path: '/#pricing' },
  ];

  const currentPage = location.replace('/', '') || 'home';
  const navBg = scrolled ? 'oklch(0.04 0.008 285 / 98%)' : 'oklch(0.04 0.008 285 / 95%)';
  const navBorder = scrolled ? 'oklch(0.72 0.09 75 / 20%)' : 'oklch(0.72 0.09 75 / 10%)';

  // Avatar: use user's name initials or image
  const avatarLetter = (user?.displayName || user?.name || 'P').charAt(0).toUpperCase();
  const avatarUrl = user?.avatarUrl;
  const displayName = user?.displayName || user?.name || 'Patron';

  return (
    <>
      {/* Sticky wrapper — nav */}
      <div className="sticky top-0 z-[1000] w-full">
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

            {isAuthenticated ? (
              <>
                {/* Notifications — desktop only */}
                <div className="hidden md:flex items-center">
                  <NotificationBell />
                </div>

                {/* User Avatar + Dropdown — desktop */}
                <div ref={userMenuRef} className="hidden md:block" style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: '1px solid oklch(0.72 0.09 75 / 25%)',
                      cursor: 'pointer',
                      padding: '5px 10px 5px 5px',
                      transition: 'border-color 0.25s',
                      borderRadius: '2px',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.72 0.09 75 / 60%)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.72 0.09 75 / 25%)'; }}
                  >
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'oklch(0.28 0.1 20)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Cinzel', serif",
                          fontSize: '12px',
                          color: 'oklch(0.93 0.02 80)',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {avatarLetter}
                      </div>
                    )}
                    <span
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                        color: 'oklch(0.82 0.03 75)',
                        maxWidth: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayName}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{
                        color: 'oklch(0.55 0.03 60)',
                        transition: 'transform 0.2s',
                        transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '180px',
                        background: 'oklch(0.085 0.015 330)',
                        border: '1px solid oklch(0.72 0.09 75 / 20%)',
                        boxShadow: '0 8px 32px oklch(0 0 0 / 60%)',
                        zIndex: 999,
                        overflow: 'hidden',
                      }}
                    >
                      {/* User info header */}
                      <div
                        style={{
                          padding: '14px 16px',
                          borderBottom: '1px solid oklch(1 0 0 / 8%)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Cinzel', serif",
                            fontSize: '11px',
                            color: 'oklch(0.93 0.02 80)',
                            letterSpacing: '0.06em',
                            marginBottom: '2px',
                          }}
                        >
                          {displayName}
                        </div>
                        <div
                          style={{
                            fontFamily: "'IM Fell English', serif",
                            fontStyle: 'italic',
                            fontSize: '11px',
                            color: 'oklch(0.45 0.02 60)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {user?.role || 'Patron'}
                        </div>
                      </div>

                      {/* Menu items */}
                      {[
                        { icon: <User size={13} />, label: 'My Profile', action: () => setLocation('/profile') },
                        ...(user?.role === 'creator' || user?.role === 'admin' ? [
                          { icon: <LayoutDashboard size={13} />, label: 'Creator Dashboard', action: () => setLocation('/creator-dashboard') },
                          { icon: <Settings size={13} />, label: 'Creator Admin', action: () => setLocation('/creator-admin') },
                        ] : []),
                        ...(user?.role === 'admin' ? [
                          {
                            icon: <ShieldAlert size={13} />,
                            label: pendingModerationCount > 0 ? `Moderation (${pendingModerationCount})` : 'Moderation',
                            action: () => setLocation('/moderation'),
                          },
                        ] : []),
                        { icon: <Bell size={13} />, label: 'Notifications', action: () => setLocation('/notifications') },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => { item.action(); setUserMenuOpen(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '11px 16px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            fontSize: '9px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'oklch(0.75 0.03 75)',
                            textAlign: 'left',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75 / 8%)';
                            (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'none';
                            (e.currentTarget as HTMLElement).style.color = 'oklch(0.75 0.03 75)';
                          }}
                        >
                          <span style={{ color: 'oklch(0.55 0.03 60)' }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}

                      {/* Account Switcher Section */}
                      {switchableUsers.length > 0 && (
                        <>
                          <div style={{ height: '1px', background: 'oklch(1 0 0 / 6%)', margin: '4px 0' }} />
                          <div style={{ padding: '8px 16px 4px', fontFamily: "'Cinzel', serif", fontSize: '7px', letterSpacing: '0.2em', color: 'oklch(0.45 0.02 60)', textTransform: 'uppercase' }}>
                            Switch Account
                          </div>
                          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {switchableUsers.map(u => (
                              <button
                                key={u.id}
                                onClick={() => handleDevLogin(u.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  padding: '8px 16px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75 / 6%)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                              >
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.displayName || u.name || ""} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'oklch(0.25 0.08 20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '9px', color: 'oklch(0.93 0.02 80)', fontWeight: 700 }}>
                                    {(u.displayName || u.name || 'P').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', color: 'oklch(0.82 0.03 75)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {u.displayName || u.name}
                                  </div>
                                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '8px', color: 'oklch(0.45 0.02 60)', textTransform: 'capitalize' }}>
                                    {u.role}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Divider */}
                      <div style={{ height: '1px', background: 'oklch(1 0 0 / 6%)', margin: '4px 0' }} />

                      {/* Logout */}
                      <button
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '11px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: "'Cinzel', serif",
                          fontSize: '9px',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'oklch(0.55 0.04 20)',
                          textAlign: 'left',
                          transition: 'background 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'oklch(0.38 0.14 20 / 10%)';
                          (e.currentTarget as HTMLElement).style.color = 'oklch(0.65 0.1 20)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'none';
                          (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.04 20)';
                        }}
                      >
                        <LogOut size={13} />
                        {logoutMutation.isPending ? 'Leaving...' : 'Log Out'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sign Up CTA — desktop only, when NOT logged in */}
                <a
                  href={getLoginUrl('/complete-signup')}
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
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.82 0.1 78)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75)'; }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  Sign Up
                </a>
              </>
            )}

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
          {/* User info in mobile drawer */}
          {isAuthenticated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '0 0 24px',
                marginBottom: '8px',
                borderBottom: '1px solid oklch(1 0 0 / 8%)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid oklch(0.72 0.09 75 / 30%)' }}
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
                    fontSize: '18px',
                    color: 'oklch(0.93 0.02 80)',
                    fontWeight: 700,
                    flexShrink: 0,
                    border: '1px solid oklch(0.72 0.09 75 / 30%)',
                  }}
                >
                  {avatarLetter}
                </div>
              )}
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.06em' }}>
                  {displayName}
                </div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '12px', color: 'oklch(0.45 0.02 60)', marginTop: '2px' }}>
                  Patron
                </div>
              </div>
            </div>
          )}

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

          {isAuthenticated ? (
            <>
              <button
                onClick={() => { setLocation('/profile'); setMobileOpen(false); }}
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '22px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: currentPage === 'profile' ? 'oklch(0.72 0.09 75)' : 'oklch(0.93 0.02 80)',
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
                My Profile
              </button>
               {(user?.role === 'creator' || user?.role === 'admin') && (
                <>
                  <button
                    onClick={() => { setLocation('/creator-dashboard'); setMobileOpen(false); }}
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '22px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'oklch(0.93 0.02 80)',
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
                    Creator Dashboard
                  </button>
                  <button
                    onClick={() => { setLocation('/creator-admin'); setMobileOpen(false); }}
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '22px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'oklch(0.93 0.02 80)',
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
                    Creator Admin
                  </button>
                </>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={() => { setLocation('/moderation'); setMobileOpen(false); }}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '22px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'oklch(0.93 0.02 80)',
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
                  {pendingModerationCount > 0 ? `Moderation (${pendingModerationCount})` : 'Moderation'}
                </button>
              )}
              <button
                onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                style={{
                  marginTop: '32px',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  background: 'oklch(0.38 0.14 20 / 20%)',
                  color: 'oklch(0.65 0.1 20)',
                  border: '1px solid oklch(0.38 0.14 20 / 40%)',
                  padding: '18px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <a
              href={getLoginUrl('/complete-signup')}
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
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
              }}
            >
              Sign Up
            </a>
          )}
        </div>
      )}
    </>
  );
}
