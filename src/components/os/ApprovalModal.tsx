import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  APPROVAL_LEVEL_LABEL,
  APPROVAL_LEVEL_TONE,
  type ApprovalLevel,
} from "@/lib/company-data";
import { Tag } from "./primitives";

export interface ApprovalRequest {
  id: string;
  title: string;
  body: string;
  action: string;
  reason: string;
  risk: string;
  expected: string;
  approvalLevel?: ApprovalLevel;
}

export function ApprovalModal({
  open,
  onOpenChange,
  request,
  onDecide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: ApprovalRequest;
  onDecide: (approved: boolean) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  const decide = async (approved: boolean) => {
    setPending(true);
    try {
      await onDecide(approved);
      onOpenChange(false);
      toast[approved ? "success" : "message"](
        approved ? "承認しました" : "却下しました",
        {
          description: request.action,
        },
      );
    } catch (err) {
      toast.error("処理に失敗しました", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="label-caps">CEO Approval Required</DialogTitle>
        <p className="text-base font-semibold">{request.body}</p>
        <dl className="mt-2 space-y-3 text-sm">
          {[
            ["Action", request.action],
            ["Reason", request.reason],
            ["Risk", request.risk],
            ["Expected Result", request.expected],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-xl border border-border bg-secondary/30 p-3"
            >
              <dt className="label-caps">{k}</dt>
              <dd className="mt-1 text-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Tag
            tone={
              request.approvalLevel
                ? APPROVAL_LEVEL_TONE[request.approvalLevel]
                : "var(--warning)"
            }
          >
            {request.approvalLevel
              ? `${request.approvalLevel} · ${APPROVAL_LEVEL_LABEL[request.approvalLevel]}`
              : "Approval Gate · 外部公開"}
          </Tag>
          <div className="flex gap-2">
            <button
              onClick={() => void decide(false)}
              disabled={pending}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => void decide(true)}
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
