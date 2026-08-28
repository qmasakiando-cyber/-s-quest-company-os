import { createServerFn } from "@tanstack/react-start";

export const listWorkflowsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listWorkflows } = await import("./workflows.server");
  return listWorkflows();
});
