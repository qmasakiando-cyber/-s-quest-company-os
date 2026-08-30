import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCeoAuthMiddleware } from "./auth.functions";

export const listRevenueEntriesFn = createServerFn({ method: "GET" })
  .middleware([requireCeoAuthMiddleware])
  .handler(async () => {
    const { listRevenueEntries } = await import("./revenue.server");
    return listRevenueEntries();
  });

const createRevenueEntrySchema = z.object({
  category: z.string().min(1).max(100),
  amount: z.number().positive(),
  transactionDate: z.string().min(1),
  memo: z.string().max(500).nullable(),
});

export const createRevenueEntryFn = createServerFn({ method: "POST" })
  .middleware([requireCeoAuthMiddleware])
  .inputValidator((data: unknown) => createRevenueEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const { createRevenueEntry } = await import("./revenue.server");
    return createRevenueEntry(data);
  });
