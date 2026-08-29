import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { DemoDataBadge, Meter, PageHeader, Panel, Tag } from "@/components/os/primitives";
import { PROJECTS, empColor } from "@/lib/company-data";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — S-QUEST COMPANY" },
      {
        name: "description",
        content: "S-QUEST Diagnosis / Company / Marketing / SNS / AI Company などのプロジェクト進捗とリスクを管理。",
      },
      { property: "og:title", content: "Projects — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "各プロジェクトのオーナー・進捗・KPI・売上・担当AI社員を一覧で把握。",
      },
    ],
  }),
  component: ProjectsPage,
});

const statusTone = (s: string) =>
  s === "ON TRACK" ? "var(--success)" : s === "AT RISK" ? "var(--destructive)" : "var(--info)";

function ProjectsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="デリバリー"
        title="プロジェクト"
        description="プロジェクトごとに担当AI社員・進捗・KPI・リスクを紐づけます。"
        actions={<DemoDataBadge />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((p) => (
          <Panel key={p.name}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">{p.name}</h2>
              <Tag tone={statusTone(p.status)}>{p.status}</Tag>
            </div>
            <Meter className="mt-4" value={p.progress} label="進捗" />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {[
                ["担当", p.owner],
                ["期限", p.deadline],
                ["タスク", String(p.tasks)],
                ["マイルストーン", String(p.milestones)],
                ["KPI", p.kpi],
                ["売上", p.revenue],
                ["リスク", String(p.risks)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-caps">{k}</dt>
                  <dd className="mt-0.5 truncate text-foreground/85">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.employees.map((c) => (
                <Tag key={c} tone={empColor(c)}>
                  {c}
                </Tag>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
