// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { EmployeeCode, EmployeeStatus, TaskStatus } from "./company-data";

const EMPLOYEE_CODES: EmployeeCode[] = ["A", "B", "C", "D", "E", "F"];

export interface EmployeeLiveState {
  code: EmployeeCode;
  status: EmployeeStatus;
  progress: number;
  currentTask: string | null;
  completedToday: number;
  lastActivityAt: string | null;
}

interface EmployeeLiveStateRow {
  code: EmployeeCode;
  status: EmployeeStatus;
  progress: number;
  current_task: string | null;
  completed_today: number | null;
  last_activity_at: string | null;
}

function rowToLiveState(row: EmployeeLiveStateRow): EmployeeLiveState {
  return {
    code: row.code,
    status: row.status,
    progress: row.progress,
    currentTask: row.current_task,
    completedToday: row.completed_today ?? 0,
    lastActivityAt: row.last_activity_at,
  };
}

/** Read-only: current status/progress/current task for each AI employee, sourced from Supabase. */
export async function listEmployeeLiveStates(): Promise<EmployeeLiveState[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_employees")
    .select(
      "code, status, progress, current_task, completed_today, last_activity_at",
    );
  if (error)
    throw new Error(`AI社員の状態取得に失敗しました: ${error.message}`);
  return (data as EmployeeLiveStateRow[]).map(rowToLiveState);
}

export interface EmployeeErrorState {
  code: EmployeeCode;
  status: EmployeeStatus;
  currentTask: string | null;
  errorCount: number;
  lastActivityAt: string | null;
}

interface ErrorRow {
  code: EmployeeCode;
  status: EmployeeStatus;
  current_task: string | null;
  error_count: number | null;
  last_activity_at: string | null;
}

/** Read-only: employees currently in ERROR status, for the Error Center. */
export async function listErrorEmployees(): Promise<EmployeeErrorState[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_employees")
    .select("code, status, current_task, error_count, last_activity_at")
    .eq("status", "ERROR");
  if (error)
    throw new Error(`AI社員の状態取得に失敗しました: ${error.message}`);
  const rows = (data ?? []) as ErrorRow[];
  return rows.map((r) => ({
    code: r.code,
    status: r.status,
    currentTask: r.current_task,
    errorCount: r.error_count ?? 0,
    lastActivityAt: r.last_activity_at,
  }));
}

const nowIso = () => new Date().toISOString();

async function getEmployeeStatus(
  code: EmployeeCode,
): Promise<EmployeeStatus | null> {
  const supabase = await getSupabaseServerClient();
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

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("ai_employees")
    .update({ status: "READY", last_activity_at: nowIso() })
    .eq("code", assignee);
  if (error)
    throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * タスク完了イベント：担当者を DONE にし、直後に IDLE へ戻す（Obsidianの
 * 「DONE=今のタスクの完了、社員自体はIDLEへ」という定義に合わせ、1回の更新で両方反映）。
 * current_task/progress/started_at をクリアし、本日完了数を+1。
 */
export async function onTaskCompleted(assignee: EmployeeCode): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("ai_employees")
    .select("completed_today")
    .eq("code", assignee)
    .single();
  if (fetchError)
    throw new Error(`AI社員状態の取得に失敗しました: ${fetchError.message}`);
  const completedToday =
    ((data as { completed_today: number })["completed_today"] ?? 0) + 1;

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
  if (error)
    throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * タスク再開イベント：DONEだったタスクが他ステータス（現状のUIではIN PROGRESSのみ到達可）
 * へ戻された時、担当者をWORKINGにする。
 */
export async function onTaskResumed(
  assignee: EmployeeCode,
  taskTitle: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
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
  if (error)
    throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

/**
 * 依存解消イベント：完了したタスク(completedTaskId)に依存している他タスクを確認し、
 * その依存が全て満たされた場合、担当者が WAITING であれば READY に戻し waiting_for をクリアする。
 */
export async function resolveWaitingEmployees(
  completedTaskId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
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
      .update({
        status: "READY",
        waiting_for: null,
        last_activity_at: nowIso(),
      })
      .eq("code", task.assignee);
    if (updateError)
      throw new Error(`AI社員状態の更新に失敗しました: ${updateError.message}`);
  }
}

/**
 * 個別チャット失敗イベント：担当社員をERROR状態にし、error_countを+1する。
 */
export async function onEmployeeChatError(code: EmployeeCode): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("ai_employees")
    .select("error_count")
    .eq("code", code)
    .single();
  if (fetchError)
    throw new Error(`AI社員状態の取得に失敗しました: ${fetchError.message}`);
  const errorCount =
    ((data as { error_count: number })["error_count"] ?? 0) + 1;

  const { error } = await supabase
    .from("ai_employees")
    .update({
      status: "ERROR",
      error_count: errorCount,
      last_activity_at: nowIso(),
    })
    .eq("code", code);
  if (error)
    throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);

  try {
    const { createNotification } = await import("./notifications.server");
    await createNotification({
      kind: "employee_error",
      title: "AI社員エラー",
      body: `${code} — チャット処理でエラーが発生しました`,
      relatedEmployeeCode: code,
    });
  } catch (notifyError) {
    console.error("notification (employee error) failed:", notifyError);
  }
}

