// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { AiOutput, EmployeeCode } from "./company-data";

interface AiOutputRow {
  id: string;
  employee_code: EmployeeCode;
  task_id: string | null;
  output_type: string;
  title: string;
  content: string | null;
  external_url: string | null;
  created_at: string;
}

function rowToAiOutput(row: AiOutputRow): AiOutput {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    taskId: row.task_id,
    outputType: row.output_type,
    title: row.title,
    content: row.content,
    externalUrl: row.external_url,
    createdAt: row.created_at,
  };
}

/** Read-only: every AI output, most recently created first. */
export async function listAiOutputs(): Promise<AiOutput[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_outputs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`成果物の取得に失敗しました: ${error.message}`);
  return (data as AiOutputRow[]).map(rowToAiOutput);
}

/**
 * AI社員の成果物登録（台帳のみ）。UPDATE/DELETEは今回のスコープ外
 * （登録ミスの訂正が実際に必要になった時点で別途検討する）。
 */
export async function createAiOutput(input: {
  employeeCode: EmployeeCode;
  taskId: string | null;
  outputType: string;
  title: string;
  content: string | null;
  externalUrl: string | null;
}): Promise<AiOutput> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_outputs")
    .insert({
      employee_code: input.employeeCode,
      task_id: input.taskId,
      output_type: input.outputType,
      title: input.title,
      content: input.content,
      external_url: input.externalUrl,
    })
    .select()
    .single();
  if (error) throw new Error(`成果物の登録に失敗しました: ${error.message}`);
  return rowToAiOutput(data as AiOutputRow);
}
