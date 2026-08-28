import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { askJarvis } from "@/lib/jarvis.functions";
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
import {
  ACTIVITY,
  EMPLOYEES,
  JARVIS_EXAMPLES,
  KPIS,
  QUICK_ACTIONS,
  REVENUE,
  TASKS,
  empColor,
  jpy,
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
      { property: "og:title", content: "JARVIS Command Center — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "指示 → 分解 → 配分 → 統合 → CEO承認。会社を動かすオーケストレーター。",
      },
    ],
  }),
  component: JarvisPage,
});

interface Plan {
  employee: string;
  job: string;
}

interface Message {
  id: number;
  role: "CEO" | "JARVIS";
  text: string;
  /** このJARVISメッセージがどちらのモードで生成されたか（CEO側メッセージには付けない）。 */
  mode?: JarvisMode | undefined;
  plan?: Plan[] | undefined;
  /** trueの場合、text はエラーメッセージ（⚠️〜）。タスク化ボタン等を出さないためのフラグ。 */
  error?: boolean | undefined;
  meta?:
    | {
        intent: string;
        priority: string;
        workflow: string;
        approval: string;
        risk: string;
        osUpdates: string;
        nextAction: string;
      }
    | undefined;
}

/**
 * 相談モードの単発トリガー：「JARVIS、」（全角/半角どちらのカンマも可）で始まる
 * メッセージは、現在のモードトグルの状態に関わらずそのメッセージだけ相談モード扱いにする。
 */
const CONSULTATION_PREFIX_RE = /^\s*jarvis\s*[、,]/i;
const isConsultationTrigger = (text: string) => CONSULTATION_PREFIX_RE.test(text);

const planFor = (text: string): Plan[] => {
  const t = text.toLowerCase();
  if (t.includes("売上") || t.includes("revenue") || t.includes("kpi"))
    return [
      { employee: "A", job: "売上要因の一次データ収集" },
      { employee: "D", job: "Sales pipeline 分析" },
      { employee: "E", job: "Marketing funnel 分析" },
      { employee: "B", job: "原因統合・改善戦略の設計" },
      { employee: "F", job: "データ整合性確認" },
    ];
  if (t.includes("instagram") || t.includes("sns") || t.includes("content"))
    return [
      { employee: "A", job: "競合SNS施策のリサーチ" },
      { employee: "B", job: "投稿戦略とKPI設計" },
      { employee: "C", job: "クリエイティブ案の作成" },
      { employee: "E", job: "投稿カレンダー設計" },
      { employee: "F", job: "ブランド規約・事実確認" },
    ];
  if (t.includes("診断") || t.includes("離脱"))
    return [
      { employee: "A", job: "離脱区間データの収集" },
      { employee: "C", job: "UX改善案の設計" },
      { employee: "B", job: "優先順位と期待効果の算定" },
      { employee: "F", job: "ロジック整合性の確認" },
    ];
  if (t.includes("タスク") || t.includes("task"))
    return [
      { employee: "JARVIS", job: "未完了タスクの再優先順位付け" },
      { employee: "F", job: "ブロッカーのリスク確認" },
    ];
  return [
    { employee: "A", job: "前提情報のリサーチ" },
    { employee: "B", job: "アプローチ設計" },
    { employee: "F", job: "品質確認" },
  ];
};

