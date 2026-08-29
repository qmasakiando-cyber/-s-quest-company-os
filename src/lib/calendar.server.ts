// DELETE禁止ルール：物理削除は行わない（詳細は supabase.server.ts 参照）。
import { getSupabaseServerClient } from "./supabase.server";

export type EventKind =
  "Meeting" | "Review" | "Workflow" | "Report" | "Approval" | "Deadline";
export type EventOwner = "A" | "B" | "C" | "D" | "E" | "F" | "JARVIS" | "CEO";

interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  kind: EventKind;
  owner: EventOwner | null;
  related_task_id: string | null;
  status: "scheduled" | "completed" | "cancelled";
}

export interface CalendarItem {
  time: string;
  title: string;
  kind: EventKind;
  who: EventOwner;
  /** "google" ならGoogleカレンダー由来（表示のみ、書き込み・同期はしない）。 */
  source?: "google";
}

/** Same shape as company-data.ts's CALENDAR_EVENTS mock: events grouped by day. */
export interface CalendarDay {
  day: string;
  date: string;
  items: CalendarItem[];
}

const DAY_LABEL = (d: Date, isToday: boolean) =>
  isToday
    ? "TODAY"
    : d
        .toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "Asia/Tokyo",
        })
        .toUpperCase();

const DATE_LABEL = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });

const TIME_LABEL = (d: Date) =>
  d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

const dayKey = (d: Date) =>
  d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }); // YYYY-MM-DD

/**
 * Fetches the next 7 days of events, grouped by calendar day like the old
 * mock. Supabase側（calendar_events）とGoogleカレンダー（表示のみ、鍵未設定
 * や取得失敗時は静かに空扱い）を並行取得してマージする。
 */
export async function listCalendarEvents(): Promise<CalendarDay[]> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const todayKey = dayKey(now);
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 7);

  const [{ data, error }, googleItems] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_at", rangeStart.toISOString())
      .lt("start_at", rangeEnd.toISOString())
      .neq("status", "cancelled")
      .order("start_at", { ascending: true }),
    (async () => {
      const { listGoogleCalendarEvents } =
        await import("./google-calendar.server");
      return listGoogleCalendarEvents(rangeStart, rangeEnd);
    })(),
  ]);
  if (error)
    throw new Error(`カレンダーの取得に失敗しました: ${error.message}`);

  const rows = data as CalendarEventRow[];
  const byDay = new Map<string, { date: Date; items: CalendarItem[] }>();
  for (const row of rows) {
    const start = new Date(row.start_at);
    const key = dayKey(start);
    if (!byDay.has(key)) byDay.set(key, { date: start, items: [] });
    byDay.get(key)!.items.push({
      time: TIME_LABEL(start),
      title: row.title,
      kind: row.kind,
      who: row.owner ?? "JARVIS",
    });
  }
  for (const { startAt, item } of googleItems) {
    const key = dayKey(startAt);
    if (!byDay.has(key)) byDay.set(key, { date: startAt, items: [] });
    byDay.get(key)!.items.push(item);
  }
  for (const { items } of byDay.values()) {
    items.sort((a, b) => a.time.localeCompare(b.time));
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { date, items }]) => ({
      day: DAY_LABEL(date, key === todayKey),
      date: DATE_LABEL(date),
      items,
    }));
}

export async function createCalendarEvent(input: {
  title: string;
  startAt: string;
  kind: EventKind;
  owner: EventOwner;
}): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("calendar_events").insert({
    title: input.title,
    start_at: input.startAt,
    kind: input.kind,
    owner: input.owner,
    status: "scheduled",
  });
  if (error) throw new Error(`予定の追加に失敗しました: ${error.message}`);
}
