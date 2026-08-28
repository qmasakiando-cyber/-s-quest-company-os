import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { ApprovalModal, type ApprovalRequest } from "@/components/os/ApprovalModal";
import { ErrorState, PageHeader, SectionTitle, SimulationBadge, Tag } from "@/components/os/primitives";
import { useWorkflows } from "@/lib/use-workflows";
import { ALERTS, APPROVAL_LEVEL_LABEL } from "@/lib/company-data";

export const Route = createFileRoute("/decisions")({
  head: () => ({
    meta: [
      { title: "CEO Decision Center — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "承認レベル L3（会社の重要意思決定＝CEO承認必須）だけを抽出する、CEO専決の意思決定センター。",
      },
      { property: "og:title", content: "CEO Decision Center — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "JARVISでもAI社員でも完結しない、CEOにしか決められないことだけをここに集約する。",
      },
    ],
  }),
  component: DecisionsPage,
});

function DecisionsPage() {
  const l3Alerts = ALERTS.filter((a) => a.approvalLevel === "L3");
  const { workflows, loading, error } = useWorkflows();
  const l3Workflows = workflows.filter((w) => w.approvalLevel === "L3");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);

  const total = l3Alerts.length + l3Workflows.length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="経営者専決事項"
        title="CEO Decision Center"
        description="JARVISの判断でもAI社員の実行でも完結しない、会社の重要意思決定（L3）だけをここに集約する。それ以外の承認（L0〜L2）は承認センターで扱う。"
        actions={
          <>
            <Link
              to="/approvals"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              承認センター（L0〜L2）を開く
            </Link>
            <SimulationBadge />
          </>
        }
      />

      <div className="mb-6 flex items-center gap-2 rounded-xl border p-3 text-xs" style={{
        borderColor: "color-mix(in oklab, var(--destructive) 40%, transparent)",
        background: "color-mix(in oklab, var(--destructive) 10%, transparent)",
        color: "var(--destructive)",
      }}>
        <Tag tone="var(--destructive)">L3</Tag>
        <span>{APPROVAL_LEVEL_LABEL.L3}</span>
      </div>

      {error ? <p className="mb-4 text-xs text-destructive">⚠️ {error}</p> : null}

      {!loading && total === 0 ? (
        <ErrorState
          tone="var(--success)"
          title="CEOが今すぐ判断すべき事項はありません"
          body="現在、会社の重要意思決定（L3）に該当する項目はありません。"
        />
      ) : (
        <div className="space-y-8">
          {l3Alerts.length ? (
            <section>
              <SectionTitle title="今すぐ判断が必要" hint="この場でApprove / Rejectできます" />
              <div className="grid gap-3 lg:grid-cols-2">
                {l3Alerts.map((a) => (
                  <div
                    key={a.title}
                    className="rounded-2xl border-2 p-5"
                    style={{
                      borderColor: "color-mix(in oklab, var(--destructive) 45%, transparent)",
                      background: "color-mix(in oklab, var(--destructive) 9%, transparent)",
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag tone="var(--destructive)">{a.level}</Tag>
                      <Tag tone="var(--destructive)">L3 · CEO承認必須</Tag>
                    </div>
                    <p className="mt-2 text-base font-semibold">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      <span className="text-foreground/70">Risk </span>
                      {a.risk}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold" style={{ color: "var(--destructive)" }}>
                      この判断はCEOのみが行えます。
                    </p>
                    <button
                      onClick={() => setSelected(a)}
                      className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      この場で判断する
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {l3Workflows.length ? (
            <section>
              <SectionTitle
                title="CEO承認必須のワークフロー"
                hint="実行のたびにCEOの承認ゲートを通過する"
              />
              <div className="grid gap-3 lg:grid-cols-2">
                {l3Workflows.map((w) => (
                  <div
                    key={w.code}
                    className="rounded-2xl border-2 p-5"
                    style={{
                      borderColor: "color-mix(in oklab, var(--destructive) 45%, transparent)",
                      background: "color-mix(in oklab, var(--destructive) 9%, transparent)",
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="num-display text-sm font-semibold text-primary">{w.code}</span>
                      <Tag tone="var(--destructive)">L3 · CEO承認必須</Tag>
                    </div>
                    <p className="mt-2 text-base font-semibold">{w.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      <span className="text-foreground/70">Approval Gate </span>
                      {w.approvalGate}
                    </p>
                    <Link
                      to="/workflows"
                      className="mt-3 inline-block rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent"
                    >
                      ワークフロー詳細を開く
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
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
    </AppShell>
  );
}
