import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { TierPreview } from "./TierPreview";

interface TierFormProps {
  tier?: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    price: string;
    currency?: string;
    perks?: string[] | null;
    featured?: boolean;
    sortOrder?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TierForm({ tier, onSuccess, onCancel }: TierFormProps) {
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    slug: tier?.slug || "",
    description: tier?.description || "",
    price: tier?.price || "",
    currency: tier?.currency || "USD",
    perks: tier?.perks || [],
    featured: tier?.featured || false,
    sortOrder: tier?.sortOrder || 0,
  });

  const [newPerk, setNewPerk] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTierMutation = trpc.creator.createTier.useMutation();
  const updateTierMutation = trpc.creator.updateTier.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        toast.error("Tier name is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.slug.trim()) {
        toast.error("Slug is required");
        setIsSubmitting(false);
        return;
      }

      if (!formData.price.trim()) {
        toast.error("Price is required");
        setIsSubmitting(false);
        return;
      }

      // Validate price is a number
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Price must be a valid number");
        setIsSubmitting(false);
        return;
      }

      if (tier) {
        // Update existing tier
        await updateTierMutation.mutateAsync({
          tierId: tier.id,
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          price: formData.price,
          currency: formData.currency,
          perks: formData.perks.length > 0 ? formData.perks : null,
          featured: formData.featured,
          sortOrder: formData.sortOrder,
        });
        toast.success("Tier updated successfully!");
      } else {
        // Create new tier
        await createTierMutation.mutateAsync({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          price: formData.price,
          currency: formData.currency,
          perks: formData.perks.length > 0 ? formData.perks : undefined,
          featured: formData.featured,
          sortOrder: formData.sortOrder,
        });
        toast.success("Tier created successfully!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving tier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setFormData((prev) => ({
        ...prev,
        perks: [...prev.perks, newPerk.trim()],
      }));
      setNewPerk("");
    }
  };

  const handleRemovePerk = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>{tier ? "Edit Tier" : "Create New Tier"}</CardTitle>
          <CardDescription>
            {tier ? "Update tier details and pricing" : "Add a new membership tier"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tier Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tier Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Initiate, Acolyte, Immortal"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="e.g., initiate, acolyte"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              disabled={isSubmitting}
              pattern="^[a-z0-9_]+$"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (lowercase, numbers, underscores only)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what's included in this tier"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                placeholder="9.99"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="USD"
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                disabled={isSubmitting}
                maxLength={3}
              />
            </div>
          </div>

          {/* Perks */}
          <div className="space-y-2">
            <Label>Perks</Label>
            <div className="space-y-2">
              {formData.perks.map((perk, index) => (
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
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPerk())}
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

          {/* Featured & Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="featured" className="flex items-center gap-2">
                <input
                  id="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                  disabled={isSubmitting}
                />
                Featured Tier
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Display Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tier ? "Update Tier" : "Create Tier"}
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <div className="flex flex-col">
        <TierPreview
          name={formData.name}
          price={formData.price}
          currency={formData.currency}
          description={formData.description}
          perks={formData.perks}
          featured={formData.featured}
        />
      </div>
    </div>
  );
}
