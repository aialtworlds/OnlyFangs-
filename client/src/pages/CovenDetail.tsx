import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ArrowLeft, MessageSquare, Plus, Lock, Globe, Sparkles, LogOut, Check, Pin, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CovenDetail() {
  const [, params] = useRoute("/coven/:slug");
  const slug = params?.slug || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [showPostModal, setShowPostModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  // Queries
  const { data: coven, isLoading: isCovenLoading, refetch: refetchCoven } = trpc.coven.bySlug.useQuery({ slug });
  const { data: posts = [], isLoading: isPostsLoading, refetch: refetchPosts } = trpc.coven.posts.useQuery(
    { covenId: coven?.id || 0 },
    { enabled: !!coven?.allowed }
  );
  const { data: roleData } = trpc.coven.getRole.useQuery(
    { covenId: coven?.id || 0 },
    { enabled: !!coven?.id }
  );

  const isStaff = roleData?.isStaff || user?.role === "admin";
  const userRole = roleData?.role || (user?.role === "admin" ? "owner" : null);

  // Mutations
  const deletePostMutation = trpc.coven.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted.");
      refetchPosts();
    },
    onError: (err) => {
      toast.error(`Error deleting post: ${err.message}`);
    },
  });

  const togglePinMutation = trpc.coven.togglePinPost.useMutation({
    onSuccess: () => {
      toast.success("Post pin status toggled.");
      refetchPosts();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const toggleLockMutation = trpc.coven.toggleLockPost.useMutation({
    onSuccess: () => {
      toast.success("Post lock status toggled.");
      refetchPosts();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });
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

  const { data: members = [], refetch: refetchMembers } = trpc.coven.membersList.useQuery(
    { covenId: coven?.id || 0 },
    { enabled: !!coven?.id && showMembersModal }
  );

  const updateRoleMutation = trpc.coven.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated successfully.");
      refetchMembers();
    },
    onError: (err) => {
      toast.error(`Error updating role: ${err.message}`);
    },
  });

  const kickMutation = trpc.coven.kickMember.useMutation({
    onSuccess: () => {
      toast.success("Member kicked from coven.");
      refetchMembers();
      refetchCoven();
    },
    onError: (err) => {
      toast.error(`Error kicking member: ${err.message}`);
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
                {[...posts]
                  .sort((a, b) => {
                    const pinA = a.isPinned ? 1 : 0;
                    const pinB = b.isPinned ? 1 : 0;
                    if (pinA !== pinB) return pinB - pinA;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((post) => (
                    <div
                      key={post.id}
                      style={{
                        background: "oklch(0.06 0.01 285)",
                        border: post.isPinned
                          ? "1px solid oklch(0.72 0.09 75 / 35%)"
                          : "1px solid oklch(1 0 0 / 6%)",
                        borderRadius: "6px",
                        padding: "20px",
                        position: "relative",
                        transition: "border 0.2s",
                      }}
                    >
                      <div
                        onClick={() => setLocation(`/coven/${slug}/post/${post.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", color: "oklch(0.93 0.02 80)", margin: 0 }}>
                            {post.title}
                          </h3>
                          {post.isPinned && (
                            <span style={{ fontSize: "8px", background: "oklch(0.72 0.09 75 / 15%)", color: "oklch(0.72 0.09 75)", padding: "2px 6px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <Pin size={8} /> PINNED
                            </span>
                          )}
                          {post.isLocked && (
                            <span style={{ fontSize: "8px", background: "oklch(0.75 0.14 20 / 15%)", color: "oklch(0.75 0.14 20)", padding: "2px 6px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <Lock size={8} /> LOCKED
                            </span>
                          )}
                        </div>

                        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.55 0.03 60)", margin: "0 0 16px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>
                          {post.content}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid oklch(1 0 0 / 4%)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: post.userAvatarUrl ? `url(${post.userAvatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
                          <span style={{ fontSize: "11px", color: "oklch(0.72 0.09 75)" }}>{post.userDisplayName || post.userName}</span>
                          {post.userRole === "creator" && (
                            <span style={{ fontSize: "8px", background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.75 0.14 20)", padding: "1px 4px", borderRadius: "2px" }}>HOST</span>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>
                            {format(new Date(post.createdAt), "MMM d, yyyy - HH:mm")}
                          </span>

                          {/* Moderation Controls */}
                          {(isStaff || post.userId === user?.id) && (
                            <div style={{ display: "flex", gap: "8px", borderLeft: "1px solid oklch(1 0 0 / 6%)", paddingLeft: "12px" }}>
                              {isStaff && (
                                <>
                                  <button
                                    onClick={() => togglePinMutation.mutate({ postId: post.id })}
                                    style={{ background: "none", border: "none", color: post.isPinned ? "oklch(0.72 0.09 75)" : "oklch(0.45 0.02 60)", cursor: "pointer", display: "flex", padding: "2px" }}
                                    title={post.isPinned ? "Unpin Topic" : "Pin Topic"}
                                  >
                                    <Pin size={12} />
                                  </button>
                                  <button
                                    onClick={() => toggleLockMutation.mutate({ postId: post.id })}
                                    style={{ background: "none", border: "none", color: post.isLocked ? "oklch(0.75 0.14 20)" : "oklch(0.45 0.02 60)", cursor: "pointer", display: "flex", padding: "2px" }}
                                    title={post.isLocked ? "Unlock Topic" : "Lock Topic"}
                                  >
                                    <Lock size={12} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this topic and all its comments?")) {
                                    deletePostMutation.mutate({ postId: post.id });
                                  }
                                }}
                                style={{ background: "none", border: "none", color: "oklch(0.38 0.14 20)", cursor: "pointer", display: "flex", padding: "2px" }}
                                title="Delete Topic"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          )}
                        </div>
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
            {isStaff && (
              <button
                onClick={() => setShowMembersModal(true)}
                style={{ width: "100%", marginTop: "20px", fontFamily: "'Cinzel', serif", fontSize: "9.5px", letterSpacing: "0.15em", textTransform: "uppercase", background: "transparent", color: "oklch(0.72 0.09 75)", border: "1px solid oklch(0.72 0.09 75 / 30%)", padding: "10px", cursor: "pointer", transition: "all 0.2s", display: "block" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.72 0.09 75 / 10%)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Manage Members
              </button>
            )}
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

      {showMembersModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "oklch(0.02 0.005 285 / 85%)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 30%)", width: "100%", maxWidth: "500px", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)" }} />
            <div style={{ padding: "24px 30px" }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "20px", color: "oklch(0.93 0.02 80)", margin: "0 0 8px 0" }}>Manage Coven Members</h2>
              <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.45 0.02 60)", margin: "0 0 24px 0" }}>
                Promote loyal followers to moderators, demote staff, or kick members who breach the rules of the dark circle.
              </p>

              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px", paddingRight: "6px" }}>
                {members.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "oklch(0.45 0.02 60)", fontStyle: "italic", fontFamily: "'IM Fell English', serif" }}>
                    No members found in this coven.
                  </div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "oklch(0.08 0.015 330)", padding: "10px 12px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: member.avatarUrl ? `url(${member.avatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
                        <div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "12px", color: "oklch(0.93 0.02 80)" }}>
                            {member.displayName || member.name}
                          </div>
                          <span style={{ fontSize: "9px", color: "oklch(0.45 0.02 60)", textTransform: "uppercase" }}>
                            {member.role}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        {/* Only owners/admins can promote/demote */}
                        {(userRole === "owner" || user?.role === "admin") && member.userId !== user?.id && (
                          <>
                            {member.role === "member" && (
                              <button
                                onClick={() => updateRoleMutation.mutate({ covenId: coven.id, targetUserId: member.userId, newRole: "moderator" })}
                                style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", background: "oklch(0.72 0.09 75 / 10%)", color: "oklch(0.72 0.09 75)", border: "1px solid oklch(0.72 0.09 75 / 30%)", padding: "4px 8px", cursor: "pointer" }}
                              >
                                Make Mod
                              </button>
                            )}
                            {member.role === "moderator" && (
                              <button
                                onClick={() => updateRoleMutation.mutate({ covenId: coven.id, targetUserId: member.userId, newRole: "member" })}
                                style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", background: "transparent", color: "oklch(0.45 0.02 60)", border: "1px solid oklch(0.45 0.02 60 / 30%)", padding: "4px 8px", cursor: "pointer" }}
                              >
                                Remove Mod
                              </button>
                            )}
                          </>
                        )}

                        {/* Owners/Mods can kick */}
                        {member.userId !== user?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to kick ${member.displayName || member.name} from the coven?`)) {
                                kickMutation.mutate({ covenId: coven.id, targetUserId: member.userId });
                              }
                            }}
                            style={{ fontSize: "9px", fontFamily: "'Cinzel', serif", background: "transparent", color: "oklch(0.38 0.14 20)", border: "1px solid oklch(0.38 0.14 20 / 30%)", padding: "4px 8px", cursor: "pointer" }}
                          >
                            Kick
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowMembersModal(false)}
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "oklch(0.38 0.14 20)", color: "white", border: "none", padding: "10px 20px", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
