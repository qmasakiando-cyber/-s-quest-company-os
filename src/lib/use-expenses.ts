import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createExpenseFn, listExpensesFn } from "./expenses.functions";
import type { Expense } from "./company-data";

/**
 * 経費台帳（JARVIS直轄）をSupabaseから読み込み、追加操作を提供する。
 * 記帳のみ（一覧・追加）。編集・削除はPhase Aのスコープ外。
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listExpensesFn);
  const createFn = useServerFn(createExpenseFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "経費の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addExpense = useCallback(
    async (input: {
      category: string;
      amount: number;
      transactionDate: string;
      memo: string | null;
    }) => {
      const created = await createFn({ data: input });
      setExpenses((prev) =>
        [created, ...prev].sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1)),
      );
    },
    [createFn],
  );

  return { expenses, loading, error, addExpense, refresh };
}
