import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listCompanyOsEntriesFn,
  updateCompanyOsEntryFn,
} from "./company-os.functions";
import type { CompanyOsEntry, CompanyOsStatus } from "./company-os.server";
import type { OsCategory } from "./company-data";

/**
 * COMPANY OS（/company-os）をSupabaseから読み込み、CEOによる直接編集を
 * 提供する。use-approvals.ts / use-audit.ts と同じ「開いた時に一度読む」
 * 方式（常時ポーリングの必要は無い）。
 */
export function useCompanyOsEntries() {
  const [entries, setEntries] = useState<CompanyOsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listCompanyOsEntriesFn);
  const updateFn = useServerFn(updateCompanyOsEntryFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setEntries(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "COMPANY OSの取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = useCallback(
    async (input: {
      category: OsCategory;
      key: string;
      value: string;
      status: CompanyOsStatus;
    }) => {
      const updated = await updateFn({ data: input });
      setEntries((prev) => {
        const idx = prev.findIndex(
          (e) => e.category === input.category && e.key === input.key,
        );
        if (idx === -1) return [...prev, updated];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    },
    [updateFn],
  );

  return { entries, loading, error, refresh, update };
}
