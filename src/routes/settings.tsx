import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { PageHeader, Panel, SectionTitle, SimulationBadge } from "@/components/os/primitives";
import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — S-QUEST COMPANY" },
      {
        name: "description",
        content: "CEOプロファイルと外部連携アダプタの接続状況を管理。",
      },
      { property: "og:title", content: "Settings — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "COMPANY OS の動作設定と、外部連携アダプタの接続状況を管理。",
      },
    ],
  }),
  component: SettingsPage,
});

const ADAPTERS = [
  { name: "Real LLM integration", connected: true },
  { name: "Gmail", connected: false },
  { name: "Google Calendar", connected: true },
  { name: "Slack", connected: false },
  { name: "CRM", connected: false },
  { name: "Social media", connected: false },
  { name: "Analytics", connected: false },
  { name: "Payment", connected: false },
  { name: "Affiliate", connected: false },
  { name: "Job APIs", connected: false },
];

function SettingsPage() {
  const connectedCount = ADAPTERS.filter((a) => a.connected).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="設定"
        title="設定"
        description="CEOプロファイルと外部連携アダプタの接続状況を確認します。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="シミュレーションモード" hint="コード内の DEMO_MODE 定数で切り替えます" />
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 p-4">
            <div>
              <p className="text-sm font-semibold">シミュレーションモード</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ON: AI社員のオフィスフロア演出（引き渡しアニメーション・活動ログ・売上ティッカー）をmock
                dataで再現します。タスク・KPI・カレンダー等の実データ表示には影響しません。
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                DEMO_MODE
                  ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                  : "bg-[var(--success)]/15 text-[var(--success)]",
              )}
            >
              {DEMO_MODE ? "ON" : "OFF"}
            </span>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="CEOプロフィール" />
          <dl className="space-y-3 text-sm">
            {[
              ["Name", "安藤正騎"],
              ["Role", "CEO"],
              ["アクセス権", "FULL ACCESS"],
              ["Company", "S-QUEST"],
              ["Timezone", "Asia/Tokyo (UTC+9)"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle
            title="外部連携アダプター"
            hint={`${connectedCount}/${ADAPTERS.length} 接続済み`}
          />
          <div className="flex flex-wrap gap-2">
            {ADAPTERS.map((a) => (
              <span
                key={a.name}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs",
                  a.connected
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-dashed border-border text-muted-foreground",
                )}
              >
                {a.name} · {a.connected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            未接続のアダプターは、接続後 CEO → JARVIS → Planner → Agent Router → A-F → Tools → QA
            → JARVIS → CEO の経路で実行されます。
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
