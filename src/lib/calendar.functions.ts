import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  startAt: z.string().min(1),
  kind: z.enum([
    "Meeting",
    "Review",
    "Workflow",
    "Report",
    "Approval",
    "Deadline",
  ]),
  owner: z.enum(["A", "B", "C", "D", "E", "F", "JARVIS", "CEO"]),
});

export const listCalendarEventsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listCalendarEvents } = await import("./calendar.server");
    return listCalendarEvents();
  });

export const createCalendarEventFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => createEventSchema.parse(data))
  .handler(async ({ data }) => {
    const { createCalendarEvent } = await import("./calendar.server");
    await createCalendarEvent(data);
    return { ok: true };
  });
