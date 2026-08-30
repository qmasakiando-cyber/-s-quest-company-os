import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogsFn } from "./audit.functions";
import type { AuditLogEntry } from "./audit.server";

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
