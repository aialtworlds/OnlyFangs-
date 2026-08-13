import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, X, Check } from "lucide-react";

interface SubscriptionPlanFormProps {
  plan?: {
    price: string | null;
    currency?: string | null;
    perks?: string[] | null;
  } | null;
  onSaved?: () => void;
}

export function SubscriptionPlanForm({ plan, onSaved }: SubscriptionPlanFormProps) {
  const [price, setPrice] = useState(plan?.price ?? "");
  const [currency, setCurrency] = useState(plan?.currency || "USD");
  const [perks, setPerks] = useState<string[]>((plan?.perks as string[] | null) ?? []);
  const [newPerk, setNewPerk] = useState("");
  const [confirmDisable, setConfirmDisable] = useState(false);

  const updatePlanMutation = trpc.creator.updateSubscriptionPlan.useMutation();
  const disablePlanMutation = trpc.creator.disableSubscriptionPlan.useMutation();
  const utils = trpc.useUtils();

  const hasPlan = !!plan?.price;

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setPerks((prev) => [...prev, newPerk.trim()]);
      setNewPerk("");
    }
  };

  const handleRemovePerk = (index: number) => {
    setPerks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!price.trim()) {
      toast.error("Price is required");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a valid number greater than zero");
      return;
    }

    try {
      await updatePlanMutation.mutateAsync({
        price,
        currency,
        perks: perks.length > 0 ? perks : undefined,
      });
      toast.success(hasPlan ? "Subscription plan updated!" : "Subscription plan created!");
      utils.creator.subscriptionPlan.invalidate();
      onSaved?.();
    } catch (error) {
      console.error("Error saving subscription plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save subscription plan");
    }
  };

  const handleDisable = async () => {
    try {
      await disablePlanMutation.mutateAsync();
      toast.success("Subscriptions turned off.");
      setConfirmDisable(false);
      setPrice("");
      utils.creator.subscriptionPlan.invalidate();
      onSaved?.();
    } catch (error) {
      console.error("Error disabling subscription plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to disable subscriptions");
    }
  };

  const isSubmitting = updatePlanMutation.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>{hasPlan ? "Your Subscription Plan" : "Set Up Your Subscription Plan"}</CardTitle>
          <CardDescription>
            Retainers pay this single monthly price for access to your locked content and community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="9.99"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  maxLength={3}
                />
              </div>
            </div>

            {/* Perks */}
            <div className="space-y-2">
              <Label>What Retainers Get</Label>
              <div className="space-y-2">
                {perks.map((perk, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm">{perk}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePerk(index)}
                      disabled={isSubmitting}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a perk (e.g., Exclusive content)"
                  value={newPerk}
                  onChange={(e) => setNewPerk(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPerk())}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPerk}
                  disabled={isSubmitting || !newPerk.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-between">
              {hasPlan && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDisable(true)}
                  disabled={isSubmitting || disablePlanMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  Turn Off Subscriptions
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <div className="flex flex-col">
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">LIVE PREVIEW</div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Retainer</CardTitle>
              <CardDescription>Subscribe to gothic creators. Support the dark arts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {price ? `$${parseFloat(price || "0").toFixed(2)}` : "—"}
                  </span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">What's Included:</h4>
                {perks.length > 0 ? (
                  <ul className="space-y-2">
                    {perks.map((perk, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{perk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No perks added yet</p>
                )}
              </div>

              <Button className="w-full" size="lg" disabled>
                Subscribe Now
              </Button>
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>Preview Note:</strong> This is how your plan appears to patrons on your profile. Changes save when you click Update Plan.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn Off Subscriptions</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your subscription price so patrons can no longer subscribe. Existing active
              subscribers must be handled first — you can't disable while patrons are actively subscribed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={disablePlanMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disablePlanMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disablePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Turn Off
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
