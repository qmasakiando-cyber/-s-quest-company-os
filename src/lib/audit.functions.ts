import { createServerFn } from "@tanstack/react-start";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listAuditLogsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listAuditLogs } = await import("./audit.server");
    return listAuditLogs();
  });
