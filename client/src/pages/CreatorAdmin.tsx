import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TierForm } from "@/components/TierForm";
import { TierTable } from "@/components/TierTable";
import { SubscriptionsTable } from "@/components/SubscriptionsTable";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { CreatorSettingsForm } from "@/components/CreatorSettingsForm";
import { ContentUploadForm } from "@/components/ContentUploadForm";
import { AdminCreatorManagement } from "@/components/AdminCreatorManagement";
import { PayoutsTab } from "@/components/PayoutsTab";
import { toast } from "sonner";
import { Plus, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

type EditingTier = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  currency?: string;
  perks?: string[] | null;
  featured?: boolean;
  sortOrder?: number;
} | null;

export default function CreatorAdmin() {
  const { isAuthenticated, logout, user } = useAuth();
  const [editingTier, setEditingTier] = useState<EditingTier>(null);
  const [showForm, setShowForm] = useState(false);

  // Queries
  const creatorProfile = trpc.creator.myProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const tiers = trpc.creator.tiers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const subscriptions = trpc.creator.subscriptions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const analytics = trpc.creator.analytics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTier(null);
    tiers.refetch();
    analytics.refetch();
    toast.success(editingTier ? "Tier updated" : "Tier created");
  };

  const handleEditTier = (tier: any) => {
    setEditingTier(tier);
    setShowForm(true);
  };

  const handleRefreshTiers = () => {
    tiers.refetch();
    subscriptions.refetch();
    analytics.refetch();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Creator Admin Panel</CardTitle>
            <CardDescription>You need to be logged in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is a creator
  if (user?.role !== 'creator' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only creators can access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to be a creator to manage tiers and subscriptions.
            </p>
            <Button asChild className="w-full">
              <a href="/complete-signup?role=creator">Become a Creator</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!creatorProfile.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Creator Profile Required</CardTitle>
            <CardDescription>
              You need to create a creator profile first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/apply">Create Creator Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Creator Admin Panel</h1>
              <p className="text-muted-foreground mt-1">
                Manage your tiers, subscriptions, and analytics
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="creators">Creators</TabsTrigger>
            )}
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Publish Content</h2>
              <p className="text-muted-foreground mt-1">
                Upload a release for your patrons — image, photo, music, book, video, or a free post.
              </p>
            </div>
            <ContentUploadForm onSuccess={() => toast.success("Content published!")} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsChart
              data={analytics.data}
              isLoading={analytics.isLoading}
            />
          </TabsContent>

          {/* Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            {!showForm ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Membership Tiers</h2>
                    <p className="text-muted-foreground mt-1">
                      Create and manage your subscription tiers
                    </p>
                  </div>
                  <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus size={16} />
                    New Tier
                  </Button>
                </div>
                <TierTable
                  tiers={tiers.data || []}
                  isLoading={tiers.isLoading}
                  onEdit={handleEditTier}
                  onRefresh={handleRefreshTiers}
                />
              </>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTier(null);
                  }}
                >
                  ← Back to Tiers
                </Button>
                <TierForm
                  tier={editingTier || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingTier(null);
                  }}
                />
              </div>
            )}
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Active Subscriptions</h2>
              <p className="text-muted-foreground mt-1">
                View all active subscriptions to your tiers
              </p>
            </div>
            <SubscriptionsTable
              subscriptions={subscriptions.data || []}
              isLoading={subscriptions.isLoading}
            />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <PayoutsTab />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {creatorProfile.data ? (
              <CreatorSettingsForm
                profile={creatorProfile.data}
                onSuccess={() => creatorProfile.refetch()}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          {/* Admin: Creators Tab */}
          {user?.role === 'admin' && (
            <TabsContent value="creators" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Creator Management</h2>
                <p className="text-muted-foreground mt-1">
                  Manage creator verification status
                </p>
              </div>
              <AdminCreatorManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
