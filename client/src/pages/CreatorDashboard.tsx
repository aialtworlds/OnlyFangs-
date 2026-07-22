// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Creator Dashboard
// Victorian Occult Luxury · Dark Creator Platform
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Crown, Bell, ChevronRight, Settings, CreditCard,
  MessageCircle, Menu, X, User, LayoutDashboard, Users,
  BookOpen, Image, Music, Camera, Plus, Share2, Edit,
  MapPin, Instagram, Twitter, Link, BarChart2, Moon
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ── Nav Item ─────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, badge, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
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
        <span style={{ marginLeft: "auto", background: "oklch(0.38 0.14 20)", color: "white", fontSize: "10px", fontFamily: "sans-serif", borderRadius: "999px", padding: "1px 7px", minWidth: "18px", textAlign: "center" }}>{badge}</span>
      )}
      {label === "Payments" && (
        <span style={{ marginLeft: "auto", fontFamily: "'Cinzel', serif", fontSize: "7px", letterSpacing: "0.2em", color: "oklch(0.55 0.03 60)", background: "oklch(0.1 0.025 330)", padding: "2px 6px", borderRadius: "2px" }}>SOON</span>
      )}
    </button>
  );
}

// ── Stat Badge ───────────────────────────────────────────────
function StatBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Icon size={18} style={{ color: "oklch(0.55 0.03 60)" }} />
      <div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: 700, color: "oklch(0.93 0.02 80)" }}>
          {value}
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", color: "oklch(0.45 0.02 60)", textTransform: "uppercase" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Tag ──────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "0.2em",
      textTransform: "uppercase", padding: "4px 10px",
      border: "1px solid oklch(0.38 0.14 20 / 40%)",
      color: "oklch(0.65 0.03 60)", borderRadius: "2px",
    }}>{label}</span>
  );
}

// ── Content Type Icon ────────────────────────────────────────
function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    image: Image, photo: Camera, music: Music, book: BookOpen,
  };
  const Icon = icons[type] || Image;
  return <Icon size={14} />;
}

// ── Tab ──────────────────────────────────────────────────────
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.15em",
      textTransform: "uppercase", padding: "12px 16px",
      background: "none", border: "none", cursor: "pointer",
      color: active ? "oklch(0.75 0.14 20)" : "oklch(0.45 0.02 60)",
      borderBottom: active ? "2px solid oklch(0.75 0.14 20)" : "2px solid transparent",
      transition: "all 0.2s", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

