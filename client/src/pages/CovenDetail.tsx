import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ArrowLeft, MessageSquare, Plus, Lock, Globe, Sparkles, LogOut, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CovenDetail() {
  const [, params] = useRoute("/coven/:slug");
  const slug = params?.slug || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  // Queries
  const { data: coven, isLoading: isCovenLoading, refetch: refetchCoven } = trpc.coven.bySlug.useQuery({ slug });
  const { data: posts = [], isLoading: isPostsLoading, refetch: refetchPosts } = trpc.coven.posts.useQuery(
    { covenId: coven?.id || 0 },
    { enabled: !!coven?.allowed }
  );

  // Mutations
  const joinMutation = trpc.coven.join.useMutation({
    onSuccess: () => {
      toast.success("Joined coven successfully!");
      refetchCoven();
    },
    onError: (err) => {
      toast.error(`Error joining: ${err.message}`);
    },
  });

  const leaveMutation = trpc.coven.leave.useMutation({
    onSuccess: () => {
      toast.success("Left coven.");
      refetchCoven();
    },
    onError: (err) => {
      toast.error(`Error leaving: ${err.message}`);
    },
  });

  const createPostMutation = trpc.coven.createPost.useMutation({
    onSuccess: () => {
      toast.success("Discussion started!");
      setShowPostModal(false);
      setNewPost({ title: "", content: "" });
      refetchPosts();
    },
    onError: (err) => {
      toast.error(`Error posting: ${err.message}`);
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Both title and content are required.");
      return;
    }
    if (!coven?.id) return;
    createPostMutation.mutate({
      covenId: coven.id,
      title: newPost.title,
      content: newPost.content,
    });
  };

  if (isCovenLoading) {
    return (
      <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "oklch(0.72 0.09 75)" }}>
        <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!coven) {
    return (
      <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", color: "oklch(0.93 0.02 80)" }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "24px", marginBottom: "16px" }}>Coven Not Found</h2>
        <button onClick={() => setLocation("/covens")} className="btn-outline">Back to Covens</button>
      </div>
    );
  }

  // 1. Locked Screen for tier restrictions
  if (!coven.allowed) {
    return (
      <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: "560px", background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.75 0.14 20 / 30%)", borderRadius: "8px", position: "relative", overflow: "hidden", padding: "48px 32px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, oklch(0.75 0.14 20), transparent)" }} />
          
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "oklch(0.75 0.14 20 / 10%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={28} style={{ color: "oklch(0.75 0.14 20)" }} />
          </div>

          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "24px", color: "oklch(0.93 0.02 80)", letterSpacing: "0.04em", margin: "0 0 16px 0" }}>
            Coven Locked
          </h2>

          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "16px", color: "oklch(0.55 0.03 60)", lineHeight: 1.6, margin: "0 0 32px 0" }}>
            The rituals of <strong style={{ color: "oklch(0.93 0.02 80)" }}>{coven.name}</strong> are restricted to the exclusive members of the <strong style={{ color: "oklch(0.75 0.14 20)" }}>{coven.tierName}</strong> tier hosted by <strong style={{ color: "oklch(0.72 0.09 75)" }}>{coven.creatorAlias}</strong>.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button
              onClick={() => setLocation("/covens")}
              style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "oklch(0.55 0.03 60)", border: "1px solid oklch(0.55 0.03 60 / 30%)", padding: "12px 24px", cursor: "pointer" }}
            >
              Back to Covens
            </button>
            <button
              onClick={() => setLocation(`/creator/${coven.creatorHandle}`)}
              style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.75 0.14 20)", color: "white", border: "none", padding: "12px 28px", cursor: "pointer", fontWeight: 600 }}
            >
              Unlock Access (Subscribe)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", padding: "60px 0 120px", color: "oklch(0.93 0.02 80)" }}>
      {/* Cover Header */}
      <div style={{ height: "240px", background: coven.coverUrl ? `url(${coven.coverUrl}) center/cover` : "linear-gradient(180deg, oklch(0.085 0.015 330), oklch(0.04 0.008 285))", borderBottom: "1px solid oklch(0.72 0.09 75 / 10%)", position: "relative" }}>
        <div className="container mx-auto max-w-5xl" style={{ height: "100%", position: "relative" }}>
          <button
            onClick={() => setLocation("/covens")}
            style={{ position: "absolute", top: "24px", left: "20px", background: "oklch(0.02 0.005 285 / 70%)", border: "1px solid oklch(0.72 0.09 75 / 20%)", color: "oklch(0.72 0.09 75)", display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", fontFamily: "'Cinzel', serif", padding: "8px 16px", cursor: "pointer", borderRadius: "4px", zIndex: 10 }}
          >
            <ArrowLeft size={10} /> Back
          </button>

          {/* Profile Details Block */}
          <div style={{ position: "absolute", bottom: "-40px", left: "20px", right: "20px", display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "12px", background: coven.avatarUrl ? `url(${coven.avatarUrl}) center/cover` : "oklch(0.12 0.04 20)", border: "3px solid oklch(0.04 0.008 285)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>
              {!coven.avatarUrl && "🔮"}
            </div>
            <div style={{ flex: 1, minWidth: "240px", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 900, margin: 0, color: "white", letterSpacing: "0.02em" }}>
                  {coven.name}
                </h1>
                {coven.tierId ? (
                  <span style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", color: "oklch(0.75 0.14 20)", background: "oklch(0.75 0.14 20 / 10%)", padding: "2px 8px", borderRadius: "12px", border: "1px solid oklch(0.75 0.14 20 / 20%)" }}>
                    EXCLUSIVE
                  </span>
                ) : (
                  <span style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", color: "oklch(0.45 0.02 60)", background: "oklch(0.45 0.02 60 / 10%)", padding: "2px 8px", borderRadius: "12px" }}>
                    PUBLIC
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.55 0.03 60)", margin: "4px 0 0 0" }}>
                Established forum hosted by {coven.creatorAlias} ({coven.memberCount} members)
              </p>
            </div>
            
            {/* Join / Leave Actions */}
            <div style={{ paddingBottom: "8px" }}>
              {coven.isMember ? (
                <button
                  onClick={() => leaveMutation.mutate({ covenId: coven.id })}
                  disabled={leaveMutation.isPending}
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "oklch(0.38 0.14 20)", border: "1px solid oklch(0.38 0.14 20 / 40%)", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {leaveMutation.isPending ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <LogOut size={10} />}
                  Leave Coven
                </button>
              ) : (
                <button
                  onClick={() => joinMutation.mutate({ covenId: coven.id })}
                  disabled={joinMutation.isPending}
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.72 0.09 75)", color: "oklch(0.04 0.008 285)", border: "none", padding: "10px 24px", borderRadius: "4px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {joinMutation.isPending ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={10} />}
                  Join Coven
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Forum Board */}
      <div className="container mx-auto max-w-5xl" style={{ marginTop: "80px", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "40px", alignItems: "flex-start" }}>
          
          {/* Forum Threads list */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", color: "oklch(0.72 0.09 75)", margin: 0, letterSpacing: "0.05em" }}>
                Discussions
              </h2>
              {coven.isMember && (
                <button
                  onClick={() => setShowPostModal(true)}
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.38 0.14 20)", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus size={10} /> Start Topic
                </button>
              )}
            </div>

            {isPostsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "oklch(0.72 0.09 75)" }} />
              </div>
            ) : posts.length === 0 ? (
              <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(1 0 0 / 6%)", padding: "48px 24px", textAlign: "center", borderRadius: "6px" }}>
                <MessageSquare size={32} style={{ color: "oklch(0.45 0.02 60)", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.45 0.02 60)", margin: 0 }}>
                  Silence dwells here. Be the first to start a discussion topic in this coven!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setLocation(`/coven/${slug}/post/${post.id}`)}
                    style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "6px", padding: "20px", cursor: "pointer", transition: "border 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid oklch(0.72 0.09 75 / 30%)")}
                    onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid oklch(1 0 0 / 6%)")}
                  >
                    <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", color: "oklch(0.93 0.02 80)", margin: "0 0 8px 0" }}>{post.title}</h3>
                    
                    <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", margin: "0 0 16px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>
                      {post.content}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid oklch(1 0 0 / 4%)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: post.userAvatarUrl ? `url(${post.userAvatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
                        <span style={{ fontSize: "11px", color: "oklch(0.72 0.09 75)" }}>{post.userDisplayName || post.userName}</span>
                        {post.userRole === "creator" && (
                          <span style={{ fontSize: "8px", background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.75 0.14 20)", padding: "1px 4px", borderRadius: "2px" }}>HOST</span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>
                        {format(new Date(post.createdAt), "MMM d, yyyy - HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Detail Card */}
          <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "6px", padding: "20px" }}>
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.72 0.09 75)", marginBottom: "16px", borderBottom: "1px solid oklch(1 0 0 / 6%)", paddingBottom: "10px" }}>
              Coven Description
            </h3>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", lineHeight: 1.6, margin: "0 0 20px 0" }}>
              {coven.description || "No description provided for this ritual circle."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "oklch(0.45 0.02 60)" }}>
              <div>Created: <strong style={{ color: "oklch(0.82 0.03 75)" }}>{format(new Date(coven.createdAt), "MMM d, yyyy")}</strong></div>
              <div>Members: <strong style={{ color: "oklch(0.82 0.03 75)" }}>{coven.memberCount}</strong></div>
              <div>Access: <strong style={{ color: "oklch(0.82 0.03 75)" }}>{coven.tierId ? `Exclusive (${coven.tierName})` : "Public"}</strong></div>
            </div>
          </div>

        </div>
      </div>

      {/* Start discussion modal */}
      {showPostModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "oklch(0.02 0.005 285 / 85%)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 30%)", width: "100%", maxWidth: "560px", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)" }} />
            <div style={{ padding: "24px 30px" }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "20px", color: "oklch(0.93 0.02 80)", margin: "0 0 8px 0" }}>Start a New Topic</h2>
              <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.45 0.02 60)", margin: "0 0 24px 0" }}>
                Introduce a new theme or question for members of this coven. Keep it civil and respectful of the darkness.
              </p>

              <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Topic Title *
                  </label>
                  <input
                    className="input-dark"
                    type="text"
                    required
                    placeholder="e.g. My thoughts on the new album tracks"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", display: "block", marginBottom: "6px" }}>
                    Content / Message *
                  </label>
                  <textarea
                    className="input-dark"
                    required
                    rows={6}
                    placeholder="Share your thoughts..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "oklch(0.55 0.03 60)", border: "1px solid oklch(0.55 0.03 60 / 30%)", padding: "10px 20px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.72 0.09 75)", color: "oklch(0.04 0.008 285)", border: "none", padding: "10px 24px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {createPostMutation.isPending && <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />}
                    Publish Topic
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
