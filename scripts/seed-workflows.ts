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
import { WORKFLOWS, type ApprovalLevel } from "../src/lib/company-data.ts";

/**
 * WF-01〜06 の承認レベル（Obsidian「AI社員間Workflow 詳細仕様書 V1.0」の
 * L0〜L3定義に沿って、各Workflowの approvalGate の内容から判定）。
 *   - approvalGate に「CEO 承認」が明記されている、または COMPANY OS の
 *     重要Master（STRATEGY 等）更新を伴う → L3
 *   - approvalGate が「本番Deploy・外部公開」「公開・送信」等の外部発信系 → L2
 *   - approvalGate が「なし」の内部業務 → L1
 */
const APPROVAL_LEVEL_BY_CODE: Record<string, ApprovalLevel> = {
  "WF-01": "L3", // OS の STRATEGY 更新時のみ CEO 承認
  "WF-02": "L2", // 本番Deploy・外部公開
  "WF-03": "L2", // 公開・送信を伴う全操作
  "WF-04": "L2", // 外部送信（メール・DM）
  "WF-05": "L1", // なし（読取と集計のみ）
  "WF-06": "L3", // 施策実行前に CEO 承認
};

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
    approval_level: APPROVAL_LEVEL_BY_CODE[w.code] ?? null,
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
