import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/os/AppShell";
import {
  ErrorState,
  PageHeader,
  Panel,
  SimulationBadge,
  Tag,
} from "@/components/os/primitives";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { listErrorEmployeesFn, retryEmployeeFn } from "@/lib/employees.functions";
import { AI_EMPLOYEES, EMPLOYEES, empColor, type EmployeeCode } from "@/lib/company-data";

export const Route = createFileRoute("/errors")({
  head: () => ({
    meta: [
      { title: "Error Center — S-QUEST COMPANY" },
      {
        name: "description",
        content: "ai_employees.status が ERROR の項目だけを集約するエラーセンター。RETRY / JARVISへエスカレーション / ログ確認。",
      },
      { property: "og:title", content: "Error Center — S-QUEST COMPANY" },
      {
        property: "og:description",
        content: "AI会社ではエラーを隠さない。ERROR状態の社員をここで確認・再試行する。",
      },
    ],
  }),
  component: ErrorsPage,
});

interface ErrorItem {
  code: EmployeeCode;
  currentTask: string | null;
  errorCount: number;
  lastActivityAt: string | null;
}

const formatAt = (iso: string | null) => {
  if (!iso) return "不明";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "不明";
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
};

function ErrorsPage() {
  const [items, setItems] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<EmployeeCode | null>(null);
  const [logTarget, setLogTarget] = useState<ErrorItem | null>(null);

  const listFn = useServerFn(listErrorEmployeesFn);
  const retryFn = useServerFn(retryEmployeeFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setItems(data);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "エラー社員の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRetry = async (code: EmployeeCode) => {
    setRetrying(code);
    const prev = items;
    setItems((cur) => cur.filter((i) => i.code !== code));
    try {
      await retryFn({ data: { code } });
      toast.success("再試行しました", {
        description: `${code}｜${AI_EMPLOYEES[code].name} を IDLE に戻しました。`,
      });
    } catch (err) {
      setItems(prev);
      toast.error("再試行に失敗しました", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRetrying(null);
    }
  };

  const handleEscalate = (code: EmployeeCode) => {
    toast.message("JARVISへエスカレーションしました", {
      description: `${code}｜${AI_EMPLOYEES[code].name} のエラーをJARVISに報告しました — SIMULATION MODE のため実処理は行われません。`,
    });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="ガバナンス"
        title="エラーセンター"
        description="AI会社ではエラーを隠さない。ai_employees.status が ERROR の項目だけをここに集約する。"
        actions={<SimulationBadge />}
      />

      {fetchError ? (
        <p className="mb-4 text-xs text-destructive">⚠️ {fetchError}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込んでいます…</p>
      ) : items.length === 0 ? (
        <ErrorState
          tone="var(--success)"
          title="ERROR状態の社員はいません"
          body="現在、AI社員はすべて正常に稼働しています。"
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => {
            const e = EMPLOYEES.find((x) => x.code === item.code);
            const persona = AI_EMPLOYEES[item.code];
            const tone = e?.accent ?? empColor(item.code);
            return (
              <Panel
                key={item.code}
                className="p-4"
                style={{
                  borderColor: "color-mix(in oklab, var(--destructive) 32%, transparent)",
                  background: "color-mix(in oklab, var(--destructive) 8%, transparent)",
                }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag tone={tone}>
                    {item.code}｜{persona.name}
                  </Tag>
                  <Tag tone="var(--destructive)">ERROR</Tag>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    error_count {item.errorCount}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {item.currentTask ?? "対象タスクの情報がありません"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e?.department ?? persona.department} · 最終活動 {formatAt(item.lastActivityAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleRetry(item.code)}
                    disabled={retrying === item.code}
                    className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {retrying === item.code ? "再試行中…" : "RETRY"}
                  </button>
                  <button
                    onClick={() => handleEscalate(item.code)}
                    className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-accent"
                  >
                    SEND TO JARVIS
                  </button>
                  <button
                    onClick={() => setLogTarget(item)}
                    className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-accent"
                  >
                    VIEW LOG
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Dialog open={logTarget !== null} onOpenChange={(v) => !v && setLogTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="label-caps">SYSTEM ALERT · VIEW LOG</DialogTitle>
          {logTarget ? (
            <>
              <p className="text-base font-semibold">
                {logTarget.code}｜{AI_EMPLOYEES[logTarget.code].name}
              </p>
              <dl className="mt-2 space-y-3 text-sm">
                {[
                  ["Status", "ERROR"],
                  ["Error Count", String(logTarget.errorCount)],
                  ["Current Task", logTarget.currentTask ?? "（情報なし）"],
                  ["Last Activity", formatAt(logTarget.lastActivityAt)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-secondary/30 p-3">
                    <dt className="label-caps">{k}</dt>
                    <dd className="mt-1 text-foreground/90">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-1 text-[11px] text-muted-foreground">
                詳細な実行ログ（プロンプト・出力全文）はSIMULATIONのため保持していません。実処理を偽装しない方針により、ここでは
                ai_employees テーブルが持つ概要のみを表示しています。
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
