import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { TRPCError } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Menu, X, Shield, Users, FileText, Settings, BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminDashboardProps {
  children: React.ReactNode;
}

export default function AdminDashboard({ children }: AdminDashboardProps) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || "");

  // Check if user is admin or higher
  const isAdmin = user?.role === "admin" || user?.role === "sub_admin" || user?.role === "admin_master" || user?.role === "moderator";
  const isAdminMaster = user?.role === "admin_master";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access the admin panel.</p>
          <Button onClick={() => setLocation("/")} variant="default">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: BarChart3, href: "/admin", roles: ["admin_master", "admin", "sub_admin", "moderator"] },
    { label: "Users", icon: Users, href: "/admin/users", roles: ["admin_master", "admin", "sub_admin"] },
    { label: "Creators", icon: Shield, href: "/admin/creators", roles: ["admin_master", "admin", "sub_admin"] },
    { label: "Content", icon: FileText, href: "/admin/content", roles: ["admin_master", "admin", "sub_admin", "moderator"] },
    { label: "Moderators", icon: Users, href: "/admin/moderators", roles: ["admin_master", "admin"] },
    { label: "Logs", icon: FileText, href: "/admin/logs", roles: ["admin_master", "admin", "moderator"] },
    { label: "Settings", icon: Settings, href: "/admin/settings", roles: ["admin_master"] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role || ""));

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    // In a real app, this would switch the view to show what that role can see
    // For now, just update the selected role
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
            <Shield className="text-primary" size={28} />
            {sidebarOpen && <span className="font-bold text-lg">Admin</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Role Selector (Admin-Master Only) */}
        {isAdminMaster && sidebarOpen && (
          <div className="p-4 border-b border-border">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              View As Role
            </label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin_master">Admin-Master</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sub_admin">Sub-Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${!sidebarOpen && "justify-center"}`}
                    onClick={() => setLocation(item.href)}
                  >
                    <Icon size={20} />
                    {sidebarOpen && <span className="ml-3">{item.label}</span>}
                  </Button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border space-y-3">
          {sidebarOpen && (
            <div className="text-sm">
              <p className="font-semibold truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          )}
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
