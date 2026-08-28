/**
 * One-time backfill: fills tasks.workflow_id by matching the existing
 * free-text tasks.workflow column (e.g. "WF-06 KPI → Strategy") against
 * workflows.code (e.g. "WF-06"). Leaves tasks.workflow untouched.
 *
 * Safe to re-run: only updates rows where workflow_id is currently null
 * and a match is found.
 *
 * Usage:
 *   node --env-file=.env scripts/backfill-tasks-workflow-id.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_ANON_KEY"];

if (!url || !key) {
  console.error(
    "SUPABASE_URL / SUPABASE_ANON_KEY が見つかりません。\n" +
      "`node --env-file=.env scripts/backfill-tasks-workflow-id.ts` の形で実行してください。",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: workflows, error: workflowsError } = await supabase
    .from("workflows")
    .select("id, code");
  if (workflowsError) throw new Error(`workflows fetch failed: ${workflowsError.message}`);

  const codeToId = new Map<string, string>((workflows ?? []).map((w) => [w.code as string, w.id as string]));

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, workflow, workflow_id");
  if (tasksError) throw new Error(`tasks fetch failed: ${tasksError.message}`);

  let matched = 0;
  let skippedAlreadySet = 0;
  let skippedNoMatch = 0;

  for (const task of tasks ?? []) {
    if (task["workflow_id"]) {
      skippedAlreadySet++;
      continue;
    }
    const label = (task["workflow"] as string | null) ?? "";
    const codeMatch = label.match(/^(WF-\d+)/);
    const workflowId = codeMatch ? codeToId.get(codeMatch[1]!) : undefined;
    if (!workflowId) {
      skippedNoMatch++;
      console.log(`  スキップ: ${task["id"]} (workflow="${label}" は workflows.code と一致しません)`);
      continue;
    }
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ workflow_id: workflowId })
      .eq("id", task["id"] as string);
    if (updateError) throw new Error(`tasks update failed (${task["id"]}): ${updateError.message}`);
    matched++;
  }

  console.log(`✓ 紐付け完了: ${matched} 件`);
  if (skippedAlreadySet) console.log(`… 既にworkflow_id設定済みでスキップ: ${skippedAlreadySet} 件`);
  if (skippedNoMatch) console.log(`… 一致するworkflowが見つからずスキップ: ${skippedNoMatch} 件`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
