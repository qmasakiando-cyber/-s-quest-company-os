/**
 * One-time seed: pushes the AI employee and task mock data currently
 * hardcoded in src/lib/company-data.ts into the Supabase `ai_employees`
 * and `tasks` tables (supabase/schema_phase1.sql).
 *
 * Safe to re-run: uses upsert, so it will not create duplicates.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-supabase.ts
 */
import { createClient } from "@supabase/supabase-js";
import { AI_EMPLOYEES, EMPLOYEES, TASKS } from "../src/lib/company-data.ts";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_ANON_KEY"];

if (!url || !key) {
  console.error(
    "SUPABASE_URL / SUPABASE_ANON_KEY が見つかりません。\n" +
      "`node --env-file=.env scripts/seed-supabase.ts` の形で実行してください。",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

/** "たった今" / "12分前" のような相対ラベルを、それっぽい timestamptz へ変換する */
function parseLastActivity(label: string): string {
  const now = Date.now();
  if (label.includes("たった今")) return new Date(now).toISOString();
  const minutes = label.match(/(\d+)\s*分前/);
  if (minutes) return new Date(now - Number(minutes[1]) * 60_000).toISOString();
  const hours = label.match(/(\d+)\s*時間前/);
  if (hours) return new Date(now - Number(hours[1]) * 3_600_000).toISOString();
  return new Date(now - 3_600_000).toISOString();
}

/** "Today 23:00" / "Tomorrow 12:00" / "This week" のようなラベルを timestamptz へ変換する */
function parseDue(label: string): string | null {
  const now = new Date();
  const timeMatch = label.match(/(\d{1,2}):(\d{2})/);
  const applyTime = (d: Date) => {
    if (timeMatch) d.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    else d.setHours(18, 0, 0, 0);
    return d;
  };

  if (label.startsWith("Today")) return applyTime(new Date(now)).toISOString();
  if (label.startsWith("Tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return applyTime(d).toISOString();
  }
  if (label.startsWith("Yesterday")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return applyTime(d).toISOString();
  }
  if (label.toLowerCase().includes("this week")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    return applyTime(d).toISOString();
  }
  return null;
}

async function seedEmployees() {
  const rows = EMPLOYEES.map((e) => {
    const profile = AI_EMPLOYEES[e.code];
    return {
      code: e.code,
      name: e.name,
      persona_name: e.personaName ?? profile.name,
      department: e.department,
      role: e.role,
      status: e.status,
      current_task: e.currentTask,
      progress: e.progress,
      workflow: e.workflow,
      completed_today: e.completedToday,
      accent_color: e.accent,
      responsibilities: e.responsibilities,
      capabilities: e.capabilities,
      steps: e.steps,
      persona: e.persona ?? profile.persona,
      system_prompt: profile.systemPrompt,
      tasks_completed: e.performance.tasksCompleted,
      success_rate: e.performance.successRate,
      avg_completion: e.performance.avgCompletion,
      qa_pass_rate: e.performance.qaPassRate,
      permissions_read: e.permissions.read,
      permissions_write: e.permissions.write,
      last_activity_at: parseLastActivity(e.lastActivity),
    };
  });

  const { error } = await supabase.from("ai_employees").upsert(rows, { onConflict: "code" });
  if (error) throw new Error(`ai_employees seed failed: ${error.message}`);
  console.log(`✓ ai_employees: ${rows.length} 件を投入しました`);
}

async function seedTasks() {
  const rows = TASKS.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee,
    created_by: t.createdBy,
    due_at: parseDue(t.due),
    project: t.project,
    workflow: t.workflow,
    dependencies: t.dependencies,
    comments: t.comments,
    log: t.log,
  }));

  const { error } = await supabase.from("tasks").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`tasks seed failed: ${error.message}`);
  console.log(`✓ tasks: ${rows.length} 件を投入しました`);
}

async function main() {
  await seedEmployees();
  await seedTasks();
  console.log("シード完了。");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
