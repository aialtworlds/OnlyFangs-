import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle, Flag } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function ModerationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "flags" | "stats">("pending");
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [changeNotes, setChangeNotes] = useState("");

  // Queries
  const pendingQuery = trpc.moderation.getPending.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const flagsQuery = trpc.moderation.getFlags.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const statsQuery = trpc.moderation.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Mutations
  const approveMutation = trpc.moderation.approve.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      setSelectedContent(null);
    },
  });
  const rejectMutation = trpc.moderation.reject.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      setSelectedContent(null);
      setRejectReason("");
    },
  });
  const changesMutation = trpc.moderation.requestChanges.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      setSelectedContent(null);
      setChangeNotes("");
    },
  });
  const resolveFlagMutation = trpc.moderation.resolveFlag.useMutation({
    onSuccess: () => {
      flagsQuery.refetch();
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can access the moderation dashboard.</p>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const pending = pendingQuery.data || [];
  const flags = flagsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Content Moderation Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Pending Review</div>
            <div className="text-3xl font-bold mt-2">{stats?.pending || 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-3xl font-bold mt-2 text-green-600">{stats?.approved || 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-3xl font-bold mt-2 text-red-600">{stats?.rejected || 0}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground">Changes Requested</div>
            <div className="text-3xl font-bold mt-2 text-yellow-600">{(stats as any)?.changes_requested || 0}</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Review ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab("flags")}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === "flags"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag size={16} className="inline mr-2" />
            Flagged Content ({flags.length})
          </button>
        </div>

        {/* Pending Content Tab */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : pending.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
                <h2 className="text-xl font-bold mb-2">All Clear!</h2>
                <p className="text-muted-foreground">No content pending review.</p>
              </Card>
            ) : (
              pending.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Content Info */}
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Creator: <span className="font-semibold">{item.creatorAlias}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Type: <span className="font-semibold capitalize">{item.type}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(item.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Preview/Notes */}
                    <div>
                      {item.notes && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Admin Notes:</p>
                          <Streamdown>{item.notes}</Streamdown>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {selectedContent === item.id ? (
                        <>
                          {/* Approve */}
                          <Button
                            onClick={() => approveMutation.mutate({ contentId: item.id })}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                            Approve
                          </Button>

                          {/* Reject */}
                          <div>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Rejection reason..."
                              className="w-full p-2 text-sm border rounded-lg mb-2"
                            />
                            <Button
                              onClick={() => {
                                if (rejectReason.trim()) {
                                  rejectMutation.mutate({ contentId: item.id, reason: rejectReason });
                                }
                              }}
                              disabled={rejectMutation.isPending || !rejectReason.trim()}
                              className="w-full bg-red-600 hover:bg-red-700"
                            >
                              {rejectMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <XCircle size={16} className="mr-2" />}
                              Reject
                            </Button>
                          </div>

                          {/* Request Changes */}
                          <div>
                            <textarea
                              value={changeNotes}
                              onChange={(e) => setChangeNotes(e.target.value)}
                              placeholder="What changes are needed?..."
                              className="w-full p-2 text-sm border rounded-lg mb-2"
                            />
                            <Button
                              onClick={() => {
                                if (changeNotes.trim()) {
                                  changesMutation.mutate({ contentId: item.id, notes: changeNotes });
                                }
                              }}
                              disabled={changesMutation.isPending || !changeNotes.trim()}
                              className="w-full bg-yellow-600 hover:bg-yellow-700"
                            >
                              {changesMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <AlertCircle size={16} className="mr-2" />}
                              Request Changes
                            </Button>
                          </div>

                          <Button
                            onClick={() => {
                              setSelectedContent(null);
                              setRejectReason("");
                              setChangeNotes("");
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setSelectedContent(item.id)} variant="outline" className="w-full">
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Flagged Content Tab */}
        {activeTab === "flags" && (
          <div className="space-y-4">
            {flagsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : flags.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
                <h2 className="text-xl font-bold mb-2">No Flags</h2>
                <p className="text-muted-foreground">No content has been flagged by users.</p>
              </Card>
            ) : (
              flags.map((flag) => (
                <Card key={flag.id} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Flag Info */}
                    <div>
                      <h3 className="font-bold text-lg mb-2">{flag.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Creator: <span className="font-semibold">{flag.creatorAlias}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Reason: <span className="font-semibold capitalize">{flag.reason}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Flagged: {new Date(flag.flaggedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      {flag.description && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Report:</p>
                          <Streamdown>{flag.description}</Streamdown>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => resolveFlagMutation.mutate({ flagId: flag.id })}
                        disabled={resolveFlagMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {resolveFlagMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
