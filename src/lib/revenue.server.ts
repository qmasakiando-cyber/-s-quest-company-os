// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import { jpy, type RevenueEntry } from "./company-data";

interface RevenueEntryRow {
  id: string;
  category: string;
  amount: number;
  transaction_date: string;
  memo: string | null;
  created_at: string;
}

function rowToRevenueEntry(row: RevenueEntryRow): RevenueEntry {
  return {
    id: row.id,
    category: row.category,
    amount: row.amount,
    transactionDate: row.transaction_date,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

/** Read-only: every revenue entry, most recent transaction first. */
export async function listRevenueEntries(): Promise<RevenueEntry[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("revenue_entries")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`売上の取得に失敗しました: ${error.message}`);
  return (data as RevenueEntryRow[]).map(rowToRevenueEntry);
}

/**
 * 売上の記帳（台帳のみ）。UPDATE/DELETEは今回のスコープ外
 * （expensesと同じ判断。誤記帳の訂正が必要になった時点で別途検討する）。
 */
export async function createRevenueEntry(input: {
  category: string;
  amount: number;
  transactionDate: string;
  memo: string | null;
}): Promise<RevenueEntry> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("revenue_entries")
    .insert({
      category: input.category,
      amount: input.amount,
      transaction_date: input.transactionDate,
      memo: input.memo,
    })
    .select()
    .single();
  if (error) throw new Error(`売上の登録に失敗しました: ${error.message}`);
  const entry = rowToRevenueEntry(data as RevenueEntryRow);

  try {
    const { createAuditLog } = await import("./audit.server");
    await createAuditLog({
      actor: "CEO",
      action: "Logged Revenue",
      target: `${entry.category} ${jpy(entry.amount)}`,
    });
  } catch (auditError) {
    console.error("audit log (revenue logged) failed:", auditError);
  }

  return entry;
}
