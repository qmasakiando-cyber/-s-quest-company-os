import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  assignee: z.enum(["A", "B", "C", "D", "E", "F"]),
});

const setStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "BACKLOG",
    "TODO",
    "IN PROGRESS",
    "REVIEW",
    "DONE",
    "BLOCKED",
  ]),
});

export const listTasksFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listTasks } = await import("./tasks.server");
    return listTasks();
  });

export const createTaskFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => createTaskSchema.parse(data))
  .handler(async ({ data }) => {
    const { createTask } = await import("./tasks.server");
    return createTask(data);
  });

export const setTaskStatusFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { setTaskStatus } = await import("./tasks.server");
    await setTaskStatus(data);
    return { ok: true };
  });
