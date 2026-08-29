import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/os/AppShell";
import { PageHeader, Panel, Tag, SimulationBadge } from "@/components/os/primitives";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTasks } from "@/lib/use-tasks";
import { TASK_COLUMNS, empColor, type Task, type TaskStatus } from "@/lib/company-data";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Management — S-QUEST COMPANY" },
      {
        name: "description",
        content: "Kanban / List / Calendar でAI社員のタスクを一元管理。担当・優先度・依存関係・監査ログ付き。",
      },
      { property: "og:title", content: "Task Management — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "JARVISが配分し、AI社員が実行するタスクをCEOが俯瞰する。",
      },
    ],
  }),
  component: TasksPage,
});

const priorityTone = (p: string) =>
  p === "P0" ? "var(--destructive)" : p === "P1" ? "var(--warning)" : "var(--muted-foreground)";

const columnTone: Record<TaskStatus, string> = {
  BACKLOG: "var(--muted-foreground)",
  TODO: "var(--info)",
  "IN PROGRESS": "var(--primary)",
  REVIEW: "var(--emp-b)",
  DONE: "var(--success)",
  BLOCKED: "var(--destructive)",
};

function TaskChip({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="num-display text-[10px] text-muted-foreground">{task.id}</span>
        <Tag tone={priorityTone(task.priority)}>{task.priority}</Tag>
      </div>
      <p className="mt-2 text-sm leading-snug">{task.title}</p>
      <div className="mt-3 flex items-center justify-between">
        <span
          className="grid size-6 place-items-center rounded-md text-[10px] font-bold"
          style={{
            background: `color-mix(in oklab, ${empColor(task.assignee)} 16%, transparent)`,
            color: empColor(task.assignee),
          }}
        >
          {task.assignee}
        </span>
        <span className="text-[11px] text-muted-foreground">{task.due}</span>
      </div>
    </button>
  );
}

function TasksPage() {
  const [view, setView] = useState<"Kanban" | "List" | "カレンダー">("Kanban");
  const [active, setActive] = useState<Task | null>(null);
  const { tasks: TASKS, loading, error } = useTasks();

  return (
    <AppShell>
      <PageHeader
        eyebrow="マネジメント"
        title="タスク"
        description="AI社員のタスクはすべてJARVISが配分します。重要操作は承認ゲートを通過します。"
        actions={
          <>
            <SimulationBadge />
            <div className="flex rounded-lg border border-border p-1">
              {(["Kanban", "List", "カレンダー"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        }
      />

      {error ? <p className="mb-3 text-xs text-destructive">⚠️ {error}</p> : null}
      {loading && !TASKS.length ? (
        <p className="mb-3 text-xs text-muted-foreground">タスクを読み込んでいます…</p>
      ) : null}

      {view === "Kanban" ? (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {TASK_COLUMNS.map((col) => {
            const items = TASKS.filter((t) => t.status === col);
            return (
              <div key={col} className="min-w-[260px] flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: columnTone[col] }} />
                  <p className="label-caps">{col}</p>
                  <span className="num-display text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2 rounded-2xl border border-border bg-secondary/15 p-2">
                  {items.length ? (
                    items.map((t) => (
                      <TaskChip key={t.id} task={t} onOpen={() => setActive(t)} />
                    ))
                  ) : (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      タスクはありません
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "List" ? (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["ID", "Title", "Assignee", "Priority", "Status", "Due"].map((h) => (
                  <th key={h} className="label-caps px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TASKS.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setActive(t)}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
                >
                  <td className="num-display px-4 py-3 text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3">
                    <Tag tone={empColor(t.assignee)}>{t.assignee}</Tag>
                  </td>
                  <td className="px-4 py-3">
                    <Tag tone={priorityTone(t.priority)}>{t.priority}</Tag>
                  </td>
                  <td className="px-4 py-3">
                    <Tag tone={columnTone[t.status]}>{t.status}</Tag>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}

      {view === "カレンダー" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Today", "Tomorrow", "This week"].map((bucket) => (
            <Panel key={bucket}>
              <p className="label-caps mb-3">{bucket}</p>
              <div className="space-y-2">
                {TASKS.filter((t) => t.due.toLowerCase().includes(bucket.toLowerCase())).map(
                  (t) => (
                    <TaskChip key={t.id} task={t} onOpen={() => setActive(t)} />
                  ),
                )}
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active ? (
            <>
              <SheetHeader>
                <p className="num-display text-xs text-muted-foreground">{active.id}</p>
                <SheetTitle className="text-lg">{active.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 p-4 pt-0">
                <p className="text-sm text-muted-foreground">{active.description}</p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Status", active.status],
                    ["Priority", active.priority],
                    ["Assignee", active.assignee],
                    ["Created by", active.createdBy],
                    ["Due", active.due],
                    ["Project", active.project],
                    ["Workflow", active.workflow],
                    ["Dependencies", active.dependencies.join(", ") || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-border bg-secondary/30 p-3">
                      <dt className="label-caps">{k}</dt>
                      <dd className="mt-1 text-foreground/90">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="label-caps mb-2">コメント</p>
                  {active.comments.length ? (
                    <ul className="space-y-2">
                      {active.comments.map((c) => (
                        <li key={c.at} className="rounded-xl border border-border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Tag tone={empColor(c.by)}>{c.by}</Tag>
                            <span className="text-[11px] text-muted-foreground">{c.at}</span>
                          </div>
                          <p className="mt-1.5 text-foreground/90">{c.text}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">コメントはまだありません。</p>
                  )}
                </div>

                <div>
                  <p className="label-caps mb-2">アクティビティログ</p>
                  <ol className="space-y-2 border-l border-border pl-4 text-xs text-muted-foreground">
                    {active.log.length ? (
                      active.log.map((l) => (
                        <li key={l.at + l.text}>
                          <span className="num-display mr-2 text-foreground/70">{l.at}</span>
                          {l.text}
                        </li>
                      ))
                    ) : (
                      <li>ログはまだありません。</li>
                    )}
                  </ol>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
