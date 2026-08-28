import { getSupabaseServerClient } from "./supabase.server";
import type { ApprovalLevel, Workflow } from "./company-data";

interface WorkflowRow {
  code: string;
  name: string;
  description: string | null;
  trigger: string | null;
  status: Workflow["status"];
  version: string | null;
  runs: number;
  success_rate: number;
  diagram: string[] | null;
  input: string | null;
  processing: string[] | null;
  output: string | null;
  approval_gate: string | null;
  failure_branch: string | null;
  os_update: string | null;
  retry: string | null;
  timeout: string | null;
  approval_level: ApprovalLevel | null;
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? "",
    trigger: row.trigger ?? "",
    status: row.status,
    version: row.version ?? "",
    runs: row.runs,
    successRate: row.success_rate,
    diagram: row.diagram ?? [],
    input: row.input ?? "",
    processing: row.processing ?? [],
    output: row.output ?? "",
    approvalGate: row.approval_gate ?? "",
    failureBranch: row.failure_branch ?? "",
    osUpdate: row.os_update ?? "",
    retry: row.retry ?? "",
    timeout: row.timeout ?? "",
    ...(row.approval_level ? { approvalLevel: row.approval_level } : {}),
  };
}

export async function listWorkflows(): Promise<Workflow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("workflows").select("*").order("code", { ascending: true });
  if (error) throw new Error(`ワークフローの取得に失敗しました: ${error.message}`);
  return (data as WorkflowRow[]).map(rowToWorkflow);
}
