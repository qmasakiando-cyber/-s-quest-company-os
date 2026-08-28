import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { JarvisCore } from "@/components/os/JarvisCore";
import { PageHeader, Panel, SectionTitle, SimulationBadge } from "@/components/os/primitives";
import { AI_EMPLOYEES, EMPLOYEES } from "@/lib/company-data";

export const Route = createFileRoute("/company-map")({
  head: () => ({
    meta: [
      { title: "Company Map — S-QUEST COMPANY" },
      {
        name: "description",
        content: "CEO → JARVIS → AI社員A〜Fの組織構造を一枚で見る組織図。",
      },
      { property: "og:title", content: "Company Map — S-QUEST COMPANY" },
      { property: "og:description", content: "会社の指揮系統と役割分担を可視化する。" },
    ],
  }),
  component: CompanyMapPage,
});

function CompanyMapPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="組織"
        title="Company Map"
        description="CEOの指示はJARVISを経由してA〜Fへ配分される。AI社員同士は直接通信せず、必ずJARVIS経由で連携する。"
        actions={<SimulationBadge />}
      />

      <Panel className="overflow-x-auto p-8">
        <div className="mx-auto flex min-w-[720px] max-w-3xl flex-col items-center">
          {/* CEO */}
          <Link
            to="/profile"
            className="flex flex-col items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-8 py-4 transition-colors hover:bg-primary/15"
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              M
            </span>
            <span className="text-sm font-semibold tracking-[0.14em]">CEO</span>
            <span className="text-[11px] text-muted-foreground">安藤正騎・全権限</span>
          </Link>

          <div className="h-8 w-px bg-border" aria-hidden />

          {/* JARVIS */}
          <Link to="/jarvis" className="flex flex-col items-center gap-1">
            <JarvisCore state="IDLE" size={120} label="JARVIS" health={90} />
            <span className="text-[11px] text-muted-foreground">COMPANY COMMANDER</span>
          </Link>

          <div className="h-8 w-px bg-border" aria-hidden />
          <div className="h-px w-full bg-border" aria-hidden />

          {/* A〜F */}
          <div className="mt-0 grid w-full grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {EMPLOYEES.map((e) => {
              const persona = AI_EMPLOYEES[e.code];
              return (
                <div key={e.code} className="flex flex-col items-center gap-1.5">
                  <div className="h-6 w-px bg-border" aria-hidden />
                  <Link
                    to="/employees/$code"
                    params={{ code: e.code }}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-transform hover:-translate-y-0.5"
                    style={{
                      borderColor: `color-mix(in oklab, ${e.accent} 35%, var(--border))`,
                      background: `color-mix(in oklab, ${e.accent} 8%, transparent)`,
                    }}
                  >
                    <span
                      className="grid size-9 place-items-center rounded-lg text-xs font-bold"
                      style={{
                        background: `color-mix(in oklab, ${e.accent} 18%, transparent)`,
                        color: e.accent,
                        border: `1px solid color-mix(in oklab, ${e.accent} 40%, transparent)`,
                      }}
                    >
                      {e.code}
                    </span>
                    <span className="text-xs font-semibold">{e.name}</span>
                    <span className="text-[10px] text-muted-foreground">{persona.englishName}</span>
                    <span className="text-[10px] text-muted-foreground">{e.department}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="mt-8">
        <SectionTitle title="指揮系統" hint="COMPANY ORGANIZATION" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel className="p-4">
            <p className="label-caps">CEO</p>
            <p className="mt-2 text-sm text-foreground/90">
              会社全体の最終意思決定者。外部公開・送信・支払い・契約・削除・本番変更は必ずCEO承認を経る。
            </p>
          </Panel>
          <Panel className="p-4">
            <p className="label-caps">JARVIS</p>
            <p className="mt-2 text-sm text-foreground/90">
              COMPANY COMMANDER。タスク配分・Workflow管理・進捗監視・リスク検知・COMPANY OS更新をA〜Fに代わって統括する。
            </p>
          </Panel>
          <Panel className="p-4">
            <p className="label-caps">A〜F｜AI EMPLOYEES</p>
            <p className="mt-2 text-sm text-foreground/90">
              各領域の専門AI社員。社員同士は直接連携せず、原則JARVISを経由してタスクを受け渡す。
            </p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
