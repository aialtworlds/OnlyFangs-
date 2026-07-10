import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AppealFormProps {
  contentId: number;
  onSuccess?: () => void;
}

export default function AppealForm({ contentId, onSuccess }: AppealFormProps) {
  const [reason, setReason] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const submitAppeal = trpc.appeals.submit.useMutation({
    onSuccess: () => {
      toast.success("Appeal submitted successfully");
      setReason("");
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit appeal");
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for your appeal");
      return;
    }
    submitAppeal.mutate({ contentId, reason });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <AlertCircle size={16} />
        Appeal Decision
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-yellow-500" />
          Appeal Rejection
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          Explain why you believe this content should be reconsidered for
          publication.
        </p>

        <Textarea
          placeholder="Provide your appeal reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-4 min-h-24"
          disabled={submitAppeal.isPending}
        />

        <div className="flex gap-2">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            disabled={submitAppeal.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitAppeal.isPending || !reason.trim()}
            className="gap-2"
          >
            {submitAppeal.isPending ? (
              <>Submitting...</>
            ) : (
              <>
                <CheckCircle size={16} />
                Submit Appeal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
