import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listNotifications } = await import("./notifications.server");
    return listNotifications();
  });

const markNotificationReadSchema = z.object({
  id: z.string().min(1),
});

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => markNotificationReadSchema.parse(data))
  .handler(async ({ data }) => {
    const { markNotificationRead } = await import("./notifications.server");
    return markNotificationRead(data.id);
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { markAllNotificationsRead } = await import("./notifications.server");
    await markAllNotificationsRead();
    return { ok: true };
  });
