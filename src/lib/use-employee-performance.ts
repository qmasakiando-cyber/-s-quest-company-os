import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listEmployeePerformanceFn } from "./employees.functions";
import type { EmployeePerformance } from "./employees.server";
import type { EmployeeCode } from "./company-data";

const POLL_INTERVAL_MS = 30_000;

/**
 * tasks から都度集計した tasksCompleted / successRate / avgCompletion を
 * 社員コードごとに読み込む共通フック（/employees の一覧表・個別ページの
 * パフォーマンスセクションで使う）。use-employee-live-states.ts と同じ
 * ポーリング方針。
 */
export function useEmployeePerformance() {
  const [performance, setPerformance] = useState<
    Partial<Record<EmployeeCode, EmployeePerformance>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listEmployeePerformanceFn);

  const refresh = useCallback(async () => {
    try {
      const data = await listFn();
      setPerformance(Object.fromEntries(data.map((p) => [p.code, p])));
      setError(null);
    } catch (err) {
      console.error("useEmployeePerformance: refresh failed", err);
      setError("実績データを取得できませんでした。表示は前回値のままです。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { performance, loading, error, refresh };
}
