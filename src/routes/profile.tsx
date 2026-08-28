import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { PageHeader, Panel, SectionTitle, SimulationBadge, Tag } from "@/components/os/primitives";
import { ALERTS, CALENDAR_EVENTS, TASKS, empColor } from "@/lib/company-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "CEO Profile — S-QUEST COMPANY" },
      {
        name: "description",
        content: "CEOの本日のタスク・承認待ち・ミーティングを1画面で把握する。",
      },
      { property: "og:title", content: "CEO Profile — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "S-QUEST COMPANY を統括するCEOのプロフィールと本日の予定。",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const todayTasks = TASKS.filter((t) => t.due.startsWith("Today") && t.status !== "DONE");
  const approvals = ALERTS.filter((a) => a.level === "APPROVAL");
  const today = CALENDAR_EVENTS.find((d) => d.day === "TODAY");
  const meetings = (today?.items ?? []).filter((i) => i.kind === "Meeting");

  return (
    <AppShell>
      <PageHeader
        eyebrow="経営者"
        title="CEO プロフィール"
        description="今日、CEOとして把握しておくべきタスク・承認・予定をまとめたページ。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Panel className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            M
          </div>
          <div>
            <p className="text-base font-semibold">安藤正騎</p>
            <p className="label-caps mt-1">FOUNDER / CEO</p>
          </div>
          <Tag tone="var(--primary)">S-QUEST COMPANY</Tag>
          <p className="text-xs text-muted-foreground">
            JARVISを通じてAI社員A〜Fを統括し、最終意思決定を行う。
          </p>
          <Link
            to="/jarvis"
            className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            JARVISへ指示する
          </Link>
        </Panel>

        <div className="space-y-4">
          <div>
            <SectionTitle title="TODAY" hint="本日の状況を3秒で把握" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Panel className="p-4">
                <p className="label-caps">TASKS</p>
                <p className="num-display mt-2 text-3xl">{todayTasks.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">本日期限・未完了</p>
              </Panel>
              <Panel className="p-4">
                <p className="label-caps">APPROVALS</p>
                <p className="num-display mt-2 text-3xl" style={{ color: "var(--warning)" }}>
                  {approvals.length}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">CEO承認待ち</p>
              </Panel>
              <Panel className="p-4">
                <p className="label-caps">MEETINGS</p>
                <p className="num-display mt-2 text-3xl">{meetings.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">本日の予定</p>
              </Panel>
            </div>
          </div>

          <Panel>
            <SectionTitle title="本日期限のタスク" />
            {todayTasks.length ? (
              <ul className="space-y-2">
                {todayTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2.5"
                  >
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
                      style={{
                        background: `color-mix(in oklab, ${empColor(t.assignee)} 16%, transparent)`,
                        color: empColor(t.assignee),
                      }}
                    >
                      {t.assignee}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                    <Tag
                      tone={
                        t.priority === "P0"
                          ? "var(--destructive)"
                          : t.priority === "P1"
                            ? "var(--warning)"
                            : "var(--muted-foreground)"
                      }
                    >
                      {t.priority}
                    </Tag>
                    <span className="text-[11px] text-muted-foreground">{t.due}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">本日期限のタスクはありません。</p>
            )}
          </Panel>

          <Panel>
            <SectionTitle title="CEO承認が必要な項目" />
            {approvals.length ? (
              <ul className="space-y-2">
                {approvals.map((a) => (
                  <li key={a.title} className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{a.title}</span>
                      <Tag tone="var(--warning)">{a.level}</Tag>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">承認待ちの項目はありません。</p>
            )}
          </Panel>

          <Panel>
            <SectionTitle title="本日のミーティング" />
            {meetings.length ? (
              <ul className="space-y-2">
                {meetings.map((m) => (
                  <li key={m.time + m.title} className="flex items-center gap-3 text-sm">
                    <span className="num-display w-12 text-xs text-muted-foreground">{m.time}</span>
                    <span className="flex-1 truncate">{m.title}</span>
                    <Tag tone={empColor(m.who)}>{m.who}</Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">本日のミーティングはありません。</p>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
