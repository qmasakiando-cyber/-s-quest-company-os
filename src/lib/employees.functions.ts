import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listEmployeeLiveStatesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listEmployeeLiveStates } = await import("./employees.server");
  return listEmployeeLiveStates();
});

export const listErrorEmployeesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listErrorEmployees } = await import("./employees.server");
  return listErrorEmployees();
});

const retryEmployeeSchema = z.object({ code: z.enum(["A", "B", "C", "D", "E", "F"]) });

export const retryEmployeeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => retryEmployeeSchema.parse(data))
  .handler(async ({ data }) => {
    const { retryEmployee } = await import("./employees.server");
    await retryEmployee(data.code);
    return { ok: true };
  });
