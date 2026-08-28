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
