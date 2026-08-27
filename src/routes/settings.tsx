import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { PageHeader, Panel, SectionTitle, SimulationBadge, Tag } from "@/components/os/primitives";
import { Switch } from "@/components/ui/switch";
import { EMPLOYEES } from "@/lib/company-data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — S-QUEST COMPANY" },
      {
        name: "description",
        content: "Simulation Mode、CEOプロファイル、AI社員の有効化、承認ゲート、外部連携アダプタの設定。",
      },
      { property: "og:title", content: "Settings — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "COMPANY OS の動作設定と、将来の外部連携アダプタの状態を管理。",
      },
    ],
  }),
  component: SettingsPage,
});

const ADAPTERS = [
  "Real LLM integration",
  "Gmail",
  "Google Calendar",
  "Slack",
  "CRM",
  "Social media",
  "Analytics",
  "Payment",
  "Affiliate",
  "Job APIs",
];

function SettingsPage() {
  const [simulation, setSimulation] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(EMPLOYEES.map((e) => [e.code, true])),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="設定"
        title="設定"
        description="現在は Simulation Mode。実処理が存在しないため、完了を偽装せず SIMULATION と明示します。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle title="シミュレーションモード" hint="API未接続でもUI動作を確認できます" />
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 p-4">
            <div>
              <p className="text-sm font-semibold">シミュレーションモード</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ON: AI社員の作業・Workflow・KPI更新をmock dataで再現します。
              </p>
            </div>
            <Switch
              checked={simulation}
              onCheckedChange={setSimulation}
              aria-label="Simulation mode"
            />
          </div>
          {!simulation ? (
            <p className="mt-3 text-xs text-[var(--warning)]">
              バックエンド未接続のため、OFFでは実データは取得されません。
            </p>
          ) : null}
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

        <Panel>
          <SectionTitle title="AI社員" hint="有効化 / 無効化" />
          <ul className="space-y-2">
            {EMPLOYEES.map((e) => (
              <li
                key={e.code}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Tag tone={e.accent}>
                    {e.code}｜{e.name}
                  </Tag>
                  <span className="text-xs text-muted-foreground">{e.department}</span>
                </div>
                <Switch
                  checked={enabled[e.code] ?? false}
                  onCheckedChange={(v) => setEnabled((s) => ({ ...s, [e.code]: v }))}
                  aria-label={`Employee ${e.code}`}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionTitle title="外部連携アダプター" hint="Adapter architecture（未接続）" />
          <div className="flex flex-wrap gap-2">
            {ADAPTERS.map((a) => (
              <span
                key={a}
                className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
              >
                {a} · NOT CONNECTED
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            接続時は CEO → JARVIS → Planner → Agent Router → A-F → Tools → QA → JARVIS → CEO
            の経路で実行されます。
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
