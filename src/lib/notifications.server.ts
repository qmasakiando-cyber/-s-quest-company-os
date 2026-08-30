// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { EmployeeCode } from "./company-data";

export type NotificationKind =
  "approval_pending" | "approval_decided" | "employee_error";

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  relatedApprovalId: string | null;
  relatedEmployeeCode: EmployeeCode | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  related_approval_id: string | null;
  related_employee_code: EmployeeCode | null;
  read_at: string | null;
  created_at: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    relatedApprovalId: row.related_approval_id,
    relatedEmployeeCode: row.related_employee_code,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/** Read-only: most recently created notifications first. */
export async function listNotifications(limit = 30): Promise<Notification[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`通知の取得に失敗しました: ${error.message}`);
  return (data as NotificationRow[]).map(rowToNotification);
}

/**
 * 内部用：schema_phase8.sqlで合意した3イベント（承認申請/承認・却下確定/
 * AI社員エラー）の発生元から呼ばれる。通知作成自体の失敗で本処理を止め
 * たくないため、呼び出し側でtry/catchすること（approvals.server.ts /
 * employees.server.ts の呼び出し箇所を参照）。
 */
export async function createNotification(input: {
  kind: NotificationKind;
  title: string;
  body: string;
  relatedApprovalId?: string | null;
  relatedEmployeeCode?: EmployeeCode | null;
}): Promise<Notification> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      kind: input.kind,
      title: input.title,
      body: input.body,
      related_approval_id: input.relatedApprovalId ?? null,
      related_employee_code: input.relatedEmployeeCode ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`通知の作成に失敗しました: ${error.message}`);
  return rowToNotification(data as NotificationRow);
}

/** 既読化（read_atのUPDATEのみ、DELETEはしない）。 */
export async function markNotificationRead(id: string): Promise<Notification> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`通知の既読化に失敗しました: ${error.message}`);
  return rowToNotification(data as NotificationRow);
}

/** 未読の全件を一括既読化（read_atのUPDATEのみ）。 */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw new Error(`通知の既読化に失敗しました: ${error.message}`);
}
