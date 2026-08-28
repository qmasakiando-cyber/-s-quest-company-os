import { createServerFn } from "@tanstack/react-start";

export const listKpisFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listKpis } = await import("./kpi.server");
  return listKpis();
});
