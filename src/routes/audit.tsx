import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import {
  EmptyState,
  PageHeader,
  Panel,
  SectionTitle,
  Tag,
} from "@/components/os/primitives";
import { auditActorColor, useAuditLogs } from "@/lib/use-audit";
import { useCompanyOsEntries } from "@/lib/use-company-os";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "全ての重要操作の Timestamp / Actor / Action / Target を記録する監査ログ。",
      },
      { property: "og:title", content: "Audit Log — S-QUEST COMPANY" },
      {
        property: "og:description",
        content:
          "承認申請/決定・タスク作成/ステータス変更・経費/売上の記帳をすべて記録します。",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { logs, loading, error } = useAuditLogs();
  const { entries: osEntries } = useCompanyOsEntries();
  const approvalGateRule = osEntries.find(
    (e) => e.category === "RULES" && e.key === "Approval Gate",
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="ガバナンス"
        title="監査ログ"
        description="AI社員にCEO権限はありません。外部公開・送信・支払い・契約・削除・本番変更は承認ゲートを通過します。"
      />

      {error ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel className="overflow-x-auto p-0">
          {loading && !logs.length ? (
            <p className="p-5 text-sm text-muted-foreground">
              読み込んでいます…
            </p>
          ) : logs.length ? (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Timestamp", "Actor", "Action", "Target"].map((h) => (
                    <th key={h} className="label-caps px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="num-display px-4 py-3 text-xs text-muted-foreground">
                      {l.createdAt.replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-4 py-3">
                      <Tag tone={auditActorColor(l.actor)}>{l.actor}</Tag>
                    </td>
                    <td className="px-4 py-3">{l.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState
                title="記録がありません"
                body="タスクの作成・承認の申請/決定・経費/売上の記帳を行うと、ここに記録されます。"
              />
            </div>
          )}
        </Panel>

        <Panel className="h-fit">
          <SectionTitle title="承認ゲート規則" />
          <ul className="space-y-2 text-sm text-foreground/85">
            {(approvalGateRule?.value ?? "").split(" / ").map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-[var(--warning)]">•</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            監査担当 F｜QA · 記録は削除されません（証跡として全件保持）
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
