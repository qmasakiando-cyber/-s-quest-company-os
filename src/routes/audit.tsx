import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { PageHeader, Panel, SectionTitle, SimulationBadge, Tag } from "@/components/os/primitives";
import { AUDIT_LOGS, COMPANY_OS } from "@/lib/company-data";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — S-QUEST COMPANY" },
      {
        name: "description",
        content: "全ての重要操作の Timestamp / Actor / Action / Target / Status / Approval を記録する監査ログ。",
      },
      { property: "og:title", content: "Audit Log — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "AI社員の操作はすべて記録され、承認ゲートの通過履歴も残ります。",
      },
    ],
  }),
  component: AuditPage,
});

const statusTone = (s: string) =>
  s === "SUCCESS"
    ? "var(--success)"
    : s === "PENDING"
      ? "var(--warning)"
      : s === "RUNNING"
        ? "var(--primary)"
        : "var(--destructive)";

function AuditPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="ガバナンス"
        title="監査ログ"
        description="AI社員にCEO権限はありません。外部公開・送信・支払い・契約・削除・本番変更は承認ゲートを通過します。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Timestamp", "Actor", "Action", "Target", "Status", "Approval"].map((h) => (
                  <th key={h} className="label-caps px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map((l) => (
                <tr key={l.at + l.action} className="border-b border-border/60 last:border-0">
                  <td className="num-display px-4 py-3 text-xs text-muted-foreground">{l.at}</td>
                  <td className="px-4 py-3">{l.actor}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.target}</td>
                  <td className="px-4 py-3">
                    <Tag tone={statusTone(l.status)}>{l.status}</Tag>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.approval}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel className="h-fit">
          <SectionTitle title="承認ゲート規則" />
          <ul className="space-y-2 text-sm text-foreground/85">
            {(COMPANY_OS.RULES[0]?.value ?? "").split(" / ").map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-[var(--warning)]">•</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            ログ保持期間 365日 · 監査担当 F｜QA
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
