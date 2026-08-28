import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAiOutputFn, listAiOutputsFn } from "./ai-outputs.functions";
import type { AiOutput, EmployeeCode } from "./company-data";

/**
 * AI社員（A〜F）の成果物台帳をSupabaseから読み込み、登録操作を提供する。
 * 記帳のみ（一覧・登録）。編集・削除はPhase Aのスコープ外。
 */
export function useAiOutputs() {
  const [outputs, setOutputs] = useState<AiOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listAiOutputsFn);
  const createFn = useServerFn(createAiOutputFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setOutputs(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "成果物の取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addOutput = useCallback(
    async (input: {
      employeeCode: EmployeeCode;
      taskId: string | null;
      outputType: string;
      title: string;
      content: string | null;
      externalUrl: string | null;
    }) => {
      const created = await createFn({ data: input });
      setOutputs((prev) => [created, ...prev]);
    },
    [createFn],
  );

  return { outputs, loading, error, addOutput, refresh };
}
