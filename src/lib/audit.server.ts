// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";

export type AuditActor = "JARVIS" | "CEO";

export interface AuditLogEntry {
  id: string;
  actor: AuditActor;
  action: string;
  target: string;
  relatedTaskId: string | null;
  relatedApprovalId: string | null;
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  actor: AuditActor;
  action: string;
  target: string;
  related_task_id: string | null;
  related_approval_id: string | null;
  created_at: string;
}

function rowToAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action,
    target: row.target,
    relatedTaskId: row.related_task_id,
    relatedApprovalId: row.related_approval_id,
    createdAt: row.created_at,
  };
}

/** Read-only: most recently created audit log entries first. */
export async function listAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`監査ログの取得に失敗しました: ${error.message}`);
  return (data as AuditLogRow[]).map(rowToAuditLogEntry);
}

/**
 * 内部用：schema_phase10.sqlで合意した6操作（タスク作成/ステータス変更、
 * 承認申請/決定、経費/売上記帳）の発生元から呼ばれる。ログ作成自体の失敗で
 * 本処理を止めたくないため、呼び出し側でtry/catchすること
 * （tasks.server.ts / approvals.server.ts / expenses.server.ts /
 * revenue.server.ts の呼び出し箇所を参照）。一度書いたら不変：
 * UPDATE/DELETE用の関数は用意しない。
 */
export async function createAuditLog(input: {
  actor: AuditActor;
  action: string;
  target: string;
  relatedTaskId?: string | null;
  relatedApprovalId?: string | null;
}): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor: input.actor,
    action: input.action,
    target: input.target,
    related_task_id: input.relatedTaskId ?? null,
    related_approval_id: input.relatedApprovalId ?? null,
  });
  if (error) throw new Error(`監査ログの作成に失敗しました: ${error.message}`);
}
