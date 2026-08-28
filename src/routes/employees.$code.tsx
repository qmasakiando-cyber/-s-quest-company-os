import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/os/AppShell";
import { EmployeeChat } from "@/components/os/EmployeeChat";
import {
  Meter,
  PageHeader,
  Panel,
  SectionTitle,
  SimulationBadge,
  StatusPill,
  Tag,
} from "@/components/os/primitives";
import { AI_EMPLOYEES, EMPLOYEES, employeeByCode, type EmployeeStatus } from "@/lib/company-data";
import { useTasks } from "@/lib/use-tasks";
import { listEmployeeLiveStatesFn } from "@/lib/employees.functions";

export const Route = createFileRoute("/employees/$code")({
  loader: ({ params }) => {
    const employee = employeeByCode(params.code);
    if (!employee) throw notFound();
    return { employee };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Employee not found — S-QUEST COMPANY" }, { name: "robots", content: "noindex" }],
      };
    }
    const e = loaderData.employee;
    const profile = AI_EMPLOYEES[e.code];
    const title = `${e.code}・${profile.name}｜${e.name} — S-QUEST COMPANY`;
    const description = `${e.department}を担当するAI社員${e.code}。現在の状態・タスク・実績・権限・System Promptを確認する。`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: EmployeeNotFound,
  component: EmployeeDetail,
});

function EmployeeNotFound() {
  return (
    <AppShell>
      <PageHeader
        title="AI社員が見つかりません"
        description="A〜F のいずれかを指定してください。"
        actions={
          <Link
            to="/employees"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            All employees
          </Link>
        }
      />
    </AppShell>
  );
}

