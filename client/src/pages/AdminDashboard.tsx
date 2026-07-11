import { useAuth } from "@/_core/hooks/useAuth";
import AdminDashboardLayout from "@/components/AdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Shield, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery();

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your admin overview.
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers || 0}
              color="text-blue-500"
            />
            <StatCard
              icon={Shield}
              label="Total Admins"
              value={stats?.totalAdmins || 0}
              color="text-purple-500"
            />
            <StatCard
              icon={FileText}
              label="Recent Actions"
              value={stats?.recentActions || 0}
              color="text-green-500"
            />
            <StatCard
              icon={BarChart3}
              label="Last Action"
              value={stats?.lastAction ? new Date(stats.lastAction).toLocaleDateString() : "N/A"}
              color="text-orange-500"
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common admin tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
                <div className="font-semibold mb-1">Manage Users</div>
                <div className="text-sm text-muted-foreground">View and manage platform users</div>
              </button>
              <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
                <div className="font-semibold mb-1">Review Content</div>
                <div className="text-sm text-muted-foreground">Moderate pending content</div>
              </button>
              <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
                <div className="font-semibold mb-1">Manage Creators</div>
                <div className="text-sm text-muted-foreground">Verify and manage creators</div>
              </button>
              <button className="p-4 border border-border rounded-lg hover:bg-accent transition-colors text-left">
                <div className="font-semibold mb-1">View Audit Logs</div>
                <div className="text-sm text-muted-foreground">Track admin actions</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current admin panel status and configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Your Role</span>
                <span className="text-sm text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Admin Panel Version</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last System Update</span>
                <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}
