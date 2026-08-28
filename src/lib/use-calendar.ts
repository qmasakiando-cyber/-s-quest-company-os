import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCalendarEventFn, listCalendarEventsFn } from "./calendar.functions";
import type { CalendarDay, EventKind, EventOwner } from "./calendar.server";

/** Loads the next 7 days of calendar events from Supabase and exposes an add action. */
export function useCalendar() {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listCalendarEventsFn);
  const createFn = useServerFn(createCalendarEventFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setDays(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "カレンダーの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEvent = useCallback(
    async (input: { title: string; startAt: string; kind: EventKind; owner: EventOwner }) => {
      await createFn({ data: input });
      await refresh();
    },
    [createFn, refresh],
  );

  return { days, loading, error, addEvent, refresh };
}
