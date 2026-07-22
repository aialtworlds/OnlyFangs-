import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface ReportContentButtonProps {
  contentId: number;
}

const REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright violation" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
] as const;

export function ReportContentButton({ contentId }: ReportContentButtonProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const flagMutation = trpc.moderation.flagContent.useMutation();

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          window.location.href = getLoginUrl(window.location.pathname);
        }}
      >
        <Flag size={14} className="mr-1" /> Report
      </Button>
    );
  }

  if (submitted) {
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Flag size={14} /> Reported — thank you
      </span>
    );
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag size={14} className="mr-1" /> Report
      </Button>
    );
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please choose a reason.");
      return;
    }
    try {
      await flagMutation.mutateAsync({
        contentId,
        reason: reason as "inappropriate" | "copyright" | "spam" | "other",
        description: description.trim() || undefined,
      });
      setSubmitted(true);
      setOpen(false);
      toast.success("Content reported. Our team will review it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit the report.");
    }
  };

  return (
    <div className="space-y-2 border rounded-md p-3 bg-muted/30">
      <Select value={reason} onValueChange={setReason}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Why are you reporting this?" />
        </SelectTrigger>
        <SelectContent>
          {REASONS.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Add details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-xs min-h-[60px]"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={flagMutation.isPending}>
          {flagMutation.isPending ? "Submitting..." : "Submit Report"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
