import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/os/AppShell";
import { ApprovalModal, type ApprovalRequest } from "@/components/os/ApprovalModal";
import {
  ConfirmDialog,
  ErrorState,
  PageHeader,
  Panel,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { ALERTS, APPROVAL_LEVEL_SHORT_LABEL, APPROVAL_LEVEL_TONE } from "@/lib/company-data";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approval Center — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "外部公開・送信・支払い・契約・削除・本番変更など、CEO承認が必要な項目だけを集約する承認センター。",
      },
      { property: "og:title", content: "Approval Center — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "AI社員はCEO権限を持たない。承認が必要な判断だけをここに集約する。",
      },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const approvals: ApprovalRequest[] = ALERTS.filter((a) => a.level === "APPROVAL");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null);

  return (
    <AppShell>
      <PageHeader
        eyebrow="経営判断"
        title="承認センター"
        description="AI社員はCEO権限を持たない。外部公開・送信・支払い・契約・削除・本番変更・重要なOS更新は、すべてここでCEOが判断する。"
        actions={<SimulationBadge />}
      />

      {approvals.length === 0 ? (
        <ErrorState
          tone="var(--success)"
          title="承認待ちの項目はありません"
          body="現在、CEOの承認が必要な項目はありません。AI社員は通常業務を継続しています。"
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {approvals.map((a) => (
            <Panel
              key={a.title}
              className="p-4"
              style={{
                borderColor: "color-mix(in oklab, var(--warning) 32%, transparent)",
                background: "color-mix(in oklab, var(--warning) 8%, transparent)",
              }}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag tone="var(--warning)">APPROVAL</Tag>
                {a.approvalLevel ? (
                  <Tag tone={APPROVAL_LEVEL_TONE[a.approvalLevel]}>
                    {a.approvalLevel} · {APPROVAL_LEVEL_SHORT_LABEL[a.approvalLevel]}
                  </Tag>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-semibold">{a.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="text-foreground/70">Risk </span>
                {a.risk}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSelected(a)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                >
                  詳細を確認
                </button>
                <button
                  onClick={() => setRejectTarget(a)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-accent"
                >
                  却下
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {selected ? (
        <ApprovalModal
          open={true}
          onOpenChange={(v) => {
            if (!v) setSelected(null);
          }}
          request={selected}
        />
      ) : null}

      <ConfirmDialog
        open={rejectTarget !== null}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
        title="この申請を却下しますか？"
        description={rejectTarget?.body ?? ""}
        confirmLabel="却下する"
        danger
        onConfirm={() => {
          if (!rejectTarget) return;
          toast.message("却下しました", {
            description: `${rejectTarget.action} — SIMULATION MODE のため実処理は行われません。`,
          });
          setRejectTarget(null);
        }}
      />
    </AppShell>
  );
}
