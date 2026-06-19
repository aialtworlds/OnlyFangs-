// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Patron Dashboard
// Victorian Occult Luxury · Dark Creator Platform
// ═══════════════════════════════════════════════════════════

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Crown, Bookmark, Heart, Shield, Bell,
  ChevronRight, Image, Play, BookOpen, Lock,
  Settings, CreditCard, History, Compass,
  MessageCircle, Menu, X, User, LayoutDashboard, Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

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

function StatCard({ icon: Icon, title, value, subtitle }: {
  icon: React.ElementType; title: string; value: string | number; subtitle: string;
}) {
  return (
    <div style={{
      background: "oklch(0.085 0.015 330)", border: "1px solid oklch(1 0 0 / 8%)",
      borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        border: "1px solid oklch(0.38 0.14 20 / 40%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "oklch(0.75 0.14 20)",
      }}>
        <Icon size={20} />
      </div>
      <div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 700, color: "oklch(0.93 0.02 80)", marginBottom: "2px" }}>
          {value === 0 || value === "0" ? "—" : value}
        </div>
        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.45 0.02 60)" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const s = {
    width: "36px", height: "36px", borderRadius: "8px", display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
    background: "oklch(0.1 0.025 330)", border: "1px solid oklch(0.38 0.14 20 / 25%)",
    color: "oklch(0.75 0.14 20)",
  };
  if (type === "new_photo" || type === "new_post") return <div style={s}><Image size={16} /></div>;
  if (type === "new_music") return <div style={s}><Play size={16} /></div>;
  if (type === "new_book") return <div style={s}><BookOpen size={16} /></div>;
  if (type === "unlocked_post") return <div style={s}><Lock size={16} /></div>;
  return <div style={s}><Bell size={16} /></div>;
}

