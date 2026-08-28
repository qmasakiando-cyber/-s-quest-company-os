import { createServerFn } from "@tanstack/react-start";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listWorkflowsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listWorkflows } = await import("./workflows.server");
    return listWorkflows();
  });
