import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/os/AppShell";
import { DemoDataBadge, Meter, PageHeader, Panel, SectionTitle, SimulationBadge } from "@/components/os/primitives";
import { REVENUE, REVENUE_SERIES, jpy } from "@/lib/company-data";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue — S-QUEST COMPANY" },
      {
        name: "description",
        content: "Total / Monthly / MRR / ARR、収益源別内訳、経費と利益を期間別に可視化する経営ダッシュボード。",
      },
      { property: "og:title", content: "Revenue — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "Affiliate / Career / B2B / Other の収益構造と利益を一画面で把握。",
      },
    ],
  }),
  component: RevenuePage,
});

const RANGES = ["7D", "30D", "90D", "1Y", "All"] as const;

function RevenuePage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30D");
  const data = REVENUE_SERIES[range] ?? [];
  const pct = Math.round((REVENUE.monthly / REVENUE.goal) * 100);

  const streams = [
    { label: "Affiliate Revenue", value: REVENUE.affiliate, tone: "var(--emp-a)" },
    { label: "Career Revenue", value: REVENUE.career, tone: "var(--emp-e)" },
    { label: "B2B Revenue", value: REVENUE.b2b, tone: "var(--emp-d)" },
    { label: "Other Revenue", value: REVENUE.other, tone: "var(--emp-b)" },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="ファイナンス"
        title="売上"
        description="D｜Sales が集計し、F｜QA がデータ整合性を確認した実績値を表示します。"
        actions={
          <div className="flex items-center gap-2">
            <DemoDataBadge />
            <SimulationBadge />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Revenue", jpy(REVENUE.total)],
          ["Monthly Revenue", jpy(REVENUE.monthly)],
          ["MRR", jpy(REVENUE.mrr)],
          ["ARR", jpy(REVENUE.arr)],
        ].map(([k, v]) => (
          <Panel key={k} className="p-4">
            <p className="label-caps">{k}</p>
            <p className="num-display mt-2 text-2xl">{v}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle
            title="売上 / 費用 / 利益"
            action={
              <div className="flex rounded-lg border border-border p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={
                      "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors " +
                      (range === r
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  {[
                    ["rev", "var(--primary)"],
                    ["exp", "var(--destructive)"],
                    ["pro", "var(--success)"],
                  ].map(([id, tone]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={tone} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={tone} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => jpy(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  fill="url(#rev)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--destructive)"
                  fill="url(#exp)"
                  strokeWidth={1.6}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--success)"
                  fill="url(#pro)"
                  strokeWidth={1.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="label-caps">月間目標</p>
            <p className="num-display mt-2 text-3xl">{jpy(REVENUE.monthly)}</p>
            <Meter className="mt-4" value={pct} label="Achievement" />
            <p className="mt-2 text-xs text-muted-foreground">
              Goal {jpy(REVENUE.goal)} · Gap {jpy(REVENUE.goal - REVENUE.monthly)}
            </p>
          </Panel>

          <Panel>
            <SectionTitle title="売上構成" />
            <ul className="space-y-3">
              {streams.map((s) => (
                <li key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="num-display">{jpy(s.value)}</span>
                  </div>
                  <Meter
                    className="mt-1.5"
                    tone={s.tone}
                    value={Math.round((s.value / REVENUE.monthly) * 100)}
                  />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Expenses</dt>
                <dd className="num-display text-[var(--destructive)]">{jpy(REVENUE.expenses)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Profit</dt>
                <dd className="num-display text-[var(--success)]">{jpy(REVENUE.profit)}</dd>
              </div>
            </dl>
            <Link
              to="/expenses"
              className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              経費の内訳を見る（JARVIS直轄）→
            </Link>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
