// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type {
  Approval,
  ApprovalLevel,
  ApprovalStatus,
  EmployeeCode,
} from "./company-data";

interface ApprovalRow {
  id: string;
  requested_by: EmployeeCode | "JARVIS";
  approval_level: ApprovalLevel;
  title: string;
  body: string;
  action: string;
  reason: string;
  risk: string;
  expected: string;
  related_task_id: string | null;
  status: ApprovalStatus;
  decided_at: string | null;
  created_at: string;
}

function rowToApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    requestedBy: row.requested_by,
    approvalLevel: row.approval_level,
    title: row.title,
    body: row.body,
    action: row.action,
    reason: row.reason,
    risk: row.risk,
    expected: row.expected,
    relatedTaskId: row.related_task_id,
    status: row.status,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

/** Read-only: every approval request, most recently created first. */
export async function listApprovals(): Promise<Approval[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`承認依頼の取得に失敗しました: ${error.message}`);
  return (data as ApprovalRow[]).map(rowToApproval);
}

/** 承認依頼の登録（CEOが手動で作成）。UPDATE/DELETEは今回のスコープ外。 */
export async function createApproval(input: {
  requestedBy: EmployeeCode | "JARVIS";
  approvalLevel: ApprovalLevel;
  title: string;
  body: string;
  action: string;
  reason: string;
  risk: string;
  expected: string;
  relatedTaskId: string | null;
}): Promise<Approval> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("approvals")
    .insert({
      requested_by: input.requestedBy,
      approval_level: input.approvalLevel,
      title: input.title,
      body: input.body,
      action: input.action,
      reason: input.reason,
      risk: input.risk,
      expected: input.expected,
      related_task_id: input.relatedTaskId,
    })
    .select()
    .single();
  if (error) throw new Error(`承認依頼の登録に失敗しました: ${error.message}`);
  const approval = rowToApproval(data as ApprovalRow);

  try {
    const { createNotification } = await import("./notifications.server");
    await createNotification({
      kind: "approval_pending",
      title: "承認が必要です",
      body: `${approval.requestedBy} — ${approval.title}`,
      relatedApprovalId: approval.id,
    });
  } catch (notifyError) {
    console.error("notification (approval pending) failed:", notifyError);
  }

  return approval;
}

/**
 * 承認/却下（statusとdecided_atのUPDATEのみ、DELETEはしない）。
 * related_task_idがあれば、承認→タスクをDONEへ、却下→IN PROGRESSへ連動
 * させる（tasks.server.tsのsetTaskStatusをそのまま再利用し、AI社員の
 * 状態連動もそちらに任せる）。連動が失敗しても承認判断自体は成功として返す。
 */
export async function decideApproval(input: {
  id: string;
  approved: boolean;
}): Promise<Approval> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("approvals")
    .update({
      status: input.approved ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw new Error(`承認判断の更新に失敗しました: ${error.message}`);
  const approval = rowToApproval(data as ApprovalRow);

  if (approval.relatedTaskId) {
    try {
      const { setTaskStatus } = await import("./tasks.server");
      await setTaskStatus({
        id: approval.relatedTaskId,
        status: input.approved ? "DONE" : "IN PROGRESS",
      });
    } catch (syncError) {
      console.error("task sync (approval decided) failed:", syncError);
    }
  }

  try {
    const { createNotification } = await import("./notifications.server");
    await createNotification({
      kind: "approval_decided",
      title: input.approved ? "承認されました" : "却下されました",
      body: `${approval.requestedBy} — ${approval.title}`,
      relatedApprovalId: approval.id,
    });
  } catch (notifyError) {
    console.error("notification (approval decided) failed:", notifyError);
  }

  return approval;
}
