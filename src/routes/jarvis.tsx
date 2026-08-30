import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { askJarvis, confirmJarvisTaskFn } from "@/lib/jarvis.functions";
import type { JarvisMode } from "@/lib/jarvis-prompt";
import { useVoiceInput, useVoiceOutput } from "@/lib/voice";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/os/AppShell";
import { JarvisCore } from "@/components/os/JarvisCore";
import {
  Panel,
  PageHeader,
  SectionTitle,
  SimulationBadge,
  Tag,
  Meter,
} from "@/components/os/primitives";
import { useTasks } from "@/lib/use-tasks";
import { useKpis } from "@/lib/use-kpis";
import { useEmployeeLiveStates } from "@/lib/use-employee-live-states";
import { useRevenue } from "@/lib/use-revenue";
import {
  ACTIVITY,
  EMPLOYEES,
  JARVIS_EXAMPLES,
  QUICK_ACTIONS,
  empColor,
  jpy,
  type EmployeeCode,
  type Priority,
} from "@/lib/company-data";

export const Route = createFileRoute("/jarvis")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "JARVIS Command Center — S-QUEST COMPANY" },
      {
        name: "description",
        content:
          "JARVISがCEOの指示を分解し、AI社員A〜Fへ仕事を配分するオーケストレーション画面。",
      },
      {
        property: "og:title",
        content: "JARVIS Command Center — S-QUEST COMPANY",
      },
      {
        property: "og:description",
        content:
          "指示 → 分解 → 配分 → 統合 → CEO承認。会社を動かすオーケストレーター。",
      },
    ],
  }),
  component: JarvisPage,
});

/** JARVISが会話から提案する、唯一のアクション（v1）。実行はCEOの実行ボタン確認を経る。 */
interface ProposedTask {
  title: string;
  assignee: EmployeeCode;
  priority?: Priority | undefined;
}

interface Message {
  id: number;
  role: "CEO" | "JARVIS";
  text: string;
  /** このJARVISメッセージがどちらのモードで生成されたか（CEO側メッセージには付けない）。 */
  mode?: JarvisMode | undefined;
  /** trueの場合、text はエラーメッセージ（⚠️〜）。提案カード等を出さないためのフラグ。 */
  error?: boolean | undefined;
  proposedTask?: ProposedTask | undefined;
  /** 実行ボタンを押した後の状態。"executing"中は多重クリックを防ぐ。 */
  taskExecution?:
    | { status: "executing" }
    | { status: "done"; taskId: string }
    | { status: "failed"; message: string }
    | undefined;
}

/**
 * 相談モードの単発トリガー：「JARVIS、」（全角/半角どちらのカンマも可）で始まる
 * メッセージは、現在のモードトグルの状態に関わらずそのメッセージだけ相談モード扱いにする。
 */
const CONSULTATION_PREFIX_RE = /^\s*jarvis\s*[、,]/i;
const isConsultationTrigger = (text: string) =>
  CONSULTATION_PREFIX_RE.test(text);

