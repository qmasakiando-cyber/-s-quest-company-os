// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";
import type { Kpi } from "./company-data";

interface KpiRow {
  id: string;
  code: string;
  name: string;
  category: Kpi["category"];
  unit: string;
  target_value: number | null;
  owner: string | null;
}

interface KpiValueRow {
  id: string;
  kpi_id: string;
  period_start: string;
  value: number;
  target_value: number | null;
}

/** Turns a raw numeric value back into the "¥328,000" / "72.4%" / "6m 12s" style string. */
function formatByUnit(v: number, unit: string): string {
  switch (unit) {
    case "¥":
      return `¥${Math.round(v).toLocaleString("en-US")}`;
    case "+件":
      return `+${Math.round(v).toLocaleString("en-US")}`;
    case "/5":
      return `${v.toFixed(2)} / 5`;
    case "min": {
      const totalSeconds = Math.round(v * 60);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m}m ${String(s).padStart(2, "0")}s`;
    }
    case "%": {
      const rounded = Math.round(v * 10) / 10;
      return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
    }
    default:
      return Math.round(v).toLocaleString("en-US");
  }
}

export async function listKpis(): Promise<Kpi[]> {
  const supabase = await getSupabaseServerClient();
  const [
    { data: kpiRows, error: kpiError },
    { data: valueRows, error: valueError },
  ] = await Promise.all([
    supabase.from("kpis").select("*").eq("status", "active"),
    supabase
      .from("kpi_values")
      .select("*")
      .order("period_start", { ascending: true }),
  ]);
  if (kpiError) throw new Error(`KPIの取得に失敗しました: ${kpiError.message}`);
  if (valueError)
    throw new Error(`KPI実績の取得に失敗しました: ${valueError.message}`);

  const valuesByKpi = new Map<string, KpiValueRow[]>();
  for (const row of valueRows as KpiValueRow[]) {
    const list = valuesByKpi.get(row.kpi_id) ?? [];
    list.push(row);
    valuesByKpi.set(row.kpi_id, list);
  }

  return (kpiRows as KpiRow[]).map((kpi) => {
    const values = valuesByKpi.get(kpi.id) ?? [];
    const trend = values.map((v) => v.value);
    const current = values.at(-1);
    const previous = values.at(-2);
    const currentValue = current?.value ?? 0;
    const previousValue = previous?.value ?? currentValue;
    const change =
      previousValue !== 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;
    const targetValue =
      current?.target_value ?? kpi.target_value ?? currentValue;

    return {
      code: kpi.code,
      name: kpi.name,
      category: kpi.category,
      value: formatByUnit(currentValue, kpi.unit),
      target: formatByUnit(targetValue, kpi.unit),
      previous: formatByUnit(previousValue, kpi.unit),
      change: Math.round(change * 10) / 10,
      owner: kpi.owner ?? "JARVIS",
      trend,
      achievementRate: targetValue !== 0 ? currentValue / targetValue : 1,
    };
  });
}

/**
 * Read-only: 生の目標値（表示用に整形しない数値）を単一のKPIコードから取得する。
 * listKpis()と同じ「最新kpi_valuesのtarget_value優先、無ければkpis.target_value」
 * のフォールバック順を使う。/revenue の月間目標カード（"monthly_revenue"）向け。
 */
export async function getKpiTargetValue(code: string): Promise<number | null> {
  const supabase = await getSupabaseServerClient();
  const { data: kpiRow, error: kpiError } = await supabase
    .from("kpis")
    .select("id, target_value")
    .eq("code", code)
    .maybeSingle();
  if (kpiError)
    throw new Error(`KPI目標値の取得に失敗しました: ${kpiError.message}`);
  if (!kpiRow) return null;

  const { data: latestValue, error: valueError } = await supabase
    .from("kpi_values")
    .select("target_value")
    .eq("kpi_id", (kpiRow as { id: string }).id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (valueError)
    throw new Error(`KPI目標値の取得に失敗しました: ${valueError.message}`);

  return (
    (latestValue as { target_value: number | null } | null)?.target_value ??
    (kpiRow as { target_value: number | null }).target_value ??
    null
  );
}

/**
 * JARVISのupdate_kpi_targetから、CEOが実行ボタンで確定した時にだけ呼ばれる。
 * kpis.target_value を上書きするだけでなく、kpi_values に「今日・目標値のみ変更・
 * 実測値は直前と同じ」の新しい行を追記する。理由：getKpiTargetValue()/listKpis()は
 * 最新のkpi_values.target_valueを優先して読むため、kpis.target_valueだけ書き換えても
 * 既存のkpi_values行（seed-calendar-kpi.tsで全トレンドポイントに同じtarget_valueが
 * 入っている）に上書きされて表示に反映されない。expenses/revenue_entries/audit_logsと
 * 同じ「上書きせず追記する」台帳哲学に合わせ、目標変更の履歴も自然に残す。
 */
export async function updateKpiTarget(input: {
  code: string;
  targetValue: number;
}): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data: kpiRow, error: kpiError } = await supabase
    .from("kpis")
    .select("id, name, target_value")
    .eq("code", input.code)
    .single();
  if (kpiError) throw new Error(`KPIの取得に失敗しました: ${kpiError.message}`);
  const kpi = kpiRow as {
    id: string;
    name: string;
    target_value: number | null;
  };

  const { data: latestValue, error: valueError } = await supabase
    .from("kpi_values")
    .select("value")
    .eq("kpi_id", kpi.id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (valueError)
    throw new Error(`KPI実績の取得に失敗しました: ${valueError.message}`);
  const carriedValue = (latestValue as { value: number } | null)?.value ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const { error: insertError } = await supabase.from("kpi_values").insert({
    kpi_id: kpi.id,
    period_start: today,
    period_end: today,
    value: carriedValue,
    target_value: input.targetValue,
  });
  if (insertError)
    throw new Error(`KPI目標値の更新に失敗しました: ${insertError.message}`);

  const { error: updateError } = await supabase
    .from("kpis")
    .update({ target_value: input.targetValue })
    .eq("id", kpi.id);
  if (updateError)
    throw new Error(`KPI目標値の更新に失敗しました: ${updateError.message}`);

  try {
    const { createAuditLog } = await import("./audit.server");
    const { jpy } = await import("./company-data");
    const previousTarget = kpi.target_value ?? carriedValue;
    await createAuditLog({
      actor: "JARVIS",
      action: "Updated KPI Target",
      target: `${kpi.name}: ${jpy(previousTarget)} → ${jpy(input.targetValue)}`,
    });
  } catch (auditError) {
    console.error("audit log (kpi target updated) failed:", auditError);
  }
}
