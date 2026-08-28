import { createServerFn } from "@tanstack/react-start";

export const listEmployeeLiveStatesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listEmployeeLiveStates } = await import("./employees.server");
  return listEmployeeLiveStates();
});
