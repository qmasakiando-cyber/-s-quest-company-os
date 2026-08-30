// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { EmployeeCode, Priority, Task, TaskStatus } from "./company-data";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee: EmployeeCode | "JARVIS" | "CEO";
  created_by: string;
  due_at: string | null;
  project: string | null;
  workflow: string | null;
  dependencies: string[] | null;
  comments: { by: string; text: string; at: string }[] | null;
  log: { at: string; text: string }[] | null;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

/** Formats a due_at timestamp back into the "Today 23:00" style label the UI expects. */
function formatDue(dueAt: string | null): string {
  if (!dueAt) return "未設定";
  const due = new Date(dueAt);
  const now = new Date();
  const dayDiff = Math.round(
    (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86_400_000,
  );
  if (dayDiff === 0) return `Today ${fmtTime(due)}`;
  if (dayDiff === 1) return `Tomorrow ${fmtTime(due)}`;
  if (dayDiff === -1) return `Yesterday ${fmtTime(due)}`;
  return due.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    createdBy: row.created_by,
    due: formatDue(row.due_at),
    project: row.project ?? "",
    workflow: row.workflow ?? "",
    dependencies: row.dependencies ?? [],
    comments: row.comments ?? [],
    log: row.log ?? [],
  };
}

export async function listTasks(): Promise<Task[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`タスクの取得に失敗しました: ${error.message}`);
  return (data as TaskRow[]).map(rowToTask);
}

const randomTaskId = () => `TSK-${Math.floor(1000 + Math.random() * 9000)}`;

export async function createTask(input: {
  title: string;
  assignee: EmployeeCode;
  priority?: Priority | undefined;
  /** "jarvis"：JARVISチャットでの提案をCEOが実行ボタンで確定した場合。省略時は従来通りダッシュボードからの追加として記録する。 */
  source?: "dashboard" | "jarvis" | undefined;
}): Promise<Task> {
  const supabase = await getSupabaseServerClient();
  const fromJarvis = input.source === "jarvis";
  const baseRow = {
    title: input.title,
    description: "",
    status: "TODO" as TaskStatus,
    priority: input.priority ?? ("P2" as Priority),
    assignee: input.assignee,
    created_by: fromJarvis ? "JARVIS" : "CEO",
    project: "S-QUEST Company",
    workflow: "—",
    dependencies: [],
    comments: [],
    log: [
      {
        at: fmtTime(new Date()),
        text: fromJarvis
          ? "JARVISが会話からの提案をCEOの実行確認を経て作成"
          : "CEOがダッシュボードから追加",
      },
    ],
  };

  // id is a short human-readable code (e.g. "TSK-1041"); retry a few times on
  // the rare collision with an existing id instead of failing the request.
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomTaskId();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ id, ...baseRow })
      .select()
      .single();
    if (!error) {
      const task = rowToTask(data as TaskRow);
      // AI社員の状態を連動更新する。失敗してもタスク作成自体は成功として返す。
      try {
        const { onTaskCreated } = await import("./employees.server");
        await onTaskCreated(input.assignee);
      } catch (syncError) {
        console.error("employee status sync (task created) failed:", syncError);
      }
      return task;
    }
    if (error.code !== "23505")
      throw new Error(`タスクの作成に失敗しました: ${error.message}`);
  }
  throw new Error("タスクの作成に失敗しました: IDの採番に失敗しました。");
}

export async function setTaskStatus(input: {
  id: string;
  status: TaskStatus;
}): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: input.status,
      // DONEへの遷移時に完了時刻を記録し、DONEから戻された場合はクリアする
      // （/employees のパフォーマンス集計 = listEmployeePerformance() が
      // avg(completed_at - created_at) で平均完了時間を算出するために使う）。
      completed_at: input.status === "DONE" ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .select("id, title, assignee")
    .single();
  if (error) throw new Error(`タスクの更新に失敗しました: ${error.message}`);

  const task = data as {
    id: string;
    title: string;
    assignee: EmployeeCode | "JARVIS" | "CEO";
  };
  if (task.assignee === "JARVIS" || task.assignee === "CEO") return;

  // AI社員の状態を連動更新する。失敗してもタスク更新自体は成功として返す。
  try {
    const { onTaskCompleted, onTaskResumed, resolveWaitingEmployees } =
      await import("./employees.server");
    if (input.status === "DONE") {
      await onTaskCompleted(task.assignee);
      await resolveWaitingEmployees(task.id);
    } else {
      await onTaskResumed(task.assignee, task.title);
    }
  } catch (syncError) {
    console.error(
      "employee status sync (task status changed) failed:",
      syncError,
    );
  }
}
