import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function PayoutsTab() {
  const [loading, setLoading] = useState(false);

  // Query to get status
  const statusQuery = trpc.creator.getStripeConnectStatus.useQuery();

  // Mutations
  const setupMutation = trpc.creator.stripeConnectSetup.useMutation();
  const loginLinkMutation = trpc.creator.getStripeLoginLink.useMutation();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await setupMutation.mutateAsync({
        origin: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not generate Stripe onboarding URL.");
      }
    } catch (error) {
      console.error("Error setting up Connect:", error);
      toast.error("An error occurred while setting up Stripe Connect.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = async () => {
    setLoading(true);
    try {
      const result = await loginLinkMutation.mutateAsync();
      if (result.url) {
        window.open(result.url, "_blank");
      } else {
        toast.error("Could not generate Stripe login link.");
      }
    } catch (error) {
      console.error("Error getting login link:", error);
      toast.error("An error occurred while opening the Stripe dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </CardContent>
      </Card>
    );
  }

  const { connected, active, accountId } = statusQuery.data || { connected: false, active: false };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif tracking-wide">Payouts & Billing</h2>
        <p className="text-muted-foreground mt-1">
          Set up your Stripe Connect Express account to receive your patrons' subscriptions directly and automatically.
        </p>
      </div>

      {!connected || !active ? (
        <Card className="border-red-900/30 bg-red-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <CardTitle className="font-serif">Payouts Disabled</CardTitle>
                <CardDescription>
                  Your payment account isn't set up yet, or onboarding is still pending.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To start receiving payments from patrons on OnlyFangs, you need to connect a Stripe account.
              When you sign up, you'll provide your preferred bank account to receive monthly subscription payouts.
            </p>
            <div className="bg-muted/40 p-4 rounded-lg border border-border/50 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="font-semibold text-primary">10%</span>
              </div>
              <div className="flex justify-between">
                <span>Net Payout to Creator:</span>
                <span className="font-semibold text-green-500">90%</span>
              </div>
              <div className="flex justify-between">
                <span>Payout Frequency:</span>
                <span className="font-semibold">Automatic (configured on Stripe)</span>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading || setupMutation.isPending}
              className="w-full md:w-auto font-semibold gap-2"
            >
              {(loading || setupMutation.isPending) && <Loader2 className="animate-spin" size={16} />}
              {connected ? "Finish Stripe Onboarding" : "Connect Stripe Account"}
              <ExternalLink size={16} />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-900/30 bg-green-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <CardTitle className="font-serif">Payouts Set Up and Active</CardTitle>
                <CardDescription>
                  Your Stripe Connect account is active and ready to receive payouts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Stripe Account ID: <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono">{accountId}</code>
              </p>
              <p>Transaction Status: <span className="text-green-500 font-semibold">Active</span></p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscription payouts (90% of gross revenue) are sent directly to your bank account configured on Stripe.
              You can view your accumulated balance, edit your bank details, and manage statements by clicking the button below.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGoToDashboard}
                disabled={loading || loginLinkMutation.isPending}
                className="font-semibold gap-2"
              >
                {(loading || loginLinkMutation.isPending) && <Loader2 className="animate-spin" size={16} />}
                View Stripe Express Dashboard
                <ExternalLink size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
