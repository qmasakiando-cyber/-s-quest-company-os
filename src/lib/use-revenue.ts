import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createRevenueEntryFn,
  listRevenueEntriesFn,
} from "./revenue.functions";
import { getKpiTargetValueFn } from "./kpi.functions";
import { revenueMonthKey, type RevenueEntry } from "./company-data";

const MONTHLY_REVENUE_KPI_CODE = "monthly_revenue";

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

/**
 * 売上台帳（revenue_entries）をSupabaseから読み込み、記帳・当月合計・月間
 * 目標を提供する。目標は独自ストレージを持たず、既存のkpisテーブルの
 * "Monthly Revenue"行（target_value）をそのまま読む（company-healthとの
 * 二重管理を避けるための意図的な選択）。index.tsx / jarvis.tsx / revenue.tsx
 * の3箇所で共通利用する。
 */
export function useRevenue() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [goal, setGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listRevenueEntriesFn);
  const createFn = useServerFn(createRevenueEntryFn);
  const goalFn = useServerFn(getKpiTargetValueFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesData, goalData] = await Promise.all([
        listFn(),
        goalFn({ data: { code: MONTHLY_REVENUE_KPI_CODE } }),
      ]);
      setEntries(entriesData);
      setGoal(goalData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "売上の取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [listFn, goalFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (input: {
      category: string;
      amount: number;
      transactionDate: string;
      memo: string | null;
    }) => {
      const created = await createFn({ data: input });
      setEntries((prev) =>
        [created, ...prev].sort((a, b) =>
          a.transactionDate < b.transactionDate ? 1 : -1,
        ),
      );
    },
    [createFn],
  );

  const monthlyTotal = entries
    .filter((e) => revenueMonthKey(e.transactionDate) === currentMonthKey())
    .reduce((sum, e) => sum + e.amount, 0);

  return { entries, goal, monthlyTotal, loading, error, addEntry, refresh };
}