function JarvisPage() {
  const { q } = Route.useSearch();
  const ask = useServerFn(askJarvis);
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
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const submitRef = useRef<(text: string, modeOverride?: JarvisMode) => void>(() => {});
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
    const plan = effectiveMode === "instruction" ? planFor(value) : undefined;
    setMessages((m) => [
      ...m,
      { id: ceoId, role: "CEO", text: value },
      {
        id: jarvisId,
        role: "JARVIS",
        text: "",
        mode: effectiveMode,
        plan,
        meta:
          effectiveMode === "instruction"
            ? {
                intent: value.slice(0, 60),
                priority: "P1",
                workflow: "JARVIS → 担当AI社員 → JARVIS → CEO",
                approval: "重要事項は CEO 承認が必要",
                risk: "MEDIUM",
                osUpdates: "COMPANY OS 更新候補として保留",
                nextAction: "実行を押すと JARVIS が各社員へ配分します（シミュレーション）",
              }
            : undefined,
      },
    ]);
    setInput("");
    setPending(true);
    historyRef.current = [...historyRef.current, { role: "user", content: value }];

    void ask({ data: { messages: historyRef.current, mode: effectiveMode } })
      .then(({ reply }: { reply: string }) => {
        historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];
        setMessages((m) => m.map((x) => (x.id === jarvisId ? { ...x, text: reply } : x)));
        void voiceOut.speak(reply);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "JARVISとの通信に失敗しました。";
        setMessages((m) =>
          m.map((x) =>
            x.id === jarvisId ? { ...x, text: `⚠️ ${msg}`, plan: undefined, error: true } : x,
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

  useEffect(() => {
    if (q) submit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const working = EMPLOYEES.filter((e) => e.status === "WORKING" || e.status === "REVIEW");

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
                WF-06 を実行中。A / D / E の一次データを統合し、B が改善戦略を設計しています。
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
            <div ref={scrollRef} className="max-h-[560px] space-y-5 overflow-y-auto p-5">
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
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
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
                      {m.plan ? (
                        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                          <p className="label-caps">アクションプラン</p>
                          <ol className="mt-3 space-y-2">
                            {m.plan.map((p) => (
                              <li key={p.employee + p.job} className="flex items-center gap-3">
                                <span
                                  className="grid size-7 place-items-center rounded-lg text-[11px] font-bold"
                                  style={{
                                    background: `color-mix(in oklab, ${empColor(p.employee)} 16%, transparent)`,
                                    color: empColor(p.employee),
                                  }}
                                >
                                  {p.employee === "JARVIS" ? "Q" : p.employee}
                                </span>
                                <span className="text-sm">{p.job}</span>
                              </li>
                            ))}
                          </ol>
                          {m.meta ? (
                            <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
                              {[
                                ["優先度", m.meta.priority],
                                ["ワークフロー", m.meta.workflow],
                                ["承認", m.meta.approval],
                                ["リスク", m.meta.risk],
                                ["COMPANY OS", m.meta.osUpdates],
                                ["次のアクション", m.meta.nextAction],
                              ].map(([k, v]) => (
                                <div key={k}>
                                  <dt className="label-caps">{k}</dt>
                                  <dd className="mt-0.5 text-foreground/80">{v}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : null}
                          <div className="mt-4 flex gap-2">
                            <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                              実行
                            </button>
                            <button className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-accent">
                              修正
                            </button>
                          </div>
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
                  onClick={() => (voiceIn.recording ? void voiceIn.stop() : void voiceIn.start())}
                  disabled={pending || voiceIn.transcribing}
                  aria-label={voiceIn.recording ? "録音を終了して送信" : "音声で指示する"}
                  title={voiceIn.recording ? "録音を終了して送信" : "音声で指示する"}
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
                  aria-label={voiceOut.enabled ? "音声応答をオフにする" : "音声応答をオンにする"}
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
                        style={{ width: `${Math.min(100, Math.round(voiceIn.level * 260))}%` }}
                      />
                    </span>
                  </span>
                ) : voiceIn.transcribing ? (
                  <span className="text-muted-foreground">音声を文字起こししています…</span>
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
                ["③ 実施中の仕事", `${EMPLOYEES.filter((e) => e.status === "WORKING").length}名が稼働中・${TASKS.filter((t) => t.status === "IN PROGRESS").length}件進行`],
                ["④ CEO判断が必要", "新LP公開の最終承認 1件"],
                ["⑤ 今日のTOP3", "① 売上ギャップ分析 ② 診断結果ページ修正 ③ 法人営業10社"],
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
                <dd className="num-display">{jpy(REVENUE.monthly)}</dd>
              </div>
              <Meter value={Math.round((REVENUE.monthly / REVENUE.goal) * 100)} label="Goal" />
              {KPIS.slice(3, 8).map((k) => (
                <div key={k.name} className="flex items-center justify-between gap-3">
                  <dt className="truncate text-muted-foreground">{k.name}</dt>
                  <dd className="num-display">{k.value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">タスクを開く</dt>
                <dd className="num-display">
                  {TASKS.filter((t) => t.status !== "DONE").length}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <SectionTitle title="アクションコンソール" hint="直近の実行ログ" />
            <ol className="space-y-3 text-xs">
              {ACTIVITY.slice(0, 6).map((a) => (
                <li key={a.at + a.text} className="flex gap-2">
                  <span className="num-display text-muted-foreground">{a.at}</span>
                  <Tag tone={empColor(a.actor)}>{a.actor}</Tag>
                  <span className="min-w-0 flex-1 text-foreground/80">{a.text}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}