function EmployeeDetail() {
  const { employee: e } = Route.useLoaderData();
  const profile = AI_EMPLOYEES[e.code];
  const tone = e.accent;
  const { tasks: allTasks } = useTasks();
  const tasks = allTasks.filter((t) => t.assignee === e.code);
  const [chatStatus, setChatStatus] = useState<"working" | "idle">("idle");

  // 稼働状況（status・progress）は Supabase の ai_employees から読み込む（表示のみ、書き込みなし）
  const [live, setLive] = useState<{ status: EmployeeStatus; progress: number } | null>(null);
  const listLiveStates = useServerFn(listEmployeeLiveStatesFn);
  useEffect(() => {
    let cancelled = false;
    listLiveStates()
      .then((states) => {
        if (cancelled) return;
        const found = states.find((s) => s.code === e.code);
        if (found) setLive({ status: found.status, progress: found.progress });
      })
      .catch(() => {
        // Supabase未到達時は company-data.ts の静的値にフォールバックする
      });
    return () => {
      cancelled = true;
    };
  }, [e.code, listLiveStates]);

  const baseStatus = live?.status ?? e.status;
  const baseProgress = live?.progress ?? e.progress;
  const liveStatus = chatStatus === "working" ? "WORKING" : baseStatus;
  const active = liveStatus === "WORKING" || liveStatus === "THINKING";
  const activeStepIndex = active ? Math.floor((baseProgress / 100) * e.steps.length) : -1;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`AI社員 ${e.code}／${profile.department}`}
        title={`${e.code}・${profile.name}`}
        description={`${e.name}｜${profile.role}｜${profile.persona}`}
        actions={
          <>
            <SimulationBadge />
            <StatusPill status={liveStatus} />
          </>
        }
      />

      <div className="mb-4">
        <EmployeeChat
          code={e.code}
          personaName={profile.name}
          tone={tone}
          onStatusChange={setChatStatus}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel style={{ borderColor: `color-mix(in oklab, ${tone} 24%, var(--border))` }}>
            <SectionTitle title="進行中の仕事" hint={e.workflow} />
            <p className="text-sm">{e.currentTask}</p>
            <Meter
              className="mt-4"
              value={baseProgress}
              tone={tone}
              label={active ? `${e.code} is ${e.steps[Math.max(0, activeStepIndex)]?.toLowerCase()}…` : "進捗"}
            />
            <ol className="mt-5 grid gap-2 sm:grid-cols-5">
              {e.steps.map((s, i) => {
                const done = i < activeStepIndex;
                const current = i === activeStepIndex;
                return (
                  <li
                    key={s}
                    className="rounded-xl border px-3 py-2 text-[11px]"
                    style={{
                      borderColor: current
                        ? `color-mix(in oklab, ${tone} 45%, transparent)`
                        : "var(--border)",
                      background: current
                        ? `color-mix(in oklab, ${tone} 12%, transparent)`
                        : "transparent",
                      color: done || current ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                  >
                    {s}
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel style={{ borderColor: `color-mix(in oklab, ${tone} 24%, var(--border))` }}>
            <SectionTitle title="キャラクタープロフィール" hint={profile.englishName} />
            <p className="text-sm text-foreground/85">{profile.persona}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="label-caps mb-2">スキル</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Tag key={s} tone={tone}>
                      {s}
                    </Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-caps mb-2">ドット絵設定</p>
                <dl className="space-y-1 text-xs text-foreground/80">
                  {[
                    ["髪型", profile.pixelConfig.hairStyle],
                    ["服装", profile.pixelConfig.outfit],
                    ["アクセサリ", profile.pixelConfig.accessory],
                    ["動作", profile.pixelConfig.animationState],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="w-16 shrink-0 text-muted-foreground">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm">
              <p className="text-xs text-muted-foreground">{profile.kpi.label}</p>
              <p className="num-display mt-1">
                {profile.kpi.value}
                <span className="ml-2 text-xs text-muted-foreground">
                  / 目標 {profile.kpi.target}
                </span>
              </p>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="担当業務プロフィール" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="label-caps mb-2">担当領域</p>
                <ul className="space-y-1.5 text-sm text-foreground/85">
                  {e.responsibilities.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-caps mb-2">能力</p>
                <div className="flex flex-wrap gap-2">
                  {e.capabilities.map((c) => (
                    <Tag key={c} tone={tone}>
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="担当タスク" />
            {tasks.length ? (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm"
                  >
                    <span className="num-display text-[11px] text-muted-foreground">{t.id}</span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <Tag tone={tone}>{t.status}</Tag>
                    <span className="text-[11px] text-muted-foreground">{t.due}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                現在割り当てられたタスクはありません。JARVISから仕事を配分できます。
              </p>
            )}
          </Panel>

          <Panel>
            <SectionTitle title="システムプロンプト" hint="編集には CEO 権限が必要です" />
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-xs leading-relaxed text-foreground/85">
              {profile.systemPrompt}
            </pre>
            <p className="mt-3 text-[11px] text-muted-foreground">補足（英語版）: {e.systemPrompt}</p>
            <button
              disabled
              className="mt-3 cursor-not-allowed rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              編集（CEOのみ）
            </button>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel>
            <SectionTitle title="パフォーマンス" />
            <dl className="space-y-3 text-sm">
              {[
                ["完了タスク", String(e.performance.tasksCompleted)],
                ["成功率", `${e.performance.successRate}%`],
                ["平均処理時間", e.performance.avgCompletion],
                ["QAパス率", `${e.performance.qaPassRate}%`],
                ["本日完了", String(e.completedToday)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="num-display">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <SectionTitle title="権限" />
            <p className="label-caps mb-2">参照</p>
            <div className="flex flex-wrap gap-1.5">
              {e.permissions.read.map((r) => (
                <Tag key={r} tone="var(--muted-foreground)">
                  {r}
                </Tag>
              ))}
            </div>
            <p className="label-caps mb-2 mt-4">編集</p>
            <div className="flex flex-wrap gap-1.5">
              {e.permissions.write.map((r) => (
                <Tag key={r} tone={tone}>
                  {r}
                </Tag>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="活動ログ" />
            <ol className="space-y-3 border-l border-border pl-4 text-xs">
              {e.activity.map((a) => (
                <li key={a.at}>
                  <span className="num-display mr-2 text-muted-foreground">{a.at}</span>
                  <span className="text-foreground/85">{a.text}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <SectionTitle title="チーム" />
            <div className="flex flex-wrap gap-2">
              {EMPLOYEES.map((o) => (
                <Link
                  key={o.code}
                  to="/employees/$code"
                  params={{ code: o.code }}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                  style={{
                    borderColor:
                      o.code === e.code
                        ? `color-mix(in oklab, ${o.accent} 50%, transparent)`
                        : "var(--border)",
                    color: o.accent,
                  }}
                >
                  {o.code}・{AI_EMPLOYEES[o.code].name}
                </Link>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
