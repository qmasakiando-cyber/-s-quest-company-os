import { createServerFn } from "@tanstack/react-start";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listKpisFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listKpis } = await import("./kpi.server");
    return listKpis();
  });
