import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Plus, Users, Lock, Unlock, Globe, Info } from "lucide-react";
import { toast } from "sonner";

export default function Covens() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoven, setNewCoven] = useState({
    name: "",
    slug: "",
    description: "",
    tierId: "",
  });

  const isCreatorOrAdmin = user?.role === "creator" || user?.role === "admin";

  // Queries
  const { data: covensList = [], isLoading, refetch } = trpc.coven.list.useQuery();
  const { data: myTiers = [] } = trpc.creator.myTiers.useQuery(undefined, {
    enabled: isCreatorOrAdmin,
  });

  // Mutations
  const createCovenMutation = trpc.coven.create.useMutation({
    onSuccess: (coven) => {
      toast.success("Coven created successfully!");
      setShowCreateModal(false);
      setNewCoven({ name: "", slug: "", description: "", tierId: "" });
      refetch();
      setLocation(`/coven/${coven.slug}`);
    },
    onError: (err) => {
      toast.error(`Error creating coven: ${err.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoven.name.trim() || !newCoven.slug.trim()) {
      toast.error("Name and handle slug are required.");
      return;
    }
    createCovenMutation.mutate({
      name: newCoven.name,
      slug: newCoven.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: newCoven.description || undefined,
      tierId: newCoven.tierId ? parseInt(newCoven.tierId) : undefined,
    });
  };

  return (
    <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", padding: "80px 20px 120px", color: "oklch(0.93 0.02 80)" }}>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", borderBottom: "1px solid oklch(0.72 0.09 75 / 15%)", paddingBottom: "24px", marginBottom: "40px" }}>
          <div>
            <span className="tag-label" style={{ background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.72 0.09 75)" }}>Dark Forums</span>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 900, color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", margin: "12px 0 8px 0" }}>
              The Covens
            </h1>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "16px", color: "oklch(0.55 0.03 60)", margin: 0 }}>
              Gather with other creatures of the night. Share ideas, join discussions, or support exclusive coven circles.
            </p>
          </div>
          {isCreatorOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.38 0.14 20)", color: "white", border: "none", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.45 0.16 20)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "oklch(0.38 0.14 20)")}
            >
              <Plus size={14} /> Establish Coven
            </button>
          )}
        </div>

        {/* Explorer Grid */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
            <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "oklch(0.72 0.09 75)" }} />
          </div>
        ) : covensList.length === 0 ? (
          <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 15%)", padding: "60px 20px", textAlign: "center", borderRadius: "8px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔮</div>
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", color: "oklch(0.82 0.03 75)", marginBottom: "8px" }}>No Covens Found</h3>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", color: "oklch(0.45 0.02 60)", maxWidth: "480px", margin: "0 auto" }}>
              No covens have been established in the directory yet. Creators can spawn new coven rooms to house their circle's discussions.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {covensList.map((coven) => (
              <div
                key={coven.id}
                onClick={() => setLocation(`/coven/${coven.slug}`)}
                style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 10%)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", transition: "all 0.2s", transform: "translateY(0)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "1px solid oklch(0.72 0.09 75 / 40%)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid oklch(0.72 0.09 75 / 10%)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Banner */}
                <div style={{ height: "100px", background: coven.coverUrl ? `url(${coven.coverUrl}) center/cover` : "oklch(0.08 0.02 330)", borderBottom: "1px solid oklch(1 0 0 / 6%)", position: "relative" }}>
                  <div style={{ position: "absolute", bottom: "-20px", left: "20px", width: "48px", height: "48px", borderRadius: "8px", background: coven.avatarUrl ? `url(${coven.avatarUrl}) center/cover` : "oklch(0.12 0.04 20)", border: "2px solid oklch(0.06 0.01 285)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    {!coven.avatarUrl && "🔮"}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "32px 20px 20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "oklch(0.93 0.02 80)", margin: 0 }}>
                      {coven.name}
                    </h3>
                    {coven.tierId ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontFamily: "'Cinzel', serif", color: "oklch(0.75 0.14 20)", background: "oklch(0.75 0.14 20 / 10%)", padding: "2px 8px", borderRadius: "12px", border: "1px solid oklch(0.75 0.14 20 / 20%)" }}>
                        <Lock size={8} /> EXCLUSIVE
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontFamily: "'Cinzel', serif", color: "oklch(0.45 0.02 60)", background: "oklch(0.45 0.02 60 / 10%)", padding: "2px 8px", borderRadius: "12px" }}>
                        <Globe size={8} /> PUBLIC
                      </span>
                    )}
                  </div>

                  {coven.creatorAlias && (
                    <div style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>Hosted by</span>
                      <span style={{ color: "oklch(0.72 0.09 75)" }}>{coven.creatorAlias}</span>
                    </div>
                  )}

                  <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", lineHeight: 1.5, margin: "0 0 16px 0", height: "40px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {coven.description || "A mysterious gathering circle in the depths of OnlyFangs..."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid oklch(1 0 0 / 6%)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>
                      <Users size={12} />
                      <span>Enter Coven</span>
                    </div>
                    {coven.tierId && (
                      <span style={{ fontSize: "10px", color: "oklch(0.55 0.03 60)" }}>
                        {coven.tierName} (${coven.tierPrice}/mo)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "oklch(0.02 0.005 285 / 85%)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 30%)", width: "100%", maxWidth: "500px", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)" }} />
            <div style={{ padding: "24px 30px" }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "20px", color: "oklch(0.93 0.02 80)", margin: "0 0 8px 0" }}>Establish a New Coven</h2>
              <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.45 0.02 60)", margin: "0 0 24px 0" }}>
                Create a dedicated discussion forum for your followers. Link it to a tier to reward premium subscribers.
              </p>

              <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Coven Name *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    required
                    placeholder="e.g. Vampires of London"
                    value={newCoven.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
                      setNewCoven({ ...newCoven, name, slug });
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Handle / URL Slug *
                  </label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)", marginRight: "6px" }}>onlyfangs.com/coven/</span>
                    <input
                      className="input-dark"
                      type="text"
                      required
                      placeholder="vampires-london"
                      value={newCoven.slug}
                      onChange={(e) => setNewCoven({ ...newCoven, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Description
                  </label>
                  <textarea
                    className="input-dark"
                    rows={3}
                    placeholder="Brief coven vision or description..."
                    value={newCoven.description}
                    onChange={(e) => setNewCoven({ ...newCoven, description: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Access Level (Tier Gated)
                  </label>
                  <select
                    className="input-dark"
                    value={newCoven.tierId}
                    onChange={(e) => setNewCoven({ ...newCoven, tierId: e.target.value })}
                    style={{ background: "oklch(0.085 0.015 330)" }}
                  >
                    <option value="">Public (Free to join for all patrons)</option>
                    {myTiers.map((tier) => (
                      <option key={tier.id} value={tier.id.toString()}>
                        {tier.name} - ${tier.price}/mo
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "oklch(0.55 0.03 60)", border: "1px solid oklch(0.55 0.03 60 / 30%)", padding: "10px 20px", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCovenMutation.isPending}
                    style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.72 0.09 75)", color: "oklch(0.04 0.008 285)", border: "none", padding: "10px 24px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {createCovenMutation.isPending && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />}
                    Establish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
