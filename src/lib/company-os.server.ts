// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { OsCategory } from "./company-data";

export type CompanyOsStatus = "ACTIVE" | "DRAFT" | "REVIEW";

export interface CompanyOsEntry {
  id: string;
  category: OsCategory;
  key: string;
  value: string;
  status: CompanyOsStatus;
  updatedBy: string;
  updatedAt: string;
  source: string;
  confidence: number;
  /** そのkeyの何回目の記帳か（1始まり）。保存はせずここで都度計算する。 */
  version: number;
}

interface CompanyOsEntryRow {
  id: string;
  category: OsCategory;
  key: string;
  value: string;
  status: CompanyOsStatus;
  updated_by: string;
  source: string;
  confidence: number;
  created_at: string;
}

function rowToEntry(row: CompanyOsEntryRow, version: number): CompanyOsEntry {
  return {
    id: row.id,
    category: row.category,
    key: row.key,
    value: row.value,
    status: row.status,
    updatedBy: row.updated_by,
    updatedAt: row.created_at,
    source: row.source,
    confidence: row.confidence,
    version,
  };
}

/**
 * Read-only: (category, key) ごとの最新行だけを返す。company_os_entries は
 * 記帳のみの追記式テーブル（1回の編集＝1行のINSERT）なので、kpi.server.ts の
 * listKpis() と同じ「最新行に集約する」パターンをそのまま使う。
 */
export async function listCompanyOsEntries(): Promise<CompanyOsEntry[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_os_entries")
    .select("*")
    .order("created_at", { ascending: true });
  if (error)
    throw new Error(`COMPANY OSの取得に失敗しました: ${error.message}`);

  const rows = (data ?? []) as CompanyOsEntryRow[];
  const groups = new Map<string, CompanyOsEntryRow[]>();
  const order: string[] = [];
  for (const row of rows) {
    const groupKey = `${row.category}::${row.key}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
      order.push(groupKey);
    }
    groups.get(groupKey)!.push(row);
  }

  return order.map((groupKey) => {
    const groupRows = groups.get(groupKey)!;
    const latest = groupRows[groupRows.length - 1]!;
    return rowToEntry(latest, groupRows.length);
  });
}

/**
 * CEOによる直接編集（記帳のみ、UPDATE/DELETEはしない）。既存keyへの編集も
 * 新しいkeyの追加も、どちらも新しい行のINSERTとして表現する
 * （expenses/revenue_entriesと同じ台帳哲学）。source/confidenceは常に
 * "CEO"/100固定 — このフォームを操作するのは常にCEO自身のため。
 */
export async function updateCompanyOsEntry(input: {
  category: OsCategory;
  key: string;
  value: string;
  status: CompanyOsStatus;
}): Promise<CompanyOsEntry> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("company_os_entries")
    .insert({
      category: input.category,
      key: input.key,
      value: input.value,
      status: input.status,
      updated_by: "CEO",
      source: "CEO",
      confidence: 100,
    })
    .select()
    .single();
  if (error)
    throw new Error(`COMPANY OSの更新に失敗しました: ${error.message}`);

  const { count, error: countError } = await supabase
    .from("company_os_entries")
    .select("*", { count: "exact", head: true })
    .eq("category", input.category)
    .eq("key", input.key);
  if (countError)
    throw new Error(`COMPANY OSの更新に失敗しました: ${countError.message}`);

  try {
    const { createAuditLog } = await import("./audit.server");
    await createAuditLog({
      actor: "CEO",
      action: "Updated COMPANY OS",
      target: `${input.category} / ${input.key}`,
    });
  } catch (auditError) {
    console.error("audit log (company os updated) failed:", auditError);
  }

  return rowToEntry(data as CompanyOsEntryRow, count ?? 1);
}
