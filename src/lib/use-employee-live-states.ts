import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listEmployeeLiveStatesFn } from "./employees.functions";
import type { EmployeeLiveState } from "./employees.server";
import type { EmployeeCode } from "./company-data";

const POLL_INTERVAL_MS = 30_000;

/**
 * ai_employees の実データ（status/progress/currentTask/completedToday/
 * lastActivityAt）を社員コードごとに読み込む共通フック。ダッシュボードの
 * AIオフィスフロアと /employees ページの両方から使う。30秒おきに再取得し、
 * 他画面での変更にもある程度追従する（表示のみ、書き込みなし）。
 */
export function useEmployeeLiveStates() {
  const [states, setStates] = useState<
    Partial<Record<EmployeeCode, EmployeeLiveState>>
  >({});
  const [loading, setLoading] = useState(true);

  const listFn = useServerFn(listEmployeeLiveStatesFn);

  const refresh = useCallback(async () => {
    try {
      const data = await listFn();
      setStates(Object.fromEntries(data.map((s) => [s.code, s])));
    } catch {
      // Supabase未到達時は呼び出し側の静的値へのフォールバックに任せる
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { states, loading, refresh };
}
