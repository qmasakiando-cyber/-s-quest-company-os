import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  APPROVAL_LEVEL_LABEL,
  APPROVAL_LEVEL_TONE,
  type ApprovalLevel,
} from "@/lib/company-data";
import { Tag } from "./primitives";

export interface ApprovalRequest {
  title: string;
  body: string;
  action: string;
  reason: string;
  risk: string;
  expected: string;
  /** L0〜L3。未指定なら従来どおり固定の「外部公開」ゲート表示にフォールバック。 */
  approvalLevel?: ApprovalLevel;
}

export function ApprovalModal({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: ApprovalRequest;
}) {
  const decide = (approved: boolean) => {
    onOpenChange(false);
    toast[approved ? "success" : "message"](
      approved ? "承認しました" : "却下しました",
      { description: `${request.action} — SIMULATION MODE のため実処理は行われません。` },
    );
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
            <div key={k} className="rounded-xl border border-border bg-secondary/30 p-3">
              <dt className="label-caps">{k}</dt>
              <dd className="mt-1 text-foreground/90">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Tag tone={request.approvalLevel ? APPROVAL_LEVEL_TONE[request.approvalLevel] : "var(--warning)"}>
            {request.approvalLevel
              ? `${request.approvalLevel} · ${APPROVAL_LEVEL_LABEL[request.approvalLevel]}`
              : "Approval Gate · 外部公開"}
          </Tag>
          <div className="flex gap-2">
            <button
              onClick={() => decide(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent"
            >
              Reject
            </button>
            <button
              onClick={() => decide(true)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Approve
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
