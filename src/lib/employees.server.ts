// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { EmployeeCode, EmployeeStatus } from "./company-data";

export interface EmployeeLiveState {
  code: EmployeeCode;
  status: EmployeeStatus;
  progress: number;
}

/** Read-only: current status/progress for each AI employee, sourced from Supabase. */
export async function listEmployeeLiveStates(): Promise<EmployeeLiveState[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("ai_employees").select("code, status, progress");
  if (error) throw new Error(`AI社員の状態取得に失敗しました: ${error.message}`);
  return (data ?? []) as EmployeeLiveState[];
}

const nowIso = () => new Date().toISOString();

async function getEmployeeStatus(code: EmployeeCode): Promise<EmployeeStatus | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_employees")
    .select("status")
    .eq("code", code)
    .single();
  if (error) return null;
  return (data as { status: EmployeeStatus })["status"];
}

/**
 * タスク作成イベント：担当者が IDLE か DONE（＝手が空いている）なら READY へ。
 * 既に稼働中（WORKING/THINKING等）なら、新しいタスクはキュー扱いで状態を変えない。
 */
export async function onTaskCreated(assignee: EmployeeCode): Promise<void> {
  const current = await getEmployeeStatus(assignee);
  if (current !== "IDLE" && current !== "DONE") return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("ai_employees")
    .update({ status: "READY", last_activity_at: nowIso() })
    .eq("code", assignee);
  if (error) throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * タスク完了イベント：担当者を DONE にし、直後に IDLE へ戻す（Obsidianの
 * 「DONE=今のタスクの完了、社員自体はIDLEへ」という定義に合わせ、1回の更新で両方反映）。
 * current_task/progress/started_at をクリアし、本日完了数を+1。
 */
export async function onTaskCompleted(assignee: EmployeeCode): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("ai_employees")
    .select("completed_today")
    .eq("code", assignee)
    .single();
  if (fetchError) throw new Error(`AI社員状態の取得に失敗しました: ${fetchError.message}`);
  const completedToday = ((data as { completed_today: number })["completed_today"] ?? 0) + 1;

  const { error } = await supabase
    .from("ai_employees")
    .update({
      status: "IDLE",
      current_task: null,
      progress: 0,
      started_at: null,
      completed_today: completedToday,
      last_activity_at: nowIso(),
    })
    .eq("code", assignee);
  if (error) throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * タスク再開イベント：DONEだったタスクが他ステータス（現状のUIではIN PROGRESSのみ到達可）
 * へ戻された時、担当者をWORKINGにする。
 */
export async function onTaskResumed(assignee: EmployeeCode, taskTitle: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("ai_employees")
    .update({
      status: "WORKING",
      current_task: taskTitle,
      progress: 10,
      started_at: nowIso(),
      last_activity_at: nowIso(),
    })
    .eq("code", assignee);
  if (error) throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * 依存解消イベント：完了したタスク(completedTaskId)に依存している他タスクを確認し、
 * その依存が全て満たされた場合、担当者が WAITING であれば READY に戻し waiting_for をクリアする。
 */
export async function resolveWaitingEmployees(completedTaskId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: allTasks, error } = await supabase
    .from("tasks")
    .select("id, assignee, status, dependencies");
  if (error) throw new Error(`タスクの取得に失敗しました: ${error.message}`);

  const rows = (allTasks ?? []) as {
    id: string;
    assignee: EmployeeCode | "JARVIS" | "CEO";
    status: string;
    dependencies: string[] | null;
  }[];
  const statusById = new Map(rows.map((t) => [t.id, t.status]));

  for (const task of rows) {
    const deps = task.dependencies ?? [];
    if (!deps.includes(completedTaskId)) continue;
    const allDone = deps.every((depId) => statusById.get(depId) === "DONE");
    if (!allDone) continue;
    if (task.assignee === "JARVIS" || task.assignee === "CEO") continue;

    const currentStatus = await getEmployeeStatus(task.assignee);
    if (currentStatus !== "WAITING") continue;

    const { error: updateError } = await supabase
      .from("ai_employees")
      .update({ status: "READY", waiting_for: null, last_activity_at: nowIso() })
      .eq("code", task.assignee);
    if (updateError) throw new Error(`AI社員状態の更新に失敗しました: ${updateError.message}`);
  }
}

/**
 * 個別チャット失敗イベント：担当社員をERROR状態にし、error_countを+1する。
 */
export async function onEmployeeChatError(code: EmployeeCode): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("ai_employees")
    .select("error_count")
    .eq("code", code)
    .single();
  if (fetchError) throw new Error(`AI社員状態の取得に失敗しました: ${fetchError.message}`);
  const errorCount = ((data as { error_count: number })["error_count"] ?? 0) + 1;

  const { error } = await supabase
    .from("ai_employees")
    .update({ status: "ERROR", error_count: errorCount, last_activity_at: nowIso() })
    .eq("code", code);
  if (error) throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}