function timeAgo(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PatronDashboard() {
  const [, navigate] = useLocation();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: stats, isLoading: statsLoading } = trpc.patron.stats.useQuery();
  const { data: subscriptions, isLoading: subsLoading } = trpc.patron.subscriptions.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.patron.activity.useQuery();
  const { data: unread } = trpc.patron.unreadCounts.useQuery();
  const { data: discoverCreators } = trpc.patron.discoverCreators.useQuery({ limit: 3 });

  const displayName = user.name || "Nightwalker";

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "subscriptions", icon: Crown, label: "Subscriptions" },
    { id: "discover", icon: Compass, label: "Discover" },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unread?.messages },
    { id: "notifications", icon: Bell, label: "Notifications", badge: unread?.notifications },
    { id: "wishlist", icon: Heart, label: "Wishlist" },
    { id: "history", icon: History, label: "History" },
    { id: "payment", icon: CreditCard, label: "Payment Methods" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleNav = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    if (id === "discover") navigate("/");
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid oklch(1 0 0 / 6%)", cursor: "pointer" }} onClick={() => navigate("/")}>
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
      <div style={{ margin: "0 12px 12px", background: "oklch(0.08 0.02 330)", border: "1px solid oklch(0.38 0.14 20 / 20%)", borderRadius: "8px", padding: "16px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.3em", color: "oklch(0.75 0.14 20)", textTransform: "uppercase", marginBottom: "8px" }}>
          Welcome to the Night
        </div>
        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.5 0.02 60)", lineHeight: 1.6, marginBottom: "12px" }}>
          Support dark creators. Unlock exclusive content.
        </p>
        <button onClick={() => navigate("/")} style={{
          width: "100%", padding: "8px", border: "1px solid oklch(0.38 0.14 20 / 60%)",
          background: "transparent", color: "oklch(0.75 0.14 20)", fontFamily: "'Cinzel', serif",
          fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
          borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          Explore Creators <ChevronRight size={12} />
        </button>
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid oklch(1 0 0 / 6%)", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "oklch(0.15 0.03 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          <User size={16} style={{ color: "oklch(0.55 0.03 60)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", color: "oklch(0.82 0.03 75)", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          <button onClick={logout} style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", color: "oklch(0.38 0.14 20)", letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "oklch(0.04 0.008 285)", display: "flex", fontFamily: "'Cinzel', serif" }}>

      {/* Desktop Sidebar */}
      <div className="pdb-sidebar" style={{ width: "240px", flexShrink: 0, background: "oklch(0.055 0.012 330)", borderRight: "1px solid oklch(1 0 0 / 6%)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <SidebarContent />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "oklch(0.04 0.008 285 / 90%)", backdropFilter: "blur(8px)" }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{ width: "280px", height: "100%", background: "oklch(0.055 0.012 330)", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>

        {/* Mobile Header */}
        <div className="pdb-mobile-header" style={{ padding: "14px 16px", borderBottom: "1px solid oklch(1 0 0 / 6%)", display: "none", alignItems: "center", justifyContent: "space-between", background: "oklch(0.055 0.012 330)" }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer" }}>
            <Menu size={20} />
          </button>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", letterSpacing: "0.1em", color: "oklch(0.93 0.02 80)" }}>
            ONLY <span style={{ color: "oklch(0.75 0.14 20)" }}>FANGS</span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", color: "oklch(0.55 0.03 60)", cursor: "pointer", position: "relative" }}>
              <Bell size={18} />
              {unread && unread.notifications > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "oklch(0.38 0.14 20)", color: "white", fontSize: "9px", borderRadius: "999px", padding: "1px 4px" }}>{unread.notifications}</span>
              )}
            </button>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "oklch(0.15 0.03 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={14} style={{ color: "oklch(0.55 0.03 60)" }} />
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{ position: "relative", height: "180px", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, oklch(0.1 0.05 20) 0%, oklch(0.05 0.01 285) 60%, oklch(0.14 0.07 20) 100%)" }} />
          <div style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", width: "140px", height: "140px", borderRadius: "50%", background: "radial-gradient(circle, oklch(0.38 0.14 20 / 35%) 0%, transparent 70%)", boxShadow: "0 0 80px oklch(0.38 0.14 20 / 25%)" }} />
          <div style={{ position: "absolute", inset: 0, padding: "32px" }}>
            <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", marginBottom: "6px" }}>Welcome back,</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 700, color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", marginBottom: "6px", display: "flex", alignItems: "center", gap: "12px" }}>
              {displayName} <span style={{ fontSize: "20px" }}>🦇</span>
            </div>
            <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.45 0.02 60)" }}>
              Your obsession. Your eternal access.
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <StatCard icon={Crown} title="Active Subscriptions" value={statsLoading ? "..." : stats?.activeSubscriptions ?? 0} subtitle="Your current memberships" />
            <StatCard icon={Bookmark} title="Saved Content" value={statsLoading ? "..." : stats?.savedContentCount ?? 0} subtitle="Your favorite posts & media" />
            <StatCard icon={Users} title="Following Creators" value={statsLoading ? "..." : stats?.followingCreators ?? 0} subtitle="The creators you follow" />
            <StatCard icon={Shield} title="Loyalty Status" value={statsLoading ? "..." : stats?.loyaltyPoints ?? 0} subtitle="Your loyalty benefits" />
          </div>

          {/* Two-column layout on desktop */}
          <div className="pdb-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>

            {/* Subscriptions */}
            <div style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em" }}>Your Subscriptions</span>
                <button style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "oklch(0.75 0.14 20)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  View all <ChevronRight size={12} />
                </button>
              </div>
              {subsLoading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "oklch(0.35 0.02 60)", fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>Loading...</div>
              ) : !subscriptions || subscriptions.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>🦇</div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: "12px", color: "oklch(0.55 0.03 60)", marginBottom: "6px" }}>No active subscriptions</div>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.35 0.02 60)", marginBottom: "14px" }}>Discover creators and support the darkness</div>
                  <button onClick={() => navigate("/")} style={{ padding: "8px 20px", background: "oklch(0.38 0.14 20)", border: "none", color: "white", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px" }}>
                    Explore Creators
                  </button>
                </div>
              ) : (
                <div>
                  {subscriptions.map((sub: any) => (
                    <div key={sub.subId} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid oklch(1 0 0 / 4%)", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "oklch(1 0 0 / 3%)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "oklch(0.1 0.025 330)", border: "1px solid oklch(0.38 0.14 20 / 30%)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sub.creatorAvatarUrl ? <img src={sub.creatorAvatarUrl} alt={sub.creatorAlias} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} style={{ color: "oklch(0.35 0.02 60)" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em" }}>{sub.creatorAlias}</span>
                          {sub.creatorVerified && <span style={{ color: "oklch(0.75 0.14 20)", fontSize: "12px" }}>✓</span>}
                        </div>
                        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.45 0.02 60)" }}>{sub.creatorCategory || "Creator"}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {sub.renewsAt && (
                          <>
                            <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>Renews on</div>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", color: "oklch(0.65 0.02 60)" }}>
                              {new Date(sub.renewsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </>
                        )}
                      </div>
                      <ChevronRight size={14} style={{ color: "oklch(0.35 0.02 60)", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em" }}>Recent Activity</span>
                <button style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "oklch(0.75 0.14 20)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  View all <ChevronRight size={12} />
                </button>
              </div>
              {activityLoading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "oklch(0.35 0.02 60)", fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>Loading...</div>
              ) : !activity || activity.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.35 0.02 60)" }}>
                    No recent activity. Subscribe to creators to see their updates here.
                  </div>
                </div>
              ) : (
                <div>
                  {activity.map((item: any) => (
                    <div key={item.id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid oklch(1 0 0 / 4%)" }}>
                      <ActivityIcon type={item.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "12px", color: "oklch(0.82 0.03 75)", letterSpacing: "0.04em", marginBottom: "2px" }}>{item.creatorAlias || "Creator"}</div>
                        <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "12px", color: "oklch(0.45 0.02 60)" }}>{item.message || item.type.replace(/_/g, " ")}</div>
                      </div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "11px", color: "oklch(0.35 0.02 60)", flexShrink: 0 }}>{timeAgo(item.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Continue Exploring */}
            {discoverCreators && discoverCreators.length > 0 && (
              <div style={{ background: "oklch(0.07 0.012 330)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.06em" }}>Continue Exploring</span>
                  <button onClick={() => navigate("/")} style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "oklch(0.75 0.14 20)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {discoverCreators.map((creator: any) => (
                    <div key={creator.id} style={{ textAlign: "center", cursor: "pointer" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "8px", background: "oklch(0.1 0.025 330)", border: "1px solid oklch(0.38 0.14 20 / 20%)", overflow: "hidden", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.alias} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={24} style={{ color: "oklch(0.35 0.02 60)" }} />}
                      </div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", color: "oklch(0.82 0.03 75)", letterSpacing: "0.04em", marginBottom: "2px" }}>{creator.alias}</div>
                      <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "10px", color: "oklch(0.4 0.02 60)" }}>{creator.category || "Creator"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Banner */}
            <div style={{ background: "linear-gradient(135deg, oklch(0.1 0.04 20) 0%, oklch(0.07 0.012 330) 100%)", border: "1px solid oklch(0.38 0.14 20 / 20%)", borderRadius: "8px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ width: "48px", height: "48px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>🦇</div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", marginBottom: "4px" }}>Thank you for supporting the night.</div>
                <div style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.45 0.02 60)" }}>Your support keeps the darkness alive.</div>
              </div>
              <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "transparent", border: "1px solid oklch(0.75 0.14 20)", color: "oklch(0.75 0.14 20)", fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                Browse More Creators <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="pdb-bottom-nav" style={{ borderTop: "1px solid oklch(1 0 0 / 8%)", background: "oklch(0.055 0.012 330)", padding: "8px 0 12px", display: "none", justifyContent: "space-around" }}>
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "subscriptions", icon: Crown, label: "Subscriptions" },
            { id: "discover", icon: Compass, label: "Discover" },
            { id: "messages", icon: MessageCircle, label: "Messages", badge: unread?.messages },
            { id: "notifications", icon: Bell, label: "Notifications", badge: unread?.notifications },
            { id: "wishlist", icon: Heart, label: "Wishlist" },
            { id: "more", icon: Menu, label: "More" },
          ].map((item) => (
            <button key={item.id}
              onClick={() => item.id === "more" ? setMobileMenuOpen(true) : handleNav(item.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", color: activeNav === item.id ? "oklch(0.75 0.14 20)" : "oklch(0.45 0.02 60)", padding: "4px 8px", position: "relative" }}>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{ position: "absolute", top: "0", right: "4px", background: "oklch(0.38 0.14 20)", color: "white", fontSize: "8px", borderRadius: "999px", padding: "1px 4px" }}>{item.badge}</span>
              )}
              <item.icon size={18} />
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "0.05em" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pdb-sidebar { display: none !important; }
          .pdb-mobile-header { display: flex !important; }
          .pdb-bottom-nav { display: flex !important; }
        }
        @media (min-width: 900px) {
          .pdb-main-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
