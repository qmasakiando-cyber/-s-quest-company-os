import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/os/AppShell";
import { Delta, PageHeader, Panel, SimulationBadge, Tag } from "@/components/os/primitives";
import { useKpis } from "@/lib/use-kpis";
import { empColor, type Kpi } from "@/lib/company-data";

export const Route = createFileRoute("/kpi")({
  head: () => ({
    meta: [
      { title: "KPI Dashboard — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "Business / Product / Marketing / Sales / Diagnosis / AI Company のKPIを目標比・前期比・トレンドで管理。",
      },
      { property: "og:title", content: "KPI Dashboard — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "KPI逸脱を検知するとWF-06が起動し、改善戦略が生成されます。",
      },
    ],
  }),
  component: KpiPage,
});

const CATEGORIES = [
  "ALL",
  "BUSINESS",
  "PRODUCT",
  "MARKETING",
  "SALES",
  "DIAGNOSIS",
  "AI COMPANY",
] as const;

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const chart = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone} stopOpacity={0.45} />
              <stop offset="100%" stopColor={tone} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={tone}
            strokeWidth={1.8}
            fill={`url(#g-${tone})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const tone = kpi.change >= 0 ? "var(--success)" : "var(--destructive)";
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="label-caps">{kpi.name}</p>
        <Tag tone={empColor(kpi.owner)}>{kpi.owner}</Tag>
      </div>
      <p className="num-display mt-2 text-2xl">{kpi.value}</p>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <Delta value={kpi.change} />
        <span>prev {kpi.previous}</span>
        <span>target {kpi.target}</span>
      </div>
      <Spark data={kpi.trend} tone={tone} />
    </Panel>
  );
}

function KpiPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("ALL");
  const { kpis: KPIS, loading, error } = useKpis();
  const list = cat === "ALL" ? KPIS : KPIS.filter((k) => k.category === cat);
  const risky = KPIS.filter((k) => k.change < 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="計測"
        title="KPI"
        description="主要KPIが目標比 -10% を超えると WF-06（KPI → Strategy）が自動起動します。"
        actions={<SimulationBadge />}
      />

      {error ? <p className="mb-3 text-xs text-destructive">⚠️ {error}</p> : null}
      {loading && !KPIS.length ? (
        <p className="mb-3 text-xs text-muted-foreground">KPIを読み込んでいます…</p>
      ) : null}

      {risky.length ? (
        <Panel
          className="mb-6"
          style={{ borderColor: "color-mix(in oklab, var(--destructive) 30%, var(--border))" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Tag tone="var(--destructive)">KPI ALERT</Tag>
            <p className="text-sm">
              {risky.map((r) => `${r.name} ${r.change.toFixed(1)}%`).join(" · ")}
            </p>
          </div>
        </Panel>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
              (cat === c
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((k) => (
          <KpiCard key={k.name} kpi={k} />
        ))}
      </div>
    </AppShell>
  );
}
