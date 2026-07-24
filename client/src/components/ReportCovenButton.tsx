import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReportCovenButtonProps {
  covenId: number;
  postId: number;
  commentId?: number; // omit to report the post itself, include to report a specific comment
}

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Threat / Harassment" },
  { value: "other", label: "Other" },
] as const;

export function ReportCovenButton({ covenId, postId, commentId }: ReportCovenButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reportMutation = trpc.coven.report.useMutation();

  if (submitted) {
    return (
      <span style={{ fontSize: "9px", color: "oklch(0.45 0.02 60)", fontStyle: "italic" }}>
        Reported — thank you
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: "9px",
          fontFamily: "'Cinzel', serif",
          background: "none",
          border: "none",
          color: "oklch(0.45 0.02 60)",
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Report
      </button>
    );
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please choose a reason.");
      return;
    }
    try {
      const result = await reportMutation.mutateAsync({
        covenId,
        postId,
        commentId,
        reason: reason as "spam" | "harassment" | "other",
        description: description.trim() || undefined,
      });
      setSubmitted(true);
      setOpen(false);
      toast.success(
        result.escalated
          ? "Reported to platform admins for review."
          : "Reported to the coven's staff."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit the report.");
    }
  };

  return (
    <div
      style={{
        marginTop: "6px",
        padding: "10px",
        background: "oklch(0.06 0.01 285)",
        border: "1px solid oklch(0.72 0.09 75 / 15%)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxWidth: "260px",
      }}
    >
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{
          fontSize: "10px",
          background: "oklch(0.08 0.015 330)",
          color: "oklch(0.93 0.02 80)",
          border: "1px solid oklch(0.72 0.09 75 / 20%)",
          padding: "6px",
        }}
      >
        <option value="">Why are you reporting this?</option>
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Add details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        style={{
          fontSize: "10px",
          background: "oklch(0.08 0.015 330)",
          color: "oklch(0.93 0.02 80)",
          border: "1px solid oklch(0.72 0.09 75 / 20%)",
          padding: "6px",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={handleSubmit}
          disabled={reportMutation.isPending}
          style={{
            fontSize: "9px",
            fontFamily: "'Cinzel', serif",
            background: "oklch(0.72 0.09 75)",
            color: "oklch(0.04 0.008 285)",
            border: "none",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          {reportMutation.isPending ? "Submitting..." : "Submit"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{
            fontSize: "9px",
            fontFamily: "'Cinzel', serif",
            background: "none",
            color: "oklch(0.45 0.02 60)",
            border: "none",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
