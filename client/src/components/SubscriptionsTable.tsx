import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  id: number;
  patronId: number;
  tierId: number;
  tierName: string;
  status: "active" | "cancelled" | "expired" | "paused";
  startedAt: Date;
  renewsAt?: Date | null;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
}

export function SubscriptionsTable({ subscriptions, isLoading = false }: SubscriptionsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No subscriptions yet</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Renews At</TableHead>
            <TableHead>Stripe ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>
                <p className="font-medium">{sub.tierName}</p>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(sub.status)}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(sub.startedAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-sm">
                {sub.renewsAt ? format(new Date(sub.renewsAt), "MMM d, yyyy") : "-"}
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">
                {sub.stripeSubscriptionId ? sub.stripeSubscriptionId.substring(0, 20) + "..." : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
