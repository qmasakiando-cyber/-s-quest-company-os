import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listEmployeeLiveStatesFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listEmployeeLiveStates } = await import("./employees.server");
    return listEmployeeLiveStates();
  });

export const listErrorEmployeesFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listErrorEmployees } = await import("./employees.server");
    return listErrorEmployees();
  });

export const listEmployeePerformanceFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listEmployeePerformance } = await import("./employees.server");
    return listEmployeePerformance();
  });

const retryEmployeeSchema = z.object({
  code: z.enum(["A", "B", "C", "D", "E", "F"]),
});

export const retryEmployeeFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => retryEmployeeSchema.parse(data))
  .handler(async ({ data }) => {
    const { retryEmployee } = await import("./employees.server");
    await retryEmployee(data.code);
    return { ok: true };
  });
