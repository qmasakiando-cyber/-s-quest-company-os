import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/os/AppShell";
import {
  ApprovalModal,
  type ApprovalRequest,
} from "@/components/os/ApprovalModal";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Panel,
  SectionTitle,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { useApprovals } from "@/lib/use-approvals";
import { useTasks } from "@/lib/use-tasks";
import {
  APPROVAL_LEVEL_SHORT_LABEL,
  APPROVAL_LEVEL_TONE,
  type ApprovalLevel,
  type EmployeeCode,
  empColor,
  employeeDisplayName,
} from "@/lib/company-data";

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
        content:
          "AI社員はCEO権限を持たない。承認が必要な判断だけをここに集約する。",
      },
    ],
  }),
  component: ApprovalsPage,
});

const REQUESTERS: (EmployeeCode | "JARVIS")[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "JARVIS",
];
const APPROVAL_LEVELS: ApprovalLevel[] = ["L0", "L1", "L2", "L3"];

function ApprovalsPage() {
  const { approvals, loading, error, addApproval, decide } = useApprovals();
  const { tasks } = useTasks();

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(
    null,
  );

  const [requestedBy, setRequestedBy] = useState<EmployeeCode | "JARVIS">(
    "JARVIS",
  );
  const [approvalLevel, setApprovalLevel] = useState<ApprovalLevel>("L2");
  const [relatedTaskId, setRelatedTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [risk, setRisk] = useState("");
  const [expected, setExpected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleDecide = (id: string) => async (approved: boolean) => {
    await decide(id, approved);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !title.trim() ||
      !body.trim() ||
      !action.trim() ||
      !reason.trim() ||
      !risk.trim() ||
      !expected.trim()
    ) {
      setFormError("すべての項目を入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      await addApproval({
        requestedBy,
        approvalLevel,
        title: title.trim(),
        body: body.trim(),
        action: action.trim(),
        reason: reason.trim(),
        risk: risk.trim(),
        expected: expected.trim(),
        relatedTaskId: relatedTaskId || null,
      });
      toast.success("承認依頼を登録しました", { description: title.trim() });
      setTitle("");
      setBody("");
      setAction("");
      setReason("");
      setRisk("");
      setExpected("");
      setRelatedTaskId("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "承認依頼の登録に失敗しました。";
      setFormError(message);
      toast.error("承認依頼の登録に失敗しました", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="経営判断"
        title="承認センター"
        description="AI社員はCEO権限を持たない。外部公開・送信・支払い・契約・削除・本番変更・重要なOS更新は、すべてここでCEOが判断する。"
        actions={<SimulationBadge />}
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div>
            <SectionTitle title="承認待ち" hint={`${pending.length}件`} />
            {loading && !approvals.length ? (
              <p className="text-sm text-muted-foreground">読み込んでいます…</p>
            ) : pending.length === 0 ? (
              <ErrorState
                tone="var(--success)"
                title="承認待ちの項目はありません"
                body="現在、CEOの承認が必要な項目はありません。AI社員は通常業務を継続しています。"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pending.map((a) => (
                  <Panel
                    key={a.id}
                    className="p-4"
                    style={{
                      borderColor:
                        "color-mix(in oklab, var(--warning) 32%, transparent)",
                      background:
                        "color-mix(in oklab, var(--warning) 8%, transparent)",
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag tone={empColor(a.requestedBy)}>{a.requestedBy}</Tag>
                      <Tag tone={APPROVAL_LEVEL_TONE[a.approvalLevel]}>
                        {a.approvalLevel} ·{" "}
                        {APPROVAL_LEVEL_SHORT_LABEL[a.approvalLevel]}
                      </Tag>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{a.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      <span className="text-foreground/70">Risk </span>
                      {a.risk}
                    </p>
                    {a.relatedTaskId ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        <span className="text-foreground/70">関連タスク </span>
                        {a.relatedTaskId}
                      </p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setSelected({ ...a })}
                        className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
                      >
                        詳細を確認
                      </button>
                      <button
                        onClick={() => setRejectTarget({ ...a })}
                        className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-accent"
                      >
                        却下
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>

          <Panel className="p-0">
            <div className="p-5 pb-0">
              <SectionTitle title="対応済み" hint={`${resolved.length}件`} />
            </div>
            {resolved.length ? (
              <ul className="divide-y divide-border">
                {resolved.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <Tag
                      tone={
                        a.status === "approved"
                          ? "var(--success)"
                          : "var(--muted-foreground)"
                      }
                    >
                      {a.status === "approved" ? "承認済み" : "却下"}
                    </Tag>
                    <Tag tone={APPROVAL_LEVEL_TONE[a.approvalLevel]}>
                      {a.approvalLevel}
                    </Tag>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                      {a.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {a.decidedAt ? a.decidedAt.slice(0, 10) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="対応済みの承認依頼はありません"
                  body="承認・却下すると、ここに記録が残ります。"
                />
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <SectionTitle title="承認依頼を登録" />
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <label className="label-caps mb-1.5 block">依頼元</label>
                <select
                  value={requestedBy}
                  onChange={(e) =>
                    setRequestedBy(e.target.value as EmployeeCode | "JARVIS")
                  }
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {REQUESTERS.map((r) => (
                    <option key={r} value={r}>
                      {r === "JARVIS"
                        ? "JARVIS（AI COO）"
                        : employeeDisplayName(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">承認レベル</label>
                <select
                  value={approvalLevel}
                  onChange={(e) =>
                    setApprovalLevel(e.target.value as ApprovalLevel)
                  }
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {APPROVAL_LEVELS.map((lv) => (
                    <option key={lv} value={lv}>
                      {lv} ・ {APPROVAL_LEVEL_SHORT_LABEL[lv]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">
                  関連タスク（任意）
                </label>
                <select
                  value={relatedTaskId}
                  onChange={(e) => setRelatedTaskId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                >
                  <option value="">紐付けなし</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} ・ {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-caps mb-1.5 block">タイトル</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：承認が必要です"
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">本文</label>
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="例：C が新しいLP公開を申請しています"
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">
                  Action（何をするか）
                </label>
                <input
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="例：外部公開 / s-quest.jp/lp/diagnosis-v2"
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">Reason</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">Risk</label>
                <input
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                />
              </div>

              <div>
                <label className="label-caps mb-1.5 block">
                  Expected Result
                </label>
                <input
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary/60"
                />
              </div>

              {formError ? (
                <p className="text-xs text-destructive">⚠️ {formError}</p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "登録中…" : "登録する"}
              </button>
            </form>
          </Panel>
        </div>
      </div>

      {selected ? (
        <ApprovalModal
          open={true}
          onOpenChange={(v) => {
            if (!v) setSelected(null);
          }}
          request={selected}
          onDecide={handleDecide(selected.id)}
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
          const id = rejectTarget.id;
          setRejectTarget(null);
          decide(id, false)
            .then(() =>
              toast.message("却下しました", {
                description: rejectTarget.action,
              }),
            )
            .catch((err: unknown) =>
              toast.error("却下に失敗しました", {
                description: err instanceof Error ? err.message : undefined,
              }),
            );
        }}
      />
    </AppShell>
  );
}
