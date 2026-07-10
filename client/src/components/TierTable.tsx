import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { Edit2, Trash2, Loader2, Star, Copy } from "lucide-react";

interface Tier {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  currency?: string;
  perks?: string[] | null;
  featured?: boolean;
  sortOrder?: number;
}

interface TierTableProps {
  tiers: Tier[];
  isLoading?: boolean;
  onEdit?: (tier: Tier) => void;
  onRefresh?: () => void;
}

export function TierTable({ tiers, isLoading = false, onEdit, onRefresh }: TierTableProps) {
  const [tierToDelete, setTierToDelete] = useState<Tier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<number | null>(null);

  const deleteTierMutation = trpc.creator.deleteTier.useMutation();
  const duplicateTierMutation = trpc.creator.duplicateTier.useMutation();

  const handleDuplicate = async (tier: Tier) => {
    setIsDuplicating(tier.id);
    try {
      const result = await duplicateTierMutation.mutateAsync({ tierId: tier.id });
      toast.success(`Tier "${result.tierName}" duplicated successfully!`);
      onRefresh?.();
    } catch (error) {
      console.error("Error duplicating tier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to duplicate tier");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDelete = async () => {
    if (!tierToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTierMutation.mutateAsync({ tierId: tierToDelete.id });
      toast.success("Tier deleted successfully!");
      setTierToDelete(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting tier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete tier");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No tiers created yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Perks</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">{tier.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  Creator's Choice
                </TableCell>
                <TableCell>
                  {tier.perks && tier.perks.length > 0 ? (
                    <div className="text-xs">
                      <p className="font-medium">{tier.perks.length} perks</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {tier.perks.slice(0, 2).map((perk, i) => (
                          <li key={i}>{perk}</li>
                        ))}
                        {tier.perks.length > 2 && <li>+{tier.perks.length - 2} more</li>}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {tier.featured ? (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star size={16} fill="currentColor" />
                      <span className="text-xs">Featured</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(tier)}
                      disabled={isDeleting}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(tier)}
                      disabled={isDeleting || isDuplicating !== null}
                      title="Duplicate tier"
                    >
                      {isDuplicating === tier.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTierToDelete(tier)}
                      disabled={isDeleting || isDuplicating === tier.id}
                      className="text-destructive hover:text-destructive"
                      title="Delete tier"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!tierToDelete} onOpenChange={(open) => !open && setTierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{tierToDelete?.name}" tier? This action cannot be undone.
              Make sure there are no active subscriptions to this tier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