/**
 * RETRY（Error Center）：ERROR状態の社員をIDLEへ戻す。current_task/progress/started_at
 * をクリアする（onTaskCompletedと同じ更新パターン）。実際の再送信・再実行は行わない（SIMULATION）。
 * error_count は履歴として保持し、リセットしない。
 */
export async function retryEmployee(code: EmployeeCode): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("ai_employees")
    .update({
      status: "IDLE",
      current_task: null,
      progress: 0,
      started_at: null,
      last_activity_at: nowIso(),
    })
    .eq("code", code);
  if (error)
    throw new Error(`AI社員状態の更新に失敗しました: ${error.message}`);
}

export interface EmployeePerformance {
  code: EmployeeCode;
  /** assigneeがそのAI社員で status = DONE のタスク件数。 */
  tasksCompleted: number;
  /** DONE / (DONE + BLOCKED) の百分率。DONEもBLOCKEDもまだ無ければ未計測（null）。 */
  successRate: number | null;
  /** completed_at - created_at の平均を "18m" / "1h 30m" 形式にした文字列。DONEにcompleted_atが無ければ未計測（null）。 */
  avgCompletion: string | null;
}

function formatDurationMinutes(totalMinutes: number): string {
  const m = Math.round(totalMinutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

/**
 * Read-only: tasks_completed / success_rate / avg_completion を、ai_employees
 * にキャッシュされた列ではなく tasks から都度集計して返す（表示ズレを防ぐ
 * ため、書き込み・保存はしない。migration_007でai_employees側の同名列は
 * 廃止済み）。QA合否に相当する実測データは今のスキーマに存在しないため、
 * ここでは扱わない（/employees側でQA Pass列自体を削除する）。
 */
export async function listEmployeePerformance(): Promise<
  EmployeePerformance[]
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("assignee, status, created_at, completed_at")
    .in("assignee", EMPLOYEE_CODES);
  if (error)
    throw new Error(`タスク実績の取得に失敗しました: ${error.message}`);

  const rows = (data ?? []) as {
    assignee: EmployeeCode;
    status: TaskStatus;
    created_at: string;
    completed_at: string | null;
  }[];

  return EMPLOYEE_CODES.map((code) => {
    const own = rows.filter((r) => r.assignee === code);
    const done = own.filter((r) => r.status === "DONE");
    const blocked = own.filter((r) => r.status === "BLOCKED");
    const settled = done.length + blocked.length;
    const successRate = settled > 0 ? (done.length / settled) * 100 : null;

    const durationsMinutes = done
      .filter((r) => r.completed_at)
      .map(
        (r) =>
          (new Date(r.completed_at as string).getTime() -
            new Date(r.created_at).getTime()) /
          60_000,
      )
      .filter((m) => m >= 0);
    const avgCompletion =
      durationsMinutes.length > 0
        ? formatDurationMinutes(
            durationsMinutes.reduce((a, b) => a + b, 0) /
              durationsMinutes.length,
          )
        : null;

    return {
      code,
      tasksCompleted: done.length,
      successRate:
        successRate !== null ? Math.round(successRate * 10) / 10 : null,
      avgCompletion,
    };
  });
}
