import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ArrowLeft, MessageSquare, Send, Check, Pin, Trash, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CovenPostDetail() {
  const [, params] = useRoute("/coven/:slug/post/:id");
  const slug = params?.slug || "";
  const postId = params?.id ? parseInt(params.id) : 0;
  
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  
  const [commentText, setCommentText] = useState("");

  // Queries
  const { data: post, isLoading: isPostLoading } = trpc.coven.postDetail.useQuery({ postId });
  const { data: comments = [], isLoading: isCommentsLoading, refetch: refetchComments } = trpc.coven.comments.useQuery({ postId });
  const { data: roleData } = trpc.coven.getRole.useQuery(
    { covenId: post?.covenId || 0 },
    { enabled: !!post?.covenId }
  );

  const isStaff = roleData?.isStaff || user?.role === "admin";

  // Mutations
  const createCommentMutation = trpc.coven.createComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast.success("Reply posted!");
    },
    onError: (err) => {
      toast.error(`Error replying: ${err.message}`);
    },
  });

  const deletePostMutation = trpc.coven.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted.");
      setLocation(`/coven/${slug}`);
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const deleteCommentMutation = trpc.coven.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("Reply deleted.");
      refetchComments();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const togglePinMutation = trpc.coven.togglePinPost.useMutation({
    onSuccess: () => {
      toast.success("Post pin status toggled.");
      utils.coven.postDetail.invalidate({ postId });
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const toggleLockMutation = trpc.coven.toggleLockPost.useMutation({
    onSuccess: () => {
      toast.success("Post lock status toggled.");
      utils.coven.postDetail.invalidate({ postId });
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      postId,
      content: commentText,
    });
  };

  if (isPostLoading) {
    return (
      <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "oklch(0.72 0.09 75)" }}>
        <Loader2 size={36} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", color: "oklch(0.93 0.02 80)" }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "24px", marginBottom: "16px" }}>Post Not Found</h2>
        <button onClick={() => setLocation(`/coven/${slug}`)} className="btn-outline">Back to Coven</button>
      </div>
    );
  }

  return (
    <div style={{ background: "oklch(0.04 0.008 285)", minHeight: "100vh", padding: "80px 20px 120px", color: "oklch(0.93 0.02 80)" }}>
      <div className="container mx-auto max-w-4xl">
        
        {/* Navigation */}
        <button
          onClick={() => setLocation(`/coven/${slug}`)}
          style={{ background: "none", border: "none", color: "oklch(0.72 0.09 75)", display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontFamily: "'Cinzel', serif", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", marginBottom: "32px", padding: 0 }}
        >
          <ArrowLeft size={12} /> Back to Coven Discussion
        </button>

        {/* Main Post Card */}
        <div style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(0.72 0.09 75 / 15%)", borderRadius: "8px", padding: "30px", marginBottom: "40px" }}>
          
          {/* Author Block */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid oklch(1 0 0 / 6%)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: post.userAvatarUrl ? `url(${post.userAvatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)" }}>{post.userDisplayName || post.userName}</span>
                  {post.userRole === "creator" && (
                    <span style={{ fontSize: "8px", background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.75 0.14 20)", padding: "1px 4px", borderRadius: "2px" }}>HOST</span>
                  )}
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
                <div style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>
                  {format(new Date(post.createdAt), "MMMM d, yyyy - HH:mm")}
                </div>
              </div>
            </div>

            {/* Moderation actions */}
            {(isStaff || post.userId === user?.id) && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {isStaff && (
                  <>
                    <button
                      onClick={() => togglePinMutation.mutate({ postId: post.id })}
                      style={{ background: "none", border: "none", color: post.isPinned ? "oklch(0.72 0.09 75)" : "oklch(0.45 0.02 60)", cursor: "pointer", display: "flex" }}
                      title={post.isPinned ? "Unpin Topic" : "Pin Topic"}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      onClick={() => toggleLockMutation.mutate({ postId: post.id })}
                      style={{ background: "none", border: "none", color: post.isLocked ? "oklch(0.75 0.14 20)" : "oklch(0.45 0.02 60)", cursor: "pointer", display: "flex" }}
                      title={post.isLocked ? "Unlock Topic" : "Lock Topic"}
                    >
                      <Lock size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this topic and all its comments?")) {
                      deletePostMutation.mutate({ postId: post.id });
                    }
                  }}
                  style={{ background: "none", border: "none", color: "oklch(0.38 0.14 20)", cursor: "pointer", display: "flex" }}
                  title="Delete Topic"
                >
                  <Trash size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Title and Content */}
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", color: "white", letterSpacing: "0.02em", margin: "0 0 20px 0", lineHeight: 1.3 }}>
            {post.title}
          </h1>

          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "16px", color: "oklch(0.85 0.02 75)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
            {post.content}
          </p>
        </div>

        {/* Comments Section */}
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "oklch(0.72 0.09 75)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare size={16} /> Replies ({comments.length})
          </h2>

          {isCommentsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "oklch(0.72 0.09 75)" }} />
            </div>
          ) : comments.length === 0 ? (
            <div style={{ padding: "30px", border: "1px dashed oklch(1 0 0 / 6%)", borderRadius: "6px", textAlign: "center", marginBottom: "40px" }}>
              <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "13px", color: "oklch(0.45 0.02 60)", margin: 0 }}>
                No replies yet. Speak your mind and join the discussion!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{ background: "oklch(0.05 0.01 285)", border: "1px solid oklch(1 0 0 / 4%)", borderRadius: "6px", padding: "20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: comment.userAvatarUrl ? `url(${comment.userAvatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", color: "oklch(0.93 0.02 80)" }}>
                          {comment.userDisplayName || comment.userName}
                        </span>
                        {comment.userRole === "creator" && (
                          <span style={{ fontSize: "7px", background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.75 0.14 20)", padding: "1px 4px", borderRadius: "2px" }}>HOST</span>
                        )}
                        <span style={{ fontSize: "10px", color: "oklch(0.45 0.02 60)" }}>
                          {format(new Date(comment.createdAt), "MMM d, yyyy - HH:mm")}
                        </span>
                      </div>
                    </div>

                    {(isStaff || comment.userId === user?.id) && (
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this reply?")) {
                            deleteCommentMutation.mutate({ commentId: comment.id });
                          }
                        }}
                        style={{ background: "none", border: "none", color: "oklch(0.38 0.14 20)", cursor: "pointer", display: "flex", padding: "2px" }}
                        title="Delete Reply"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.75 0.02 60)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {post.isLocked && !isStaff ? (
            <div style={{ background: "oklch(0.06 0.01 285)", border: "1px dashed oklch(0.75 0.14 20 / 30%)", borderRadius: "6px", padding: "20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "oklch(0.75 0.14 20)", fontSize: "14px", fontFamily: "'IM Fell English', serif", fontStyle: "italic" }}>
              <Lock size={14} /> This topic is locked. You cannot reply to this thread.
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.20em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", margin: 0 }}>
                Speak to the Circle {post.isLocked && <span style={{ color: "oklch(0.75 0.14 20)", fontSize: "9px" }}>(LOCKED - STAFF ONLY)</span>}
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <textarea
                  className="input-dark"
                  rows={3}
                  placeholder="Write your response here..."
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ flex: 1, resize: "vertical" }}
                />
                <button
                  type="submit"
                  disabled={createCommentMutation.isPending || !commentText.trim()}
                  style={{ background: "oklch(0.38 0.14 20)", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                >
                  {createCommentMutation.isPending ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
