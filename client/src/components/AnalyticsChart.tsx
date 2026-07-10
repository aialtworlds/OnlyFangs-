import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, DollarSign, TrendingUp } from "lucide-react";

interface TierBreakdown {
  tierName: string;
  tierId: number;
  subscribers: number;
  price: string;
}

interface AnalyticsData {
  totalSubscribers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  tierBreakdown: TierBreakdown[];
}

interface AnalyticsChartProps {
  data?: AnalyticsData;
  isLoading?: boolean;
}

export function AnalyticsChart({ data, isLoading = false }: AnalyticsChartProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = [
    {
      title: "Total Subscribers",
      value: data.totalSubscribers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Active Subscriptions",
      value: data.activeSubscriptions,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      title: "Monthly Revenue",
      value: `$${data.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Breakdown */}
      {data.tierBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscribers by Tier</CardTitle>
            <CardDescription>Distribution of active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tierBreakdown.map((tier) => {
                const totalRevenue = tier.subscribers * parseFloat(tier.price);
                const maxSubscribers = Math.max(...data.tierBreakdown.map((t) => t.subscribers), 1);
                const percentage = (tier.subscribers / maxSubscribers) * 100;

                return (
                  <div key={tier.tierId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tier.tierName}</p>
                        <p className="text-xs text-muted-foreground">
                          {tier.subscribers} subscriber{tier.subscribers !== 1 ? "s" : ""} • $
                          {totalRevenue.toFixed(2)} revenue
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Creator's Choice</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
