import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKpisFn } from "./kpi.functions";
import type { Kpi } from "./company-data";

/** Read-only: loads KPI current values / targets / trend from Supabase. */
export function useKpis() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listKpisFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setKpis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "KPIの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { kpis, loading, error, refresh };
}
