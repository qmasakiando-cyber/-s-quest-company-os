import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listKpisFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listKpis } = await import("./kpi.server");
    return listKpis();
  });

const getKpiTargetValueSchema = z.object({
  code: z.string().min(1),
});

export const getKpiTargetValueFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => getKpiTargetValueSchema.parse(data))
  .handler(async ({ data }) => {
    const { getKpiTargetValue } = await import("./kpi.server");
    return getKpiTargetValue(data.code);
  });
