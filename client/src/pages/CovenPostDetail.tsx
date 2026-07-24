import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ArrowLeft, MessageSquare, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CovenPostDetail() {
  const [, params] = useRoute("/coven/:slug/post/:id");
  const slug = params?.slug || "";
  const postId = params?.id ? parseInt(params.id) : 0;
  
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [commentText, setCommentText] = useState("");

  // Queries
  const { data: post, isLoading: isPostLoading } = trpc.coven.postDetail.useQuery({ postId });
  const { data: comments = [], isLoading: isCommentsLoading, refetch: refetchComments } = trpc.coven.comments.useQuery({ postId });

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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", borderBottom: "1px solid oklch(1 0 0 / 6%)", paddingBottom: "16px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: post.userAvatarUrl ? `url(${post.userAvatarUrl}) center/cover` : "oklch(0.15 0.03 330)", overflow: "hidden" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", color: "oklch(0.93 0.02 80)" }}>{post.userDisplayName || post.userName}</span>
                {post.userRole === "creator" && (
                  <span style={{ fontSize: "8px", background: "oklch(0.38 0.14 20 / 20%)", color: "oklch(0.75 0.14 20)", padding: "1px 4px", borderRadius: "2px" }}>HOST</span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "oklch(0.45 0.02 60)" }}>
                {format(new Date(post.createdAt), "MMMM d, yyyy - HH:mm")}
              </div>
            </div>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
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
                  <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "14px", color: "oklch(0.75 0.02 60)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Post Comment Input */}
          <form onSubmit={handleCommentSubmit} style={{ background: "oklch(0.06 0.01 285)", border: "1px solid oklch(1 0 0 / 6%)", borderRadius: "6px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "0.20em", textTransform: "uppercase", color: "oklch(0.55 0.03 60)", margin: 0 }}>
              Speak to the Circle
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
        </div>

      </div>
    </div>
  );
}
