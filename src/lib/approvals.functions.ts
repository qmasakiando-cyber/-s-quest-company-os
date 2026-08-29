import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listApprovalsFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listApprovals } = await import("./approvals.server");
    return listApprovals();
  });

const createApprovalSchema = z.object({
  requestedBy: z.enum(["A", "B", "C", "D", "E", "F", "JARVIS"]),
  approvalLevel: z.enum(["L0", "L1", "L2", "L3"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  action: z.string().min(1).max(500),
  reason: z.string().min(1).max(1000),
  risk: z.string().min(1).max(500),
  expected: z.string().min(1).max(500),
  relatedTaskId: z.string().min(1).max(50).nullable(),
});

export const createApprovalFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => createApprovalSchema.parse(data))
  .handler(async ({ data }) => {
    const { createApproval } = await import("./approvals.server");
    return createApproval(data);
  });

const decideApprovalSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
});

export const decideApprovalFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => decideApprovalSchema.parse(data))
  .handler(async ({ data }) => {
    const { decideApproval } = await import("./approvals.server");
    return decideApproval(data);
  });
