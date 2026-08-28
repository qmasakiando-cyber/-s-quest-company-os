/**
 * One-time seed: pushes the WF-01〜06 mock data currently hardcoded in
 * src/lib/company-data.ts (the WORKFLOWS const) into the Supabase
 * `workflows` table (supabase/schema_phase3.sql).
 *
 * Upserted by `code`, so re-running this script is safe.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-workflows.ts
 */
import { createClient } from "@supabase/supabase-js";
import { WORKFLOWS } from "../src/lib/company-data.ts";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_ANON_KEY"];

if (!url || !key) {
  console.error(
    "SUPABASE_URL / SUPABASE_ANON_KEY が見つかりません。\n" +
      "`node --env-file=.env scripts/seed-workflows.ts` の形で実行してください。",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedWorkflows() {
  const rows = WORKFLOWS.map((w) => ({
    code: w.code,
    name: w.name,
    description: w.description,
    trigger: w.trigger,
    status: w.status,
    version: w.version,
    runs: w.runs,
    success_rate: w.successRate,
    diagram: w.diagram,
    input: w.input,
    processing: w.processing,
    output: w.output,
    approval_gate: w.approvalGate,
    failure_branch: w.failureBranch,
    os_update: w.osUpdate,
    retry: w.retry,
    timeout: w.timeout,
  }));

  const { error } = await supabase.from("workflows").upsert(rows, { onConflict: "code" });
  if (error) throw new Error(`workflows seed failed: ${error.message}`);
  console.log(`✓ workflows: ${rows.length} 件を投入しました`);
}

seedWorkflows()
  .then(() => console.log("シード完了。"))
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
