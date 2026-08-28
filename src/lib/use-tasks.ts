import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createTaskFn, listTasksFn, setTaskStatusFn } from "./tasks.functions";
import type { EmployeeCode, Task, TaskStatus } from "./company-data";

/**
 * Loads tasks from Supabase and exposes add / toggle-done actions that persist
 * there too (optimistic UI, reverts on failure). Shared by every page that
 * reads or writes the tasks list so they all stay in sync with the same data.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listTasksFn);
  const createFn = useServerFn(createTaskFn);
  const statusFn = useServerFn(setTaskStatusFn);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listFn();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスクの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (title: string, assignee: EmployeeCode) => {
      const created = await createFn({ data: { title, assignee } });
      setTasks((prev) => [created, ...prev]);
    },
    [createFn],
  );

  const toggleTaskDone = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      const prevStatus = target.status;
      const nextStatus: TaskStatus = prevStatus === "DONE" ? "IN PROGRESS" : "DONE";
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));
      try {
        await statusFn({ data: { id, status: nextStatus } });
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: prevStatus } : t)));
        throw err;
      }
    },
    [tasks, statusFn],
  );

  return { tasks, loading, error, addTask, toggleTaskDone, refresh };
}
