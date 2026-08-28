/**
 * One-time seed: pushes the calendar and KPI mock data currently hardcoded
 * in src/lib/company-data.ts into the Supabase `calendar_events`, `kpis`,
 * and `kpi_values` tables (supabase/schema_phase1.sql).
 *
 * kpis are upserted by `code`, and kpi_values are fully replaced per kpi
 * (delete-then-insert), so re-running this script is safe.
 * calendar_events has no natural business key, so it only seeds once: if
 * the table already has rows, it's skipped (to avoid duplicating events on
 * re-run).
 *
 * Usage:
 *   node --env-file=.env scripts/seed-calendar-kpi.ts
 */
import { createClient } from "@supabase/supabase-js";
import { CALENDAR_EVENTS, KPIS } from "../src/lib/company-data.ts";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_ANON_KEY"];

if (!url || !key) {
  console.error(
    "SUPABASE_URL / SUPABASE_ANON_KEY が見つかりません。\n" +
      "`node --env-file=.env scripts/seed-calendar-kpi.ts` の形で実行してください。",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function seedCalendarEvents() {
  const { count, error: countError } = await supabase
    .from("calendar_events")
    .select("*", { count: "exact", head: true });
  if (countError) throw new Error(`calendar_events count failed: ${countError.message}`);
  if ((count ?? 0) > 0) {
    console.log(`… calendar_events は既に ${count} 件あるため投入をスキップしました`);
    return;
  }

  const now = new Date();
  const rows = CALENDAR_EVENTS.flatMap((day, dayOffset) =>
    day.items.map((item) => {
      const [hh, mm] = item.time.split(":").map(Number);
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hh ?? 9, mm ?? 0, 0, 0);
      return {
        title: item.title,
        start_at: d.toISOString(),
        kind: item.kind,
        owner: item.who,
        status: "scheduled" as const,
      };
    }),
  );

  const { error } = await supabase.from("calendar_events").insert(rows);
  if (error) throw new Error(`calendar_events seed failed: ${error.message}`);
  console.log(`✓ calendar_events: ${rows.length} 件を投入しました`);
}

/** "¥328,000" / "4.8%" / "6m 12s" / "4.42 / 5" / "+2,140" / "142" のような
 *  表示用文字列を、生の数値へ変換する。 */
function parseNumber(raw: string): number {
  const s = raw.trim();
  if (s.includes("/")) {
    const [left] = s.split("/");
    return parseFloat(left!.trim());
  }
  const minSec = s.match(/^(\d+)m\s*(\d+)s$/);
  if (minSec) return Number(minSec[1]) + Number(minSec[2]) / 60;
  const percent = s.match(/^([\d.]+)%$/);
  if (percent) return parseFloat(percent[1]!);
  const cleaned = s.replace(/[¥,+]/g, "");
  return parseFloat(cleaned.replace(/[^0-9.\-]/g, ""));
}

/** 表示用文字列の見た目から unit コードを推測する（kpi.server.ts の formatByUnit と対応）。 */
function inferUnit(raw: string): string {
  const s = raw.trim();
  if (s.startsWith("¥")) return "¥";
  if (s.includes("/5")) return "/5";
  if (s.startsWith("+")) return "+件";
  if (/^\d+m\s*\d+s$/.test(s)) return "min";
  if (s.endsWith("%")) return "%";
  return "件";
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

async function seedKpis() {
  let kpiCount = 0;
  let valueCount = 0;

  for (const k of KPIS) {
    const unit = inferUnit(k.value);
    const currentValue = parseNumber(k.value);
    const targetValue = parseNumber(k.target);
    const code = slugify(k.name);

    const { data: kpiRow, error: kpiError } = await supabase
      .from("kpis")
      .upsert(
        {
          code,
          name: k.name,
          category: k.category,
          unit,
          target_value: targetValue,
          owner: k.owner,
          status: "active",
        },
        { onConflict: "code" },
      )
      .select()
      .single();
    if (kpiError) throw new Error(`kpis upsert failed (${k.name}): ${kpiError.message}`);
    kpiCount++;

    // Trend numbers in the mock are sometimes scaled down (e.g. thousands of
    // yen); rescale the whole series so the last point matches the real
    // current value exactly.
    const lastTrend = k.trend.at(-1) ?? currentValue;
    const scale = lastTrend !== 0 ? currentValue / lastTrend : 1;
    const scaledTrend = k.trend.map((v) => v * scale);
    if (scaledTrend.length) scaledTrend[scaledTrend.length - 1] = currentValue;

    const now = new Date();
    const valueRows = scaledTrend.map((value, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (scaledTrend.length - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return {
        kpi_id: kpiRow.id as string,
        period_start: dateStr,
        period_end: dateStr,
        value,
        target_value: targetValue,
      };
    });

    const { error: deleteError } = await supabase
      .from("kpi_values")
      .delete()
      .eq("kpi_id", kpiRow.id);
    if (deleteError) throw new Error(`kpi_values delete failed (${k.name}): ${deleteError.message}`);

    const { error: insertError } = await supabase.from("kpi_values").insert(valueRows);
    if (insertError) throw new Error(`kpi_values insert failed (${k.name}): ${insertError.message}`);
    valueCount += valueRows.length;
  }

  console.log(`✓ kpis: ${kpiCount} 件を投入しました`);
  console.log(`✓ kpi_values: ${valueCount} 件を投入しました`);
}

async function main() {
  await seedCalendarEvents();
  await seedKpis();
  console.log("シード完了。");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