function JarvisPage() {
  const { q } = Route.useSearch();
  const ask = useServerFn(askJarvis);
  const confirmTask = useServerFn(confirmJarvisTaskFn);
  const { tasks } = useTasks();
  const { kpis } = useKpis();
  const { monthlyTotal: monthlyRevenue, goal: revenueGoal } = useRevenue();
  const { states: liveStates } = useEmployeeLiveStates();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "JARVIS",
      text: "CEO、おかえりなさい。現在 WF-06（KPI → 戦略）を実行中です。承認待ちが1件あります。ご指示をどうぞ。",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<JarvisMode>("instruction");
  const nextId = useRef(2);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    [],
  );
  const submitRef = useRef<(text: string, modeOverride?: JarvisMode) => void>(
    () => {},
  );
  const voiceOut = useVoiceOutput();
  const voiceIn = useVoiceInput((text) => submitRef.current(text));

  /**
   * modeOverrideを渡した場合はモードトグルの状態を無視してそのモードで送信する
   * （相談内容を指示モードへ引き継ぐ「タスク化」ボタン用）。渡さない場合は、
   * 「JARVIS、」の単発トリガーを優先し、なければ現在のモードトグルに従う。
   */
  const submit = (text: string, modeOverride?: JarvisMode) => {
    const value = text.trim();
    if (!value || pending) return;
    const effectiveMode: JarvisMode =
      modeOverride ?? (isConsultationTrigger(value) ? "consultation" : mode);
    const ceoId = nextId.current++;
    const jarvisId = nextId.current++;
    setMessages((m) => [
      ...m,
      { id: ceoId, role: "CEO", text: value },
      { id: jarvisId, role: "JARVIS", text: "", mode: effectiveMode },
    ]);
    setInput("");
    setPending(true);
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: value },
    ];

    void ask({ data: { messages: historyRef.current, mode: effectiveMode } })
      .then(({ reply, proposedTask }) => {
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: reply },
        ];
        setMessages((m) =>
          m.map((x) =>
            x.id === jarvisId ? { ...x, text: reply, proposedTask } : x,
          ),
        );
        void voiceOut.speak(reply);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "JARVISとの通信に失敗しました。";
        setMessages((m) =>
          m.map((x) =>
            x.id === jarvisId
              ? {
                  ...x,
                  text: `⚠️ ${msg}`,
                  proposedTask: undefined,
                  error: true,
                }
              : x,
          ),
        );
      })
      .finally(() => setPending(false));
  };

  submitRef.current = submit;

  const escalateToInstruction = () => {
    setMode("instruction");
    submit("この相談内容を踏まえて、実行計画を作ってください。", "instruction");
  };

  /** JARVISが提案したタスクを、CEOの実行ボタン確認を経て実際に作成する。 */
  const executeProposedTask = (messageId: number, task: ProposedTask) => {
    setMessages((m) =>
      m.map((x) =>
        x.id === messageId
          ? { ...x, taskExecution: { status: "executing" } }
          : x,
      ),
    );
    void confirmTask({ data: task })
      .then((created) => {
        setMessages((m) =>
          m.map((x) =>
            x.id === messageId
              ? {
                  ...x,
                  taskExecution: { status: "done", taskId: created.id },
                }
              : x,
          ),
        );
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "タスクの作成に失敗しました。";
        setMessages((m) =>
          m.map((x) =>
            x.id === messageId
              ? { ...x, taskExecution: { status: "failed", message: msg } }
              : x,
          ),
        );
      });
  };

  useEffect(() => {
    if (q) submit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const working = EMPLOYEES.filter(
    (e) => e.status === "WORKING" || e.status === "REVIEW",
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="司令塔"
        title="JARVIS 司令センター"
        description="CEOの意図を分解し、AI社員に配分し、結果を統合して報告します。内部の思考過程ではなく「実行内容」を提示します。"
        actions={<SimulationBadge />}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <Panel className="flex items-center gap-5">
            <JarvisCore state={pending ? "THINKING" : "WORKING"} size={132} />
            <div className="min-w-0">
              <p className="label-caps">現在のオーケストレーション</p>
              <p className="mt-1 text-sm">
                WF-06 を実行中。A / D / E の一次データを統合し、B
                が改善戦略を設計しています。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {working.map((e) => (
                  <Tag key={e.code} tone={e.accent}>
                    {e.code} {e.status}
                  </Tag>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="p-0">
            <div
              ref={scrollRef}
              className="max-h-[560px] space-y-5 overflow-y-auto p-5"
            >
              {messages.map((m) =>
                m.role === "CEO" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <div className="mt-1 size-8 shrink-0 rounded-full bg-[radial-gradient(circle_at_40%_35%,color-mix(in_oklab,var(--primary)_90%,white),var(--primary)_60%,transparent)]" />
                    <div className="min-w-0 flex-1 space-y-3">
                      {m.mode === "consultation" ? (
                        <Tag tone="var(--emp-b)">相談モード</Tag>
                      ) : null}
                      {m.text ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {m.text}
                        </p>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                          JARVIS が思考中です…
                        </p>
                      )}
                      {m.mode === "consultation" && m.text && !m.error ? (
                        <button
                          onClick={escalateToInstruction}
                          disabled={pending}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                        >
                          この内容を指示モードで実行案にする
                        </button>
                      ) : null}
                      {m.proposedTask ? (
                        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                          <p className="label-caps">タスク作成の提案</p>
                          <div className="mt-3 flex items-center gap-3">
                            <span
                              className="grid size-7 place-items-center rounded-lg text-[11px] font-bold"
                              style={{
                                background: `color-mix(in oklab, ${empColor(m.proposedTask.assignee)} 16%, transparent)`,
                                color: empColor(m.proposedTask.assignee),
                              }}
                            >
                              {m.proposedTask.assignee}
                            </span>
                            <span className="text-sm">
                              {m.proposedTask.title}
                            </span>
                            {m.proposedTask.priority ? (
                              <Tag tone="var(--muted-foreground)">
                                {m.proposedTask.priority}
                              </Tag>
                            ) : null}
                          </div>

                          {m.taskExecution?.status === "done" ? (
                            <p className="mt-4 text-sm text-success">
                              ✅ タスクを作成しました：{m.taskExecution.taskId}
                              。
                              <Link
                                to="/tasks"
                                className="ml-1 underline underline-offset-2"
                              >
                                タスク一覧を開く
                              </Link>
                            </p>
                          ) : (
                            <div className="mt-4 flex items-center gap-2">
                              <button
                                onClick={() =>
                                  executeProposedTask(m.id, m.proposedTask!)
                                }
                                disabled={
                                  m.taskExecution?.status === "executing"
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                              >
                                {m.taskExecution?.status === "executing"
                                  ? "作成しています…"
                                  : "実行（タスクを作成）"}
                              </button>
                              {m.taskExecution?.status === "failed" ? (
                                <span className="text-xs text-destructive">
                                  ⚠️ {m.taskExecution.message}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex rounded-lg border border-border p-1">
                  {(["instruction", "consultation"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      aria-pressed={mode === m}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                        mode === m
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "instruction" ? "指示モード" : "相談モード"}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {mode === "instruction"
                    ? "依頼をタスクに分解し、A〜Fへ配分します"
                    : "COO対CEOの1対1相談。分解・割り振りはしません"}
                  ・「JARVIS、」で始めると、この一言だけ相談モードになります
                </span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-2 focus-within:border-primary/60"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="JARVISに指示・相談する…"
                  aria-label="JARVISへの指示"
                  disabled={pending}
                  className="h-9 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() =>
                    voiceIn.recording
                      ? void voiceIn.stop()
                      : void voiceIn.start()
                  }
                  disabled={pending || voiceIn.transcribing}
                  aria-label={
                    voiceIn.recording ? "録音を終了して送信" : "音声で指示する"
                  }
                  title={
                    voiceIn.recording ? "録音を終了して送信" : "音声で指示する"
                  }
                  className={cn(
                    "grid size-9 place-items-center rounded-lg border transition-colors disabled:opacity-50",
                    voiceIn.recording
                      ? "border-destructive/60 bg-destructive/15 text-destructive"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {voiceIn.transcribing ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : voiceIn.recording ? (
                    <Square className="size-3.5" aria-hidden />
                  ) : (
                    <Mic className="size-4" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    voiceOut.stop();
                    voiceOut.setEnabled(!voiceOut.enabled);
                  }}
                  aria-label={
                    voiceOut.enabled
                      ? "音声応答をオフにする"
                      : "音声応答をオンにする"
                  }
                  title={voiceOut.enabled ? "音声応答オン" : "音声応答オフ"}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg border transition-colors",
                    voiceOut.enabled
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {voiceOut.enabled ? (
                    <Volume2 className="size-4" aria-hidden />
                  ) : (
                    <VolumeX className="size-4" aria-hidden />
                  )}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="size-3.5" aria-hidden />
                  )}
                  送信
                </button>
              </form>
              <div className="mt-2 flex min-h-4 items-center gap-2 text-[11px]">
                {voiceIn.recording ? (
                  <span className="inline-flex items-center gap-2 text-destructive">
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                    録音中… もう一度押すと JARVIS に送信します
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full bg-destructive transition-[width]"
                        style={{
                          width: `${Math.min(100, Math.round(voiceIn.level * 260))}%`,
                        }}
                      />
                    </span>
                  </span>
                ) : voiceIn.transcribing ? (
                  <span className="text-muted-foreground">
                    音声を文字起こししています…
                  </span>
                ) : voiceOut.speaking ? (
                  <span className="text-primary">JARVIS が音声で応答中…</span>
                ) : voiceIn.error ? (
                  <span className="text-destructive">{voiceIn.error}</span>
                ) : (
                  <span className="text-muted-foreground">
                    マイクで話しかけると JARVIS が音声で返答します
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_ACTIONS.concat(JARVIS_EXAMPLES).map((a) => (
                  <button
                    key={a}
                    onClick={() => submit(a)}
                    className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Company context */}
        <aside className="space-y-4">
          <Panel>
            <SectionTitle title="CEOへの報告" hint="TODAY" />
            <ol className="space-y-3 text-xs">
              {[
                ["① 昨日の進捗", "A 調査完了 / E 投稿案5件 / C LP公開申請"],
                ["② 現在の問題", "Leads が前月比 -17.9%（P0）"],
                [
                  "③ 実施中の仕事",
                  `${EMPLOYEES.filter((e) => (liveStates[e.code]?.status ?? e.status) === "WORKING").length}名が稼働中・${tasks.filter((t) => t.status === "IN PROGRESS").length}件進行`,
                ],
                ["④ CEO判断が必要", "新LP公開の最終承認 1件"],
                [
                  "⑤ 今日のTOP3",
                  "① 売上ギャップ分析 ② 診断結果ページ修正 ③ 法人営業10社",
                ],
              ].map(([k, v]) => (
                <li key={k}>
                  <p className="label-caps">{k}</p>
                  <p className="mt-0.5 text-foreground/80">{v}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <SectionTitle title="会社コンテキスト" />
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Monthly Revenue</dt>
                <dd className="num-display">{jpy(monthlyRevenue)}</dd>
              </div>
              <Meter
                value={
                  revenueGoal && revenueGoal > 0
                    ? Math.round((monthlyRevenue / revenueGoal) * 100)
                    : 0
                }
                label="Goal"
              />
              {kpis.slice(3, 8).map((k) => (
                <div
                  key={k.name}
                  className="flex items-center justify-between gap-3"
                >
                  <dt className="truncate text-muted-foreground">{k.name}</dt>
                  <dd className="num-display">{k.value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">タスクを開く</dt>
                <dd className="num-display">
                  {tasks.filter((t) => t.status !== "DONE").length}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <SectionTitle title="アクションコンソール" hint="直近の実行ログ" />
            <ol className="space-y-3 text-xs">
              {ACTIVITY.slice(0, 6).map((a) => (
                <li key={a.at + a.text} className="flex gap-2">
                  <span className="num-display text-muted-foreground">
                    {a.at}
                  </span>
                  <Tag tone={empColor(a.actor)}>{a.actor}</Tag>
                  <span className="min-w-0 flex-1 text-foreground/80">
                    {a.text}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
