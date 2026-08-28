import { Link } from "@tanstack/react-router";
import { JarvisCore, type CoreState } from "./JarvisCore";
import { Meter, Tag } from "./primitives";
import type { Handoff, QuestState } from "@/lib/demo-mode";
import { COMPANY_STATUS_LABEL, COMPANY_STATUS_TONE, type CompanyStatus } from "@/lib/company-data";

const CORE_STATE: Record<QuestState, CoreState> = {
  IDLE: "IDLE",
  THINKING: "THINKING",
  ORCHESTRATING: "WORKING",
  COMMUNICATING: "WORKING",
  ERROR: "ERROR",
};

const STATE_LABEL: Record<QuestState, string> = {
  IDLE: "待機中 · CEOの指示を待っています",
  THINKING: "思考中 · タスクを分解しています",
  ORCHESTRATING: "配分中 · AI社員を統括しています",
  COMMUNICATING: "通信中 · AI社員とデータをやり取りしています",
  ERROR: "エラー · CEOの確認が必要です",
};

export function QuestCore({
  state,
  message,
  health,
  currentTask,
  handoff,
  companyStatus,
}: {
  state: QuestState;
  message: string;
  health: number;
  currentTask: string;
  handoff: Handoff | null;
  /** 実際のAI社員稼働状況（ai_employees）から算出した会社全体のステータス */
  companyStatus?: CompanyStatus | undefined;
}) {
  return (
    <section
      className="panel relative overflow-hidden p-6 sm:p-8 lg:p-10"
      aria-label="JARVIS 司令塔"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* 大画面ではコアを大きく表示 */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <p className="label-caps">AI COMPANY 司令塔</p>
            {companyStatus ? (
              <Tag tone={COMPANY_STATUS_TONE[companyStatus]}>
                COMPANY STATUS · {COMPANY_STATUS_LABEL[companyStatus]}
              </Tag>
            ) : null}
          </div>
          <div className="relative mt-4 aspect-square w-[240px] sm:w-[320px] lg:w-[420px] xl:w-[480px]">
            <JarvisCore state={CORE_STATE[state]} size="100%" label="JARVIS" health={health} />
            {handoff ? (
              <span
                className="animate-ping-soft absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "color-mix(in oklab, var(--primary) 45%, transparent)" }}
                aria-hidden
              />
            ) : null}
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-[0.18em] lg:text-5xl">JARVIS</h2>
          <p className="mt-2 text-xs font-semibold tracking-wide text-primary lg:text-sm">
            {STATE_LABEL[state]}
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="label-caps">現在の作業</p>
            <p className="mt-1 text-sm text-foreground/90 lg:text-base">{currentTask}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="label-caps">CEOへの報告</p>
            <p className="mt-1 text-sm text-foreground/90 lg:text-base">{message}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps">会社の健全性</p>
              <span className="num-display text-lg text-[var(--success)]">{health}%</span>
            </div>
            <Meter className="mt-2" value={health} tone="var(--success)" label="健全性" />
          </div>
          {handoff ? (
            <p className="num-display text-[11px] text-muted-foreground">
              {handoff.from} → {handoff.to} 通信中…
            </p>
          ) : null}

          <Link
            to="/jarvis"
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            司令センターを開く
          </Link>
        </div>
      </div>
    </section>
  );
}
