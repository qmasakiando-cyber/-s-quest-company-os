import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listNotificationsFn,
  markAllNotificationsReadFn,
  markNotificationReadFn,
} from "./notifications.functions";
import type { Notification } from "./notifications.server";

const POLL_INTERVAL_MS = 30_000;

/**
 * 通知センター（AppShellのベルアイコン）向け。承認申請/承認・却下確定/
 * AI社員エラーの3イベントで作られた notifications をポーリングし、
 * 既読化（read_atのUPDATEのみ）の操作を提供する。
 * use-employee-performance.ts と同じポーリング方針。
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listNotificationsFn);
  const markReadFn = useServerFn(markNotificationReadFn);
  const markAllReadFn = useServerFn(markAllNotificationsReadFn);

  const refresh = useCallback(async () => {
    try {
      const data = await listFn();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("useNotifications: refresh failed", err);
      setError("通知を取得できませんでした。表示は前回値のままです。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const updated = await markReadFn({ data: { id } });
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    },
    [markReadFn],
  );

  const markAllRead = useCallback(async () => {
    await markAllReadFn();
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now })),
    );
  }, [markAllReadFn]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
