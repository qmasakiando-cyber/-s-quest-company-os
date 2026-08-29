import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  createApprovalFn,
  decideApprovalFn,
  listApprovalsFn,
} from "./approvals.functions";
import type { Approval, ApprovalLevel, EmployeeCode } from "./company-data";

/**
 * CEO承認ワークフローをSupabaseから読み込み、登録・承認/却下の操作を提供する。
 * 承認/却下はUPDATEのみ（statusとdecided_at）、DELETEはしない。
 */
export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listApprovalsFn);
  const createFn = useServerFn(createApprovalFn);
  const decideFn = useServerFn(decideApprovalFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setApprovals(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "承認依頼の取得に失敗しました。",
      );
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addApproval = useCallback(
    async (input: {
      requestedBy: EmployeeCode | "JARVIS";
      approvalLevel: ApprovalLevel;
      title: string;
      body: string;
      action: string;
      reason: string;
      risk: string;
      expected: string;
      relatedTaskId: string | null;
    }) => {
      const created = await createFn({ data: input });
      setApprovals((prev) => [created, ...prev]);
    },
    [createFn],
  );

  const decide = useCallback(
    async (id: string, approved: boolean) => {
      const updated = await decideFn({ data: { id, approved } });
      setApprovals((prev) => prev.map((a) => (a.id === id ? updated : a)));
    },
    [decideFn],
  );

  return { approvals, loading, error, addApproval, decide, refresh };
}