export default function CreatorDashboard() {
  const [, navigate] = useLocation();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("releases");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: profile, isLoading: profileLoading } = trpc.creator.myProfile.useQuery();
  const { data: releases, isLoading: releasesLoading } = trpc.creator.releases.useQuery();
  const { data: tiers } = trpc.creator.tiers.useQuery();
  const { data: unread } = trpc.patron.unreadCounts.useQuery();

  // Show loading while profile query is in flight
  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'oklch(0.04 0.008 285)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '2px solid oklch(0.75 0.14 20 / 30%)', borderTop: '2px solid oklch(0.75 0.14 20)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '14px', color: 'oklch(0.45 0.02 60)' }}>Summoning your dashboard...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // If user has no creator profile yet, show onboarding prompt
  if (!profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'oklch(0.04 0.008 285)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '460px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '1px solid oklch(0.38 0.14 20 / 30%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '42px', background: 'oklch(0.07 0.012 330)' }}>🦇</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '24px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Create Your Creator Profile
          </h2>
          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '15px', color: 'oklch(0.55 0.03 60)', lineHeight: 1.7, marginBottom: '32px' }}>
            You need a creator profile before you can access your dashboard. Choose your artist name, set up your page, and start sharing your darkness with the world.
          </p>
          <button
            onClick={() => navigate('/apply')}
            style={{
              padding: '14px 32px',
              background: 'oklch(0.38 0.14 20)',
              border: 'none',
              color: 'white',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'oklch(0.48 0.16 20)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'oklch(0.38 0.14 20)'}
          >
            <Plus size={16} /> Become a Creator
          </button>
        </div>
      </div>
    );
  }


  const displayName = profile.alias || user.name || "Creator";
  const handle = profile.handle ? `@${profile.handle}` : "";
  const tags = (profile.tags as string[] | null)?.length
    ? (profile.tags as string[]).map(t => t.toUpperCase())
    : ["CREATOR"];

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "releases", icon: Moon, label: "Nocturnal Releases" },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unread?.messages },
    { id: "audience", icon: Users, label: "Audience" },
    { id: "insights", icon: BarChart2, label: "Insights" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "resources", icon: BookOpen, label: "Creator Resources" },
  ];

  const handleNav = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    // Some sidebar items already have a real, dedicated page elsewhere in
    // the app — send the user there instead of just highlighting the icon
    // with no visible change (the rest stay as in-page tabs for now).
    if (id === "messages") {
      navigate("/messages");
    } else if (id === "settings") {
      navigate("/creator-admin");
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid oklch(1 0 0 / 6%)", cursor: "pointer" }} onClick={() => navigate("/")}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", letterSpacing: "0.12em", color: "oklch(0.93 0.02 80)" }}>
          ONLY <span style={{ color: "oklch(0.75 0.14 20)", fontWeight: 900 }}>FANGS</span>
        </div>
      </div>

      {/* Create Button */}
      <div style={{ padding: "16px 12px 8px" }}>
        <button
          onClick={() => navigate("/creator-admin")}
          style={{
          width: "100%", padding: "12px", background: "oklch(0.38 0.14 20)",
          border: "none", color: "white", fontFamily: "'Cinzel', serif",
          fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
          cursor: "pointer", borderRadius: "6px", display: "flex",
          alignItems: "center", justifyContent: "center", gap: "8px",
          transition: "background 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "oklch(0.45 0.16 20)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "oklch(0.38 0.14 20)"}
        >
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: "8px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map((item) => (
          <NavItem key={item.id} icon={item.icon} label={item.label}
            active={activeNav === item.id} badge={item.badge} onClick={() => handleNav(item.id)} />
        ))}
      </nav>

      {/* Founding Circle */}
      <div style={{ margin: "0 12px 12px", background: "oklch(0.08 0.02 330)", border: "1px solid oklch(0.38 0.14 20 / 20%)", borderRadius: "8px", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "oklch(0.12 0.04 20)", border: "1px solid oklch(0.38 0.14 20 / 30%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🦇</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.25em", color: "oklch(0.75 0.14 20)", textTransform: "uppercase" }}>Founding Circle</div>
        </div>
        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.5 0.02 60)", lineHeight: 1.6, marginBottom: "12px" }}>
          Thank you for being part of the founding circle. You're helping shape the future of Only Fangs.
        </p>
        <button style={{ width: "100%", padding: "8px", border: "1px solid oklch(0.38 0.14 20 / 40%)", background: "transparent", color: "oklch(0.65 0.03 60)", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px" }}>
          Submit Feedback
        </button>
      </div>

      {/* User Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid oklch(1 0 0 / 6%)", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "oklch(0.15 0.03 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} style={{ color: "oklch(0.55 0.03 60)" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", color: "oklch(0.82 0.03 75)", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
          <button onClick={logout} style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "oklch(0.38 0.14 20)", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign Out</button>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.35 0.02 60)" }}>
          <Settings size={14} />
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.04 0.008 285)", display: "flex", fontFamily: "'Cinzel', serif" }}>

      {/* Desktop Sidebar */}
      <div className="cdb-sidebar" style={{ width: "240px", flexShrink: 0, background: "oklch(0.055 0.012 330)", borderRight: "1px solid oklch(1 0 0 / 6%)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <SidebarContent />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "oklch(0.04 0.008 285 / 90%)", backdropFilter: "blur(8px)" }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{ width: "280px", height: "100%", background: "oklch(0.055 0.012 330)", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>

        {/* Top Header (Desktop) */}
        <div className="cdb-top-header" style={{ padding: "12px 24px", borderBottom: "1px solid oklch(1 0 0 / 6%)", display: "flex", alignItems: "center", gap: "16px", background: "oklch(0.055 0.012 330)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: "6px", padding: "8px 14px", maxWidth: "400px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "oklch(0.35 0.02 60)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.35 0.02 60)" }}>Search creators, tags, categories...</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}><Bell size={18} /></button>
            <button style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}><Moon size={18} /></button>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "oklch(0.15 0.03 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} style={{ color: "oklch(0.55 0.03 60)" }} />}
            </div>
            <ChevronRight size={14} style={{ color: "oklch(0.35 0.02 60)" }} />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="cdb-mobile-header" style={{ padding: "14px 16px", borderBottom: "1px solid oklch(1 0 0 / 6%)", display: "none", alignItems: "center", justifyContent: "space-between", background: "oklch(0.055 0.012 330)" }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}><Menu size={20} /></button>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", letterSpacing: "0.1em", color: "oklch(0.93 0.02 80)" }}>
            ONLY <span style={{ color: "oklch(0.75 0.14 20)" }}>FANGS</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}><Bell size={18} /></button>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "oklch(0.15 0.03 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={14} style={{ color: "oklch(0.55 0.03 60)" }} />
            </div>
          </div>
        </div>

        {/* Profile Cover */}
        <div style={{ position: "relative", height: "200px", overflow: "hidden", flexShrink: 0 }}>
          {profile?.coverUrl ? (
            <img src={profile.coverUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, oklch(0.08 0.03 20) 0%, oklch(0.04 0.008 285) 50%, oklch(0.06 0.02 300) 100%)", position: "relative", overflow: "hidden" }}>
              {[15, 35, 65, 80].map((pos, i) => (
                <div key={i} style={{ position: "absolute", bottom: "20px", left: `${pos}%`, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{ width: "2px", height: "8px", background: "oklch(0.75 0.14 20 / 80%)", borderRadius: "1px", boxShadow: "0 0 8px oklch(0.75 0.14 20 / 60%)" }} />
                  <div style={{ width: "6px", height: `${30 + i * 10}px`, background: "oklch(0.82 0.03 75 / 20%)", borderRadius: "2px" }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, oklch(0.04 0.008 285 / 60%) 100%)" }} />
          <button style={{ position: "absolute", top: "16px", right: "16px", padding: "8px 16px", background: "oklch(0.04 0.008 285 / 80%)", border: "1px solid oklch(1 0 0 / 20%)", backdropFilter: "blur(8px)", color: "oklch(0.93 0.02 80)", fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Edit size={12} /> Edit Profile
          </button>
          <button
            onClick={async () => {
              const profileUrl = `${window.location.origin}/creator/${profile?.handle || ''}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: profile?.alias || 'My Profile',
                    text: profile?.bio || 'Confira minha página no OnlyFangs!',
                    url: profileUrl,
                  });
                } catch (err) {
                  if ((err as Error).name !== 'AbortError') {
                    toast.error('Erro ao compartilhar');
                  }
                }
              } else {
                try {
                  await navigator.clipboard.writeText(profileUrl);
                  toast.success('Link do perfil copiado!');
                } catch {
                  toast.error('Erro ao copiar link');
                }
              }
            }}
            style={{ position: "absolute", top: "52px", right: "16px", padding: "8px", background: "oklch(0.04 0.008 285 / 80%)", border: "1px solid oklch(1 0 0 / 20%)", backdropFilter: "blur(8px)", color: "oklch(0.55 0.03 60)", cursor: "pointer", borderRadius: "4px" }}
            title="Compartilhar Perfil"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* Profile Info */}
        <div style={{ padding: "0 24px 0", position: "relative" }}>
          <div style={{ marginTop: "-50px", marginBottom: "16px" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "3px solid oklch(0.04 0.008 285)", overflow: "hidden", background: "oklch(0.1 0.025 330)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={40} style={{ color: "oklch(0.35 0.02 60)" }} />}
              </div>
              {profile?.verified && (
                <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "24px", height: "24px", borderRadius: "50%", background: "oklch(0.38 0.14 20)", border: "2px solid oklch(0.04 0.008 285)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>🦇</div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(20px, 3vw, 28px)", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", margin: 0 }}>
                {profileLoading ? "Loading..." : displayName}
              </h1>
              {profile?.verified && <span style={{ color: "oklch(0.75 0.14 20)", fontSize: "16px" }}>✓</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {handle && <span style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)" }}>{handle}</span>}
              {profile?.location && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)" }}>
                  <MapPin size={12} /> {profile.location}
                </span>
              )}
            </div>
          </div>

          {profile?.bio ? (
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.65 0.02 60)", lineHeight: 1.7, marginBottom: "12px", maxWidth: "600px" }}>
              {profile.bio}
            </p>
          ) : (
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.45 0.02 60)", lineHeight: 1.7, marginBottom: "12px" }}>
              Vampire. Storyteller. Keeper of ancient beauty and eternal night.<br />
              I create dark romantic content, gothic fashion &amp; vampire lifestyle.
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {tags.map((tag) => <Tag key={tag} label={tag} />)}
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "0.2em", color: "oklch(0.45 0.02 60)", padding: "4px 8px", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "2px" }}>+2</span>
          </div>

          <div style={{ display: "flex", gap: "32px", paddingBottom: "16px", borderBottom: "1px solid oklch(1 0 0 / 6%)", flexWrap: "wrap" }}>
            <StatBadge icon={Users} value={0} label="Followers" />
            <StatBadge icon={Crown} value={0} label="Patrons" />
            <StatBadge icon={BookOpen} value={releases?.length ?? 0} label="Releases" />
            <StatBadge icon={Bell} value={0} label="Renown" />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 24px", borderBottom: "1px solid oklch(1 0 0 / 6%)", display: "flex", gap: "0", overflowX: "auto" }}>
          {["releases", "about", "tiers", "gallery", "posts", "collections"].map((tab) => (
            <Tab key={tab} label={tab.toUpperCase()} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "24px", flex: 1 }}>
          <div style={{ display: "grid", gap: "20px" }} className="cdb-content-grid">

            {/* Main Content Area */}
            <div>
              {activeTab === "releases" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Moon size={16} style={{ color: "oklch(0.55 0.03 60)" }} />
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em" }}>Nocturnal Releases</span>
                    </div>
                    <button style={{ padding: "6px 14px", background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 10%)", color: "oklch(0.65 0.02 60)", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      Recent <ChevronRight size={10} />
                    </button>
                  </div>

                  {releasesLoading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "oklch(0.35 0.02 60)", fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>Loading...</div>
                  ) : !releases || releases.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center", background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px" }}>
                      <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "1px solid oklch(0.38 0.14 20 / 20%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "32px" }}>🦇</div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "oklch(0.82 0.03 75)", letterSpacing: "0.06em", marginBottom: "8px" }}>No releases yet</div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.45 0.02 60)", marginBottom: "24px" }}>Share your darkness with the world.</div>
                      <button style={{ padding: "12px 24px", background: "oklch(0.38 0.14 20)", border: "none", color: "white", fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={14} /> Create Your First Release
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                      {releases.map((release: any) => (
                        <div key={release.id} style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}>
                          <div style={{ height: "160px", background: "oklch(0.1 0.025 330)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {release.thumbnailUrl ? (
                              <img src={release.thumbnailUrl} alt={release.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <ContentTypeIcon type={release.type} />
                            )}
                            <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "oklch(0.04 0.008 285 / 80%)", padding: "3px 8px", borderRadius: "3px", display: "flex", alignItems: "center", gap: "4px", color: "oklch(0.75 0.14 20)", fontSize: "10px", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                              <ContentTypeIcon type={release.type} />
                              <span style={{ marginLeft: "4px" }}>{release.type.toUpperCase()}</span>
                            </div>
                          </div>
                          <div style={{ padding: "12px 14px" }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "12px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", marginBottom: "4px" }}>{release.title}</div>
                            {release.description && (
                              <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.45 0.02 60)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{release.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div style={{ background: "oklch(0.07 0.012 330)", border: "1px dashed oklch(0.38 0.14 20 / 30%)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", cursor: "pointer" }}>
                        <div style={{ textAlign: "center" }}>
                          <Plus size={24} style={{ color: "oklch(0.38 0.14 20)", margin: "0 auto 8px" }} />
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.15em", color: "oklch(0.45 0.02 60)" }}>NEW RELEASE</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tiers" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em" }}>Membership Tiers</span>
                    <button style={{ padding: "8px 16px", background: "oklch(0.38 0.14 20)", border: "none", color: "white", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Plus size={12} /> Add Tier
                    </button>
                  </div>
                  {!tiers || tiers.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px" }}>
                      <Crown size={32} style={{ color: "oklch(0.38 0.14 20 / 40%)", margin: "0 auto 12px" }} />
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.55 0.03 60)", marginBottom: "6px" }}>No tiers configured</div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.35 0.02 60)" }}>Create tiers to let patrons subscribe to your content</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                      {tiers.map((tier: any) => (
                        <div key={tier.id} style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(0.38 0.14 20 / 20%)", borderRadius: "8px", padding: "20px" }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em", marginBottom: "4px" }}>{tier.name}</div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "20px", fontWeight: 700, color: "oklch(0.75 0.14 20)", marginBottom: "8px" }}>
                            {parseFloat(tier.price) === 0 ? "Free" : `$${tier.price}`}
                          </div>
                          {tier.description && <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.45 0.02 60)" }}>{tier.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeTab === "about" || activeTab === "gallery" || activeTab === "posts" || activeTab === "collections") && (
                <div style={{ padding: "40px", textAlign: "center", background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>🦇</div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.55 0.03 60)", marginBottom: "6px" }}>
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming soon
                  </div>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.35 0.02 60)" }}>
                    This section is being prepared for the darkness
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="cdb-right-sidebar" style={{ flexDirection: "column", gap: "16px", display: "none" }}>
              <div style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", padding: "20px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em", marginBottom: "12px" }}>About the Creator</div>
                <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", lineHeight: 1.7, marginBottom: "16px" }}>
                  {profile?.bio || "I am drawn to beauty in darkness. Through my art and stories, I bring the gothic, the romantic, and the eternal night to life."}
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[Instagram, Twitter, Link].map((Icon, i) => (
                    <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(0.65 0.02 60)", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "oklch(0.75 0.14 20)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "oklch(0.65 0.02 60)"}>
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", padding: "20px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em", marginBottom: "8px" }}>Support the Darkness</div>
                <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", lineHeight: 1.7, marginBottom: "16px" }}>
                  Subscribe to unlock exclusive content and support this creator.
                </p>
                <button style={{ width: "100%", padding: "10px", background: "oklch(0.38 0.14 20)", border: "none", color: "white", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Crown size={12} /> View Tiers &amp; Benefits
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cdb-sidebar { display: none !important; }
          .cdb-top-header { display: none !important; }
          .cdb-mobile-header { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .cdb-content-grid { grid-template-columns: 1fr 280px !important; }
          .cdb-right-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
