import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { DemoDataBadge, PageHeader, Panel, SectionTitle, Tag } from "@/components/os/primitives";
import { DAILY_REPORT, REPORTS } from "@/lib/company-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — S-QUEST COMPANY" },
      {
        name: "description",
        content: "AI社員からの報告を Daily / Weekly / Monthly / Strategy / Sales / Marketing / Product / QA に集約。",
      },
      { property: "og:title", content: "Reports — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "JARVISが統合したDaily Company Reportで会社の状態を1画面で把握。",
      },
    ],
  }),
  component: ReportsPage,
});

const TYPES = [
  "ALL",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "STRATEGY",
  "SALES",
  "MARKETING",
  "PRODUCT",
  "QA",
] as const;

function ReportsPage() {
  const [type, setType] = useState<(typeof TYPES)[number]>("ALL");
  const list = type === "ALL" ? REPORTS : REPORTS.filter((r) => r.type === type);

  return (
    <AppShell>
      <PageHeader
        eyebrow="インテリジェンス"
        title="レポート"
        description="AI社員の報告はJARVISが統合し、CEO向けに要約されます。"
        actions={<DemoDataBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                  (type === t
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {list.map((r) => (
              <Panel key={r.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag tone="var(--primary)">{r.type}</Tag>
                    <span className="num-display text-[11px] text-muted-foreground">{r.id}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {r.by} · {r.at}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{r.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
              </Panel>
            ))}
          </div>
        </div>

        <Panel className="h-fit">
          <SectionTitle title="デイリー全社レポート" hint="2026-08-26 · by JARVIS" />
          <dl className="space-y-3 text-sm">
            {[
              ["売上", DAILY_REPORT.revenue],
              ["Tasks completed", DAILY_REPORT.tasksCompleted],
              ["AI Employee activity", DAILY_REPORT.employeeActivity],
              ["KPI movement", DAILY_REPORT.kpiMovement],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-secondary/25 p-3">
                <dt className="label-caps">{k}</dt>
                <dd className="mt-1 text-foreground/90">{v}</dd>
              </div>
            ))}
          </dl>

          {[
            ["Problems", DAILY_REPORT.problems, "var(--destructive)"],
            ["Achievements", DAILY_REPORT.achievements, "var(--success)"],
            ["リスク", DAILY_REPORT.risks, "var(--warning)"],
            ["Tomorrow's priorities", DAILY_REPORT.tomorrow, "var(--info)"],
          ].map(([label, items, tone]) => (
            <div key={label as string} className="mt-4">
              <p className="label-caps mb-2">{label as string}</p>
              <ul className="space-y-1 text-sm">
                {(items as string[]).map((i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: tone as string }}>•</span>
                    <span className="text-foreground/85">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-5 rounded-xl border border-primary/35 bg-primary/8 p-4">
            <p className="label-caps">JARVISの提言</p>
            <p className="mt-1 text-sm">{DAILY_REPORT.recommendation}</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
