import { useMemo, useState, useRef, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, Plus, Send } from "lucide-react";
import { AppShell } from "@/components/os/AppShell";
import { OfficeFloor } from "@/components/os/OfficeFloor";
import {
  Delta,
  DemoDataBadge,
  Meter,
  Panel,
  SectionTitle,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { ApprovalModal } from "@/components/os/ApprovalModal";
import { useCompanySimulation } from "@/lib/demo-mode";
import { useTasks } from "@/lib/use-tasks";
import { useCalendar } from "@/lib/use-calendar";
import { useKpis } from "@/lib/use-kpis";
import { useEmployeeLiveStates } from "@/lib/use-employee-live-states";
import { useApprovals } from "@/lib/use-approvals";
import { useCompanyHealth } from "@/lib/use-company-health";
import type { EventKind, EventOwner } from "@/lib/calendar.server";
import {
  ALERTS,
  APPROVAL_LEVEL_SHORT_LABEL,
  APPROVAL_LEVEL_TONE,
  DASHBOARD_KPI_NAMES,
  EMPLOYEES,
  NO_CURRENT_TASK_LABEL,
  QUICK_ACTIONS,
  REVENUE,
  computeCompanyStatus,
  formatLastActivity,
  type Approval,
  type EmployeeCode,
  empColor,
  jpy,
} from "@/lib/company-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "S-QUEST COMPANY HQ — AI Company Operating System" },
      {
        name: "description",
        content:
          "CEO × JARVIS × AI社員A〜Fが働く仮想企業のHQダッシュボード。デスクで作業するAI社員、タスク配分、Activity、KPI、売上を一画面で経営する。",
      },
      {
        property: "og:title",
        content: "S-QUEST COMPANY HQ — AI Company Operating System",
      },
      {
        property: "og:description",
        content:
          "AI社員がデスクで働く会社OS。JARVISが指示を分解し、A〜Fが実行し、成果がCOMPANY OSに蓄積される。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HqPage,
});

function HqPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<any>(null);
  const sim = useCompanySimulation();
  const { setEmployees: setSimEmployees } = sim;
  const { health: companyHealth } = useCompanyHealth();
  const healthScore = companyHealth?.total ?? 0;

  // AIオフィスフロア：status/progress/currentTask/completedToday/lastActivity
  // は ai_employees の実データで上書きする（体の微アニメーション・引き渡し演出・
  // 売上ティッカーは sim 側の演出のまま）。COMPANY STATUS バッジも同じ実データから算出。
  const { states: liveStates } = useEmployeeLiveStates();
  useEffect(() => {
    setSimEmployees((prev) =>
      prev.map((emp) => {
        const live = liveStates[emp.code];
        if (!live) return emp;
        return {
          ...emp,
          status: live.status,
          progress: live.progress,
          currentTask: live.currentTask ?? NO_CURRENT_TASK_LABEL,
          completedToday: live.completedToday,
          todayTasks: Math.max(emp.todayTasks, live.completedToday + 2),
          lastActivity: formatLastActivity(live.lastActivityAt),
        };
      }),
    );
  }, [liveStates, setSimEmployees]);
  const companyStatus = useMemo(
    () =>
      computeCompanyStatus(
        EMPLOYEES.map((e) => liveStates[e.code]?.status ?? e.status),
      ),
    [liveStates],
  );

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop?.();
    };
  }, []);

  const startVoice = () => {
    const SpeechRec =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(
        "この環境は音声入力に対応していません。Chrome など対応ブラウザでお試しください。",
      );
      return;
    }
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    recognizerRef.current = rec;
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setPrompt(text);
      setListening(false);
      void navigate({ to: "/jarvis", search: { q: text } });
    };
    rec.start();
  };

  const { kpis: KPIS } = useKpis();
  const dashboardKpis = useMemo(
    () =>
      DASHBOARD_KPI_NAMES.map((n) => KPIS.find((k) => k.name === n)).filter(
        (k): k is NonNullable<typeof k> => Boolean(k),
      ),
    [KPIS],
  );
  const revenuePct = Math.round((REVENUE.monthly / REVENUE.goal) * 100);

  // ── CEOの確認が必要（実データの承認依頼 + 静的なWARNING/CRITICALアラート） ──
  const { approvals: allApprovals, decide: decideApproval } = useApprovals();
  const pendingApprovals = allApprovals.filter((a) => a.status === "pending");
  const staticAlerts = ALERTS.filter((a) => a.level !== "APPROVAL");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(
    null,
  );

  // ── quick task board (ダッシュボードから直接タスク管理、Supabase永続化) ──
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask: addTaskRemote,
    toggleTaskDone: toggleTaskDoneRemote,
  } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<EmployeeCode>("B");
  const [taskActionError, setTaskActionError] = useState<string | null>(null);

  const toggleTaskDone = (id: string) => {
    setTaskActionError(null);
    toggleTaskDoneRemote(id).catch((err: unknown) => {
      setTaskActionError(
        err instanceof Error ? err.message : "タスクの更新に失敗しました。",
      );
    });
  };

  const addTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    setTaskActionError(null);
    setNewTaskTitle("");
    addTaskRemote(title, newTaskAssignee).catch((err: unknown) => {
      setTaskActionError(
        err instanceof Error ? err.message : "タスクの追加に失敗しました。",
      );
    });
  };

  const taskGroups = [
    "IN PROGRESS",
    "REVIEW",
    "TODO",
    "BLOCKED",
    "DONE",
  ] as const;
  const GROUP_JA: Record<(typeof taskGroups)[number], string> = {
    "IN PROGRESS": "進行中",
    REVIEW: "レビュー中",
    TODO: "未着手",
    BLOCKED: "ブロック中",
    DONE: "完了",
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    void navigate({ to: "/jarvis", search: { q: text } });
  };

  // ── quick calendar widget（ダッシュボードから予定を追加、Supabase永続化） ──
  const { days: calendarDays, error: calendarError, addEvent } = useCalendar();
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("18:00");
  const [newEventOwner, setNewEventOwner] = useState<EventOwner>("CEO");
  const [eventActionError, setEventActionError] = useState<string | null>(null);

  const addCalendarEvent = () => {
    const title = newEventTitle.trim();
    if (!title) return;
    setEventActionError(null);
    const [hh, mm] = newEventTime.split(":").map(Number);
    const startAt = new Date();
    startAt.setHours(hh ?? 18, mm ?? 0, 0, 0);
    setNewEventTitle("");
    addEvent({
      title,
      startAt: startAt.toISOString(),
      kind: "Meeting" as EventKind,
      owner: newEventOwner,
    }).catch((err: unknown) => {
      setEventActionError(
        err instanceof Error ? err.message : "予定の追加に失敗しました。",
      );
    });
  };

  return (
    <AppShell>
      {/* ── HQ header ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">
            S-QUEST COMPANY 本社 · 2026年8月26日（水）21:38 JST
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            こんばんは、CEO。
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            現在 {sim.workingCount} 名のAI社員が稼働中。JARVIS
            が会社を統括しています。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimulationBadge />
          <Link to="/company-health">
            <Tag tone="var(--success)">会社健全性 {healthScore}/100</Tag>
          </Link>
          <Tag tone="var(--primary)">本日売上 {jpy(sim.revenueToday)}</Tag>
        </div>
      </div>

      {/* ── CEO COMMAND ── */}
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label-caps">CEO指示 — AI社員へ指示</p>
          <span className="text-[11px] text-muted-foreground">
            指示は JARVIS が分解し、A〜F へ配分します
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(prompt);
          }}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 p-2 focus-within:border-primary/60"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例：S-QUESTのInstagram集客戦略を作って"
            aria-label="JARVISへの指示"
            className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={startVoice}
            aria-label="音声で指示する"
            title="音声で指示する"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors"
            style={
              listening
                ? {
                    borderColor: "var(--destructive)",
                    color: "var(--destructive)",
                    background:
                      "color-mix(in oklab, var(--destructive) 12%, transparent)",
                    animation: "core-pulse 1s ease-in-out infinite",
                  }
                : { borderColor: "var(--border)" }
            }
          >
            <Mic className="size-4" aria-hidden />
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Send className="size-3.5" aria-hidden />
            指示を出す
          </button>
        </form>
        {listening ? (
          <p className="mt-2 text-[11px] font-semibold text-destructive">
            🎙 聞いています...
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </Panel>

      {/* ── AI OFFICE FLOOR ── */}
      <section className="mt-8">
        <SectionTitle
          title="AIオフィスフロア"
          hint="A〜FのAI社員はすべて JARVIS を経由して連携します"
          action={
            <Link
              to="/employees"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              社員一覧
            </Link>
          }
        />
        <OfficeFloor
          employees={sim.employees}
          handoff={sim.handoff}
          questState={sim.questState}
          questMessage={sim.questMessage}
          health={healthScore}
          currentTask="WF-06｜KPI Gap → Strategy → Sales リカバリー"
          companyStatus={companyStatus}
        />
      </section>

      {/* ── Approvals / alerts ── */}
      <section className="mt-8">
        <SectionTitle
          title="CEOの確認が必要"
          action={
            <Link
              to="/approvals"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              承認センターを開く
            </Link>
          }
        />
        {pendingApprovals.length === 0 && staticAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            現在、CEOの確認が必要な項目はありません。
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {pendingApprovals.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border p-4"
                style={{
                  borderColor:
                    "color-mix(in oklab, var(--warning) 32%, transparent)",
                  background:
                    "color-mix(in oklab, var(--warning) 8%, transparent)",
                }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag tone="var(--warning)">APPROVAL</Tag>
                  <Tag tone={APPROVAL_LEVEL_TONE[a.approvalLevel]}>
                    {a.approvalLevel} ·{" "}
                    {APPROVAL_LEVEL_SHORT_LABEL[a.approvalLevel]}
                  </Tag>
                </div>
                <p className="mt-2 text-sm font-semibold">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setSelectedApproval(a)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                  >
                    承認画面を開く
                  </button>
                </div>
              </div>
            ))}
            {staticAlerts.map((a) => {
              const tone =
                a.level === "CRITICAL" ? "var(--destructive)" : "var(--emp-d)";
              return (
                <div
                  key={a.title}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: `color-mix(in oklab, ${tone} 32%, transparent)`,
                    background: `color-mix(in oklab, ${tone} 8%, transparent)`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag tone={tone}>{a.level}</Tag>
                    <DemoDataBadge />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── KPI row ── */}
      <section className="mt-8">
        <SectionTitle
          title="KPIサマリー"
          action={
            <Link
              to="/kpi"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Open KPI
            </Link>
          }
        />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {dashboardKpis.map((k) => (
            <Panel key={k.name} className="min-w-[210px] p-4">
              <p className="label-caps truncate">{k.name}</p>
              <p className="num-display mt-2 text-2xl">{k.value}</p>
              <div className="mt-1 flex items-center justify-between">
                <Delta value={k.change} />
                <span className="text-[11px] text-muted-foreground">
                  Target {k.target}
                </span>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* ── Tasks / Activity / Revenue ── */}
      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle
            title="全社タスク"
            action={
              <Link
                to="/tasks"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Open tasks
              </Link>
            }
          />

          {/* クイック追加 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTask();
            }}
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="タスクを追加..."
              aria-label="新しいタスク"
              className="h-9 min-w-[180px] flex-1 rounded-lg border border-border bg-secondary/40 px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
            />
            <select
              value={newTaskAssignee}
              onChange={(e) =>
                setNewTaskAssignee(e.target.value as EmployeeCode)
              }
              aria-label="担当AI社員"
              className="h-9 rounded-lg border border-border bg-secondary/40 px-2 text-xs outline-none"
            >
              {(["A", "B", "C", "D", "E", "F"] as const).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" aria-hidden />
              追加
            </button>
          </form>

          {tasksError || taskActionError ? (
            <p className="mb-3 text-xs text-destructive">
              ⚠️ {tasksError ?? taskActionError}
            </p>
          ) : null}
          {tasksLoading && !tasks.length ? (
            <p className="mb-3 text-xs text-muted-foreground">
              タスクを読み込んでいます…
            </p>
          ) : null}

          <div className="space-y-4">
            {taskGroups.map((group) => {
              const items = tasks.filter((t) => t.status === group);
              if (!items.length) return null;
              return (
                <div key={group}>
                  <p className="label-caps mb-2">
                    {GROUP_JA[group]} · {items.length}件
                  </p>
                  <ul className="space-y-2">
                    {items.map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskDone(t.id)}
                          aria-label={
                            t.status === "DONE" ? "未完了に戻す" : "完了にする"
                          }
                          className="grid size-5 shrink-0 place-items-center rounded-md border text-[10px] font-bold transition-colors"
                          style={
                            t.status === "DONE"
                              ? {
                                  background: "var(--success)",
                                  borderColor: "var(--success)",
                                  color: "var(--background)",
                                }
                              : { borderColor: "var(--border)" }
                          }
                        >
                          {t.status === "DONE" ? "✓" : ""}
                        </button>
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
                          style={{
                            background: `color-mix(in oklab, ${empColor(t.assignee)} 16%, transparent)`,
                            color: empColor(t.assignee),
                          }}
                        >
                          {t.assignee}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${t.status === "DONE" ? "text-muted-foreground line-through" : ""}`}
                        >
                          {t.title}
                        </span>
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
                        <span className="text-[11px] text-muted-foreground">
                          {t.due}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <p className="label-caps">売上</p>
            <p className="num-display mt-2 text-3xl">{jpy(REVENUE.monthly)}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>本日売上 {jpy(sim.revenueToday)}</span>
              <Link to="/revenue" className="hover:text-foreground">
                Detail
              </Link>
            </div>
            <Meter className="mt-4" value={revenuePct} label="月間達成率" />
          </Panel>

          <Panel>
            <SectionTitle
              title="カレンダー"
              action={
                <Link
                  to="/calendar"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  7 days
                </Link>
              }
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCalendarEvent();
              }}
              className="mb-3 flex flex-wrap items-center gap-1.5"
            >
              <input
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="予定を追加..."
                aria-label="新しい予定"
                className="h-8 min-w-[120px] flex-1 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
              />
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                aria-label="時刻"
                className="h-8 rounded-lg border border-border bg-secondary/40 px-2 text-xs outline-none"
              />
              <select
                value={newEventOwner}
                onChange={(e) => setNewEventOwner(e.target.value as EventOwner)}
                aria-label="担当"
                className="h-8 rounded-lg border border-border bg-secondary/40 px-1.5 text-xs outline-none"
              >
                {(["CEO", "JARVIS", "A", "B", "C", "D", "E", "F"] as const).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="size-3.5" aria-hidden />
                追加
              </button>
            </form>
            {calendarError || eventActionError ? (
              <p className="mb-2 text-xs text-destructive">
                ⚠️ {calendarError ?? eventActionError}
              </p>
            ) : null}
            <ul className="space-y-2">
              {(calendarDays[0]?.items ?? []).map((i) => (
                <li
                  key={i.time + i.title}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="num-display w-12 text-xs text-muted-foreground">
                    {i.time}
                  </span>
                  <span className="flex-1 truncate">{i.title}</span>
                  <Tag tone={empColor(i.who)}>{i.who}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      {/* ── Live activity feed ── */}
      <section className="mt-8">
        <SectionTitle
          title="全社アクティビティ"
          hint="DEMO MODE · 会社ログはリアルタイムで更新されます"
        />
        <Panel>
          <ol className="relative space-y-4 border-l border-border pl-5">
            {sim.activity.map((a) => (
              <li key={a.id} className="relative">
                <span
                  className="absolute -left-[27px] top-1.5 size-2.5 rounded-full ring-4 ring-[var(--card)]"
                  style={{ background: empColor(a.actor) }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num-display text-xs text-muted-foreground">
                    {a.at}
                  </span>
                  <Tag tone={empColor(a.actor)}>{a.actor}</Tag>
                  <span className="text-sm">{a.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      {selectedApproval ? (
        <ApprovalModal
          open={true}
          onOpenChange={(v) => {
            if (!v) setSelectedApproval(null);
          }}
          request={selectedApproval}
          onDecide={(approved) => decideApproval(selectedApproval.id, approved)}
        />
      ) : null}
    </AppShell>
  );
}
