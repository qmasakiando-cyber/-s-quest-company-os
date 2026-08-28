// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { Expense } from "./company-data";

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  transaction_date: string;
  memo: string | null;
  created_at: string;
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: row.amount,
    transactionDate: row.transaction_date,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

/** Read-only: every expense entry, most recent transaction first. */
export async function listExpenses(): Promise<Expense[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`経費の取得に失敗しました: ${error.message}`);
  return (data as ExpenseRow[]).map(rowToExpense);
}

/**
 * 経費の記帳（JARVIS直轄・台帳のみ）。UPDATE/DELETEは今回のスコープ外
 * （誤記帳の訂正が実際に必要になった時点で別途検討する）。
 */
export async function createExpense(input: {
  category: string;
  amount: number;
  transactionDate: string;
  memo: string | null;
}): Promise<Expense> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      category: input.category,
      amount: input.amount,
      transaction_date: input.transactionDate,
      memo: input.memo,
    })
    .select()
    .single();
  if (error) throw new Error(`経費の登録に失敗しました: ${error.message}`);
  return rowToExpense(data as ExpenseRow);
}
