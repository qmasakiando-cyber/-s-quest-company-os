import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogsFn } from "./audit.functions";
import type { AuditActor, AuditLogEntry } from "./audit.server";

/** actor別2色（JARVIS=primary / CEO=emp-d）。audit.tsx・ダッシュボード・
 * JARVISコンソールの全アクティビティ表示で共通に使う。 */
export const auditActorColor = (actor: AuditActor) =>
  actor === "JARVIS" ? "var(--primary)" : "var(--emp-d)";

/** createAuditLog()呼び出し側（tasks/approvals/expenses/revenue/kpi/
 * company-os の各server.ts）が書き込むactionの英語文言 → 表示用の日本語。
 * 未知のactionは素通しする（DBの値がUIの語彙より先に進むことがあるため）。 */
const AUDIT_ACTION_LABEL: Record<string, string> = {
  "Created Task": "タスクを作成",
  "Updated Task Status": "タスクの状況を更新",
  "Requested Approval": "承認を申請",
  Approved: "承認を実行",
  Rejected: "申請を却下",
  "Logged Expense": "経費を記帳",
  "Logged Revenue": "売上を記帳",
  "Updated COMPANY OS": "COMPANY OSを更新",
  "Updated KPI Target": "KPI目標値を変更",
};
export const auditActionLabel = (action: string) =>
  AUDIT_ACTION_LABEL[action] ?? action;

/**
 * 監査ログ（/audit）をSupabaseから読み込む。通知ベルのような常時ポーリング
 * ではなく、use-approvals.tsと同じ「開いた時に一度読む」方式（履歴閲覧
 * ページであり、常時追従の必要は無いため）。
 */
export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listAuditLogsFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "監査ログの取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { logs, loading, error, refresh };
}
